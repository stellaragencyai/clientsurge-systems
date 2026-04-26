/**
 * processDripCampaigns — hourly runner that fires overdue drip steps.
 *
 * For each active DripCampaign:
 *  1. Load the lead — if status is Qualified/Booked/Closed, stop the campaign
 *  2. Check each step interval since enrolled_at:
 *     - Day 1 (≥ 24h)  → send if day1_status = "pending"
 *     - Day 3 (≥ 72h)  → send if day3_status = "pending"
 *     - Day 7 (≥ 168h) → send if day7_status = "pending"
 *  3. Send SMS via Twilio (falls back to email via Resend if no phone)
 *  4. Update DripCampaign step status + sent_at
 *  5. If all 3 steps sent → mark campaign "completed"
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { allowAnonymousAutomation } from "../_shared/automationSecurity.js";

const STOP_STATUSES = ["Qualified", "Booking Prompt Sent", "Booked", "Closed"];

const STEPS = [
  { key: "day1", hoursRequired: 24,  sentAtField: "day1_sent_at", statusField: "day1_status" },
  { key: "day3", hoursRequired: 72,  sentAtField: "day3_sent_at", statusField: "day3_status" },
  { key: "day7", hoursRequired: 168, sentAtField: "day7_sent_at", statusField: "day7_status" },
];

function hoursSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

function renderTemplate(template, lead, bookingLink) {
  return (template || "")
    .replace(/{name}/g, lead.full_name || "there")
    .replace(/{business_name}/g, lead.business_name || "us")
    .replace(/{booking_link}/g, bookingLink || "")
    .replace(/{date}/g, new Date().toLocaleDateString());
}

async function sendSMS(phone, body, accountSid, authToken, fromNumber) {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: fromNumber, Body: body }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Twilio error");
  }
  return true;
}

async function sendEmail(to, subject, body, resendKey, fromEmail) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail || "noreply@clientsurge.com",
      to,
      subject,
      text: body,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Resend error");
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) OR admin direct call
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!user && !allowAnonymousAutomation(req)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load all active campaigns
    const campaigns = await base44.asServiceRole.entities.DripCampaign.filter({ status: "active" }, "-enrolled_at", 5000);
    if (!campaigns?.length) {
      return Response.json({ success: true, processed: 0, message: "No active drip campaigns." });
    }

    // Load admin settings once
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};

    const accountSid  = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken   = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber  = settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");
    const twilioReady = !!(accountSid && authToken && fromNumber && settings.twilio_enabled);

    const resendKey   = Deno.env.get("RESEND_API_KEY");
    const fromEmail   = settings.resend_from_email || "noreply@clientsurge.com";
    const resendReady = !!(resendKey && settings.resend_enabled);

    const templateMap = {
      day1: settings.follow_up_day1_sms,
      day3: settings.follow_up_day3_sms,
      day7: settings.follow_up_day7_sms,
    };

    const results = { fired: 0, skipped: 0, stopped: 0, errors: 0 };

    for (const campaign of campaigns) {
      try {
        // Load lead
        const lead = await base44.asServiceRole.entities.Leads.get(campaign.lead_id);
        if (!lead) {
          await base44.asServiceRole.entities.DripCampaign.update(campaign.id, { status: "stopped", stop_reason: "completed_all_steps", notes: "Lead record not found." });
          results.stopped++;
          continue;
        }

        // Stop if lead reached a terminal status
        if (STOP_STATUSES.includes(lead.status)) {
          const stopReason = lead.status === "Qualified" ? "qualified"
            : lead.status === "Booked" ? "booked"
            : lead.status === "Closed" ? "closed"
            : "qualified";

          await base44.asServiceRole.entities.DripCampaign.update(campaign.id, { status: "stopped", stop_reason: stopReason });
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: campaign.lead_id,
            channel: "internal",
            direction: "system",
            event_type: "workflow_triggered",
            provider: "internal",
            status: "processed",
            subject: `Drip campaign stopped — lead is ${lead.status}`,
            message_body: `Drip campaign auto-stopped because lead reached status: ${lead.status}.`,
          });
          results.stopped++;
          continue;
        }

        const enrolledAt = campaign.enrolled_at;
        const hoursSinceEnroll = hoursSince(enrolledAt);
        let campaignUpdates = { last_step_run_at: new Date().toISOString() };
        let allStepsDone = true;

        for (const step of STEPS) {
          const currentStepStatus = campaign[step.statusField];

          if (currentStepStatus === "sent" || currentStepStatus === "skipped") continue;

          // Not yet due
          if (hoursSinceEnroll < step.hoursRequired) {
            allStepsDone = false;
            continue;
          }

          allStepsDone = false; // still has pending steps until confirmed sent

          // Due — send now
          const template = templateMap[step.key] || "";
          const messageBody = renderTemplate(template, lead, settings.booking_link_default);

          let sent = false;
          let channel = "sms";
          let error = null;

          if (twilioReady && lead.phone && messageBody) {
            try {
              await sendSMS(lead.phone, messageBody, accountSid, authToken, fromNumber);
              sent = true;
            } catch (err) {
              error = err.message;
              console.error(`processDripCampaigns [${step.key}] SMS error for lead ${campaign.lead_id}:`, err.message);
            }
          }

          // Fallback to email if SMS failed or no phone
          if (!sent && resendReady && lead.email) {
            try {
              await sendEmail(
                lead.email,
                `Following up — ${lead.business_name || "your inquiry"}`,
                messageBody || `Hi ${lead.full_name || "there"}, just following up on your recent inquiry. We'd love to help!`,
                resendKey,
                fromEmail
              );
              sent = true;
              channel = "email";
            } catch (err) {
              error = err.message;
              console.error(`processDripCampaigns [${step.key}] email error for lead ${campaign.lead_id}:`, err.message);
            }
          }

          const stepStatus = sent ? "sent" : "failed";
          campaignUpdates[step.statusField] = stepStatus;
          if (sent) {
            campaignUpdates[step.sentAtField] = new Date().toISOString();
          }

          // Log CommunicationEvent
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: campaign.lead_id,
            channel,
            direction: "outbound",
            event_type: channel === "sms" ? "sms_sent" : "email_sent",
            provider: channel === "sms" ? "twilio" : "resend",
            status: sent ? "sent" : "failed",
            subject: `Drip ${step.key} — automated follow-up`,
            message_body: messageBody,
            error_message: error || undefined,
            metadata_json: JSON.stringify({ drip_step: step.key, campaign_id: campaign.id, auto: true }),
          });

          // Update lead last_contacted_at
          if (sent) {
            await base44.asServiceRole.entities.Leads.update(campaign.lead_id, {
              last_contacted_at: new Date().toISOString(),
            });
          }

          sent ? results.fired++ : results.errors++;
        }

        // Check if all 3 steps are done after this run
        const finalDay1 = campaignUpdates.day1_status ?? campaign.day1_status;
        const finalDay3 = campaignUpdates.day3_status ?? campaign.day3_status;
        const finalDay7 = campaignUpdates.day7_status ?? campaign.day7_status;
        const done = ["sent", "skipped"].includes(finalDay1) &&
                     ["sent", "skipped"].includes(finalDay3) &&
                     ["sent", "skipped"].includes(finalDay7);

        if (done) {
          campaignUpdates.status = "completed";
          campaignUpdates.stop_reason = "completed_all_steps";
        }

        await base44.asServiceRole.entities.DripCampaign.update(campaign.id, campaignUpdates);

      } catch (err) {
        console.error(`processDripCampaigns error for campaign ${campaign.id}:`, err.message);
        results.errors++;
      }
    }

    return Response.json({ success: true, campaigns_checked: campaigns.length, ...results });

  } catch (error) {
    console.error("processDripCampaigns error:", error);
    return Response.json({ error: error.message || "Failed to process drip campaigns" }, { status: 500 });
  }
});

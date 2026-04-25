/**
 * processQualifiedFollowUps — hourly runner for two automated follow-up flows.
 *
 * FLOW 1: Qualified → Booking Prompt (24h)
 *   Finds leads where:
 *     - status = "Qualified"
 *     - next_follow_up_at is in the past
 *   Action: sends booking prompt SMS + email to lead, updates status to "Booking Prompt Sent"
 *
 * FLOW 2: Replied → Rep Reminder (48h)
 *   Finds leads where:
 *     - status = "Replied"
 *     - next_follow_up_at is in the past
 *     - assigned_to is set
 *   Action: emails the assigned rep a reminder to follow up with this lead
 *
 * Both flows clear next_follow_up_at after firing to prevent re-triggering.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function renderTemplate(template, lead, bookingLink) {
  return (template || "")
    .replace(/{name}/g, lead.full_name || "there")
    .replace(/{business_name}/g, lead.business_name || "")
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
    throw new Error(err?.message || "Twilio SMS error");
  }
  return true;
}

async function sendEmail(to, subject, htmlBody, resendKey, fromEmail) {
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
      text: htmlBody,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Resend email error");
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) OR admin direct call
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Load settings + all leads that have a due next_follow_up_at
    const [settingsRecords, allLeads] = await Promise.all([
      base44.asServiceRole.entities.AdminSettings.list("-created_date", 1),
      base44.asServiceRole.entities.Leads.list("-created_date", 5000),
    ]);

    const settings = settingsRecords?.[0] || {};

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken  = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");
    const twilioReady = !!(accountSid && authToken && fromNumber && settings.twilio_enabled);

    const resendKey  = Deno.env.get("RESEND_API_KEY");
    const fromEmail  = settings.resend_from_email || "noreply@clientsurge.com";
    const resendReady = !!(resendKey && settings.resend_enabled);

    const bookingLink = settings.booking_link_default || "";

    // Filter to only leads whose follow-up is due now
    const dueLeads = (allLeads || []).filter((l) => {
      if (!l.next_follow_up_at) return false;
      return new Date(l.next_follow_up_at) <= new Date();
    });

    const results = { qualified_prompted: 0, replied_reminders: 0, errors: 0 };

    for (const lead of dueLeads) {
      try {

        // ── FLOW 1: Qualified → Booking Prompt ────────────────────────────────
        if (lead.status === "Qualified") {
          const smsTemplate = settings.follow_up_booking_prompt_sms ||
            `Hi {name}! We noticed you're interested in working with us. Ready to book your free consultation? Here's your link: {booking_link}`;
          const smsBody = renderTemplate(smsTemplate, lead, bookingLink);

          let smsSent = false;
          let emailSent = false;

          // Send SMS to lead
          if (twilioReady && lead.phone && smsBody) {
            try {
              await sendSMS(lead.phone, smsBody, accountSid, authToken, fromNumber);
              smsSent = true;
            } catch (err) {
              console.error(`processQualifiedFollowUps SMS error lead ${lead.id}:`, err.message);
            }
          }

          // Send email to lead (always attempt if resend ready)
          if (resendReady && lead.email) {
            const emailTemplate = settings.follow_up_booking_prompt_email ||
              `Hi {name},\n\nWe wanted to reach out — you're qualified and ready to take the next step!\n\nClick here to book your consultation: {booking_link}\n\nLooking forward to speaking with you!`;
            const emailBody = renderTemplate(emailTemplate, lead, bookingLink);
            try {
              await sendEmail(
                lead.email,
                `You're ready to book — ${lead.business_name || lead.full_name}`,
                emailBody,
                resendKey,
                fromEmail
              );
              emailSent = true;
            } catch (err) {
              console.error(`processQualifiedFollowUps email error lead ${lead.id}:`, err.message);
            }
          }

          if (smsSent || emailSent) {
            await base44.asServiceRole.entities.Leads.update(lead.id, {
              status: "Booking Prompt Sent",
              booking_link_sent_at: now,
              last_contacted_at: now,
              next_follow_up_at: null,
            });
          }

          // Log event
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: smsSent ? "sms" : emailSent ? "email" : "internal",
            direction: "outbound",
            event_type: smsSent ? "sms_sent" : emailSent ? "email_sent" : "workflow_triggered",
            provider: smsSent ? "twilio" : emailSent ? "resend" : "internal",
            status: smsSent || emailSent ? "sent" : "failed",
            subject: "Automated Booking Prompt — Qualified lead 24h follow-up",
            message_body: smsBody,
            metadata_json: JSON.stringify({ flow: "qualified_booking_prompt", sms_sent: smsSent, email_sent: emailSent }),
          });

          if (smsSent || emailSent) {
            results.qualified_prompted++;
          } else {
            results.errors++;
          }
        }

        // ── FLOW 2: Replied → Rep Reminder ────────────────────────────────────
        else if (lead.status === "Replied") {
          const repEmail = lead.assigned_to;

          if (repEmail && resendReady) {
            const repSubject = `⚡ Follow-up reminder: ${lead.full_name} replied 2 days ago`;
            const repBody =
              `Hi,\n\n` +
              `This is an automated reminder that ${lead.full_name} (${lead.business_name || "unknown business"}) replied to your outreach 2 days ago and is still waiting for follow-up.\n\n` +
              `Lead status: Replied\n` +
              `Phone: ${lead.phone || "N/A"}\n` +
              `Email: ${lead.email || "N/A"}\n` +
              `Problem: ${lead.problem || "N/A"}\n\n` +
              `Now is a great time to qualify them and move toward booking.\n\n` +
              `— ClientSurge Automation`;

            try {
              await sendEmail(repEmail, repSubject, repBody, resendKey, fromEmail);
            } catch (err) {
              console.error(`processQualifiedFollowUps rep reminder error lead ${lead.id}:`, err.message);
            }
          }

          // Clear next_follow_up_at so we don't re-fire
          await base44.asServiceRole.entities.Leads.update(lead.id, {
            next_follow_up_at: null,
          });

          // Log event
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: "email",
            direction: "internal",
            event_type: "workflow_triggered",
            provider: repEmail && resendReady ? "resend" : "internal",
            status: repEmail && resendReady ? "sent" : "pending",
            subject: `Rep follow-up reminder sent to ${repEmail || "unassigned"}`,
            message_body: `Reminder sent to assigned rep (${repEmail || "none"}) — lead replied 48h ago with no further action.`,
            metadata_json: JSON.stringify({ flow: "replied_rep_reminder", rep_email: repEmail }),
          });

          results.replied_reminders++;
        }

      } catch (err) {
        console.error(`processQualifiedFollowUps error for lead ${lead.id}:`, err.message);
        results.errors++;
      }
    }

    return Response.json({
      success: true,
      leads_checked: dueLeads.length,
      ...results,
    });

  } catch (error) {
    console.error("processQualifiedFollowUps error:", error);
    return Response.json({ error: error.message || "Failed to process follow-ups" }, { status: 500 });
  }
});

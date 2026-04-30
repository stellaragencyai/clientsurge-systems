/**
 * Missed-Call Follow-Up Processor (Minute-Precision)
 * Scheduled: Every 5 minutes
 * Purpose: Send 2min SMS, 10min email, 1hr SMS, 24hr email to missed-call leads
 * 
 * Separate from generic drip system — designed for urgent recovery timing
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const FOLLOW_UP_STEPS = [
  { step: 1, minutesAfter: 2, channel: "sms", key: "missed_call_sms_2min" },
  { step: 2, minutesAfter: 10, channel: "email", key: "missed_call_email_10min" },
  { step: 3, minutesAfter: 60, channel: "sms", key: "missed_call_sms_1hr" },
  { step: 4, minutesAfter: 1440, channel: "email", key: "missed_call_email_24hr" },
];

function minutesSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60);
}

async function checkAlreadySent(base44, leadId, stepKey) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      lead_id: leadId,
      metadata_json: { $regex: `"missed_call_step":"${stepKey}"` },
      event_type: { $in: ["sms_sent", "email_sent"] },
    },
    "-created_date",
    1
  );
  return events?.length > 0;
}

async function sendSMS(base44, lead, messageBody, fromNumber, stepKey) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
  if (!statusCallbackUrl) {
    console.warn("[processMissedCallFollowUps] TWILIO_SMS_STATUS_CALLBACK_URL missing — SMS delivery tracking disabled");
  }

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials missing");
  }

  const params = { To: lead.phone, From: fromNumber, Body: messageBody };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Twilio error: ${err?.message || res.status}`);
  }

  const result = await res.json();
  return { success: true, messageId: result.sid };
}

async function sendEmail(base44, lead, subject, body, fromEmail, stepKey) {
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!resendKey) {
    throw new Error("Resend API key missing");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail || "noreply@clientsurge.com",
      to: lead.email,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${err?.message || res.status}`);
  }

  const result = await res.json();
  return { success: true, messageId: result.id };
}

function renderTemplate(template, lead, bookingLink) {
  if (!template) return "";
  return template
    .replace(/{name}/g, lead.full_name || "there")
    .replace(/{business_name}/g, lead.business_name || "us")
    .replace(/{booking_link}/g, bookingLink || "")
    .replace(/{date}/g, new Date().toLocaleDateString());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no user) or admin
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─────────────────────────────────────────────────────
    // STEP 1: Find all leads with missed-call initial SMS sent, no reply yet
    // ─────────────────────────────────────────────────────
    const leads = await base44.asServiceRole.entities.Leads.filter(
      {
        status: { $in: ["Contacted"] },
        activation_priority: "Hot",
        last_contacted_at: { $exists: true },
      },
      "-last_contacted_at",
      1000
    );

    if (!leads?.length) {
      return Response.json({
        success: true,
        processed: 0,
        message: "No missed-call leads to process",
      });
    }

    // Load admin settings once for templates and booking link
    const settingsRecords =
      await base44.asServiceRole.entities.AdminSettings.list(
        "-created_date",
        1
      );
    const settings = settingsRecords?.[0] || {};

    const fromNumber =
      settings.twilio_from_number ||
      Deno.env.get("TWILIO_PHONE_NUMBER");
    const fromEmail =
      settings.resend_from_email || "noreply@clientsurge.com";
    const bookingLink = settings.booking_link_default || "";

    // Hard-coded templates (can be overridden by AdminSettings if added)
    const templates = {
      missed_call_sms_2min:
        "Just wanted to follow up — we can usually get you taken care of pretty quickly.\n\nWhat's going on?",
      missed_call_email_10min: {
        subject: "Most people ask us this",
        body: `Quick heads up —\n\nMost people who call us are usually looking for:\n• Pricing\n• Availability\n• Same-day service\n\nIf that's you, we can help fast.\n\nBook here:\n${bookingLink}`,
      },
      missed_call_sms_1hr:
        "We've got a few open spots today/tomorrow.\n\nWant me to lock one in for you?",
      missed_call_email_24hr: {
        subject: "Should I close this out?",
        body: `Haven't heard back — totally fine if now's not the right time.\n\nIf you still need help, you can book here:\n${bookingLink}\n\nOtherwise I'll close this out 👍`,
      },
    };

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      stopped: 0,
      failed: 0,
    };

    // ─────────────────────────────────────────────────────
    // STEP 2: Process each lead
    // ─────────────────────────────────────────────────────
    for (const lead of leads) {
      try {
        const minutesElapsed = minutesSince(lead.last_contacted_at);

        // Re-check stop conditions
        if (!["Contacted"].includes(lead.status)) {
          console.log(
            `[processMissedCallFollowUps] Lead ${lead.id} status changed to ${lead.status} — stopping`
          );
          results.stopped++;
          continue;
        }

        // Process each follow-up step
        for (const stepConfig of FOLLOW_UP_STEPS) {
          try {
            // Check if enough time has passed
            if (minutesElapsed < stepConfig.minutesAfter) {
              continue; // Not due yet
            }

            // Check if already sent (idempotency)
            const alreadySent = await checkAlreadySent(
              base44,
              lead.id,
              stepConfig.key
            );
            if (alreadySent) {
              console.log(
                `[processMissedCallFollowUps] Step ${stepConfig.step} already sent for lead ${lead.id} — skipping`
              );
              results.skipped++;
              continue;
            }

            // Re-check lead status before send
            const freshLead = await base44.asServiceRole.entities.Leads.get(
              lead.id
            );
            if (!freshLead || !["Contacted"].includes(freshLead.status)) {
              console.log(
                `[processMissedCallFollowUps] Lead ${lead.id} no longer in Contacted status — stopping`
              );
              await base44.asServiceRole.entities.CommunicationEvent.create({
                lead_id: lead.id,
                channel: "internal",
                direction: "system",
                event_type: "workflow_triggered",
                provider: "internal",
                status: "stopped",
                subject: `Missed-call follow-up stopped at step ${stepConfig.step}`,
                message_body: `Lead status changed or lead not found`,
                metadata_json: JSON.stringify({
                  step: stepConfig.step,
                  reason: "status_changed_or_not_found",
                  timestamp: new Date().toISOString(),
                }),
              });
              results.stopped++;
              continue;
            }

            let sent = false;
            let messageId = null;
            let error = null;

            // Send SMS steps
            if (stepConfig.channel === "sms") {
              if (!freshLead.phone) {
                console.log(
                  `[processMissedCallFollowUps] No phone for lead ${lead.id} at step ${stepConfig.step}`
                );
                await base44.asServiceRole.entities.CommunicationEvent.create({
                  lead_id: lead.id,
                  channel: "sms",
                  direction: "outbound",
                  event_type: "sms_skipped",
                  provider: "twilio",
                  status: "skipped",
                  subject: `Missed-call SMS step ${stepConfig.step} skipped`,
                  message_body: "No phone number on lead",
                  metadata_json: JSON.stringify({
                    step: stepConfig.step,
                    key: stepConfig.key,
                    reason: "no_phone",
                  }),
                });
                results.skipped++;
                continue;
              }

              try {
                const template = templates[stepConfig.key] || "";
                const messageBody = renderTemplate(
                  template,
                  freshLead,
                  bookingLink
                );
                const smsResult = await sendSMS(
                  base44,
                  freshLead,
                  messageBody,
                  fromNumber,
                  stepConfig.key
                );
                sent = true;
                messageId = smsResult.messageId;
              } catch (err) {
                error = err.message;
                console.error(
                  `[processMissedCallFollowUps] SMS step ${stepConfig.step} failed for lead ${lead.id}:`,
                  err.message
                );
              }
            }

            // Send EMAIL steps
            if (stepConfig.channel === "email") {
              if (!freshLead.email) {
                console.log(
                  `[processMissedCallFollowUps] No email for lead ${lead.id} at step ${stepConfig.step}`
                );
                await base44.asServiceRole.entities.CommunicationEvent.create({
                  lead_id: lead.id,
                  channel: "email",
                  direction: "outbound",
                  event_type: "email_skipped",
                  provider: "resend",
                  status: "skipped",
                  subject: `Missed-call email step ${stepConfig.step} skipped`,
                  message_body: "No email address on lead",
                  metadata_json: JSON.stringify({
                    step: stepConfig.step,
                    key: stepConfig.key,
                    reason: "no_email",
                  }),
                });
                results.skipped++;
                continue;
              }

              try {
                const emailConfig = templates[stepConfig.key] || {};
                const emailResult = await sendEmail(
                  base44,
                  freshLead,
                  emailConfig.subject || "Follow-up",
                  renderTemplate(
                    emailConfig.body || "",
                    freshLead,
                    bookingLink
                  ),
                  fromEmail,
                  stepConfig.key
                );
                sent = true;
                messageId = emailResult.messageId;
              } catch (err) {
                error = err.message;
                console.error(
                  `[processMissedCallFollowUps] Email step ${stepConfig.step} failed for lead ${lead.id}:`,
                  err.message
                );
              }
            }

            // Log result
            if (sent) {
              await base44.asServiceRole.entities.CommunicationEvent.create({
                lead_id: lead.id,
                channel: stepConfig.channel,
                direction: "outbound",
                event_type:
                  stepConfig.channel === "sms" ? "sms_sent" : "email_sent",
                provider: stepConfig.channel === "sms" ? "twilio" : "resend",
                status: "sent",
                subject: `Missed-call follow-up step ${stepConfig.step}`,
                message_body: templates[stepConfig.key]?.body ||
                  templates[stepConfig.key] || "(message body)",
                provider_message_id: messageId,
                metadata_json: JSON.stringify({
                  step: stepConfig.step,
                  key: stepConfig.key,
                  missed_call_processor: true,
                  timestamp: new Date().toISOString(),
                }),
              });

              // Update lead last_contacted_at
              await base44.asServiceRole.entities.Leads.update(lead.id, {
                last_contacted_at: new Date().toISOString(),
              });

              results.sent++;
            } else if (error) {
              await base44.asServiceRole.entities.CommunicationEvent.create({
                lead_id: lead.id,
                channel: stepConfig.channel,
                direction: "outbound",
                event_type: stepConfig.channel === "sms" ? "sms_failed" : "email_failed",
                provider: stepConfig.channel === "sms" ? "twilio" : "resend",
                status: "failed",
                subject: `Missed-call step ${stepConfig.step} failed`,
                message_body: error,
                error_message: error,
                metadata_json: JSON.stringify({
                  step: stepConfig.step,
                  key: stepConfig.key,
                  missed_call_processor: true,
                }),
              });
              results.failed++;
            }
          } catch (stepError) {
            console.error(
              `[processMissedCallFollowUps] Step ${stepConfig.step} error for lead ${lead.id}:`,
              stepError.message
            );
            results.failed++;
          }
        }

        results.processed++;
      } catch (leadError) {
        console.error(
          `[processMissedCallFollowUps] Lead ${lead.id} error:`,
          leadError.message
        );
        results.failed++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error("[processMissedCallFollowUps] Fatal error:", error.message);
    return Response.json(
      { error: error.message || "Failed to process missed-call follow-ups" },
      { status: 500 }
    );
  }
});
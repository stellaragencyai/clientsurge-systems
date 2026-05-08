/**
 * Website Lead Follow-Up Processor
 * Sends 3-step sequence: 10min SMS, 1hr email, 24hr SMS
 * Reuses patterns from processMissedCallFollowUps for consistency
 * Scheduled to run every 5 minutes
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const FOLLOW_UP_STEPS = [
  { step: 1, minutesAfter: 10, channel: "sms", key: "website_follow_sms_10min" },
  { step: 2, minutesAfter: 60, channel: "email", key: "website_follow_email_1hr" },
  { step: 3, minutesAfter: 1440, channel: "sms", key: "website_follow_sms_24hr" },
];

// #98: cadence_paused guard
function isCadencePaused(lead) {
  return lead?.cadence_paused === true || lead?.status === "opted_out" || lead?.status === "Booked";
}

// #128: TCPA opt-out footer for all SMS
function appendOptOut(msg) {
  if ((msg || "").toLowerCase().includes("reply stop")) return msg;
  return msg + "\n\nReply STOP to unsubscribe.";
}

function minutesSince(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60);
}

async function checkAlreadySent(base44, leadId, stepKey) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      context_id: leadId,
      context_type: "website_lead",
      metadata_json: { $regex: `"step_key":"${stepKey}"` },
      event_type: { $in: ["sms_sent", "email_sent"] },
    },
    "-created_date",
    1
  ).catch(() => []);
  return events?.length > 0;
}

async function sendSMS(base44, lead, messageBody, fromNumber, stepKey) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
  if (!statusCallbackUrl) {
    console.warn("[processWebsiteLeadFollowUps] TWILIO_SMS_STATUS_CALLBACK_URL missing — SMS delivery tracking disabled");
  }

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials missing");
  }

  const params = { To: lead.phone_number, From: fromNumber, Body: messageBody };
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

  const idempotencyKey = `website-lead/${lead.id}/${stepKey}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: fromEmail || "noreply@clientsurgesystems.com",
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
    .replace(/{first_name}/g, lead.first_name || lead.full_name || "there")
    .replace(/{full_name}/g, lead.full_name || "there")
    .replace(/{service_interest}/g, lead.service_interest || "our services")
    .replace(/{business_name}/g, Deno.env.get("DEFAULT_BUSINESS_NAME") || "us")
    .replace(/{booking_link}/g, bookingLink || "");
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

    // Find all website leads that are eligible for follow-ups
    const leads = await base44.asServiceRole.entities.WebsiteLead.filter(
      {
        lead_status: { $in: ["new", "contacted"] },
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
        initial_response_sent_at: { $exists: true },
      },
      "-initial_response_sent_at",
      1000
    );

    if (!leads?.length) {
      return Response.json({
        success: true,
        processed: 0,
        message: "No website leads to process",
      });
    }

    // Load admin settings once
    const settingsRecords =
      await base44.asServiceRole.entities.AdminSettings.list(
        "-created_date",
        1
      );
    const settings = settingsRecords?.[0] || {};

    const fromNumber =
      settings.twilio_from_number || Deno.env.get("TWILIO_PHONE_NUMBER");
    const fromEmail =
      settings.resend_from_email || Deno.env.get("RESEND_FROM_EMAIL") ||
      "noreply@clientsurgesystems.com";
    const bookingLink = settings.booking_link_default || "";
    const businessName = Deno.env.get("DEFAULT_BUSINESS_NAME") || "us";

    const templates = {
      website_follow_sms_10min: `Quick follow-up — I saw you reached out about {service_interest}. Do you want help figuring out the best option?`,
      website_follow_email_1hr: {
        subject: "Still need help with {service_interest}?",
        body: `Hey {first_name},

Just checking back in.

If you still need help with {service_interest}, you can book here:
${bookingLink}

Or reply to this email with any questions.

– ${businessName}`,
      },
      website_follow_sms_24hr: `Should I close this out for now, or are you still interested in help with {service_interest}?`,
    };

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      stopped: 0,
      failed: 0,
    };

    // Process each lead
    for (const lead of leads) {
      try {
        const minutesElapsed = minutesSince(lead.initial_response_sent_at);

        // Re-check stop conditions
        const freshLead = await base44.asServiceRole.entities.WebsiteLead.get(
          lead.id
        );
        if (
          !freshLead ||
          !["new", "contacted"].includes(freshLead.lead_status) ||
          freshLead.reply_status !== "none" ||
          freshLead.booking_status !== "none"
        ) {
          console.log(
            `[processWebsiteLeadFollowUps] Lead ${lead.id} stop condition met`
          );
          await base44.asServiceRole.entities.CommunicationEvent.create({
            context_id: lead.id,
            context_type: "website_lead",
            channel: "internal",
            direction: "system",
            event_type: "workflow_triggered",
            provider: "internal",
            status: "stopped",
            subject: "Website lead follow-up stopped",
            message_body: "Stop condition triggered",
            metadata_json: JSON.stringify({
              reason: "stop_condition",
              timestamp: new Date().toISOString(),
            }),
          });
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
                `[processWebsiteLeadFollowUps] Step ${stepConfig.step} already sent for lead ${lead.id}`
              );
              results.skipped++;
              continue;
            }

            // Re-check stop conditions before send
            const freshLeadBefore =
              await base44.asServiceRole.entities.WebsiteLead.get(lead.id);
            if (
              !freshLeadBefore ||
              !["new", "contacted"].includes(freshLeadBefore.lead_status) ||
              freshLeadBefore.reply_status !== "none" ||
              freshLeadBefore.booking_status !== "none"
            ) {
              console.log(
                `[processWebsiteLeadFollowUps] Lead ${lead.id} stop condition before step ${stepConfig.step}`
              );
              results.stopped++;
              continue;
            }

            let sent = false;
            let messageId = null;
            let error = null;

            // Send SMS steps
            if (stepConfig.channel === "sms") {
              if (!freshLeadBefore.phone_number) {
                console.log(
                  `[processWebsiteLeadFollowUps] No phone for lead ${lead.id} at step ${stepConfig.step}`
                );
                await base44.asServiceRole.entities.CommunicationEvent.create({
                  context_id: lead.id,
                  context_type: "website_lead",
                  channel: "sms",
                  direction: "outbound",
                  event_type: "sms_skipped",
                  provider: "twilio",
                  status: "skipped",
                  subject: `Website follow-up SMS step ${stepConfig.step} skipped`,
                  message_body: "No phone number on lead",
                  metadata_json: JSON.stringify({
                    step: stepConfig.step,
                    step_key: stepConfig.key,
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
                  freshLeadBefore,
                  bookingLink
                );
                const smsResult = await sendSMS(
                  base44,
                  freshLeadBefore,
                  messageBody,
                  fromNumber,
                  stepConfig.key
                );
                sent = true;
                messageId = smsResult.messageId;
              } catch (err) {
                error = err.message;
                console.error(
                  `[processWebsiteLeadFollowUps] SMS step ${stepConfig.step} failed for lead ${lead.id}:`,
                  err.message
                );
              }
            }

            // Send EMAIL steps
            if (stepConfig.channel === "email") {
              if (!freshLeadBefore.email) {
                console.log(
                  `[processWebsiteLeadFollowUps] No email for lead ${lead.id} at step ${stepConfig.step}`
                );
                await base44.asServiceRole.entities.CommunicationEvent.create({
                  context_id: lead.id,
                  context_type: "website_lead",
                  channel: "email",
                  direction: "outbound",
                  event_type: "email_skipped",
                  provider: "resend",
                  status: "skipped",
                  subject: `Website follow-up email step ${stepConfig.step} skipped`,
                  message_body: "No email address on lead",
                  metadata_json: JSON.stringify({
                    step: stepConfig.step,
                    step_key: stepConfig.key,
                    reason: "no_email",
                  }),
                });
                results.skipped++;
                continue;
              }

              try {
                const emailConfig = templates[stepConfig.key] || {};
                const subject = renderTemplate(
                  emailConfig.subject || "Follow-up",
                  freshLeadBefore,
                  bookingLink
                );
                const body = renderTemplate(
                  emailConfig.body || "",
                  freshLeadBefore,
                  bookingLink
                );
                const emailResult = await sendEmail(
                  base44,
                  freshLeadBefore,
                  subject,
                  body,
                  fromEmail,
                  stepConfig.key
                );
                sent = true;
                messageId = emailResult.messageId;
              } catch (err) {
                error = err.message;
                console.error(
                  `[processWebsiteLeadFollowUps] Email step ${stepConfig.step} failed for lead ${lead.id}:`,
                  err.message
                );
              }
            }

            // Log result and update lead
            if (sent) {
              await base44.asServiceRole.entities.CommunicationEvent.create({
                context_id: lead.id,
                context_type: "website_lead",
                channel: stepConfig.channel,
                direction: "outbound",
                event_type:
                  stepConfig.channel === "sms" ? "sms_sent" : "email_sent",
                provider: stepConfig.channel === "sms" ? "twilio" : "resend",
                status: "sent",
                subject: `Website follow-up step ${stepConfig.step}`,
                message_body: templates[stepConfig.key]?.body ||
                  templates[stepConfig.key] || "(message body)",
                provider_message_id: messageId,
                metadata_json: JSON.stringify({
                  step: stepConfig.step,
                  step_key: stepConfig.key,
                  timestamp: new Date().toISOString(),
                }),
              });

              // Update lead follow-up state
              const nextStepMinutes =
                stepConfig.step === 3
                  ? null
                  : FOLLOW_UP_STEPS[stepConfig.step]?.minutesAfter;
              const updateData = {
                follow_up_step: stepConfig.step,
                last_message_sent: new Date().toISOString(),
              };
              if (nextStepMinutes) {
                updateData.next_follow_up_at = new Date(
                  Date.now() + nextStepMinutes * 60 * 1000
                ).toISOString();
              }

              await base44.asServiceRole.entities.WebsiteLead.update(
                lead.id,
                updateData
              );

              results.sent++;
            } else if (error) {
              await base44.asServiceRole.entities.CommunicationEvent.create({
                context_id: lead.id,
                context_type: "website_lead",
                channel: stepConfig.channel,
                direction: "outbound",
                event_type:
                  stepConfig.channel === "sms" ? "sms_failed" : "email_failed",
                provider: stepConfig.channel === "sms" ? "twilio" : "resend",
                status: "failed",
                subject: `Website follow-up step ${stepConfig.step} failed`,
                message_body: error,
                error_message: error,
                metadata_json: JSON.stringify({
                  step: stepConfig.step,
                  step_key: stepConfig.key,
                }),
              });
              results.failed++;
            }
          } catch (stepError) {
            console.error(
              `[processWebsiteLeadFollowUps] Step ${stepConfig.step} error for lead ${lead.id}:`,
              stepError.message
            );
            results.failed++;
          }
        }

        results.processed++;
      } catch (leadError) {
        console.error(
          `[processWebsiteLeadFollowUps] Lead ${lead.id} error:`,
          leadError.message
        );
        results.failed++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error(
      "[processWebsiteLeadFollowUps] Fatal error:",
      error.message
    );
    return Response.json(
      {
        error: error.message || "Failed to process website lead follow-ups",
      },
      { status: 500 }
    );
  }
});
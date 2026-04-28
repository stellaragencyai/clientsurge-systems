/**
 * Follow-Up Sequence Processor
 * Manages multi-channel (SMS + Email) follow-ups on a schedule
 * Runs every 5 minutes to process due follow-ups
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

// Follow-up sequence: [Step, Delay (minutes), Channel]
const FOLLOW_UP_SEQUENCE = [
  { step: 1, delay: 10, channel: "sms", template: "follow_up_day1_sms" },
  { step: 2, delay: 60, channel: "email", template: "missed_call_followup_email_1" },
  { step: 3, delay: 1440, channel: "sms", template: "follow_up_day7_sms" },
];

async function sendSmsTwilio(toNumber, messageBody) {
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  
  const response = await fetch(TWILIO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: TWILIO_FROM_NUMBER,
      To: toNumber,
      Body: messageBody,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio error: ${response.status}`);
  }

  const data = await response.json();
  return data.sid;
}

async function sendEmailResend(toEmail, subject, body, fromEmail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject,
      html: body,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend error: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

function formatMessage(template, lead) {
  return template
    .replace("{first_name}", lead.first_name || lead.full_name?.split(" ")[0] || "there")
    .replace("{business_name}", lead.business_name || "our business")
    .replace("{service_interest}", lead.service_interest || "your inquiry");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    console.log("[FollowUp] Starting follow-up sequence processor...");

    // Get leads that need follow-up
    const leads = await base44.asServiceRole.entities.WebsiteLead.filter(
      { 
        automation_enabled: true,
        booking_status: "none",
        lead_status: { $nin: ["booked", "closed", "ignored"] }
      },
      "-created_date",
      100
    );

    if (!leads || leads.length === 0) {
      console.log("[FollowUp] No leads requiring follow-up");
      return Response.json({ processed: 0, message: "No leads found" });
    }

    // Get settings for templates
    const settings = await base44.asServiceRole.entities.AdminSettings.filter({}, null, 1);
    const adminSettings = settings?.[0] || {};

    let processedCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
      try {
        const nextFollowUpAt = lead.next_follow_up_at ? new Date(lead.next_follow_up_at) : null;
        const now = new Date();

        // Check if follow-up is due
        if (nextFollowUpAt && nextFollowUpAt > now) {
          console.log(`[FollowUp] Lead ${lead.id} not due yet`);
          continue;
        }

        const currentStep = lead.follow_up_step || 0;
        const nextSequence = FOLLOW_UP_SEQUENCE[currentStep];

        if (!nextSequence) {
          console.log(`[FollowUp] Lead ${lead.id} completed all follow-ups`);
          continue;
        }

        console.log(`[FollowUp] Processing lead ${lead.id}, step ${nextSequence.step}`);

        let messageId;
        const template = adminSettings[nextSequence.template] || `Default ${nextSequence.channel} message for ${lead.first_name}`;
        const formattedMessage = formatMessage(template, lead);

        if (nextSequence.channel === "sms") {
          if (!lead.phone_number) {
            console.warn(`[FollowUp] Lead ${lead.id} missing phone number, skipping SMS`);
            continue;
          }
          messageId = await sendSmsTwilio(lead.phone_number, formattedMessage);
        } else if (nextSequence.channel === "email") {
          if (!lead.email) {
            console.warn(`[FollowUp] Lead ${lead.id} missing email, skipping email`);
            continue;
          }
          const fromEmail = adminSettings.resend_from_email || Deno.env.get("RESEND_FROM_EMAIL");
          messageId = await sendEmailResend(
            lead.email,
            `Follow-up: ${lead.service_interest || "Your Inquiry"}`,
            formattedMessage,
            fromEmail
          );
        }

        // Calculate next follow-up time
        const nextDelay = FOLLOW_UP_SEQUENCE[currentStep + 1]?.delay || null;
        const nextFollowUpTime = nextDelay 
          ? new Date(now.getTime() + nextDelay * 60000)
          : null;

        // Update lead
        await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
          follow_up_step: currentStep + 1,
          next_follow_up_at: nextFollowUpTime?.toISOString() || null,
          last_message_sent: now.toISOString(),
          sms_attempt_count: nextSequence.channel === "sms" ? (lead.sms_attempt_count || 0) + 1 : lead.sms_attempt_count,
          email_attempt_count: nextSequence.channel === "email" ? (lead.email_attempt_count || 0) + 1 : lead.email_attempt_count,
        });

        // Log event
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: lead.id,
            channel: nextSequence.channel,
            direction: "outbound",
            event_type: nextSequence.channel === "sms" ? "sms_sent" : "email_sent",
            provider: nextSequence.channel === "sms" ? "twilio" : "resend",
            status: "sent",
            message_body: formattedMessage,
            provider_message_id: messageId,
            metadata_json: JSON.stringify({
              service_key: "nurture_sequence_14d",
              step: nextSequence.step,
              channel: nextSequence.channel,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.warn(`[FollowUp] Event logging failed for lead ${lead.id}: ${e.message}`);
        }

        processedCount++;
      } catch (error) {
        errorCount++;
        console.error(`[FollowUp] Error processing lead ${lead.id}: ${error.message}`);
      }
    }

    console.log(`[FollowUp] Completed: ${processedCount} processed, ${errorCount} errors`);

    return Response.json({
      processed: processedCount,
      errors: errorCount,
      total: leads.length,
      summary: `Processed ${processedCount} follow-ups (${errorCount} errors)`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[FollowUp] Handler error: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
});
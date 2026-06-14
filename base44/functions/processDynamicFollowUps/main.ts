import { secureJson } from "../_shared/response.ts";
/**
 * Dynamic Follow-Up Cadence Processor
 * Adjusts follow-up sequence based on lead engagement
 * - Pauses on reply
 * - Switches channel after N attempts without response
 * - Calculates engagement score
 * - Respects max attempts limit
 * Scheduled every 5 minutes
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { getApprovedEmailSender, getEmailOutreachGate } from "../_shared/emailDeliverabilityGate.js";
import { appendSmsOptOut } from "../_shared/smsOptOut.js";
import { twilioFetch } from "../_shared/providerFetch.js";

const CHANNELS = {
  SMS: "sms",
  EMAIL: "email",
};

function calculateEngagementScore(lead) {
  let score = 0;
  if (lead.reply_status === "responded") score += 40;
  if (lead.booking_status === "clicked") score += 30;
  if (lead.booking_status === "booked") score += 30;
  return Math.min(score, 100);
}

function getNextChannel(lead, settings) {
  const mode = lead.cadence_mode || settings.cadence_default_mode || "auto";
  const totalAttempts = (lead.sms_attempt_count || 0) + (lead.email_attempt_count || 0);
  const switchThreshold = settings.cadence_switch_attempts || 3;

  if (mode === "sms_first") {
    return (lead.sms_attempt_count || 0) < switchThreshold ? CHANNELS.SMS : CHANNELS.EMAIL;
  }
  if (mode === "email_first") {
    return (lead.email_attempt_count || 0) < switchThreshold ? CHANNELS.EMAIL : CHANNELS.SMS;
  }

  // Auto: alternate channels if both have been attempted
  const smsCount = lead.sms_attempt_count || 0;
  const emailCount = lead.email_attempt_count || 0;
  if (smsCount > emailCount) return CHANNELS.EMAIL;
  return CHANNELS.SMS;
}

async function sendFollowUp(base44, lead, channel, stepNumber, templates) {
  try {
    let sent = false;
    let messageId = null;

    if (channel === CHANNELS.SMS) {
      const template = templates[`step${stepNumber}_sms`] || `Hi {first_name}, following up on your interest in {service_interest}. Are you still interested?`;
      const body = template
        .replace(/{first_name}/g, lead.first_name || "there")
        .replace(/{service_interest}/g, lead.service_interest || "our services");
      const outboundSmsBody = appendSmsOptOut(body);

      // Send SMS via Twilio
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (accountSid && authToken && fromNumber && lead.phone_number) {
        const res = await twilioFetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: lead.phone_number,
              From: fromNumber,
              Body: outboundSmsBody,
            }),
          }
        );

        if (res.ok) {
          const result = await res.json();
          sent = true;
          messageId = result.sid;
        }
      }
    } else if (channel === CHANNELS.EMAIL) {
      const sendGate = getEmailOutreachGate("dynamic email follow-up");
      if (!sendGate.ok) {
        console.warn(`[processDynamicFollowUps] Email follow-up blocked: ${sendGate.reason}`);
        return {
          sent: false,
          messageId: null,
          channel,
          blocked: true,
          error: sendGate.reason,
          proofStatus: sendGate.proof_status,
        };
      }

      const template = templates[`step${stepNumber}_email`] || `Hi {first_name}, just wanted to follow up on {service_interest}. Let me know if you have any questions!`;
      const body = template
        .replace(/{first_name}/g, lead.first_name || "there")
        .replace(/{service_interest}/g, lead.service_interest || "our services");

      // Send email via Resend
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey && lead.email) {
        const res = await resendFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: getApprovedEmailSender({}, { preferLeads: true }),
            to: lead.email,
            subject: `Follow-up on your interest`,
            text: body,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          sent = true;
          messageId = result.id;
        }
      }
    }

    return { sent, messageId, channel };
  } catch (error) {
    console.error(`[processDynamicFollowUps] Error sending ${channel}:`, error.message);
    return { sent: false, messageId: null, channel };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Load settings
    const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    const settings = settingsRecords?.[0] || {};

    // Load all leads eligible for follow-ups
    const leads = await base44.asServiceRole.entities.WebsiteLead.filter(
      {
        lead_status: { $in: ["new", "contacted"] },
        reply_status: "none",
        booking_status: "none",
        automation_enabled: true,
        cadence_paused: { $ne: true },
        initial_response_sent_at: { $exists: true },
      },
      "-initial_response_sent_at",
      500
    );

    if (!leads?.length) {
      return secureJson({ success: true, processed: 0, message: "No leads to process" });
    }

    const results = { processed: 0, sent: 0, paused: 0, maxed: 0, failed: 0 };

    // Templates
    const templates = {
      step1_sms: settings.follow_up_day1_sms || "Quick follow-up — still interested in {service_interest}?",
      step2_email: settings.missed_call_followup_email_1 || "Hi {first_name}, just checking in on your interest in {service_interest}.",
      step3_sms: settings.follow_up_day3_sms || "Last chance to lock in a spot for {service_interest}!",
    };

    for (const lead of leads) {
      try {
        // Calculate engagement
        const engagementScore = calculateEngagementScore(lead);

        // Pause if configured and lead has replied
        if (settings.cadence_pause_on_reply && lead.reply_status === "responded") {
          if (!lead.cadence_paused) {
            await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
              cadence_paused: true,
              cadence_paused_at: new Date().toISOString(),
            });
            results.paused++;
          }
          continue;
        }

        // Check max attempts
        const totalAttempts = (lead.sms_attempt_count || 0) + (lead.email_attempt_count || 0);
        const maxAttempts = settings.cadence_max_attempts || 6;
        if (totalAttempts >= maxAttempts) {
          results.maxed++;
          continue;
        }

        // Determine next channel
        const nextChannel = getNextChannel(lead, settings);
        const stepNumber = totalAttempts + 1;

        // Send follow-up
        const result = await sendFollowUp(base44, lead, nextChannel, stepNumber, templates);

        if (result.sent) {
          // Update lead
          const updateData = {
            last_engagement_type: nextChannel,
            last_engagement_at: new Date().toISOString(),
            last_message_sent: new Date().toISOString(),
            engagement_score: engagementScore,
          };

          if (nextChannel === CHANNELS.SMS) {
            updateData.sms_attempt_count = (lead.sms_attempt_count || 0) + 1;
          } else {
            updateData.email_attempt_count = (lead.email_attempt_count || 0) + 1;
          }

          // Schedule next follow-up if not at max
          const nextAttempt = totalAttempts + 1;
          if (nextAttempt < maxAttempts) {
            const delay = engagementScore > settings.cadence_engagement_threshold ? 30 : 60; // minutes
            updateData.next_follow_up_at = new Date(Date.now() + delay * 60 * 1000).toISOString();
          }

          await base44.asServiceRole.entities.WebsiteLead.update(lead.id, updateData);

          // Log event
          await base44.asServiceRole.entities.CommunicationEvent.create({
            context_id: lead.id,
            context_type: "website_lead",
            channel: nextChannel,
            direction: "outbound",
            event_type: `${nextChannel}_sent`,
            provider: nextChannel === CHANNELS.SMS ? "twilio" : "resend",
            status: "sent",
            subject: `Dynamic follow-up attempt ${stepNumber}`,
            provider_message_id: result.messageId,
            metadata_json: JSON.stringify({
              step: stepNumber,
              channel: nextChannel,
              engagement_score: engagementScore,
              cadence_mode: lead.cadence_mode,
            }),
          });

          results.sent++;
        } else {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            context_id: lead.id,
            context_type: "website_lead",
            channel: nextChannel,
            direction: "outbound",
            event_type: result.blocked ? "email_blocked" : `${nextChannel}_failed`,
            provider: nextChannel === CHANNELS.SMS ? "twilio" : "resend",
            status: result.blocked ? "blocked" : "failed",
            subject: `Dynamic follow-up attempt ${stepNumber}`,
            error_message: result.error || null,
            metadata_json: JSON.stringify({
              step: stepNumber,
              channel: nextChannel,
              engagement_score: engagementScore,
              cadence_mode: lead.cadence_mode,
              proof_status: result.proofStatus || null,
              requires_owner_action: Boolean(result.blocked),
            }),
          });
          results.failed++;
        }

        results.processed++;
      } catch (leadError) {
        console.error(`[processDynamicFollowUps] Lead ${lead.id} error:`, leadError.message);
        results.failed++;
      }
    }

    return secureJson({ success: true, ...results });
  } catch (error) {
    console.error("[processDynamicFollowUps] Fatal error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});

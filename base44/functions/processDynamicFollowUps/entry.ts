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
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

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
      if (lead.phone_number) {
        const result = await sendCommunicationViaOutbox({
          base44,
          channel: "sms",
          provider: "twilio",
          recipient: lead.phone_number,
          body,
          lead,
          leadId: lead.id,
          source: "processDynamicFollowUps",
          sourceRecordId: `${lead.id}:step${stepNumber}:sms`,
          templateKey: `step${stepNumber}_sms`,
          messageType: "transactional",
          consentBasis: lead.consent_given ? "web_form_consent" : "transactional_relationship",
          metadata: { step: stepNumber, cadence_mode: lead.cadence_mode },
          providerSend: (providerPayload) => sendTwilioSmsProvider({
            ...providerPayload,
            env: (name) => Deno.env.get(name),
            fetchImpl: fetch,
          }),
        });
        sent = Boolean(result.success);
        messageId = result.provider_message_id;
      }
    } else if (channel === CHANNELS.EMAIL) {
      const template = templates[`step${stepNumber}_email`] || `Hi {first_name}, just wanted to follow up on {service_interest}. Let me know if you have any questions!`;
      const body = template
        .replace(/{first_name}/g, lead.first_name || "there")
        .replace(/{service_interest}/g, lead.service_interest || "our services");

      if (lead.email) {
        const result = await sendCommunicationViaOutbox({
          base44,
          channel: "email",
          provider: "resend",
          recipient: lead.email,
          subject: "Follow-up on your interest",
          body,
          from: Deno.env.get("RESEND_FROM_EMAIL") || "noreply@clientsurge.com",
          lead,
          leadId: lead.id,
          source: "processDynamicFollowUps",
          sourceRecordId: `${lead.id}:step${stepNumber}:email`,
          templateKey: `step${stepNumber}_email`,
          messageType: "transactional",
          consentBasis: "transactional_relationship",
          metadata: { step: stepNumber, cadence_mode: lead.cadence_mode },
          providerSend: (providerPayload) => sendResendEmailProvider({
            ...providerPayload,
            env: (name) => Deno.env.get(name),
            fetchImpl: fetch,
          }),
        });
        sent = Boolean(result.success);
        messageId = result.provider_message_id;
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
      return Response.json({ success: true, processed: 0, message: "No leads to process" });
    }

    const results = { processed: 0, sent: 0, paused: 0, maxed: 0, failed: 0 };
    const nowMs = Date.now();

    // Templates
    const templates = {
      step1_sms: settings.follow_up_day1_sms || "Quick follow-up — still interested in {service_interest}?",
      step2_email: settings.missed_call_followup_email_1 || "Hi {first_name}, just checking in on your interest in {service_interest}.",
      step3_sms: settings.follow_up_day3_sms || "Last chance to lock in a spot for {service_interest}!",
    };

    for (const lead of leads) {
      try {
        const nextDueAt = Date.parse(lead.next_follow_up_at || "");
        if (Number.isFinite(nextDueAt) && nextDueAt > nowMs) {
          continue;
        }

        const cadenceStartedAt = Date.parse(lead.initial_response_sent_at || lead.created_date || "");
        const maxCadenceDays = Number(settings.cadence_max_days || 14);
        const cadenceEndsAt = Number.isFinite(cadenceStartedAt)
          ? cadenceStartedAt + maxCadenceDays * 24 * 60 * 60 * 1000
          : null;

        if (cadenceEndsAt && nowMs >= cadenceEndsAt) {
          await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
            cadence_paused: true,
            cadence_paused_at: new Date(nowMs).toISOString(),
            cadence_paused_reason: "cadence_max_days_reached",
            next_follow_up_at: null,
          });
          results.maxed++;
          results.processed++;
          continue;
        }

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
            const proposedNext = nowMs + delay * 60 * 1000;
            updateData.next_follow_up_at = new Date(
              cadenceEndsAt ? Math.min(proposedNext, cadenceEndsAt) : proposedNext
            ).toISOString();
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
          results.failed++;
        }

        results.processed++;
      } catch (leadError) {
        console.error(`[processDynamicFollowUps] Lead ${lead.id} error:`, leadError.message);
        results.failed++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error("[processDynamicFollowUps] Fatal error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

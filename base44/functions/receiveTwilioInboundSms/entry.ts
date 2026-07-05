/**
 * TWILIO INBOUND SMS WEBHOOK HANDLER — SPRINT 2 ENHANCED
 *
 * Sprint 2 additions:
 *   1. Intent classification (deterministic keyword-based, no AI auto-reply)
 *   2. STOP/opt-out handling — marks lead, stops nurture campaigns
 *   3. Pause nurture on any meaningful reply
 *   4. Escalate hot/unclear replies to admin review (Alert entity)
 *   5. Booking intent → log booking CTA event, update booking_status
 *
 * Sprint 1 fixes preserved:
 *   1. Signature validation: HMAC-SHA1 with TWILIO_AUTH_TOKEN
 *   2. GET health probe returns 200
 *   3. WebhookRegistration tracking
 *   4. Idempotency guard on MessageSid
 *
 * Hard rules:
 *   - Does NOT send AI-generated replies automatically
 *   - Does NOT mark anything live
 *   - Logs all classification and actions as CommunicationEvent metadata
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";
import crypto from "node:crypto";

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  return phone;
}

// ── Sprint 2: Deterministic intent classification (keyword-based, no external API) ──
const INTENT_CATEGORIES = [
  "booking_intent",
  "pricing_question",
  "service_question",
  "objection_or_hesitation",
  "stop_opt_out",
  "human_help_needed",
  "unknown",
];

function classifyInboundIntent(messageText) {
  const text = (messageText || "").toLowerCase().trim();

  // STOP / opt-out — highest priority
  if (/\b(stop|unsubscribe|opt.?out|remove me|cancel|end|quit|cease)\b/i.test(text)) {
    return { intent: "stop_opt_out", confidence: 0.95, recommended_action: "stop_all_contact" };
  }

  // Booking intent
  if (/\b(book|schedule|appointment|set up|sign up|ready|let.?s do it|yes|confirm|when can|available)\b/i.test(text)) {
    return { intent: "booking_intent", confidence: 0.85, recommended_action: "send_booking_link" };
  }

  // Pricing question
  if (/\b(price|cost|how much|pricing|quote|fee|rate|charge|afford)\b/i.test(text)) {
    return { intent: "pricing_question", confidence: 0.8, recommended_action: "escalate_to_admin" };
  }

  // Objection / hesitation
  if (/\b(not interested|not sure|maybe|later|think about|depends|too expensive|can.?t afford|not now|wrong number)\b/i.test(text)) {
    return { intent: "objection_or_hesitation", confidence: 0.8, recommended_action: "pause_nurture" };
  }

  // Service question
  if (/\b(how|what|when|where|who|why|explain|tell me|info|details|question|help|support)\b/i.test(text)) {
    return { intent: "service_question", confidence: 0.7, recommended_action: "escalate_to_admin" };
  }

  // Human help needed
  if (/\b(human|person|agent|representative|talk to someone|real person|manager)\b/i.test(text)) {
    return { intent: "human_help_needed", confidence: 0.85, recommended_action: "escalate_to_admin" };
  }

  // Unknown
  return { intent: "unknown", confidence: 0.4, recommended_action: "escalate_to_admin" };
}

async function validateTwilioSignature(req, rawBody) {
  const webhookKey = Deno.env.get("TWILIO_WEBHOOK_KEY");
  const providedKey = new URL(req.url).searchParams.get("twilio_webhook_key");
  if (webhookKey && providedKey && webhookKey === providedKey) {
    return { valid: true, method: "webhook_key" };
  }

  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) {
    console.error("[InboundSms] TWILIO_AUTH_TOKEN not set — cannot validate signature");
    return { valid: false, reason: "missing_auth_token" };
  }

  const signature = req.headers.get("X-Twilio-Signature");
  if (!signature) {
    console.warn("[InboundSms] X-Twilio-Signature header missing");
    return { valid: false, reason: "missing_signature" };
  }

  const originalUrl = new URL(req.url);
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const detectedHost = forwardedHost || req.headers.get("host") || originalUrl.host;
  const host = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(detectedHost)
    ? "client-surge-systems-copy-a9653cae.base44.app"
    : detectedHost;
  const protocol = forwardedProto || originalUrl.protocol.replace(":", "");
  const url = `${protocol}://${host}${originalUrl.pathname}${originalUrl.search}`;

  const params = new URLSearchParams(rawBody);
  const toSign = url +
    Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join("");

  const computed = crypto.createHmac("sha1", authToken).update(toSign).digest("base64");

  if (computed !== signature) {
    console.warn("[InboundSms] Signature mismatch — request rejected", {
      computed_prefix: computed.substring(0, 8),
      provided_prefix: signature.substring(0, 8),
    });
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true, method: "hmac" };
}

async function updateWebhookRegistration(base44, sourceName, status, error) {
  try {
    const regs = await base44.asServiceRole.entities.WebhookRegistration.filter(
      { source_name: sourceName },
      "-created_date",
      1
    );
    const now = new Date().toISOString();
    if (regs?.length > 0) {
      await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, {
        last_triggered_at: now,
        last_error: error || null,
        status,
      });
    }
  } catch (err) {
    console.warn(`[InboundSms] WebhookRegistration update failed for ${sourceName}:`, err?.message);
  }
}

// ── Sprint 2: Pause active nurture campaigns for a lead ──
async function pauseNurtureCampaigns(base44, leadId, reason) {
  try {
    const campaigns = await base44.asServiceRole.entities.NurtureCampaign.filter(
      { lead_id: leadId, status: "active" },
      "-created_date",
      10
    );
    for (const campaign of (campaigns || [])) {
      await base44.asServiceRole.entities.NurtureCampaign.update(campaign.id, {
        status: "paused",
        stop_reason: reason || "inbound_reply",
        notes: `Paused due to inbound reply at ${new Date().toISOString()}`,
      });
    }
    return (campaigns || []).length;
  } catch (err) {
    console.warn(`[InboundSms] Nurture pause failed for lead ${leadId}:`, err?.message);
    return 0;
  }
}

// ── Sprint 2: Stop nurture campaigns entirely (for STOP/opt-out) ──
async function stopNurtureCampaigns(base44, leadId, reason) {
  try {
    const campaigns = await base44.asServiceRole.entities.NurtureCampaign.filter(
      { lead_id: leadId, status: { $in: ["active", "paused"] } },
      "-created_date",
      10
    );
    for (const campaign of (campaigns || [])) {
      await base44.asServiceRole.entities.NurtureCampaign.update(campaign.id, {
        status: "stopped",
        stop_reason: reason || "opted_out",
        notes: `Stopped due to STOP/opt-out at ${new Date().toISOString()}`,
      });
    }
    return (campaigns || []).length;
  } catch (err) {
    console.warn(`[InboundSms] Nurture stop failed for lead ${leadId}:`, err?.message);
    return 0;
  }
}

// ── Sprint 2: Escalate to admin review via Alert entity ──
async function escalateToAdmin(base44, lead, intent, messageText, messageId) {
  try {
    const isHot = intent === "booking_intent";
    const isUnclear = intent === "unknown" || intent === "human_help_needed" || intent === "service_question";

    if (!isHot && !isUnclear) return null;

    await base44.asServiceRole.entities.Alert.create({
      type: isHot ? "booking_request" : "engagement_trigger",
      severity: isHot ? "high" : "medium",
      phone_number: lead.phone_number || "",
      lead_name: lead.full_name || lead.business_name || "Unknown",
      lead_id: lead.id,
      message: `[Inbound SMS] Intent: ${intent}. Message: "${(messageText || "").slice(0, 200)}". Requires admin review.`,
      lead_intent: intent === "booking_intent" ? "booking_request" : "support",
      lead_score: isHot ? 80 : 40,
      source: "twilio",
      notification_sent: false,
      read_status: false,
      conversion_status: "new",
    });
    return true;
  } catch (err) {
    console.warn(`[InboundSms] Admin escalation failed for lead ${lead.id}:`, err?.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    // GET health probe
    if (req.method === "GET") {
      const url = new URL(req.url);
      if (url.searchParams.get("_health") === "true" || !url.searchParams.get("Body")) {
        return Response.json(
          { status: "ok", route: "receiveTwilioInboundSms", method: "GET_probe", sprint: 2 },
          { status: 200 }
        );
      }
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();

    // Validate Twilio signature
    const sigResult = await validateTwilioSignature(req, rawBody);
    if (sigResult.missing_auth_token) {
      await updateWebhookRegistration(base44, "twilio_sms", "error", "TWILIO_AUTH_TOKEN not set");
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }
    if (!sigResult.valid) {
      console.warn("[InboundSms] Request rejected:", sigResult.reason);
      await updateWebhookRegistration(base44, "twilio_sms", "error", `Signature validation failed: ${sigResult.reason}`);
      return Response.json(
        { error: "Forbidden", reason: sigResult.missing_signature ? "missing_signature" : "invalid_signature" },
        { status: 403 }
      );
    }

    // Parse body
    const params = new URLSearchParams(rawBody);
    const from = normalizePhone(params.get("From"));
    const to = params.get("To");
    const message = params.get("Body");
    const messageId = params.get("MessageSid");

    if (!from || !message || !messageId) {
      await updateWebhookRegistration(base44, "twilio_sms", "error", "Missing required fields");
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Idempotency guard
    const existingEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { provider_message_id: messageId, event_type: "sms_received" },
      "-created_date",
      1
    );
    if (existingEvents && existingEvents.length > 0) {
      console.log(`[InboundSms] Duplicate MessageSid ${messageId} — already processed`);
      await updateWebhookRegistration(base44, "twilio_sms", "active", null);
      return Response.json({ received: true, matched: true, duplicate: true });
    }

    // ── Sprint 2: Classify intent BEFORE logging ──
    const classification = classifyInboundIntent(message);
    const isStopOptOut = classification.intent === "stop_opt_out";

    // Find lead by normalized phone number
    const allLeads = await base44.asServiceRole.entities.WebsiteLead.list("-created_date", 1000);
    const lead = allLeads.find((l) => {
      const normalizedLeadPhone = normalizePhone(l.phone_number);
      return normalizedLeadPhone === from;
    });

    if (!lead) {
      // Log unmatched inbound SMS
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_type: "inbound_sms_unmatched",
        channel: "sms",
        direction: "inbound",
        event_type: "sms_received",
        provider: "twilio",
        status: "unmatched",
        subject: `[TWILIO SMS] Unmatched inbound from ${from}`,
        message_body: message,
        provider_message_id: messageId,
        metadata_json: JSON.stringify({
          from,
          to,
          message_sid: messageId,
          timestamp: new Date().toISOString(),
          trigger: "inbound_sms_webhook",
          matched_website_lead_id: null,
          sprint2_intent: classification.intent,
          sprint2_confidence: classification.confidence,
          sprint2_recommended_action: classification.recommended_action,
        }),
      });
      await updateWebhookRegistration(base44, "twilio_sms", "active", null);
      return Response.json({ received: true, matched: false, intent: classification.intent });
    }

    // Log the SMS with intent classification
    const commEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead.id,
      context_type: "website_lead",
      context_id: lead.id,
      channel: "sms",
      direction: "inbound",
      event_type: "sms_received",
      provider: "twilio",
      status: "received",
      subject: `[TWILIO SMS] Reply from ${from}`,
      message_body: message,
      provider_message_id: messageId,
      metadata_json: JSON.stringify({
        from,
        to,
        message_sid: messageId,
        timestamp: new Date().toISOString(),
        trigger: "inbound_sms_webhook",
        matched_website_lead_id: lead.id,
        automation_stopped: true,
        sprint2_intent: classification.intent,
        sprint2_confidence: classification.confidence,
        sprint2_recommended_action: classification.recommended_action,
        sprint2_classified_by: "keyword_deterministic_v1",
      }),
    });

    // ── Sprint 2: Handle STOP / opt-out ──
    if (isStopOptOut) {
      await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
        reply_status: "responded",
        lead_status: "responded",
        last_engagement_type: "sms",
        last_engagement_at: new Date().toISOString(),
        last_message_sent: new Date().toISOString(),
        automation_enabled: false,
        cadence_paused: true,
        cadence_paused_at: new Date().toISOString(),
        sms_permission: false,
      });

      // Stop all active/paused nurture campaigns
      const stoppedCount = await stopNurtureCampaigns(base44, lead.id, "opted_out");

      // Log the opt-out as a CommunicationEvent
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead.id,
        context_type: "website_lead",
        context_id: lead.id,
        channel: "sms",
        direction: "system",
        event_type: "status_update",
        provider: "internal",
        status: "processed",
        subject: "Lead opted out via SMS STOP",
        message_body: `Lead texted STOP/opt-out. All nurture campaigns stopped (${stoppedCount}). Automation disabled.`,
        metadata_json: JSON.stringify({
          trigger: "stop_opt_out",
          nurture_campaigns_stopped: stoppedCount,
          timestamp: new Date().toISOString(),
        }),
      });

      await updateWebhookRegistration(base44, "twilio_sms", "active", null);
      console.log(`[InboundSms] STOP/opt-out from ${from} (lead: ${lead.id}). Stopped ${stoppedCount} nurture campaigns.`);

      return Response.json({
        received: true,
        matched: true,
        lead_id: lead.id,
        intent: classification.intent,
        opted_out: true,
        nurture_campaigns_stopped: stoppedCount,
      });
    }

    // ── Non-STOP reply: update lead status and pause nurture ──
    const leadUpdate = {
      reply_status: "responded",
      lead_status: "responded",
      last_engagement_type: "sms",
      last_engagement_at: new Date().toISOString(),
      last_message_sent: new Date().toISOString(),
      automation_enabled: false,
    };

    // Update booking status if booking intent
    if (classification.intent === "booking_intent") {
      leadUpdate.booking_status = "clicked";
    }

    await base44.asServiceRole.entities.WebsiteLead.update(lead.id, leadUpdate);

    // ── Sprint 2: Pause active nurture campaigns on meaningful reply ──
    const pausedCount = await pauseNurtureCampaigns(base44, lead.id, "inbound_reply");

    // ── Sprint 2: Escalate hot/unclear replies to admin ──
    await escalateToAdmin(base44, lead, classification.intent, message, messageId);

    // ── Sprint 2: Log booking CTA event for booking_intent ──
    if (classification.intent === "booking_intent") {
      try {
        const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
        const bookingLink = settingsRecords?.[0]?.booking_link_default || Deno.env.get("DEFAULT_BOOKING_LINK") || "";
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead.id,
          context_type: "website_lead",
          context_id: lead.id,
          channel: "internal",
          direction: "system",
          event_type: "booking_created",
          provider: "internal",
          status: "processed",
          subject: "Booking intent detected — booking CTA ready for admin review",
          message_body: `Lead expressed booking intent. Booking link: ${bookingLink || "NOT CONFIGURED"}. Admin review required before sending.`,
          metadata_json: JSON.stringify({
            trigger: "booking_intent_detected",
            booking_link: bookingLink || null,
            inbound_message_id: messageId,
            communication_event_id: commEvent?.id || null,
            timestamp: new Date().toISOString(),
            note: "Booking CTA NOT auto-sent — admin review required per Sprint 2 rules",
          }),
        });
      } catch (err) {
        console.warn(`[InboundSms] Booking CTA log failed:`, err?.message);
      }
    }

    await updateWebhookRegistration(base44, "twilio_sms", "active", null);
    console.log(`[InboundSms] SMS received from ${from} (lead: ${lead.id}, intent: ${classification.intent}, nurture_paused: ${pausedCount})`);

    return Response.json({
      received: true,
      matched: true,
      lead_id: lead.id,
      intent: classification.intent,
      confidence: classification.confidence,
      recommended_action: classification.recommended_action,
      nurture_campaigns_paused: pausedCount,
      escalated: classification.intent === "booking_intent" || classification.intent === "unknown" || classification.intent === "human_help_needed" || classification.intent === "service_question",
    });
  } catch (error) {
    console.error("[InboundSms] Handler error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return Response.json({ error: "An error occurred processing your request." }, { status: 500 });
  }
});
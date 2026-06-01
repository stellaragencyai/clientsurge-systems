import { secureJson } from "../_shared/response.ts";
/**
 * PUBLIC WEBHOOK: Twilio Inbound SMS Reply Handler
 * POST: /api/receiveTwilioInboundSms
 * 
 * Handles ALL inbound SMS messages to Twilio phone number:
 * - Matches SMS to WebsiteLead by phone number
 * - Marks WebsiteLead reply_status = responded
 * - Stops all future follow-ups
 * - Logs inbound SMS in CommunicationEvent
 * 
 * NO authentication required (Twilio sends requests)
 * Validates via signature verification
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import crypto from "node:crypto";

function normalizePhoneNumber(phone) {
  if (!phone) return "";
  // Remove all non-digit characters, then normalize to E.164-like format
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits; // US without country code
  if (digits.length === 11 && digits[0] === "1") return "+" + digits; // US with 1
  if (digits.length > 10) return "+" + digits; // International with country code
  return "+" + digits; // Fallback
}

function normalizeMessageBody(body) {
  if (!body) return "";
  return String(body).trim().substring(0, 1000); // Limit to 1000 chars
}

async function findWebsiteLeadByPhone(base44, phoneNumber) {
  if (!phoneNumber) return null;
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized) return null;

  try {
    // Find most recent WebsiteLead matching this phone
    // Exclude closed/ignored status
    const matches = await base44.asServiceRole.entities.WebsiteLead.filter(
      {
        phone_number: normalized,
        lead_status: { $nin: ["closed", "ignored"] },
        booking_status: { $ne: "booked" },
      },
      "-created_date",
      5 // Get top 5 in case of multiple matches
    );

    if (!matches || matches.length === 0) return null;

    // Return most recent active lead
    if (matches.length > 1) {
      console.log(
        `[receiveTwilioInboundSms] Found ${matches.length} active leads for ${phoneNumber}, using most recent`
      );
    }

    return matches[0];
  } catch (error) {
    console.error("[receiveTwilioInboundSms] Error finding WebsiteLead:", error.message);
    return null;
  }
}

async function isMessageAlreadyProcessed(base44, messageSid) {
  if (!messageSid) return false;

  try {
    // Check if this MessageSid was already logged
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {
        provider_message_id: messageSid,
        event_type: "sms_received",
      },
      "-created_date",
      1
    );

    if (existing && existing.length > 0) {
      console.log("[receiveTwilioInboundSms] MessageSid already processed:", messageSid);
      return true;
    }

    return false;
  } catch (error) {
    console.error("[receiveTwilioInboundSms] Error checking idempotency:", error.message);
    return false; // On error, proceed (fail-open)
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return secureJson({ error: "Method not allowed" }, { status: 405 });
  }

  let base44;
  let smsEvent = {};

  try {
    base44 = createClientFromRequest(req);

    // Parse form-encoded Twilio webhook
    const formData = await req.formData();
    const payload = Object.fromEntries(formData);

    console.log(
      "[receiveTwilioInboundSms] Received SMS from",
      payload.From,
      "MessageSid:",
      payload.MessageSid
    );

    // ─────────────────────────────────────────────────────
    // STEP 1: Validate Twilio signature (hard gate)
    // ─────────────────────────────────────────────────────
    console.log("[receiveTwilioInboundSms] Validating Twilio signature...");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!token) {
      console.error("[receiveTwilioInboundSms] TWILIO_AUTH_TOKEN is not set — rejecting");
      return secureJson({ error: "Server configuration error" }, { status: 500 });
    }

    const signature = req.headers.get("X-Twilio-Signature");
    if (!signature) {
      console.warn("[receiveTwilioInboundSms] X-Twilio-Signature header is missing — rejecting");
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url).toString();
    const data = new URLSearchParams(formData);
    const toSign =
      url +
      Array.from(data.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}${v}`)
        .join("");
    const computed = crypto.createHmac("sha1", token).update(toSign).digest("base64");

    if (computed !== signature) {
      console.warn("[receiveTwilioInboundSms] Signature invalid — rejecting");
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    console.log("[receiveTwilioInboundSms] Signature valid");

    // ─────────────────────────────────────────────────────
    // STEP 2: Validate required fields
    // ─────────────────────────────────────────────────────
    const errors = [];
    if (!payload.MessageSid) errors.push("MessageSid is required");
    if (!payload.From) errors.push("From is required");
    if (!payload.To) errors.push("To is required");
    if (!payload.Body) errors.push("Body is required");

    if (errors.length > 0) {
      console.warn("[receiveTwilioInboundSms] Validation errors:", errors);
      return secureJson(
        { error: "Invalid payload", details: errors },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────
    // STEP 3: Normalize and sanitize
    // ─────────────────────────────────────────────────────
    smsEvent = {
      message_sid: (payload.MessageSid || "").trim(),
      from_number: normalizePhoneNumber(payload.From),
      to_number: normalizePhoneNumber(payload.To),
      body: normalizeMessageBody(payload.Body),
      account_sid: (payload.AccountSid || "").trim(),
      timestamp: new Date().toISOString(),
    };

    console.log(
      "[receiveTwilioInboundSms] Normalized SMS event:",
      smsEvent.message_sid,
      "from",
      smsEvent.from_number
    );

    // ─────────────────────────────────────────────────────
    // STEP 4: Idempotency check
    // ─────────────────────────────────────────────────────
    const alreadyProcessed = await isMessageAlreadyProcessed(base44, smsEvent.message_sid);
    if (alreadyProcessed) {
      console.log("[receiveTwilioInboundSms] Duplicate MessageSid, skipping");
      return secureJson(
        { status: "ok_duplicate", message_sid: smsEvent.message_sid },
        { status: 200 }
      );
    }

    // ─────────────────────────────────────────────────────
    // STEP 5: Handle STOP / UNSTOP / HELP keywords (TCPA)
    // ─────────────────────────────────────────────────────
    const bodyUpper = smsEvent.body.trim().toUpperCase();
    const stopKeywords = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
    const startKeywords = ["START", "UNSTOP", "YES"];

    if (stopKeywords.includes(bodyUpper)) {
      console.log("[receiveTwilioInboundSms] STOP received from", smsEvent.from_number);
      // Find any active leads and disable automation
      const stopMatches = await base44.asServiceRole.entities.WebsiteLead.filter(
        { phone_number: smsEvent.from_number },
        "-created_date",
        10
      ).catch(() => []);
      for (const lead of (stopMatches || [])) {
        await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
          automation_enabled: false,
          cadence_paused: true,
          follow_up_step: 999,
          next_follow_up_at: null,
        }).catch(() => {});
      }
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_type: "sms_opt_out",
        channel: "sms",
        direction: "inbound",
        event_type: "sms_received",
        provider: "twilio",
        status: "received",
        subject: `[STOP] Opt-out from ${smsEvent.from_number}`,
        message_body: smsEvent.body,
        provider_message_id: smsEvent.message_sid,
        metadata_json: JSON.stringify({ from: smsEvent.from_number, keyword: bodyUpper, leads_updated: (stopMatches || []).length }),
      }).catch(() => {});
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        headers: { "Content-Type": "text/xml", "X-Frame-Options": "DENY" },
      });
    }

    if (startKeywords.includes(bodyUpper)) {
      console.log("[receiveTwilioInboundSms] START/UNSTOP received from", smsEvent.from_number);
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        headers: { "Content-Type": "text/xml", "X-Frame-Options": "DENY" },
      });
    }

    // ─────────────────────────────────────────────────────
    // STEP 5b: Try to match to Leads entity (AI Sales Rep pipeline)
    //          then fall back to WebsiteLead
    // ─────────────────────────────────────────────────────
    
    // First: check Leads entity (AI Sales Rep pipeline)
    let matchedLead = null;
    try {
      const leadMatches = await base44.asServiceRole.entities.Leads.filter(
        { phone: smsEvent.from_number },
        "-created_date",
        3
      );
      if (leadMatches && leadMatches.length > 0) {
        matchedLead = leadMatches[0];
      }
    } catch (err) {
      console.log("[receiveTwilioInboundSms] Leads lookup failed:", err.message);
    }

    if (matchedLead) {
      console.log("[receiveTwilioInboundSms] Matched Leads record:", matchedLead.id, "| Agent:", matchedLead.assigned_agent_name);

      let intentResult = null;
      try {
        intentResult = await base44.asServiceRole.functions.invoke("classifyLeadIntent", {
          lead_id: matchedLead.id,
          message_text: smsEvent.body,
        });
        console.log(
          `[receiveTwilioInboundSms] Intent classified | Legacy: ${intentResult?.intent} | Canonical: ${intentResult?.canonical_intent}`
        );
      } catch (intentErr) {
        console.error("[receiveTwilioInboundSms] classifyLeadIntent failed:", intentErr.message);
      }

      // Generate industry-aware AI reply
      try {
        const replyResult = await base44.asServiceRole.functions.invoke('industryAwareReply', {
          lead_id: matchedLead.id,
          inbound_message: smsEvent.body,
        });

        console.log(`[receiveTwilioInboundSms] AI reply generated | Intent: ${replyResult?.detected_intent}`);

        // Send the AI reply via SMS
        if (replyResult?.reply) {
          await base44.asServiceRole.functions.invoke('sendSMS', {
            to: smsEvent.from_number,
            body: replyResult.reply,
          });
          console.log("[receiveTwilioInboundSms] AI reply sent to", smsEvent.from_number);
        }

        // If booking intent detected, also send booking link
        if (
          replyResult?.action === 'send_booking_link' ||
          intentResult?.should_send_booking_link
        ) {
          const bookingLink = Deno.env.get('DEFAULT_BOOKING_LINK');
          if (bookingLink) {
            await base44.asServiceRole.functions.invoke('sendSMS', {
              to: smsEvent.from_number,
              body: `Here's your scheduling link: ${bookingLink}`,
            });
          }
        }
      } catch (replyErr) {
        console.error("[receiveTwilioInboundSms] industryAwareReply failed:", replyErr.message);
        // Log inbound even if reply fails
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: matchedLead.id,
          channel: "sms",
          direction: "inbound",
          event_type: "sms_received",
          provider: "twilio",
          status: "received",
          message_body: smsEvent.body,
          provider_message_id: smsEvent.message_sid,
        }).catch(() => {});
      }

      return secureJson(
        { status: "ok_ai_replied", lead_id: matchedLead.id, message_sid: smsEvent.message_sid },
        { status: 200 }
      );
    }

    // Fallback: match to WebsiteLead
    const websiteLead = await findWebsiteLeadByPhone(base44, smsEvent.from_number);

    if (websiteLead) {
      console.log(
        "[receiveTwilioInboundSms] Matched WebsiteLead:",
        websiteLead.id,
        "marking as responded"
      );

      try {
        await base44.asServiceRole.entities.WebsiteLead.update(websiteLead.id, {
          reply_status: "responded",
          lead_status: "responded",
          last_message_sent: smsEvent.timestamp,
          next_follow_up_at: null,
          follow_up_step: 999,
          automation_enabled: false,
        });
      } catch (updateError) {
        console.error("[receiveTwilioInboundSms] Failed to update WebsiteLead:", updateError.message);
      }

      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          context_type: "website_lead",
          context_id: websiteLead.id,
          channel: "sms",
          direction: "inbound",
          event_type: "sms_received",
          provider: "twilio",
          status: "received",
          subject: `[TWILIO SMS] Reply from ${smsEvent.from_number}`,
          message_body: smsEvent.body,
          provider_message_id: smsEvent.message_sid,
          metadata_json: JSON.stringify({
            from: smsEvent.from_number,
            to: smsEvent.to_number,
            message_sid: smsEvent.message_sid,
            reason: "lead_replied_by_sms",
            timestamp: smsEvent.timestamp,
            automation_stopped: true,
          }),
        });
      } catch (logError) {
        console.error("[receiveTwilioInboundSms] Failed to log event:", logError.message);
      }

      return secureJson(
        { status: "ok_matched", lead_id: websiteLead.id, message_sid: smsEvent.message_sid },
        { status: 200 }
      );
    }

    // ─────────────────────────────────────────────────────
    // STEP 8: No match found - log as unmatched
    // ─────────────────────────────────────────────────────
    console.log("[receiveTwilioInboundSms] No WebsiteLead found for", smsEvent.from_number);

    try {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_type: "inbound_sms_unmatched",
        channel: "sms",
        direction: "inbound",
        event_type: "sms_received",
        provider: "twilio",
        status: "unmatched",
        subject: `[TWILIO SMS] Unmatched inbound from ${smsEvent.from_number}`,
        message_body: smsEvent.body,
        provider_message_id: smsEvent.message_sid,
        metadata_json: JSON.stringify({
          from: smsEvent.from_number,
          to: smsEvent.to_number,
          message_sid: smsEvent.message_sid,
          reason: "no_matching_website_lead",
          timestamp: smsEvent.timestamp,
        }),
      });

      console.log("[receiveTwilioInboundSms] Logged unmatched SMS");
    } catch (logError) {
      console.error("[receiveTwilioInboundSms] Failed to log unmatched event:", logError.message);
    }

    // Still return 200 so Twilio doesn't retry
    return secureJson(
      { status: "ok_unmatched", message_sid: smsEvent.message_sid },
      { status: 200 }
    );
  } catch (error) {
    console.error("[receiveTwilioInboundSms] Runtime error:", error.message);

    if (base44) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          context_type: "inbound_sms_error",
          channel: "sms",
          direction: "inbound",
          event_type: "webhook_error",
          provider: "twilio",
          status: "failed",
          subject: "[TWILIO SMS] Webhook Processing Error",
          message_body: error.message,
          error_message: error.message,
          metadata_json: JSON.stringify({
            message_sid: smsEvent.message_sid || "unknown",
            error_stage: "processing",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (logErr) {
        console.error("[receiveTwilioInboundSms] Failed to log error:", logErr.message);
      }
    }

    // Still return 200 to prevent Twilio retry loop
    return secureJson({ status: "error_logged", message_sid: smsEvent.message_sid }, { status: 200 });
  }
});

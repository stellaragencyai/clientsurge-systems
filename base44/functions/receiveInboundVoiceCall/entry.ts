/**
 * receiveInboundVoiceCall — Hardened Twilio Voice Webhook Handler
 *
 * Guarantees:
 *   1. Always returns HTTP 200 with Content-Type: text/xml; charset=utf-8
 *   2. Always returns valid TwiML with a <Response> root element
 *   3. Accepts POST (form-urlencoded / JSON / query string) and GET probes
 *   4. Full handler wrapped in defensive try/catch — no uncaught exceptions
 *   5. Writes a CommunicationEvent (voice/inbound/twilio) for every real Twilio attempt
 *   6. AI handoff (ElevenLabs Connect+Stream) when inbound_voice_enabled AND agent configured
 *   7. Safe fallback: greeting + Dial forwarding phone (never dials itself) OR graceful Hangup
 *
 * Twilio Console → Phone Numbers → Voice & Fax → A Call Comes In → Webhook → POST
 * Canonical URL: https://clientsurgesystems.com/functions/receiveInboundVoiceCall
 * Also use the same URL for Call Status Changes → POST.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Constants ──
const SELF_NUMBER = "+16025843227";
const CANONICAL_FUNCTION_PATH = "/functions/receiveInboundVoiceCall";
const DEFAULT_APP_URL = "https://clientsurgesystems.com";
const GREETING = "Thank you for calling ClientSurge Systems. Please hold while we connect your call.";
const CALLBACK_MSG = "Thank you for calling ClientSurge Systems. All our team members are currently helping other callers. Please leave a voicemail after the tone, or try again shortly, and we will call you back. Thank you.";
const ERROR_MSG = "Thank you for calling ClientSurge Systems. We are experiencing a brief technical issue. Please call again in a moment.";

// ── URL helpers ──
function canonicalWebhookUrl() {
  const base = (Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL") || DEFAULT_APP_URL).replace(/\/$/, "");
  return `${base}${CANONICAL_FUNCTION_PATH}`;
}

function requestPath(req) {
  try {
    return new URL(req.url).pathname || CANONICAL_FUNCTION_PATH;
  } catch (_) {
    return CANONICAL_FUNCTION_PATH;
  }
}

// ── TwiML helpers ──
function wrapTwiml(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${inner}\n</Response>`;
}

function xmlResponse(inner, status = 200) {
  return new Response(wrapTwiml(inner), {
    status,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
    },
  });
}

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Phone normalization ──
function normalizePhoneE164(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  if (digits.length > 11) return `+${digits}`;
  return null;
}

function isSelfNumber(phone) {
  if (!phone) return false;
  const norm = normalizePhoneE164(phone);
  if (!norm) return false;
  const selfNorm = normalizePhoneE164(SELF_NUMBER);
  const envSelf1 = normalizePhoneE164(Deno.env.get("TWILIO_PHONE_NUMBER"));
  const envSelf2 = normalizePhoneE164(Deno.env.get("TWILIO_FROM_NUMBER"));
  return norm === selfNorm || norm === envSelf1 || norm === envSelf2;
}

// ── Param parsing (supports form-urlencoded, JSON, query string) ──
function parseInboundParams(req, rawBody, contentType) {
  let params = {};
  let parseMode = "none";
  const ct = (contentType || "").toLowerCase();

  // 1. Form-urlencoded body
  if (rawBody && (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data"))) {
    try {
      const qs = new URLSearchParams(rawBody);
      if (qs.has("CallSid") || qs.has("From") || qs.has("AccountSid") || qs.has("CallStatus")) {
        params = Object.fromEntries(qs);
        parseMode = "form-urlencoded";
      }
    } catch (_) {}
  }

  // 2. JSON body
  if (parseMode === "none" && rawBody && ct.includes("application/json")) {
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        params = parsed;
        parseMode = "json";
      }
    } catch (_) {}
  }

  // 3. Fallback: try form-urlencoded regardless of content-type
  if (parseMode === "none" && rawBody) {
    try {
      const qs = new URLSearchParams(rawBody);
      if (qs.has("CallSid") || qs.has("From") || qs.has("AccountSid")) {
        params = Object.fromEntries(qs);
        parseMode = "form-urlencoded-fallback";
      }
    } catch (_) {}
  }

  // 4. Fallback: query string params in URL
  if (parseMode === "none") {
    try {
      const url = new URL(req.url);
      const qs = url.searchParams;
      if (qs.has("CallSid") || qs.has("From") || qs.has("AccountSid")) {
        params = Object.fromEntries(qs);
        parseMode = "query-string";
      }
    } catch (_) {}
  }

  if (parseMode === "none") {
    parseMode = rawBody ? "unrecognized" : "empty-body";
  }

  return { params, parseMode };
}

// ── TwiML builders ──
function buildFallbackTwiml(forwardingPhone) {
  if (forwardingPhone && !isSelfNumber(forwardingPhone)) {
    return `  <Say voice="alice">${escapeXml(GREETING)}</Say>\n  <Dial callerId="${escapeXml(SELF_NUMBER)}">${escapeXml(forwardingPhone)}</Dial>`;
  }
  return `  <Say voice="alice">${escapeXml(CALLBACK_MSG)}</Say>\n  <Hangup/>`;
}

function buildAiHandoffTwiml(agentId) {
  // ElevenLabs Conversational AI via Twilio <Connect><Stream>
  const streamUrl = `wss://api.elevenlabs.io/v1/conversational-rag/twilio/${agentId}`;
  return `  <Connect>\n    <Stream url="${escapeXml(streamUrl)}" />\n  </Connect>`;
}

function buildErrorFallbackTwiml() {
  return `  <Say voice="alice">${escapeXml(ERROR_MSG)}</Say>\n  <Hangup/>`;
}

// ── Load voice configuration from AdminSettings + env ──
async function loadVoiceConfig(req) {
  let settings = null;
  try {
    const base44 = createClientFromRequest(req);
    const list = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    settings = list?.[0] || null;
  } catch (err) {
    console.warn("[receiveInboundVoiceCall] AdminSettings load failed:", err?.message);
  }

  const envForwarding = Deno.env.get("ADMIN_NOTIFICATION_PHONE") || "";
  const settingsForwarding = settings?.voice_forwarding_phone || "";
  const forwardingPhone = normalizePhoneE164(settingsForwarding || envForwarding);

  const inboundVoiceEnabled = settings?.inbound_voice_enabled === true;
  const elevenLabsAgentId =
    settings?.elevenlabs_agent_ids?.receptionist ||
    settings?.elevenlabs_agent_ids?.general ||
    Deno.env.get("ELEVENLABS_AGENT_ID") ||
    "";
  const elevenLabsConfigured = !!elevenLabsAgentId;

  return {
    forwardingPhone,
    inboundVoiceEnabled,
    elevenLabsAgentId,
    elevenLabsConfigured,
  };
}

// ── Fire-and-forget logging (runs after TwiML is returned) ──
async function logCallAsync(req, params, parseMode, contentType, fallbackMode, exceptionMsg) {
  try {
    const base44 = createClientFromRequest(req);

    const callSid = params.CallSid || params.call_sid || `LIVE_NO_SID_${Date.now()}`;
    const from = params.From || params.from || "";
    const to = params.To || params.to || "";
    const callStatus = params.CallStatus || params.call_status || "initiated";
    const direction = params.Direction || params.direction || "inbound";
    const accountSidPresent = !!(params.AccountSid || params.account_sid);
    const isSmoke =
      callSid.startsWith("CA_TEST") ||
      callSid.startsWith("SMOKE") ||
      params._smoke === "true" ||
      params._health === "true";
    const now = new Date().toISOString();

    const status = exceptionMsg ? "failed" : "received";

    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "voice",
      direction: "inbound",
      event_type: "voice_call_initiated",
      provider: "twilio",
      status,
      subject: isSmoke ? "Voice webhook received (health/smoke)" : "Live inbound call received",
      provider_message_id: callSid,
      message_body: `Inbound call from ${from} to ${to || SELF_NUMBER} — status: ${callStatus}, direction: ${direction}`,
      error_message: exceptionMsg || undefined,
      metadata_json: JSON.stringify({
        call_sid: callSid,
        from,
        to,
        call_status: callStatus,
        direction,
        account_sid_present: accountSidPresent,
        received_at: now,
        content_type: contentType || "unknown",
        parse_mode: parseMode,
        fallback_mode: fallbackMode || "none",
        smoke: isSmoke,
        live_call: !isSmoke,
        source_route: CANONICAL_FUNCTION_PATH,
        request_path: requestPath(req),
        canonical_webhook_url: canonicalWebhookUrl(),
        exception: exceptionMsg || null,
      }),
    });

    // Update WebhookRegistration (best-effort)
    try {
      const regs = await base44.asServiceRole.entities.WebhookRegistration.filter(
        { source_name: "twilio_voice" },
        "-created_date",
        1
      );
      if (regs?.length > 0) {
        await base44.asServiceRole.entities.WebhookRegistration.update(regs[0].id, {
          webhook_url: canonicalWebhookUrl(),
          last_triggered_at: now,
          last_error: exceptionMsg || null,
          status: "active",
        });
      }
    } catch (_) {}

    // WebsiteLead capture (best-effort, only for real calls with a real phone)
    if (!isSmoke) {
      const normalizedPhone = normalizePhoneE164(from);
      if (normalizedPhone) {
        try {
          const existing = await base44.asServiceRole.entities.WebsiteLead.filter(
            { phone_number: normalizedPhone },
            "-created_date",
            1
          );
          if (existing?.length > 0) {
            await base44.asServiceRole.entities.WebsiteLead.update(existing[0].id, {
              call_sid: callSid,
              last_engagement_type: "call",
              last_engagement_at: now,
              call_summary: `Live inbound call received — status: ${callStatus}.`,
            });
          } else {
            await base44.asServiceRole.entities.WebsiteLead.create({
              phone_number: normalizedPhone,
              full_name: "Inbound Caller",
              source: "elevenlabs_sarah_ai_receptionist",
              call_sid: callSid,
              last_engagement_type: "call",
              last_engagement_at: now,
              lead_status: "new",
              call_summary: `Live inbound call from ${from} via Twilio.`,
              conversation_id: callSid,
            });
          }
        } catch (_) {}
      }
    }

    console.log(
      `[receiveInboundVoiceCall] logged: sid=${callSid} parse=${parseMode} fallback=${fallbackMode || "none"} smoke=${isSmoke} status=${status}`
    );
  } catch (err) {
    console.error("[receiveInboundVoiceCall] async log failed (non-fatal):", err?.message);
  }
}

// ── Main handler ──
Deno.serve(async (req) => {
  let rawBody = "";
  let contentType = "";
  let parseMode = "none";
  let fallbackMode = "none";
  let exceptionMsg = null;
  let params = {};

  try {
    // ── GET: health probe — return valid TwiML so Twilio GET requests also work ──
    if (req.method === "GET") {
      return xmlResponse(`  <Say voice="alice">Voice webhook is online.</Say>`);
    }

    if (req.method !== "POST") {
      return xmlResponse(`  <Hangup/>`);
    }

    // ── Read body (must happen before any Response is returned) ──
    try {
      rawBody = await req.text();
      contentType = req.headers.get("content-type") || "";
    } catch (err) {
      contentType = "";
      rawBody = "";
      exceptionMsg = `body-read-error: ${err.message}`;
    }

    // ── Parse inbound params ──
    const parsed = parseInboundParams(req, rawBody, contentType);
    params = parsed.params;
    parseMode = parsed.parseMode;

    const callStatus = params.CallStatus || params.call_status || "initiated";

    // ── Status callback detection (terminal call events) ──
    const isStatusCallback = ["completed", "busy", "failed", "no-answer", "canceled"].includes(callStatus);
    if (isStatusCallback) {
      const response = xmlResponse(``);
      logCallAsync(req, params, parseMode, contentType, "status-callback", exceptionMsg).catch(() => {});
      return response;
    }

    // ── Load voice config ──
    let voiceConfig = null;
    try {
      voiceConfig = await loadVoiceConfig(req);
    } catch (err) {
      exceptionMsg = `config-load-error: ${err.message}`;
    }

    // ── Build TwiML ──
    let twimlBody = "";
    const aiEligible = voiceConfig?.inboundVoiceEnabled && voiceConfig?.elevenLabsConfigured;

    if (aiEligible) {
      try {
        twimlBody = buildAiHandoffTwiml(voiceConfig.elevenLabsAgentId);
        fallbackMode = "ai-handoff";
      } catch (err) {
        exceptionMsg = `ai-handoff-error: ${err.message}`;
        fallbackMode = "ai-failed-fallback";
        twimlBody = buildFallbackTwiml(voiceConfig?.forwardingPhone);
      }
    } else {
      fallbackMode = voiceConfig?.inboundVoiceEnabled
        ? "ai-not-configured-fallback"
        : "inbound-disabled-fallback";
      twimlBody = buildFallbackTwiml(voiceConfig?.forwardingPhone);
    }

    // ── Return TwiML ──
    const response = xmlResponse(twimlBody);

    // ── Fire-and-forget logging ──
    logCallAsync(req, params, parseMode, contentType, fallbackMode, exceptionMsg).catch(() => {});

    return response;
  } catch (error) {
    // ── Ultimate fallback: never let Twilio see an unhandled error ──
    exceptionMsg = `handler-error: ${error.message}`;
    fallbackMode = "handler-catch-fallback";

    console.error("[receiveInboundVoiceCall] Uncaught handler error:", error.message);

    logCallAsync(req, params || {}, parseMode, contentType, fallbackMode, exceptionMsg).catch(() => {});

    return xmlResponse(buildErrorFallbackTwiml());
  }
});
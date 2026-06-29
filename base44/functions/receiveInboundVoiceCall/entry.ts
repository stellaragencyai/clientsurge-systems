/**
 * receiveInboundVoiceCall — Hardened Twilio Voice Webhook Handler
 *
 * Guarantees:
 *   1. Always returns HTTP 200 with Content-Type: text/xml; charset=utf-8
 *   2. Always returns valid TwiML with a <Response> root element
 *   3. Accepts POST (form-urlencoded / JSON / query string) and GET probes
 *   4. Full handler wrapped in defensive try/catch — no uncaught exceptions
 *   5. Writes a CommunicationEvent (voice/inbound/twilio) for every attempt
 *   6. Sends one SMS text-back to the inbound caller using TWILIO_MESSAGING_SERVICE_SID
 *   7. Deduplicates SMS text-back by CallSid
 *   8. AI handoff (ElevenLabs Connect+Stream) when inbound_voice_enabled AND agent configured
 *   9. Safe fallback: greeting + Dial forwarding phone (never dials itself) OR graceful Hangup
 *
 * Twilio Console → Phone Numbers → Voice & Fax → A Call Comes In → POST
 * URL: https://clientsurgesystems.com/api/receiveInboundVoiceCall
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Constants ──
const SELF_NUMBER = "+16025843227";
const GREETING = "Thank you for calling ClientSurge Systems. Please hold while we connect your call.";
const CALLBACK_MSG = "Thank you for calling ClientSurge Systems. All our team members are currently helping other callers. Please leave a voicemail after the tone, or try again shortly, and we will call you back. Thank you.";
const ERROR_MSG = "Thank you for calling ClientSurge Systems. We are experiencing a brief technical issue. Please call again in a moment.";
const DEFAULT_TEXT_BACK_MESSAGE = "Thanks for calling ClientSurge Systems - sorry we missed you. Reply here and we'll help you get your automation setup started. Book here: https://clientsurgesystems.com/free-audit";
const TEXT_BACK_SERVICE_KEY = "missed_call_text_back";

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

function isSmokeCall(params = {}) {
  const callSid = params.CallSid || params.call_sid || "";
  return (
    callSid.startsWith("CA_TEST") ||
    callSid.startsWith("SMOKE") ||
    params._smoke === "true" ||
    params._health === "true"
  );
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

function appendSmsOptOut(message) {
  const trimmed = String(message || "").trim();
  if (!trimmed) return "";
  if (/\breply\s+stop\b/i.test(trimmed) || /\bstop\s+to\s+opt\s+out\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

function formatTextBackTemplate(template, lead, settings) {
  const bookingLink =
    settings?.booking_link_default ||
    Deno.env.get("DEFAULT_BOOKING_LINK") ||
    "https://clientsurgesystems.com/free-audit";
  const businessName = Deno.env.get("DEFAULT_BUSINESS_NAME") || "ClientSurge Systems";
  const firstName = lead?.first_name || lead?.full_name?.split(" ")?.[0] || "there";
  const industry = lead?.industry_slug || lead?.business_type || "your industry";

  return String(template || DEFAULT_TEXT_BACK_MESSAGE)
    .replace(/\{first_name\}/g, firstName)
    .replace(/\{business_name\}/g, businessName)
    .replace(/\{booking_link\}/g, bookingLink)
    .replace(/\{industry\}/g, industry);
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
    settings,
  };
}

async function logSmsTextBackEvent(base44, fields) {
  const now = new Date().toISOString();
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: fields.leadId || undefined,
      context_type: "twilio_call",
      context_id: fields.callSid || undefined,
      service_key: TEXT_BACK_SERVICE_KEY,
      channel: "sms",
      direction: "outbound",
      event_type: fields.eventType,
      provider: "twilio",
      status: fields.status,
      subject: fields.subject,
      message_body: fields.messageBody || null,
      provider_message_id: fields.messageSid || null,
      error_message: fields.errorMessage || null,
      environment: Deno.env.get("APP_ENV") || "production",
      metadata_json: JSON.stringify({
        service_key: TEXT_BACK_SERVICE_KEY,
        source_route: "/api/receiveInboundVoiceCall",
        call_sid: fields.callSid || null,
        caller_phone: fields.callerPhone || null,
        twilio_message_sid: fields.messageSid || null,
        twilio_message_status: fields.messageStatus || null,
        parse_mode: fields.parseMode || null,
        content_type: fields.contentType || null,
        reason: fields.reason || null,
        timestamp: now,
      }),
    });
  } catch (err) {
    console.error("[receiveInboundVoiceCall] SMS text-back event log failed:", err?.message);
  }
}

async function hasTextBackAlreadySent(base44, callSid) {
  if (!callSid) return false;

  try {
    const existing = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {
        context_id: callSid,
        service_key: TEXT_BACK_SERVICE_KEY,
        channel: "sms",
        direction: "outbound",
        event_type: "sms_sent",
      },
      "-created_date",
      1
    );

    return Boolean(existing?.length);
  } catch (err) {
    console.warn("[receiveInboundVoiceCall] SMS text-back dedupe check failed:", err?.message);
    return false;
  }
}

async function findOrCreateWebsiteLeadForCaller(base44, normalizedPhone, callSid) {
  const now = new Date().toISOString();

  try {
    const existing = await base44.asServiceRole.entities.WebsiteLead.filter(
      { phone_number: normalizedPhone },
      "-created_date",
      1
    );

    if (existing?.length > 0) {
      const lead = existing[0];
      try {
        await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
          call_sid: callSid || lead.call_sid,
          last_engagement_type: "call",
          last_engagement_at: now,
          call_summary: "Inbound call received. Automated text-back attempted.",
        });
      } catch (_) {}
      return lead;
    }

    return await base44.asServiceRole.entities.WebsiteLead.create({
      phone_number: normalizedPhone,
      full_name: "Inbound Caller",
      source: "elevenlabs_sarah_ai_receptionist",
      call_sid: callSid || undefined,
      last_engagement_type: "call",
      last_engagement_at: now,
      lead_status: "new",
      call_summary: "Inbound call received. Automated text-back attempted.",
      conversation_id: callSid || undefined,
      requested_channels: ["voice", "sms"],
    });
  } catch (err) {
    console.warn("[receiveInboundVoiceCall] WebsiteLead lookup/create failed:", err?.message);
    return null;
  }
}

async function loadLatestAdminSettings(base44) {
  try {
    const list = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    return list?.[0] || null;
  } catch (err) {
    console.warn("[receiveInboundVoiceCall] AdminSettings lookup for text-back failed:", err?.message);
    return null;
  }
}

async function sendTwilioSmsViaMessagingService(toNumber, messageBody, statusCallbackUrl) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

  if (!accountSid) throw new Error("TWILIO_ACCOUNT_SID is not configured");
  if (!authToken) throw new Error("TWILIO_AUTH_TOKEN is not configured");
  if (!messagingServiceSid) throw new Error("TWILIO_MESSAGING_SERVICE_SID is not configured");

  const params = {
    MessagingServiceSid: messagingServiceSid,
    To: toNumber,
    Body: appendSmsOptOut(messageBody),
  };

  if (statusCallbackUrl) {
    params.StatusCallback = statusCallbackUrl;
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    }
  );

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_) {
    data = { raw };
  }

  if (!response.ok) {
    const detail = data?.message || data?.error_message || raw || `HTTP ${response.status}`;
    throw new Error(`Twilio SMS failed: ${response.status} - ${detail}`);
  }

  return {
    sid: data.sid,
    status: data.status,
  };
}

async function sendCallTextBackAsync(req, params, parseMode, contentType) {
  const callSid = params.CallSid || params.call_sid || "";
  const rawFrom = params.From || params.from || "";
  const callStatus = params.CallStatus || params.call_status || "initiated";
  const normalizedPhone = normalizePhoneE164(rawFrom);
  const base44 = createClientFromRequest(req);

  if (isSmokeCall(params)) {
    return { skipped: true, reason: "smoke_call" };
  }

  if (!callSid) {
    await logSmsTextBackEvent(base44, {
      eventType: "sms_skipped",
      status: "processed",
      subject: "Inbound call text-back skipped — missing CallSid",
      reason: "missing_call_sid",
      callerPhone: normalizedPhone || rawFrom || null,
      parseMode,
      contentType,
    });
    return { skipped: true, reason: "missing_call_sid" };
  }

  if (!normalizedPhone) {
    await logSmsTextBackEvent(base44, {
      callSid,
      eventType: "sms_skipped",
      status: "processed",
      subject: "Inbound call text-back skipped — invalid caller phone",
      reason: "invalid_from_number",
      callerPhone: rawFrom || null,
      parseMode,
      contentType,
    });
    return { skipped: true, reason: "invalid_from_number" };
  }

  if (isSelfNumber(normalizedPhone)) {
    await logSmsTextBackEvent(base44, {
      callSid,
      eventType: "sms_skipped",
      status: "processed",
      subject: "Inbound call text-back skipped — caller is Twilio number",
      reason: "self_number_loop_guard",
      callerPhone: normalizedPhone,
      parseMode,
      contentType,
    });
    return { skipped: true, reason: "self_number_loop_guard" };
  }

  if (await hasTextBackAlreadySent(base44, callSid)) {
    return { skipped: true, reason: "duplicate_call_sid" };
  }

  const settings = await loadLatestAdminSettings(base44);
  const lead = await findOrCreateWebsiteLeadForCaller(base44, normalizedPhone, callSid);

  if (lead?.do_not_contact === true) {
    await logSmsTextBackEvent(base44, {
      callSid,
      leadId: lead.id,
      eventType: "sms_skipped",
      status: "processed",
      subject: "Inbound call text-back skipped — lead marked do not contact",
      reason: "lead_do_not_contact",
      callerPhone: normalizedPhone,
      parseMode,
      contentType,
    });
    return { skipped: true, reason: "lead_do_not_contact" };
  }

  const messageBody = formatTextBackTemplate(settings?.missed_call_sms_template || DEFAULT_TEXT_BACK_MESSAGE, lead, settings);
  const statusCallbackUrl = settings?.sms_status_callback_url || Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL") || "";

  try {
    const result = await sendTwilioSmsViaMessagingService(normalizedPhone, messageBody, statusCallbackUrl);
    const now = new Date().toISOString();

    if (lead?.id) {
      try {
        await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
          initial_response_sent_at: lead.initial_response_sent_at || now,
          lead_status: lead.lead_status === "new" ? "contacted" : lead.lead_status,
          sms_attempt_count: (lead.sms_attempt_count || 0) + 1,
          last_engagement_type: "sms",
          last_engagement_at: now,
          last_message_sent: now,
          call_summary: `Inbound call received (${callStatus}). Automated text-back sent.`,
        });
      } catch (err) {
        console.warn("[receiveInboundVoiceCall] WebsiteLead SMS update failed:", err?.message);
      }
    }

    await logSmsTextBackEvent(base44, {
      callSid,
      leadId: lead?.id,
      eventType: "sms_sent",
      status: "sent",
      subject: "Inbound call text-back sent",
      messageBody: appendSmsOptOut(messageBody),
      messageSid: result.sid,
      messageStatus: result.status,
      callerPhone: normalizedPhone,
      parseMode,
      contentType,
    });

    console.log(`[receiveInboundVoiceCall] SMS text-back sent: callSid=${callSid} messageSid=${result.sid}`);
    return { sent: true, messageSid: result.sid };
  } catch (err) {
    await logSmsTextBackEvent(base44, {
      callSid,
      leadId: lead?.id,
      eventType: "sms_failed",
      status: "failed",
      subject: "Inbound call text-back failed",
      messageBody: appendSmsOptOut(messageBody),
      errorMessage: err?.message || "Unknown Twilio SMS error",
      callerPhone: normalizedPhone,
      parseMode,
      contentType,
    });

    console.error("[receiveInboundVoiceCall] SMS text-back failed:", err?.message);
    return { sent: false, error: err?.message };
  }
}

async function runCallTextBackWithBudget(req, params, parseMode, contentType) {
  const timeoutMs = Number(Deno.env.get("TWILIO_CALL_TEXT_BACK_TIMEOUT_MS") || "2500");
  const sendPromise = sendCallTextBackAsync(req, params, parseMode, contentType)
    .then((result) => ({ type: "done", result }))
    .catch((err) => ({ type: "error", error: err }));

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve({ type: "timeout" }), Number.isFinite(timeoutMs) ? timeoutMs : 2500);
  });

  const result = await Promise.race([sendPromise, timeoutPromise]);
  if (result?.type === "timeout") {
    console.warn("[receiveInboundVoiceCall] SMS text-back still running after response budget; returning TwiML now");
  }
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
    const isSmoke = isSmokeCall(params);
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
        source_route: "/api/receiveInboundVoiceCall",
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

    // ── Send immediate text-back for real inbound calls ──
    // This is intentionally attempted before TwiML is returned, but capped so Twilio still gets a fast response.
    await runCallTextBackWithBudget(req, params, parseMode, contentType);

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
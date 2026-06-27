import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function detectEnvironment(req) {
  try {
    const url = new URL(req.url);
    if (url.hostname.includes("preview") || url.hostname.includes("sandbox")) return "preview";
  } catch (_) {}
  return "production";
}

function redactSecrets(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/(Bearer\s+)[A-Za-z0-9\-_.]+/gi, "$1[REDACTED]")
    .replace(/(Basic\s+)[A-Za-z0-9+/=]+/gi, "$1[REDACTED]")
    .replace(/re_[A-Za-z0-9]{8,}/gi, "[REDACTED]")
    .replace(/SK[A-Za-z0-9]{20,}/g, "[REDACTED]")
    .replace(/AC[a-f0-9]{32}/gi, "[REDACTED]")
    .slice(0, 2000);
}

function safeResendFrom() {
  const configured = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return "ClientSurge Systems <system@clientsurgesystems.com>";
}

// ── E.164 PHONE NORMALIZATION ──
function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return null;
  if (cleaned.length === 10) {
    if (cleaned[0] === '0' || cleaned[0] === '1') return null;
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const tenDigits = cleaned.slice(1);
    if (tenDigits[0] === '0' || tenDigits[0] === '1') return null;
    return `+${cleaned}`;
  }
  if (cleaned.length >= 11 && cleaned.length <= 15) return `+${cleaned}`;
  return null;
}

// ═══════════════════════════════════════════
// ELIGIBILITY CHECKS
// ═══════════════════════════════════════════

const TEST_EMAIL_PATTERNS = [
  "example.com",
  "clientsurge.test",
  "clientsurge-install.internal",
  "@test.",
  "@test.com",
  "@test.org",
  "smoke",
  "qa@",
  "demo@",
  "fake@",
  "noreply@",
  "no-reply@",
  ".test",
  "synthetic",
];

const TEST_SOURCE_PATTERNS = [
  "smoke_test",
  "crm_live_smoke_test",
  "twilio_missed_call_test",
  "synthetic_smoke",
];

function isTestEmail(email) {
  if (!email) return true;
  const lower = email.toLowerCase();
  return TEST_EMAIL_PATTERNS.some((p) => lower.includes(p));
}

function isTestPhone(phone) {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return true;
  if (digits.includes("555")) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  return false;
}

function isTestSource(source) {
  if (!source) return false;
  const lower = String(source).toLowerCase();
  return TEST_SOURCE_PATTERNS.some((s) => lower.includes(s));
}

// ═══════════════════════════════════════════
// SHARED EXCLUSION HELPER
// Returns true for test/backfill/QA/smoke/internal leads.
// These records must never receive automatic initial_response SMS or email.
// The admin manual test panel (trigger_name=manual_test) bypasses this.
// ═══════════════════════════════════════════

const ADMIN_TEST_NUMBERS = [
  "+16025874608", "6025874608",
  "+16025843227", "6025843227",
  "+16025550001", "+16025550099",
];

const EXCLUDE_NAME_PATTERNS = [
  "Backfill Test", "Smoke", "QA", "Stripe Webhook Proof",
  "ClientSurge Smoke", "ClientSurge QA", "Sarah Smoke Test",
  "Runtime", "Proof",
];

const EXCLUDE_BUSINESS_PATTERNS = [
  "Backfill", "Smoke", "QA", "Stripe Webhook Proof",
  "ClientSurge Smoke", "ClientSurge QA", "Runtime", "Proof",
];

const EXCLUDE_SOURCE_PATTERNS = [
  "smoke", "smoke_test", "crm_live_smoke_test",
  "twilio_missed_call_test", "test", "qa", "backfill",
];

const EXCLUDE_EMAIL_PATTERNS = [
  "example.com", "clientsurge.test", "clientsurge-install.internal",
  "backfill-test", "smoke", "qa",
];

function shouldExcludeFromAutomaticInitialResponse(lead, opts = {}) {
  // Admin manual test panel bypasses exclusion
  if (opts.allowAdminTestNumber === true) return false;

  const fullName = String(lead.full_name || lead.first_name || "");
  const businessName = String(lead.business_name || "");
  const source = String(lead.source || "").toLowerCase();
  // The safe post-patch verification lead is the only non-test record
  // permitted to use admin contact info — let it through.
  if (source === "post_patch_verification_safe") return false;

  const email = String(lead.email || "").toLowerCase();
  const phone = String(lead.phone_number || "").replace(/\D/g, "");

  if (EXCLUDE_NAME_PATTERNS.some((p) => fullName.includes(p))) return true;
  if (EXCLUDE_BUSINESS_PATTERNS.some((p) => businessName.includes(p))) return true;
  if (EXCLUDE_SOURCE_PATTERNS.some((p) => source.includes(p))) return true;
  if (EXCLUDE_EMAIL_PATTERNS.some((p) => email.includes(p))) return true;
  if (ADMIN_TEST_NUMBERS.some((n) => phone === n.replace(/\D/g, ""))) return true;

  return false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function checkSmsEligibility(lead) {
  if (!lead.phone_number) return { eligible: false, reason: "missing_phone" };
  if (isTestPhone(lead.phone_number)) return { eligible: false, reason: "invalid_phone" };
  if (lead.sms_permission !== true) return { eligible: false, reason: "no_sms_permission" };
  if (lead.consent_given !== true) return { eligible: false, reason: "no_consent" };
  if (lead.cadence_paused === true) return { eligible: false, reason: "cadence_paused" };
  if (lead.do_not_contact === true) return { eligible: false, reason: "do_not_contact" };
  if (isTestSource(lead.source)) return { eligible: false, reason: "internal_test_lead" };
  return { eligible: true };
}

function checkEmailEligibility(lead) {
  if (!lead.email) return { eligible: false, reason: "missing_email" };
  if (!isValidEmail(lead.email)) return { eligible: false, reason: "invalid_email" };
  if (isTestEmail(lead.email)) return { eligible: false, reason: "internal_test_lead" };
  if (lead.do_not_contact === true) return { eligible: false, reason: "do_not_contact" };
  if (isTestSource(lead.source)) return { eligible: false, reason: "internal_test_lead" };
  return { eligible: true };
}

// ═══════════════════════════════════════════
// PROVIDER SEND FUNCTIONS
// ═══════════════════════════════════════════

async function sendTwilioSms(toPhone, body, fromNumber) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error_code: "provider_not_configured",
      error_message: "Twilio credentials or From number not configured (AdminSettings.twilio_from_number or env var missing)",
    };
  }

  const auth = btoa(`${accountSid}:${authToken}`);
  const params = new URLSearchParams({ From: fromNumber, To: toPhone, Body: body });
  const statusCallback = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
  if (statusCallback) params.append("StatusCallback", statusCallback);

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );
    const responseText = await res.text();

    if (!res.ok) {
      let parsed = null;
      try { parsed = JSON.parse(responseText); } catch (_) {}
      return {
        success: false,
        error_code: parsed?.code ? String(parsed.code) : String(res.status),
        error_message: parsed?.message || `Twilio API error: ${res.status}`,
        response_payload: responseText,
        request_payload: params.toString(),
      };
    }

    const result = JSON.parse(responseText);
    const messageSid = result.sid;
    if (!messageSid) {
      return {
        success: false,
        error_code: "no_provider_id",
        error_message: "Twilio returned 200 but no Message SID in response",
        response_payload: responseText,
        request_payload: params.toString(),
      };
    }

    return {
      success: true,
      provider_message_id: messageSid,
      provider_status: result.status || "queued",
      from_address: fromNumber,
      response_payload: responseText,
      request_payload: params.toString(),
    };
  } catch (err) {
    return {
      success: false,
      error_code: "network_error",
      error_message: err.message,
      request_payload: params.toString(),
    };
  }
}

async function sendResendEmail(toEmail, subject, body) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = safeResendFrom();

  if (!resendKey) {
    return {
      success: false,
      error_code: "provider_not_configured",
      error_message: "RESEND_API_KEY environment variable is not set",
      from_address: fromEmail,
    };
  }

  const requestBody = JSON.stringify({ from: fromEmail, to: toEmail, subject, text: body });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: requestBody,
    });
    const responseText = await res.text();

    if (!res.ok) {
      let parsed = null;
      try { parsed = JSON.parse(responseText); } catch (_) {}
      return {
        success: false,
        error_code: String(res.status),
        error_message: parsed?.message || `Resend API error: ${res.status}`,
        from_address: fromEmail,
        response_payload: responseText,
        request_payload: requestBody,
      };
    }

    const result = JSON.parse(responseText);
    const messageId = result.id;
    if (!messageId) {
      return {
        success: false,
        error_code: "no_provider_id",
        error_message: "Resend returned 200 but no email id in response",
        from_address: fromEmail,
        response_payload: responseText,
        request_payload: requestBody,
      };
    }

    return {
      success: true,
      provider_message_id: messageId,
      provider_status: "sent",
      from_address: fromEmail,
      response_payload: responseText,
      request_payload: requestBody,
    };
  } catch (err) {
    return {
      success: false,
      error_code: "network_error",
      error_message: err.message,
      from_address: fromEmail,
      request_payload: requestBody,
    };
  }
}

// ═══════════════════════════════════════════
// COMMUNICATION LOG CREATION
// ═══════════════════════════════════════════

async function createCommLog(base44, payload) {
  try {
    const now = new Date().toISOString();
    const ds = payload.delivery_status || "unknown";
    const created = await base44.asServiceRole.entities.CommunicationLog.create({
      related_entity_type: payload.related_entity_type || "WebsiteLead",
      related_entity_id: payload.related_entity_id || null,
      lead_email: payload.lead_email || null,
      lead_phone: payload.lead_phone || null,
      canonical_to_address: payload.canonical_to_address || payload.to_address || null,
      lead_name: payload.lead_name || null,
      channel: payload.channel || "system",
      provider: payload.provider || "internal",
      direction: payload.direction || "outbound",
      trigger_name: payload.trigger_name || "initial_response",
      template_name: payload.template_name || null,
      to_address: payload.to_address || null,
      from_address: payload.from_address || null,
      subject: payload.subject || null,
      body_preview: (payload.body_preview || "").slice(0, 500),
      provider_message_id: payload.provider_message_id || null,
      provider_status: payload.provider_status || null,
      delivery_status: ds,
      error_code: payload.error_code || null,
      error_message: payload.error_message || null,
      request_payload_redacted: redactSecrets(payload.request_payload || ""),
      response_payload_redacted: redactSecrets(payload.response_payload || ""),
      sent_at: ds === "sent" || ds === "queued" ? now : null,
      delivered_at: ds === "delivered" ? now : null,
      failed_at: ds === "failed" ? now : null,
      environment: payload.environment || "production",
    });
    return created?.id || null;
  } catch (e) {
    console.warn("[processWebsiteLeadInitialResponse] createCommLog failed:", e.message);
    return null;
  }
}

// ═══════════════════════════════════════════
// CORE PROCESSING LOGIC
// ═══════════════════════════════════════════

const SMS_BODY = "Thanks for reaching out to ClientSurge Systems. We got your request and will review your automation needs shortly.\n\nReply STOP to opt out.";
const EMAIL_SUBJECT = "We received your ClientSurge request";
const EMAIL_BODY = "Thanks for reaching out to ClientSurge Systems. We received your request and will review your automation needs shortly.";

async function processLead(base44, lead, env) {
  const leadId = lead.id;
  const leadName = lead.full_name || lead.first_name || "";
  const leadEmail = lead.email || null;
  const leadPhone = lead.phone_number || null;

  // Idempotency: skip if already responded
  if (lead.initial_response_sent_at) {
    return {
      lead_id: leadId,
      skipped: true,
      reason: "already_responded",
      sms: { eligible: false, sent: false, skip_reason: "already_responded" },
      email: { eligible: false, sent: false, skip_reason: "already_responded" },
      lead_updated: false,
      initial_response_sent: false,
    };
  }

  // ── SHARED EXCLUSION CHECK ──
  // Test/backfill/QA/smoke/internal records never receive automatic initial_response.
  // Do not call Twilio, do not call Resend, do not update lead fields.
  if (shouldExcludeFromAutomaticInitialResponse(lead)) {
    // Create skipped CommunicationLog rows for available channels as audit evidence
    if (leadPhone) {
      await createCommLog(base44, {
        related_entity_type: "WebsiteLead",
        related_entity_id: leadId,
        lead_email: leadEmail,
        lead_phone: leadPhone,
        lead_name: leadName,
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
        trigger_name: "initial_response",
        to_address: leadPhone,
        body_preview: SMS_BODY.slice(0, 200),
        delivery_status: "skipped",
        error_message: "internal_test_lead",
        environment: env,
      });
    }
    if (leadEmail) {
      await createCommLog(base44, {
        related_entity_type: "WebsiteLead",
        related_entity_id: leadId,
        lead_email: leadEmail,
        lead_phone: leadPhone,
        lead_name: leadName,
        channel: "email",
        provider: "resend",
        direction: "outbound",
        trigger_name: "initial_response",
        to_address: leadEmail,
        subject: EMAIL_SUBJECT,
        body_preview: EMAIL_BODY.slice(0, 200),
        delivery_status: "skipped",
        error_message: "internal_test_lead",
        environment: env,
      });
    }
    return {
      lead_id: leadId,
      skipped: true,
      reason: "internal_test_lead",
      sms: { eligible: false, sent: false, skip_reason: "internal_test_lead" },
      email: { eligible: false, sent: false, skip_reason: "internal_test_lead" },
      lead_updated: false,
      initial_response_sent: false,
    };
  }

  const smsEligibility = checkSmsEligibility(lead);
  const emailEligibility = checkEmailEligibility(lead);

  let smsResult = { eligible: smsEligibility.eligible, sent: false };
  let emailResult = { eligible: emailEligibility.eligible, sent: false };
  let anyProviderAccepted = false;
  let lastAcceptedTimestamp = null;
  let lastEngagementType = "none";

  // ── SMS ──
  if (smsEligibility.eligible) {
    // E.164 normalization — must happen before Twilio call
    const normalizedPhone = normalizePhoneToE164(leadPhone);
    if (!normalizedPhone) {
      smsResult.error = 'invalid_phone_number';
      smsResult.error_code = 'invalid_phone_number';
      await createCommLog(base44, {
        related_entity_type: "WebsiteLead",
        related_entity_id: leadId,
        lead_email: leadEmail,
        lead_phone: leadPhone,
        lead_name: leadName,
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
        trigger_name: "initial_response",
        to_address: null,
        canonical_to_address: null,
        body_preview: SMS_BODY.slice(0, 200),
        delivery_status: "skipped",
        error_message: "invalid_phone_number",
        environment: env,
      });
    } else {
      // ── Resolve From number from AdminSettings (source of truth) ──
      let resolvedFromNumber = null;
      try {
        const smsSettings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
        if (smsSettings?.[0]?.twilio_from_number) {
          let fn = smsSettings[0].twilio_from_number;
          const fnDigits = String(fn).replace(/\D/g, '');
          if (fnDigits.length === 10) resolvedFromNumber = `+1${fnDigits}`;
          else if (fnDigits.length === 11 && fnDigits.startsWith('1')) resolvedFromNumber = `+${fnDigits}`;
          else if (fnDigits.length > 0) resolvedFromNumber = `+${fnDigits}`;
        }
      } catch (e) {
        console.warn("[processLead] AdminSettings load failed:", e.message);
      }
      if (!resolvedFromNumber) {
        const envFn = Deno.env.get("TWILIO_FROM_NUMBER") || Deno.env.get("TWILIO_PHONE_NUMBER");
        if (envFn) {
          const fnDigits = String(envFn).replace(/\D/g, '');
          if (fnDigits.length === 10) resolvedFromNumber = `+1${fnDigits}`;
          else if (fnDigits.length === 11 && fnDigits.startsWith('1')) resolvedFromNumber = `+${fnDigits}`;
          else if (fnDigits.length > 0) resolvedFromNumber = `+${fnDigits}`;
        }
      }
      // Block deprecated toll-free sender
      if (resolvedFromNumber === '+18778123630') resolvedFromNumber = null;

      const smsOutcome = await sendTwilioSms(normalizedPhone, SMS_BODY, resolvedFromNumber);
      if (smsOutcome.success) {
        smsResult.sent = true;
        smsResult.provider_message_id = smsOutcome.provider_message_id;
        smsResult.provider_status = smsOutcome.provider_status;
        smsResult.normalized_phone = normalizedPhone;
        anyProviderAccepted = true;
        lastAcceptedTimestamp = new Date().toISOString();
        lastEngagementType = "sms";
      } else {
        smsResult.error = smsOutcome.error_message;
        smsResult.error_code = smsOutcome.error_code;
      }
      await createCommLog(base44, {
        related_entity_type: "WebsiteLead",
        related_entity_id: leadId,
        lead_email: leadEmail,
        lead_phone: leadPhone,
        lead_name: leadName,
        channel: "sms",
        provider: "twilio",
        direction: "outbound",
        trigger_name: "initial_response",
        to_address: normalizedPhone,
        canonical_to_address: normalizedPhone,
        from_address: smsOutcome.from_address || Deno.env.get("TWILIO_PHONE_NUMBER") || null,
        body_preview: SMS_BODY.slice(0, 200),
        provider_message_id: smsResult.provider_message_id || null,
        provider_status: smsResult.provider_status || null,
        delivery_status: smsResult.sent ? (smsResult.provider_status === "queued" ? "queued" : "sent") : "failed",
        error_code: smsResult.error_code || null,
        error_message: smsResult.error || null,
        request_payload: smsOutcome.request_payload || "",
        response_payload: smsOutcome.response_payload || "",
        environment: env,
      });
    }
  } else {
    smsResult.skip_reason = smsEligibility.reason;
    await createCommLog(base44, {
      related_entity_type: "WebsiteLead",
      related_entity_id: leadId,
      lead_email: leadEmail,
      lead_phone: leadPhone,
      lead_name: leadName,
      channel: "sms",
      provider: "twilio",
      direction: "outbound",
      trigger_name: "initial_response",
      to_address: leadPhone,
      body_preview: SMS_BODY.slice(0, 200),
      delivery_status: "skipped",
      error_message: smsEligibility.reason,
      environment: env,
    });
  }

  // ── Email ──
  if (emailEligibility.eligible) {
    const emailOutcome = await sendResendEmail(leadEmail, EMAIL_SUBJECT, EMAIL_BODY);
    if (emailOutcome.success) {
      emailResult.sent = true;
      emailResult.provider_message_id = emailOutcome.provider_message_id;
      emailResult.provider_status = emailOutcome.provider_status;
      anyProviderAccepted = true;
      lastAcceptedTimestamp = new Date().toISOString();
      // If both sent, email is last — document in log
      lastEngagementType = "email";
    } else {
      emailResult.error = emailOutcome.error_message;
      emailResult.error_code = emailOutcome.error_code;
    }
    await createCommLog(base44, {
      related_entity_type: "WebsiteLead",
      related_entity_id: leadId,
      lead_email: leadEmail,
      lead_phone: leadPhone,
      lead_name: leadName,
      channel: "email",
      provider: "resend",
      direction: "outbound",
      trigger_name: "initial_response",
      to_address: leadEmail,
      from_address: emailOutcome.from_address || safeResendFrom(),
      subject: EMAIL_SUBJECT,
      body_preview: EMAIL_BODY.slice(0, 200),
      provider_message_id: emailResult.provider_message_id || null,
      provider_status: emailResult.provider_status || null,
      delivery_status: emailResult.sent ? "sent" : "failed",
      error_code: emailResult.error_code || null,
      error_message: emailResult.error || null,
      request_payload: emailOutcome.request_payload || "",
      response_payload: emailOutcome.response_payload || "",
      environment: env,
    });
  } else {
    emailResult.skip_reason = emailEligibility.reason;
    await createCommLog(base44, {
      related_entity_type: "WebsiteLead",
      related_entity_id: leadId,
      lead_email: leadEmail,
      lead_phone: leadPhone,
      lead_name: leadName,
      channel: "email",
      provider: "resend",
      direction: "outbound",
      trigger_name: "initial_response",
      to_address: leadEmail,
      subject: EMAIL_SUBJECT,
      body_preview: EMAIL_BODY.slice(0, 200),
      delivery_status: "skipped",
      error_message: emailEligibility.reason,
      environment: env,
    });
  }

  // ── Update WebsiteLead ──
  let leadUpdated = false;
  if (anyProviderAccepted) {
    const updatePayload = {
      initial_response_sent_at: lastAcceptedTimestamp,
      last_message_sent: lastAcceptedTimestamp,
      last_engagement_type: lastEngagementType,
      last_engagement_at: lastAcceptedTimestamp,
      lead_status: "contacted",
      sms_attempt_count: (lead.sms_attempt_count || 0) + (smsEligibility.eligible ? 1 : 0),
      email_attempt_count: (lead.email_attempt_count || 0) + (emailEligibility.eligible ? 1 : 0),
    };
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(leadId, updatePayload);
      leadUpdated = true;
    } catch (e) {
      console.warn("[processWebsiteLeadInitialResponse] Lead update failed:", e.message);
    }
  } else {
    // Both skipped/failed — increment attempt counts for attempted sends, keep status new
    const updatePayload = {
      sms_attempt_count: (lead.sms_attempt_count || 0) + (smsEligibility.eligible ? 1 : 0),
      email_attempt_count: (lead.email_attempt_count || 0) + (emailEligibility.eligible ? 1 : 0),
    };
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(leadId, updatePayload);
    } catch (_) {}
  }

  return {
    lead_id: leadId,
    skipped: false,
    sms: smsResult,
    email: emailResult,
    lead_updated: leadUpdated,
    initial_response_sent: anyProviderAccepted,
  };
}

// ═══════════════════════════════════════════
// REPAIR STUCK LEADS
// ═══════════════════════════════════════════

async function repairStuckLeads(base44, env, opts = {}) {
  const now = new Date();
  const fiveMinAgo = now.getTime() - 5 * 60 * 1000;
  const dryRun = opts.dry_run === true;
  const confirmed = opts.confirmed === true;

  const allLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
    { archived: false },
    "-created_date",
    500
  ).catch(() => []);

  const stuckLeads = (allLeads || []).filter(
    (l) => l.automation_enabled === true && !l.initial_response_sent_at && new Date(l.created_date).getTime() < fiveMinAgo
  );

  // ── DRY-RUN PREVIEW: classify each stuck lead without sending ──
  const preview = {
    would_send_sms: 0,
    would_send_email: 0,
    would_skip_internal_test: 0,
    would_skip_no_consent: 0,
    would_skip_invalid_phone: 0,
    would_skip_invalid_email: 0,
  };
  const realStuckLeads = [];

  for (const lead of stuckLeads) {
    if (shouldExcludeFromAutomaticInitialResponse(lead)) {
      preview.would_skip_internal_test++;
      continue;
    }
    const smsElig = checkSmsEligibility(lead);
    const emailElig = checkEmailEligibility(lead);

    if (smsElig.eligible) {
      preview.would_send_sms++;
    } else if (smsElig.reason === "no_consent" || smsElig.reason === "no_sms_permission") {
      preview.would_skip_no_consent++;
    } else if (smsElig.reason === "missing_phone" || smsElig.reason === "invalid_phone") {
      preview.would_skip_invalid_phone++;
    }

    if (emailElig.eligible) {
      preview.would_send_email++;
    } else if (emailElig.reason === "invalid_email" || emailElig.reason === "missing_email") {
      preview.would_skip_invalid_email++;
    }

    // Only include leads where at least one channel is eligible
    if (smsElig.eligible || emailElig.eligible) {
      realStuckLeads.push(lead);
    }
  }

  // ── If dry-run, return preview only — no sends ──
  if (dryRun) {
    return {
      success: true,
      mode: "dry_run",
      total_stuck: stuckLeads.length,
      preview,
      real_eligible_leads: realStuckLeads.length,
      message: "Dry-run preview. Pass confirm=true to send to eligible real leads.",
    };
  }

  // ── If not confirmed, refuse to send — require explicit confirmation ──
  if (!confirmed) {
    return {
      success: false,
      mode: "requires_confirmation",
      total_stuck: stuckLeads.length,
      preview,
      real_eligible_leads: realStuckLeads.length,
      message: "Repair requires confirmation. Call with dry_run=true first, then confirm=true to execute.",
    };
  }

  // ── CONFIRMED: process only real eligible leads (test/QA/backfill already filtered) ──
  let sentSms = 0;
  let sentEmail = 0;
  let skipped = 0;
  let failed = 0;
  const details = [];

  for (const lead of realStuckLeads) {
    try {
      const result = await processLead(base44, lead, env);
      if (result.sms?.sent) sentSms++;
      if (result.email?.sent) sentEmail++;
      if (!result.initial_response_sent) {
        if (result.sms?.error || result.email?.error) failed++;
        else skipped++;
      }
      details.push({
        lead_id: lead.id,
        name: lead.full_name || "—",
        email: lead.email || "—",
        phone: lead.phone_number || "—",
        source: lead.source || "—",
        sms_sent: result.sms?.sent || false,
        email_sent: result.email?.sent || false,
        sms_skip_reason: result.sms?.skip_reason || null,
        email_skip_reason: result.email?.skip_reason || null,
        sms_error: result.sms?.error || null,
        email_error: result.email?.error || null,
        initial_response_sent: result.initial_response_sent,
      });
    } catch (err) {
      failed++;
      details.push({
        lead_id: lead.id,
        name: lead.full_name || "—",
        error: err.message,
        initial_response_sent: false,
      });
    }
  }

  return {
    success: true,
    mode: "confirmed",
    total_stuck: stuckLeads.length,
    real_eligible_leads: realStuckLeads.length,
    total_processed: realStuckLeads.length,
    sent_sms: sentSms,
    sent_email: sentEmail,
    skipped,
    failed,
    preview,
    details: details.slice(0, 50),
  };
}

// ═══════════════════════════════════════════
// CREATE SAFE TEST LEAD
// ═══════════════════════════════════════════

async function createSafeTestLead(base44, body, env) {
  const { test_email, test_phone, test_name } = body;

  if (!test_email && !test_phone) {
    return json({ error: "At least one of test_email or test_phone is required" }, 400);
  }

  const now = new Date().toISOString();
  const lead = await base44.asServiceRole.entities.WebsiteLead.create({
    full_name: test_name || "Admin Test Lead",
    first_name: (test_name || "Admin Test Lead").split(" ")[0],
    email: (test_email || "").toLowerCase().trim() || null,
    phone_number: test_phone || null,
    business_name: "ClientSurge Admin Test",
    business_type: "Test",
    message: "Admin-created test lead for automation health verification.",
    source: "admin_test_lead",
    lead_status: "new",
    automation_enabled: true,
    consent_given: true,
    consent_given_at: now,
    consent_source: "admin_test_panel",
    sms_permission: true,
  });

  const result = await processLead(base44, lead, env);

  return {
    success: true,
    lead_id: lead.id,
    processing_result: result,
  };
}

// ═══════════════════════════════════════════
// RUN POST-PATCH VERIFICATION
// Creates one safe eligible lead + one internal/test lead, processes both,
// evaluates results, and stores a PostPatchVerificationResult record.
// ═══════════════════════════════════════════

async function runPostPatchVerification(base44, env) {
  const now = new Date().toISOString();

  // ── A. Create safe eligible verification lead ──
  const safeLead = await base44.asServiceRole.entities.WebsiteLead.create({
    full_name: "Post Patch Verification Lead",
    first_name: "PostPatch",
    business_name: "ClientSurge Verification Business",
    business_type: "Verification",
    source: "post_patch_verification_safe",
    email: "nolanfstrommer@gmail.com",
    phone_number: "+16025874608",
    message: "Post-patch verification: safe eligible lead for automation health proof.",
    consent_given: true,
    consent_given_at: now,
    consent_source: "post_patch_verification",
    sms_permission: true,
    automation_enabled: true,
    cadence_paused: false,
    lead_status: "new",
  });

  // ── B. Process safe lead (real Twilio + Resend calls) ──
  const safeResult = await processLead(base44, safeLead, env);

  // ── C. Create internal/test verification lead ──
  const internalLead = await base44.asServiceRole.entities.WebsiteLead.create({
    full_name: "Post Patch Internal Test Lead",
    business_name: "ClientSurge Internal Test Verification",
    business_type: "Test",
    source: "post_patch_verification_internal_test",
    email: "backfill-test-post-patch@clientsurge-install.internal",
    phone_number: "+16025874608",
    message: "Post-patch verification: internal/test lead that must be skipped.",
    consent_given: true,
    consent_given_at: now,
    consent_source: "post_patch_verification",
    sms_permission: true,
    automation_enabled: true,
    cadence_paused: false,
    lead_status: "new",
  });

  // ── D. Process internal/test lead (should be skipped for both channels) ──
  const internalResult = await processLead(base44, internalLead, env);

  // ── E. Fetch CommunicationLog rows for both leads ──
  const safeLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
    { related_entity_type: "WebsiteLead", related_entity_id: safeLead.id, trigger_name: "initial_response" },
    "-created_date",
    20
  ).catch(() => []);

  const internalLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
    { related_entity_type: "WebsiteLead", related_entity_id: internalLead.id, trigger_name: "initial_response" },
    "-created_date",
    20
  ).catch(() => []);

  const safeSmsLog = (safeLogs || []).find((l) => l.channel === "sms");
  const safeEmailLog = (safeLogs || []).find((l) => l.channel === "email");
  const internalSmsLog = (internalLogs || []).find((l) => l.channel === "sms");
  const internalEmailLog = (internalLogs || []).find((l) => l.channel === "email");

  // ── F. Evaluate pass/fail ──
  const safeSmsPass = !!(
    safeSmsLog &&
    ["sent", "queued", "delivered"].includes(safeSmsLog.delivery_status) &&
    safeSmsLog.provider_message_id
  );
  const safeEmailPass = !!(
    safeEmailLog &&
    ["sent", "queued", "delivered"].includes(safeEmailLog.delivery_status) &&
    safeEmailLog.provider_message_id
  );
  const internalSmsSkipPass = !!(
    internalSmsLog &&
    internalSmsLog.delivery_status === "skipped" &&
    !internalSmsLog.provider_message_id
  );
  const internalEmailSkipPass = !!(
    internalEmailLog &&
    internalEmailLog.delivery_status === "skipped" &&
    !internalEmailLog.provider_message_id
  );
  const leakedInternalSendDetected = (internalLogs || []).some(
    (l) => l.provider_message_id && l.delivery_status !== "skipped"
  );

  const allPass = safeSmsPass && safeEmailPass && internalSmsSkipPass && internalEmailSkipPass && !leakedInternalSendDetected;
  const anyPass = safeSmsPass || safeEmailPass || internalSmsSkipPass || internalEmailSkipPass;
  const overallStatus = allPass ? "pass" : anyPass ? "partial" : "fail";

  const notes = [
    `Safe SMS: ${safeSmsPass ? "PASS" : "FAIL"} (${safeSmsLog?.provider_message_id || "no SID"})`,
    `Safe Email: ${safeEmailPass ? "PASS" : "FAIL"} (${safeEmailLog?.provider_message_id || "no ID"})`,
    `Internal SMS skip: ${internalSmsSkipPass ? "PASS" : "FAIL"}`,
    `Internal email skip: ${internalEmailSkipPass ? "PASS" : "FAIL"}`,
    `Leaked send: ${leakedInternalSendDetected ? "DETECTED" : "none"}`,
  ].join(" | ");

  // ── G. Store PostPatchVerificationResult ──
  let verificationId = null;
  try {
    const verRecord = await base44.asServiceRole.entities.PostPatchVerificationResult.create({
      run_at: now,
      safe_lead_id: safeLead.id,
      internal_test_lead_id: internalLead.id,
      safe_sms_pass: safeSmsPass,
      safe_email_pass: safeEmailPass,
      internal_sms_skip_pass: internalSmsSkipPass,
      internal_email_skip_pass: internalEmailSkipPass,
      leaked_internal_send_detected: leakedInternalSendDetected,
      overall_status: overallStatus,
      safe_sms_log_id: safeSmsLog?.id || null,
      safe_email_log_id: safeEmailLog?.id || null,
      internal_sms_log_id: internalSmsLog?.id || null,
      internal_email_log_id: internalEmailLog?.id || null,
      safe_sms_provider_id: safeSmsLog?.provider_message_id || null,
      safe_email_provider_id: safeEmailLog?.provider_message_id || null,
      notes,
    });
    verificationId = verRecord?.id || null;
  } catch (e) {
    console.warn("[runPostPatchVerification] Failed to store result:", e.message);
  }

  return {
    success: true,
    run_at: now,
    overall_status: overallStatus,
    safe_lead_id: safeLead.id,
    internal_test_lead_id: internalLead.id,
    safe_sms_pass: safeSmsPass,
    safe_email_pass: safeEmailPass,
    internal_sms_skip_pass: internalSmsSkipPass,
    internal_email_skip_pass: internalEmailSkipPass,
    leaked_internal_send_detected: leakedInternalSendDetected,
    safe_sms_log_id: safeSmsLog?.id || null,
    safe_email_log_id: safeEmailLog?.id || null,
    internal_sms_log_id: internalSmsLog?.id || null,
    internal_email_log_id: internalEmailLog?.id || null,
    safe_sms_provider_id: safeSmsLog?.provider_message_id || null,
    safe_email_provider_id: safeEmailLog?.provider_message_id || null,
    verification_id: verificationId,
    notes,
  };
}

// ═══════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const env = detectEnvironment(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "process";

    // ── REPAIR STUCK LEADS (admin only) ──
    if (action === "repair_stuck") {
      const user = await base44.auth.me();
      if (!user) return json({ error: "Unauthorized" }, 401);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return json({ error: "Forbidden — admin access required" }, 403);
      }
      const result = await repairStuckLeads(base44, env, {
        dry_run: body.dry_run === true,
        confirmed: body.confirm === true,
      });
      return json(result);
    }

    // ── RUN POST-PATCH VERIFICATION (admin only) ──
    if (action === "run_post_patch_verification") {
      const user = await base44.auth.me();
      if (!user) return json({ error: "Unauthorized" }, 401);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return json({ error: "Forbidden — admin access required" }, 403);
      }
      const result = await runPostPatchVerification(base44, env);
      return json(result);
    }

    // ── CREATE SAFE TEST LEAD (admin only) ──
    if (action === "create_test_lead") {
      const user = await base44.auth.me();
      if (!user) return json({ error: "Unauthorized" }, 401);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return json({ error: "Forbidden — admin access required" }, 403);
      }
      const result = await createSafeTestLead(base44, body, env);
      return json(result);
    }

    // ── PROCESS SINGLE LEAD (no auth required — called from creation paths + entity automation) ──
    // Support both entity automation format and direct call format
    const isEntityAutomation = body?.event?.type === "create";
    const leadId = isEntityAutomation ? body.event.entity_id : body.lead_id;

    if (!leadId) {
      return json({ error: "lead_id is required (or event.entity_id for entity automation)" }, 400);
    }

    const lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId).catch(() => null);
    if (!lead) {
      return json({ error: "Lead not found", lead_id: leadId }, 404);
    }

    const result = await processLead(base44, lead, env);
    return json(result);
  } catch (error) {
    console.error("[processWebsiteLeadInitialResponse] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});
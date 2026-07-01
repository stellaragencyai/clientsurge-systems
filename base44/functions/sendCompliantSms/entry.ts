import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value) {
  const raw = cleanString(value);
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : "";
}

function appendOptOut(body) {
  const text = cleanString(body);
  if (/\bSTOP\b/i.test(text)) return text;
  return `${text}\n\nReply STOP to opt out.`;
}

function isQuietHours(now = new Date()) {
  const hour = now.getHours();
  return hour < 8 || hour >= 20;
}

async function findRecentSends(base44, to, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { channel: "sms", recipient: to },
    "-created_date",
    20,
  ).catch(() => []);
  return (events || []).filter((event) => cleanString(event.created_date) >= since);
}

async function hasOptedOut(base44, to) {
  const matches = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { channel: "sms", sender: to, event_type: "sms_opt_out" },
    "-created_date",
    1,
  ).catch(() => []);
  return (matches || []).length > 0;
}

async function hasConsent(base44, payload) {
  if (payload.bypass_consent === true && payload.reason === "internal_test") return true;
  if (payload.sms_consent === true || payload.consent === true) return true;
  const leadId = cleanString(payload.lead_id);
  if (!leadId) return false;
  const lead = await base44.asServiceRole.entities.Leads?.get(leadId).catch(() => null);
  return Boolean(lead?.sms_consent || lead?.sms_opt_in || lead?.consent_sms || lead?.phone_sms_consent);
}

async function logEvent(base44, payload) {
  return base44.asServiceRole.entities.CommunicationEvent.create({
    provider: "twilio",
    channel: "sms",
    direction: payload.direction || "outbound",
    event_type: payload.event_type || "sms_send_attempt",
    status: payload.status,
    recipient: payload.recipient,
    sender: payload.sender,
    lead_id: payload.lead_id || undefined,
    context_id: payload.context_id || payload.lead_id || undefined,
    message_body: payload.message_body,
    error_message: payload.error_message || undefined,
    metadata_json: payload.metadata_json ? JSON.stringify(payload.metadata_json) : undefined,
  }).catch(() => null);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  const payload = await req.json().catch(() => ({}));
  const to = normalizePhone(payload.to || payload.phone || payload.recipient);
  const body = appendOptOut(payload.body || payload.message || "");
  const leadId = cleanString(payload.lead_id);

  if (!to || !body) {
    return Response.json({ error: "Valid phone and message are required" }, { status: 400 });
  }

  if (await hasOptedOut(base44, to)) {
    await logEvent(base44, { status: "blocked", recipient: to, lead_id: leadId, message_body: body, error_message: "Recipient opted out" });
    return Response.json({ success: false, blocked: true, reason: "recipient_opted_out" }, { status: 403 });
  }

  if (!(await hasConsent(base44, payload))) {
    await logEvent(base44, { status: "blocked", recipient: to, lead_id: leadId, message_body: body, error_message: "Missing SMS consent" });
    return Response.json({ success: false, blocked: true, reason: "missing_sms_consent" }, { status: 403 });
  }

  if (isQuietHours() && payload.allow_quiet_hours !== true) {
    await logEvent(base44, { status: "blocked", recipient: to, lead_id: leadId, message_body: body, error_message: "Quiet hours block" });
    return Response.json({ success: false, blocked: true, reason: "quiet_hours" }, { status: 429 });
  }

  const recent = await findRecentSends(base44, to, 24);
  if (recent.length >= 3 && payload.bypass_frequency_cap !== true) {
    await logEvent(base44, { status: "blocked", recipient: to, lead_id: leadId, message_body: body, error_message: "Frequency cap exceeded", metadata_json: { recent_count_24h: recent.length } });
    return Response.json({ success: false, blocked: true, reason: "frequency_cap", recent_count_24h: recent.length }, { status: 429 });
  }

  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_PHONE_NUMBER");
  if (!sid || !token || !from) {
    return Response.json({ error: "Twilio is not configured" }, { status: 500 });
  }

  await logEvent(base44, { status: "queued", recipient: to, sender: from, lead_id: leadId, message_body: body });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
  });

  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!response.ok) {
    await logEvent(base44, { status: "failed", recipient: to, sender: from, lead_id: leadId, message_body: body, error_message: data?.message || text });
    return Response.json({ success: false, error: data?.message || "SMS failed" }, { status: 502 });
  }

  await logEvent(base44, {
    status: "sent",
    event_type: "sms_sent",
    recipient: to,
    sender: from,
    lead_id: leadId,
    message_body: body,
    metadata_json: { twilio_sid: data?.sid || null },
  });

  return Response.json({ success: true, sid: data?.sid || null, to });
});

import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

async function twilioFetch(url, options) {
  try { return await fetch(url, options); }
  catch (err) { throw new Error(`Twilio request failed: ${err.message || "network error"}`); }
}

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
    },
  });
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value) {
  const raw = clean(value);
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  return raw.startsWith("+") ? raw : "+" + digits;
}

function firstName(name) {
  const full = clean(name);
  return full ? full.split(/\s+/)[0] : "there";
}

function interpolate(template, vars) {
  return clean(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function(_, key) {
    const value = vars[key];
    return value == null ? "" : String(value);
  }).replace(/\s+/g, " ").trim();
}

async function requireAdmin(base44) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

async function sendTwilioSms(args) {
  const to = args.to;
  const from = args.from;
  const body = args.body;
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
  if (!accountSid || !authToken) throw new Error("Twilio credentials not configured");
  if (!from) throw new Error("Twilio business phone is not configured");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  if (statusCallbackUrl) params.set("StatusCallback", statusCallbackUrl);
  const res = await twilioFetch("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(accountSid + ":" + authToken),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await res.json().catch(function() { return {}; });
  if (!res.ok) throw new Error(data && data.message ? data.message : "Twilio send failed (" + res.status + ")");
  return { provider_message_id: data.sid || null, provider_status: data.status || "queued" };
}

Deno.serve(async function(req) {
  try {
    if (req.method !== "POST") return secureJson({ error: "Method not allowed" }, { status: 405 });
    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);
    const payload = await req.json().catch(function() { return {}; });
    const order_id = payload.order_id;
    const target_phone = payload.target_phone;
    const caller_name = payload.caller_name;
    const caller_phone = payload.caller_phone;
    const consent_granted = payload.consent_granted !== false;
    const business_is_open = payload.business_is_open !== false;
    const call_status = payload.call_status || "no-answer";
    if (!order_id) return secureJson({ error: "order_id is required" }, { status: 400 });
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });
    const installConfig = order.install_configuration || {};
    const sharedConfig = installConfig.shared || {};
    const services = installConfig.services || {};
    const serviceConfig = services.missed_call_text_back || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const missedCallItem = items.find(function(item) { return item && item.service_key === "missed_call_text_back"; });
    const installStatus = missedCallItem && missedCallItem.install_status ? missedCallItem.install_status : "unknown";
    const recipientPhone = normalizePhone(target_phone || caller_phone || order.customer_phone);
    if (!recipientPhone) return secureJson({ error: "Recipient phone number is required" }, { status: 400 });
    if (["Testing", "Live"].indexOf(installStatus) === -1) return secureJson({ error: "missed_call_text_back is not runtime-ready while status is " + installStatus, install_status: installStatus }, { status: 409 });
    if (!clean(serviceConfig.sms_template)) return secureJson({ error: "Missed-call SMS template is not configured" }, { status: 409 });
    if (sharedConfig.after_hours_behavior === "hold_until_open" && business_is_open === false) return secureJson({ error: "Runtime blocked after hours" }, { status: 409 });
    if (sharedConfig.consent_behavior === "explicit_consent_required" && consent_granted !== true) return secureJson({ error: "Explicit consent is required before sending SMS" }, { status: 409 });
    const resolvedCallerPhone = normalizePhone(caller_phone || target_phone || order.customer_phone);
    const resolvedCallerName = clean(caller_name) || "Missed Caller";
    let messageBody = interpolate(serviceConfig.sms_template, {
      first_name: firstName(resolvedCallerName || order.customer_name),
      caller_name: firstName(resolvedCallerName),
      lead_name: firstName(resolvedCallerName),
      business_name: clean(order.business_name),
      business_phone: clean(sharedConfig.twilio_business_phone),
      twilio_business_phone: clean(sharedConfig.twilio_business_phone),
      business_hours: clean(sharedConfig.business_hours),
      caller_phone: resolvedCallerPhone,
      recipient_phone: recipientPhone,
      opt_out_message: clean(sharedConfig.opt_out_message),
    });
    if (sharedConfig.consent_behavior === "include_opt_out_language" && clean(sharedConfig.opt_out_message) && messageBody.indexOf(sharedConfig.opt_out_message) === -1) {
      messageBody = (messageBody + " " + sharedConfig.opt_out_message).trim();
    }
    const sendResult = await sendTwilioSms({ to: recipientPhone, from: clean(sharedConfig.twilio_business_phone), body: messageBody });
    const now = new Date().toISOString();
    let communicationEventId = null;
    try {
      const event = await base44.asServiceRole.entities.CommunicationEvent.create({
        order_id: order.id,
        context_type: "order_runtime_test",
        context_id: order.id,
        channel: "sms",
        direction: "outbound",
        event_type: "sms_sent",
        provider: "twilio",
        status: sendResult.provider_status || "sent",
        subject: "Missed call text-back runtime test",
        message_body: messageBody,
        provider_message_id: sendResult.provider_message_id,
        metadata_json: JSON.stringify({ service_key: "missed_call_text_back", runtime_type: "simulate_missed_call", caller_name: resolvedCallerName, caller_phone: resolvedCallerPhone, recipient_phone: recipientPhone, call_status: call_status, tested_at: now }),
      });
      communicationEventId = event && event.id ? event.id : null;
    } catch (_) {}
    try { await base44.asServiceRole.entities.Order.update(order.id, { last_install_event_at: now }); } catch (_) {}
    return secureJson({ success: true, order_id: order.id, service_key: "missed_call_text_back", runtime_type: "simulate_missed_call", install_status: installStatus, recipient_phone: recipientPhone, from_phone: clean(sharedConfig.twilio_business_phone), caller_name: resolvedCallerName, caller_phone: resolvedCallerPhone, message_body: messageBody, provider_message_id: sendResult.provider_message_id, provider_status: sendResult.provider_status, communication_event_id: communicationEventId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to simulate missed call";
    const status = message === "Admin access required" ? 403 : 500;
    return secureJson({ error: message }, { status: status });
  }
});
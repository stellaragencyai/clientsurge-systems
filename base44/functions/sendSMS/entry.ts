/**
 * sendSMS — Sends SMS via Twilio. Self-contained, no local imports.
 * Logs CommunicationEvent on success and failure.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  if (digits.length > 7) return `+${digits}`;
  return null;
}

function appendOptOut(message) {
  if (!message) return message;
  if (message.includes("STOP")) return message;
  return `${message}\n\nReply STOP to opt out.`;
}

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { to, phone, message, body: messageBody, lead_id, order_id, context_type, context_id, skip_opt_out } = body;
  const rawPhone = to || phone;
  const messageText = message || messageBody;

  if (!rawPhone || !messageText) {
    return json({ error: "to/phone and message are required" }, 400);
  }

  const normalizedPhone = normalizePhone(rawPhone);
  if (!normalizedPhone) {
    return json({ error: `Invalid phone number format: ${rawPhone}` }, 400);
  }

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER") || Deno.env.get("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    const missing = [!accountSid && "TWILIO_ACCOUNT_SID", !authToken && "TWILIO_AUTH_TOKEN", !fromNumber && "TWILIO_PHONE_NUMBER"].filter(Boolean);
    console.error("[sendSMS] Twilio credentials not configured", { missing });
    return json({ error: `Twilio not configured: missing ${missing.join(", ")}` }, 500);
  }

  const finalMessage = skip_opt_out ? messageText : appendOptOut(messageText);
  const base44 = createClientFromRequest(req);

  try {
    const auth = btoa(`${accountSid}:${authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: normalizedPhone,
          Body: finalMessage,
        }).toString(),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error_code) {
      const errorMessage = data.message || data.error_message || `Twilio error ${response.status}`;
      console.error("[sendSMS] Twilio rejected request", {
        status: response.status,
        error_code: data.error_code,
        error: errorMessage,
        to: normalizedPhone,
      });

      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: lead_id || null,
        order_id: order_id || null,
        context_type: context_type || null,
        context_id: context_id || null,
        channel: "sms",
        direction: "outbound",
        event_type: "sms_failed",
        provider: "twilio",
        status: "failed",
        message_body: finalMessage.substring(0, 500),
        error_message: `${errorMessage} (code: ${data.error_code || "none"})`,
        metadata_json: JSON.stringify({ to: normalizedPhone, twilio_status: response.status, error_code: data.error_code }),
      }).catch(() => null);

      return json({ error: "Failed to send SMS", details: errorMessage, twilio_error_code: data.error_code }, 500);
    }

    console.log("[sendSMS] SMS sent", { sid: data.sid, to: normalizedPhone, status: data.status });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      order_id: order_id || null,
      context_type: context_type || null,
      context_id: context_id || null,
      channel: "sms",
      direction: "outbound",
      event_type: "sms_sent",
      provider: "twilio",
      status: "sent",
      message_body: finalMessage.substring(0, 500),
      provider_message_id: data.sid,
      metadata_json: JSON.stringify({ to: normalizedPhone, sid: data.sid, twilio_status: data.status }),
    }).catch(() => null);

    return json({ success: true, sid: data.sid, status: data.status });

  } catch (err) {
    console.error("[sendSMS] Unexpected error", { error: err.message, to: normalizedPhone });
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: lead_id || null,
      order_id: order_id || null,
      channel: "sms",
      direction: "outbound",
      event_type: "sms_failed",
      provider: "twilio",
      status: "failed",
      error_message: err.message,
      metadata_json: JSON.stringify({ to: normalizedPhone }),
    }).catch(() => null);
    return json({ error: err.message }, 500);
  }
});
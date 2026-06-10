/**
 * retryFailedEvent — Admin-only. Retries a failed CommunicationEvent.
 * Self-contained — no local imports.
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

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Admin-only
  let user = null;
  try {
    user = await base44.auth.me();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!user || user.role !== "admin") {
    return json({ error: "Admin access required" }, 403);
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { event_id } = body;
  if (!event_id) return json({ error: "event_id required" }, 400);

  // Load the event
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    { id: event_id }, "-created_date", 1
  ).catch(() => []);
  const evt = events?.[0];
  if (!evt) return json({ error: "Event not found" }, 404);
  if (evt.status !== "failed") {
    return json({ error: `Event status is '${evt.status}' — only 'failed' events can be retried` }, 400);
  }

  console.log("[retryFailedEvent] Retrying", { event_id, channel: evt.channel, provider: evt.provider });

  try {
    let retryResult = null;

    // SMS retry via Twilio
    if (evt.channel === "sms" && evt.provider === "twilio") {
      const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
      const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER") || Deno.env.get("TWILIO_FROM_NUMBER");

      if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
        return json({ error: "Twilio credentials not configured" }, 500);
      }

      let toPhone = null;
      if (evt.lead_id) {
        const leads = await base44.asServiceRole.entities.Leads.filter({ id: evt.lead_id }, "-created_date", 1).catch(() => []);
        toPhone = leads?.[0]?.phone;
      }
      if (!toPhone && evt.metadata_json) {
        try { toPhone = JSON.parse(evt.metadata_json)?.to; } catch {}
      }
      const normalizedPhone = normalizePhone(toPhone);
      if (!normalizedPhone) return json({ error: "Cannot determine valid destination phone number" }, 400);

      const messageBody = evt.message_body;
      if (!messageBody) return json({ error: "No message body to retry" }, 400);

      const auth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
        method: "POST",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: TWILIO_FROM, To: normalizedPhone, Body: messageBody }).toString(),
      });
      const data = await res.json();
      if (!res.ok || data.error_code) throw new Error(`Twilio error: ${data.message} (code: ${data.error_code})`);
      retryResult = { provider_message_id: data.sid, status: "sent", to: normalizedPhone };
    }

    // Email retry via Resend
    else if (evt.channel === "email") {
      const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
      const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL");
      if (!RESEND_KEY || !RESEND_FROM) return json({ error: "Resend credentials not configured" }, 500);

      let toEmail = null;
      if (evt.lead_id) {
        const leads = await base44.asServiceRole.entities.Leads.filter({ id: evt.lead_id }, "-created_date", 1).catch(() => []);
        toEmail = leads?.[0]?.email;
      }
      if (!toEmail && evt.order_id) {
        const orders = await base44.asServiceRole.entities.Order.filter({ id: evt.order_id }, "-created_date", 1).catch(() => []);
        toEmail = orders?.[0]?.customer_email;
      }
      if (!toEmail && evt.metadata_json) {
        try { toEmail = JSON.parse(evt.metadata_json)?.to; } catch {}
      }
      if (!toEmail) return json({ error: "Cannot determine destination email" }, 400);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [toEmail],
          subject: evt.subject || "(No subject)",
          html: evt.message_body || "(No content)",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Resend error: ${data.message || res.status}`);
      retryResult = { provider_message_id: data.id, status: "sent", to: toEmail };
    }

    else {
      return json({ error: `No retry strategy for channel=${evt.channel} provider=${evt.provider}` }, 400);
    }

    // Update event status
    await base44.asServiceRole.entities.CommunicationEvent.update(event_id, {
      status: "sent",
      provider_message_id: retryResult.provider_message_id || evt.provider_message_id,
      error_message: null,
    }).catch(() => null);

    console.log("[retryFailedEvent] Retry successful", { event_id, result: retryResult });
    return json({ success: true, event_id, result: retryResult });

  } catch (err) {
    console.error("[retryFailedEvent] Retry failed", { event_id, error: err.message });
    // Log the retry attempt failure but keep status as failed
    await base44.asServiceRole.entities.CommunicationEvent.update(event_id, {
      error_message: `Retry failed at ${new Date().toISOString()}: ${err.message}`,
    }).catch(() => null);
    return json({ error: err.message, event_id }, 500);
  }
});
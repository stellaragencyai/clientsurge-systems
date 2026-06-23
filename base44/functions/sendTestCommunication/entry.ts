import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
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

async function logComm(base44, payload) {
  try {
    const now = new Date().toISOString();
    const ds = payload.delivery_status || "unknown";
    await base44.asServiceRole.entities.CommunicationLog.create({
      related_entity_type: payload.related_entity_type || null,
      related_entity_id: payload.related_entity_id || null,
      lead_email: payload.lead_email || null,
      lead_phone: payload.lead_phone || null,
      lead_name: payload.lead_name || null,
      channel: payload.channel || "system",
      provider: payload.provider || "internal",
      direction: payload.direction || "outbound",
      trigger_name: payload.trigger_name || "unknown",
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
      failed_at: ds === "failed" ? now : null,
      environment: "production",
    });
  } catch (e) {
    console.warn("[sendTestCommunication] logComm failed:", e.message);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: "Unauthorized" }, 401);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return json({ error: "Forbidden — admin access required" }, 403);
    }

    const { action, recipient_email, recipient_phone, message } = await req.json();

    if (!action || !["email", "sms"].includes(action)) {
      return json({ error: "action must be 'email' or 'sms'" }, 400);
    }

    const testMessage = message || "This is a test message from ClientSurge Automation Health.";
    const adminEmail = user.email;

    // ── TEST EMAIL via Resend ──
    if (action === "email") {
      const toEmail = (recipient_email || adminEmail || "").trim();
      if (!toEmail || !toEmail.includes("@")) {
        return json({ error: "A valid recipient email is required" }, 400);
      }

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) {
        await logComm(base44, {
          channel: "email", provider: "resend", direction: "outbound",
          trigger_name: "manual_test", to_address: toEmail,
          from_address: safeResendFrom(), subject: "ClientSurge Test Email",
          body_preview: testMessage.slice(0, 200),
          delivery_status: "failed", error_message: "RESEND_API_KEY not configured",
        });
        return json({ success: false, error: "RESEND_API_KEY not configured" });
      }

      const emailSubject = "ClientSurge Automation Health — Test Email";
      const emailBody = `This is a test email sent from the Automation Health dashboard.\n\nMessage: ${testMessage}\n\nIf you received this, Resend is working correctly.\n\n— ClientSurge Systems`;
      const requestBody = JSON.stringify({ from: safeResendFrom(), to: toEmail, subject: emailSubject, text: emailBody });

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: requestBody,
        });
        const responseText = await res.text();

        if (!res.ok) {
          const errorMsg = `Resend API error: ${res.status} — ${responseText.slice(0, 300)}`;
          await logComm(base44, {
            channel: "email", provider: "resend", direction: "outbound",
            trigger_name: "manual_test", to_address: toEmail, from_address: safeResendFrom(),
            subject: emailSubject, body_preview: testMessage.slice(0, 200),
            delivery_status: "failed", error_message: errorMsg,
            request_payload_redacted: requestBody, response_payload_redacted: responseText,
          });
          return json({ success: false, error: errorMsg });
        }

        const result = JSON.parse(responseText);
        const messageId = result.id || null;
        await logComm(base44, {
          channel: "email", provider: "resend", direction: "outbound",
          trigger_name: "manual_test", to_address: toEmail, from_address: safeResendFrom(),
          subject: emailSubject, body_preview: testMessage.slice(0, 200),
          provider_message_id: messageId, provider_status: "sent", delivery_status: "sent",
          request_payload_redacted: requestBody, response_payload_redacted: responseText,
        });
        return json({ success: true, message_id: messageId, sent_to: toEmail });
      } catch (err) {
        await logComm(base44, {
          channel: "email", provider: "resend", direction: "outbound",
          trigger_name: "manual_test", to_address: toEmail, from_address: safeResendFrom(),
          subject: "ClientSurge Test Email", body_preview: testMessage.slice(0, 200),
          delivery_status: "failed", error_message: err.message,
        });
        return json({ success: false, error: err.message });
      }
    }

    // ── TEST SMS via Twilio ──
    if (action === "sms") {
      const toPhone = (recipient_phone || "").trim();
      if (!toPhone || toPhone.replace(/\D/g, "").length < 10) {
        return json({ error: "A valid recipient phone number is required" }, 400);
      }

      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!accountSid || !authToken || !fromNumber) {
        await logComm(base44, {
          channel: "sms", provider: "twilio", direction: "outbound",
          trigger_name: "manual_test", to_address: toPhone,
          from_address: fromNumber || "not_configured",
          body_preview: testMessage.slice(0, 200),
          delivery_status: "failed", error_message: "Twilio credentials not configured",
        });
        return json({ success: false, error: "Twilio credentials not configured" });
      }

      const auth = btoa(`${accountSid}:${authToken}`);
      const smsBody = `${testMessage}\n\nReply STOP to opt out.`;
      const params = new URLSearchParams({ From: fromNumber, To: toPhone, Body: smsBody });

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
          const errorMsg = `Twilio API error: ${res.status} — ${responseText.slice(0, 300)}`;
          await logComm(base44, {
            channel: "sms", provider: "twilio", direction: "outbound",
            trigger_name: "manual_test", to_address: toPhone, from_address: fromNumber,
            body_preview: smsBody.slice(0, 200), delivery_status: "failed",
            error_message: errorMsg, request_payload_redacted: params.toString(),
            response_payload_redacted: responseText,
          });
          return json({ success: false, error: errorMsg });
        }

        const result = JSON.parse(responseText);
        const messageSid = result.sid || null;
        await logComm(base44, {
          channel: "sms", provider: "twilio", direction: "outbound",
          trigger_name: "manual_test", to_address: toPhone, from_address: fromNumber,
          body_preview: smsBody.slice(0, 200), provider_message_id: messageSid,
          provider_status: result.status || "queued", delivery_status: "sent",
          request_payload_redacted: params.toString(), response_payload_redacted: responseText,
        });
        return json({ success: true, message_sid: messageSid, sent_to: toPhone });
      } catch (err) {
        await logComm(base44, {
          channel: "sms", provider: "twilio", direction: "outbound",
          trigger_name: "manual_test", to_address: toPhone, from_address: fromNumber,
          body_preview: testMessage.slice(0, 200), delivery_status: "failed",
          error_message: err.message,
        });
        return json({ success: false, error: err.message });
      }
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("[sendTestCommunication] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});
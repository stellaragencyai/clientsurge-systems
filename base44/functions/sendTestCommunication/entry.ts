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

function detectEnvironment(req) {
  try {
    const url = new URL(req.url);
    if (url.hostname.includes("preview") || url.hostname.includes("sandbox")) return "preview";
  } catch (_) {}
  return "production";
}

async function createCommLog(base44, payload) {
  try {
    const now = new Date().toISOString();
    const ds = payload.delivery_status || "unknown";
    const created = await base44.asServiceRole.entities.CommunicationLog.create({
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
      delivered_at: ds === "delivered" ? now : null,
      failed_at: ds === "failed" ? now : null,
      environment: payload.environment || "production",
    });
    return created?.id || null;
  } catch (e) {
    console.warn("[sendTestCommunication] createCommLog failed:", e.message);
    return null;
  }
}

/**
 * Sends REAL Twilio SMS and Resend email test messages.
 * Captures actual provider response IDs. Never creates synthetic provider IDs.
 * Logs every attempt (success or failure) as a CommunicationLog row.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: "Unauthorized" }, 401);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return json({ error: "Forbidden — admin access required" }, 403);
    }

    const { action, recipient_email, recipient_phone } = await req.json();
    const adminEmail = user.email;
    const env = detectEnvironment(req);

    if (!action || !["email", "sms"].includes(action)) {
      return json({ error: "action must be 'email' or 'sms'" }, 400);
    }

    // ═══════════════════════════════════════════
    // TEST EMAIL via Resend
    // ═══════════════════════════════════════════
    if (action === "email") {
      const toEmail = (recipient_email || adminEmail || "").trim();
      if (!toEmail || !toEmail.includes("@")) {
        return json({ error: "A valid recipient email is required" }, 400);
      }

      const resendKey = Deno.env.get("RESEND_API_KEY");
      const fromEmail = safeResendFrom();
      const subject = "ClientSurge Resend Test — Automation Health";
      const body = "This is a ClientSurge automation health check. If you received this, Resend is connected.";

      // If Resend is not configured, log a FAILED row with the real reason
      if (!resendKey) {
        const logPayload = {
          channel: "email", provider: "resend", direction: "outbound",
          trigger_name: "manual_test", to_address: toEmail, from_address: fromEmail,
          subject, body_preview: body.slice(0, 200),
          delivery_status: "failed", error_code: "MISSING_CONFIG",
          error_message: "RESEND_API_KEY environment variable is not set",
          environment: env,
        };
        const logId = await createCommLog(base44, logPayload);
        return json({
          success: false,
          passed: false,
          provider: "resend",
          error: "RESEND_API_KEY environment variable is not set",
          communication_log_id: logId,
        });
      }

      const requestBody = JSON.stringify({ from: fromEmail, to: toEmail, subject, text: body });

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: requestBody,
        });
        const responseText = await res.text();

        // Twilio/Resend rejected the request → log FAILED with real error
        if (!res.ok) {
          let parsedErr = null;
          try { parsedErr = JSON.parse(responseText); } catch (_) {}
          const errorMsg = parsedErr?.message || `Resend API error: ${res.status} — ${responseText.slice(0, 300)}`;
          const errorCode = String(res.status);

          const logPayload = {
            channel: "email", provider: "resend", direction: "outbound",
            trigger_name: "manual_test", to_address: toEmail, from_address: fromEmail,
            subject, body_preview: body.slice(0, 200),
            delivery_status: "failed", error_code: errorCode, error_message: errorMsg,
            request_payload_redacted: requestBody, response_payload_redacted: responseText,
            environment: env,
          };
          const logId = await createCommLog(base44, logPayload);

          return json({
            success: false,
            passed: false,
            provider: "resend",
            error: errorMsg,
            error_code: errorCode,
            communication_log_id: logId,
          });
        }

        // Provider accepted — capture the REAL Resend email id
        const result = JSON.parse(responseText);
        const messageId = result.id || null;

        if (!messageId) {
          // Resend returned 200 but no ID — suspicious, log as failed
          const logPayload = {
            channel: "email", provider: "resend", direction: "outbound",
            trigger_name: "manual_test", to_address: toEmail, from_address: fromEmail,
            subject, body_preview: body.slice(0, 200),
            delivery_status: "failed", error_message: "Resend returned 200 but no email id in response body",
            request_payload_redacted: requestBody, response_payload_redacted: responseText,
            environment: env,
          };
          const logId = await createCommLog(base44, logPayload);

          return json({
            success: false,
            passed: false,
            provider: "resend",
            error: "Resend returned 200 but no email id in response body",
            communication_log_id: logId,
          });
        }

        const logPayload = {
          channel: "email", provider: "resend", direction: "outbound",
          trigger_name: "manual_test", to_address: toEmail, from_address: fromEmail,
          subject, body_preview: body.slice(0, 200),
          provider_message_id: messageId, provider_status: "sent", delivery_status: "sent",
          request_payload_redacted: requestBody, response_payload_redacted: responseText,
          environment: env,
        };
        const logId = await createCommLog(base44, logPayload);

        return json({
          success: true,
          passed: true,
          provider: "resend",
          message_id: messageId,
          provider_message_id: messageId,
          sent_to: toEmail,
          communication_log_id: logId,
        });
      } catch (err) {
        // Network error — provider unreachable
        const logPayload = {
          channel: "email", provider: "resend", direction: "outbound",
          trigger_name: "manual_test", to_address: toEmail, from_address: fromEmail,
          subject, body_preview: body.slice(0, 200),
          delivery_status: "failed", error_code: "NETWORK_ERROR", error_message: err.message,
          environment: env,
        };
        const logId = await createCommLog(base44, logPayload);

        return json({
          success: false,
          passed: false,
          provider: "resend",
          error: err.message,
          error_code: "NETWORK_ERROR",
          communication_log_id: logId,
        });
      }
    }

    // ═══════════════════════════════════════════
    // TEST SMS via Twilio
    // ═══════════════════════════════════════════
    if (action === "sms") {
      const toPhone = (recipient_phone || "").trim();
      if (!toPhone || toPhone.replace(/\D/g, "").length < 10) {
        return json({ error: "A valid recipient phone number is required" }, 400);
      }

      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
      const smsBody = "ClientSurge Twilio test: automation health check.\n\nReply STOP to opt out.";

      // If Twilio is not configured, log a FAILED row with the real reason
      if (!accountSid || !authToken || !fromNumber) {
        const missing = [];
        if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
        if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
        if (!fromNumber) missing.push("TWILIO_PHONE_NUMBER");
        const errorMsg = `Twilio credentials not configured: ${missing.join(", ")}`;

        const logPayload = {
          channel: "sms", provider: "twilio", direction: "outbound",
          trigger_name: "manual_test", to_address: toPhone,
          from_address: fromNumber || "not_configured",
          body_preview: smsBody.slice(0, 200),
          delivery_status: "failed", error_code: "MISSING_CONFIG", error_message: errorMsg,
          environment: env,
        };
        const logId = await createCommLog(base44, logPayload);

        return json({
          success: false,
          passed: false,
          provider: "twilio",
          error: errorMsg,
          communication_log_id: logId,
        });
      }

      const auth = btoa(`${accountSid}:${authToken}`);
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

        // Twilio rejected → log FAILED with real error
        if (!res.ok) {
          let parsedErr = null;
          try { parsedErr = JSON.parse(responseText); } catch (_) {}
          const errorMsg = parsedErr?.message || `Twilio API error: ${res.status} — ${responseText.slice(0, 300)}`;
          const errorCode = parsedErr?.code ? String(parsedErr.code) : String(res.status);

          const logPayload = {
            channel: "sms", provider: "twilio", direction: "outbound",
            trigger_name: "manual_test", to_address: toPhone, from_address: fromNumber,
            body_preview: smsBody.slice(0, 200), delivery_status: "failed",
            error_code: errorCode, error_message: errorMsg,
            request_payload_redacted: params.toString(), response_payload_redacted: responseText,
            environment: env,
          };
          const logId = await createCommLog(base44, logPayload);

          return json({
            success: false,
            passed: false,
            provider: "twilio",
            error: errorMsg,
            error_code: errorCode,
            communication_log_id: logId,
          });
        }

        // Provider accepted — capture the REAL Twilio Message SID
        const result = JSON.parse(responseText);
        const messageSid = result.sid || null;
        const providerStatus = result.status || "queued";

        if (!messageSid) {
          const logPayload = {
            channel: "sms", provider: "twilio", direction: "outbound",
            trigger_name: "manual_test", to_address: toPhone, from_address: fromNumber,
            body_preview: smsBody.slice(0, 200),
            delivery_status: "failed", error_message: "Twilio returned 200 but no Message SID in response body",
            request_payload_redacted: params.toString(), response_payload_redacted: responseText,
            environment: env,
          };
          const logId = await createCommLog(base44, logPayload);

          return json({
            success: false,
            passed: false,
            provider: "twilio",
            error: "Twilio returned 200 but no Message SID in response body",
            communication_log_id: logId,
          });
        }

        const logPayload = {
          channel: "sms", provider: "twilio", direction: "outbound",
          trigger_name: "manual_test", to_address: toPhone, from_address: fromNumber,
          body_preview: smsBody.slice(0, 200),
          provider_message_id: messageSid, provider_status: providerStatus,
          delivery_status: providerStatus === "queued" ? "queued" : "sent",
          request_payload_redacted: params.toString(), response_payload_redacted: responseText,
          environment: env,
        };
        const logId = await createCommLog(base44, logPayload);

        return json({
          success: true,
          passed: true,
          provider: "twilio",
          message_sid: messageSid,
          provider_message_id: messageSid,
          provider_status: providerStatus,
          sent_to: toPhone,
          communication_log_id: logId,
        });
      } catch (err) {
        // Network error — provider unreachable
        const logPayload = {
          channel: "sms", provider: "twilio", direction: "outbound",
          trigger_name: "manual_test", to_address: toPhone, from_address: fromNumber,
          body_preview: smsBody.slice(0, 200),
          delivery_status: "failed", error_code: "NETWORK_ERROR", error_message: err.message,
          environment: env,
        };
        const logId = await createCommLog(base44, logPayload);

        return json({
          success: false,
          passed: false,
          provider: "twilio",
          error: err.message,
          error_code: "NETWORK_ERROR",
          communication_log_id: logId,
        });
      }
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("[sendTestCommunication] Error:", error.message);
    return json({ error: error.message }, 500);
  }
});
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { AuthGuardError, requireAdminOrSignedInternalInvocation } from "../_shared/authGuards.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function appendSmsOptOut(message) {
  if (!message) return "";
  const trimmed = message.trim();
  if (/\bSTOP\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
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

function safeResendFrom() {
  const configured = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return "ClientSurge Systems <system@clientsurgesystems.com>";
}

const DEFAULT_SMS_TEMPLATE = "Hi {first_name}, thanks for reaching out! We received your message about {service_interest}. A member of our team will be in touch shortly.";

function formatSmsTemplate(template, lead) {
  return template
    .replace("{first_name}", lead.first_name || lead.full_name?.split(" ")[0] || "there")
    .replace("{service_interest}", lead.service_interest || "your inquiry")
    .replace("{business_name}", lead.business_name || "your business");
}

async function sendTwilioSms(toNumber, messageBody, fromNumber) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  if (!fromNumber) {
    throw new Error("Twilio FROM sender not provided");
  }

  // Hard-block the deprecated toll-free sender
  if (fromNumber === "+18778123630") {
    throw new Error("Twilio sender +18778123630 is BLOCKED (toll-free verification issue). Use +16025843227.");
  }

  const auth = btoa(`${accountSid}:${authToken}`);
  const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");

  const params = { From: fromNumber, To: toNumber, Body: appendSmsOptOut(messageBody) };
  if (statusCallbackUrl) params.StatusCallback = statusCallbackUrl;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params).toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.sid;
}

async function logSmsEvent(base44, leadId, status, messageId, errorMessage, clientId, clientProjectId) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      context_id: leadId,
      context_type: "WebsiteLead",
      client_id: clientId || undefined,
      client_project_id: clientProjectId || undefined,
      tenant_scope_status: clientId ? 'scoped' : 'missing_client_id',
      channel: "sms",
      direction: "outbound",
      event_type: status === "sent" ? "sms_sent" : "sms_failed",
      provider: "twilio",
      status: status === "sent" ? "sent" : "failed",
      message_body: null,
      provider_message_id: messageId || null,
      error_message: errorMessage || null,
      metadata_json: JSON.stringify({
        service_key: "instant_lead_response",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (_) {
    // Non-blocking
  }
}

async function sendResendEmail(base44, leadId, toEmail, firstName, businessName) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return; // Skip silently — Resend not configured

  const subject = "We received your request";
  const body = `Hi ${firstName},\n\nWe received your request and will be reaching out shortly.\n\nIf this is urgent, feel free to reply to this email or text us back.\n\n– ${businessName}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `instant-response/${leadId}/initial-email`,
      },
      body: JSON.stringify({ from: safeResendFrom(), to: toEmail, subject, text: body }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Resend error: ${err?.message || res.status}`);
    }

    const result = await res.json();

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      context_id: leadId,
      context_type: "WebsiteLead",
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: "sent",
      provider_message_id: result.id || null,
      metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: new Date().toISOString() }),
    });
    base44.asServiceRole.functions.invoke('logCommunication', {
      related_entity_type: "WebsiteLead", related_entity_id: leadId,
      lead_email: toEmail, channel: "email", provider: "resend", direction: "outbound",
      trigger_name: "initial_response", to_address: toEmail, from_address: safeResendFrom(),
      subject: subject, body_preview: body.slice(0, 200),
      provider_message_id: result.id || null, provider_status: "sent",
      delivery_status: "sent", skip_lead_update: true,
    }).catch(() => {});
  } catch (emailError) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      context_id: leadId,
      context_type: "WebsiteLead",
      channel: "email",
      direction: "outbound",
      event_type: "email_failed",
      provider: "resend",
      status: "failed",
      error_message: emailError.message,
      metadata_json: JSON.stringify({ service_key: "instant_lead_response", timestamp: new Date().toISOString() }),
    });
    base44.asServiceRole.functions.invoke('logCommunication', {
      related_entity_type: "WebsiteLead", related_entity_id: leadId,
      lead_email: toEmail, channel: "email", provider: "resend", direction: "outbound",
      trigger_name: "initial_response", to_address: toEmail,
      delivery_status: "failed", error_message: emailError.message, skip_lead_update: true,
    }).catch(() => {});
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    await requireAdminOrSignedInternalInvocation(base44, req);

    const { lead_id, order_id } = await req.json();

    if (!lead_id) {
      return json({ error: "lead_id is required" }, 400);
    }

    let leadData = null;
    try {
      leadData = await base44.asServiceRole.entities.WebsiteLead.get(lead_id);
    } catch (_) {}

    if (!leadData) {
      return json({ error: "Lead not found" }, 404);
    }

    // ── DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    if (leadData.client_id) {
      try {
        const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: leadData.client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
          '-created_date', 1
        );
        const deployment = deployments?.[0] || null;
        if (deployment) {
          const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
            deployment_id: deployment.id, module_key: 'instant_lead_response'
          });
          if (permRes.data?.authorized !== true) {
            // Permission denied — log block and exit
            await base44.asServiceRole.functions.invoke('logAutomationExecution', {
              client_deployment_id: deployment.id, client_id: leadData.client_id,
              module_key: 'instant_lead_response', trigger_event: 'lead_created',
              execution_status: 'blocked',
              error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
              error_code: permRes.data?.reason || 'module_not_authorized',
              lead_id,
            }).catch(() => {});
            return json({ error: 'Module not authorized for this deployment', blocked: true, reason: permRes.data?.reason }, 403);
          }
          _obsCtx = { deployment_id: deployment.id, client_id: leadData.client_id, module_key: 'instant_lead_response', trigger_event: 'lead_created', lead_id };
        }
      } catch (err) {
        console.warn('[sendInstantLeadResponseSms] Observability init failed:', err.message);
      }
    }

    // Idempotency guard
    if (leadData.initial_response_sent_at) {
      return json({ success: false, reason: "Already sent" }, 409);
    }

    // Consent guard
    if (leadData.do_not_contact === true) {
      await logSmsEvent(base44, lead_id, "failed", null, "Lead has do_not_contact flag");
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: "WebsiteLead", related_entity_id: lead_id,
        lead_phone: leadData.phone_number, lead_name: leadData.full_name,
        channel: "sms", provider: "twilio", direction: "outbound",
        trigger_name: "initial_response", delivery_status: "skipped",
        error_message: "Lead has do_not_contact flag", skip_lead_update: true,
      }).catch(() => {});
      return json({ error: "Lead has do_not_contact flag", sms_sent: false }, 200);
    }

    // ── TENANT SCOPE GUARDRAIL (inlined) ──
    if (!leadData.client_id) {
      await logSmsEvent(base44, lead_id, "failed", null, "missing_client_id_tenant_scope");
      return json({ error: 'Outbound SMS blocked: missing client_id tenant scope', sms_sent: false, reason: 'missing_client_id_tenant_scope', safe_to_continue: true }, 200);
    }
    const sendClientId = leadData.client_id;
    const sendClientProjectId = leadData.client_project_id;

    if (!leadData.phone_number) {
      await logSmsEvent(base44, lead_id, "failed", null, "Missing phone number");
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: "WebsiteLead", related_entity_id: lead_id,
        lead_name: leadData.full_name,
        channel: "sms", provider: "twilio", direction: "outbound",
        trigger_name: "initial_response", delivery_status: "skipped",
        error_message: "Missing phone number", skip_lead_update: true,
      }).catch(() => {});
      return json({ success: false, error: "Phone number missing" }, 400);
    }

    // Load install configuration
    let smsTemplate = DEFAULT_SMS_TEMPLATE;
    if (order_id) {
      try {
        const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id }, null, 1);
        if (orders && orders.length > 0) {
          const config = orders[0].install_configuration?.services?.instant_lead_response;
          if (config?.sms_template) {
            smsTemplate = config.sms_template;
          }
        }
      } catch (_) {}
    }

    // ── RESOLVE TWILIO SENDER FROM ADMINSETTINGS (ENFORCED) ──
    let fromNumber = null;
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      if (settings?.[0]?.twilio_from_number) {
        fromNumber = settings[0].twilio_from_number;
      }
    } catch (e) {
      console.warn(`[sendInstantLeadResponseSms] Failed to load AdminSettings: ${e.message}`);
    }
    if (!fromNumber) {
      fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    }
    if (fromNumber) {
      fromNumber = normalizePhoneToE164(fromNumber);
    }

    // Hard-block deprecated toll-free sender
    if (fromNumber === "+18778123630") {
      const errorMsg = "SMS sender +18778123630 is BLOCKED. Toll-free verification failed (Twilio 30032 compliance). Use +16025843227.";
      console.error(`[sendInstantLeadResponseSms] ${errorMsg}`);
      await logSmsEvent(base44, lead_id, "failed", null, errorMsg);
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: "WebsiteLead", related_entity_id: lead_id,
        lead_phone: rawPhone, lead_name: leadData.full_name,
        channel: "sms", provider: "twilio", direction: "outbound",
        trigger_name: "initial_response", delivery_status: "skipped",
        error_message: errorMsg, skip_lead_update: true,
      }).catch(() => {});
      return json({ error: errorMsg, blocked_sender: true }, 400);
    }

    if (!fromNumber) {
      return json({ error: "Twilio SMS sender not configured" }, 500);
    }

    // ── E.164 NORMALIZATION ──
    const rawPhone = leadData.phone_number;
    const normalizedPhone = normalizePhoneToE164(rawPhone);

    if (!normalizedPhone) {
      await logSmsEvent(base44, lead_id, "failed", null, "Invalid phone number — cannot normalize to E.164");
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: "WebsiteLead", related_entity_id: lead_id,
        lead_phone: rawPhone, lead_name: leadData.full_name,
        channel: "sms", provider: "twilio", direction: "outbound",
        trigger_name: "initial_response", to_address: null, canonical_to_address: null,
        delivery_status: "skipped", error_message: "invalid_phone_number", skip_lead_update: true,
      }).catch(() => {});
      return json({ error: "Invalid phone number — cannot normalize to E.164", sms_sent: false, normalized_phone: null }, 400);
    }

    // Format and send SMS
    const messageBody = formatSmsTemplate(smsTemplate, leadData);
    let messageSid;
    try {
      messageSid = await sendTwilioSms(normalizedPhone, messageBody, fromNumber);
    } catch (smsError) {
      await logSmsEvent(base44, lead_id, "failed", null, smsError.message);
      base44.asServiceRole.functions.invoke('logCommunication', {
        related_entity_type: "WebsiteLead", related_entity_id: lead_id,
        lead_phone: rawPhone, lead_name: leadData.full_name,
        channel: "sms", provider: "twilio", direction: "outbound",
        trigger_name: "initial_response", to_address: normalizedPhone, canonical_to_address: normalizedPhone,
        delivery_status: "failed", error_message: smsError.message, skip_lead_update: true,
      }).catch(() => {});
      // ── DEPLOYMENT OBSERVABILITY: Log failed execution + trigger health check ──
      if (_obsCtx) {
        try {
          await base44.asServiceRole.functions.invoke('logAutomationExecution', {
            ..._obsCtx,
            execution_status: 'failed',
            error_message: smsError.message,
            error_code: smsError.message.includes('Twilio') ? 'twilio_api_error' : 'sms_send_failed',
            execution_time_ms: Date.now() - _obsStartTime,
          });
          await base44.asServiceRole.functions.invoke('calculateDeploymentHealth', { deployment_id: _obsCtx.deployment_id });
        } catch (_) {}
      }
      return json({ error: smsError.message, normalized_phone: normalizedPhone }, 500);
    }

    // Update WebsiteLead
    const now = new Date().toISOString();
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(lead_id, {
        initial_response_sent_at: now,
        lead_status: "contacted",
        next_follow_up_at: now,
        sms_attempt_count: (leadData.sms_attempt_count || 0) + 1,
        last_engagement_type: "sms",
        last_engagement_at: now,
      });
    } catch (_) {}

    await logSmsEvent(base44, lead_id, "sent", messageSid, null, sendClientId, sendClientProjectId);

    // ── DEPLOYMENT OBSERVABILITY: Log successful execution ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'completed',
          external_provider_reference: messageSid,
          execution_time_ms: Date.now() - _obsStartTime,
        });
      } catch (_) {}
    }

    const statusCallbackUrl = Deno.env.get("TWILIO_SMS_STATUS_CALLBACK_URL");
    base44.asServiceRole.functions.invoke('logCommunication', {
      related_entity_type: "WebsiteLead", related_entity_id: lead_id,
      lead_email: leadData.email, lead_phone: rawPhone, lead_name: leadData.full_name,
      channel: "sms", provider: "twilio", direction: "outbound",
      trigger_name: "initial_response", to_address: normalizedPhone, canonical_to_address: normalizedPhone,
      from_address: fromNumber,
      body_preview: messageBody.slice(0, 200),
      provider_message_id: messageSid, provider_status: "queued",
      delivery_status: "queued", skip_lead_update: true,
      request_payload_redacted: JSON.stringify({
        From: fromNumber,
        To: normalizedPhone,
        Body: "[MESSAGE_BODY_REDACTED]",
        StatusCallback: statusCallbackUrl ? "[REDACTED_CALLBACK_URL]" : null,
      }),
      metadata_json: JSON.stringify({
        service_key: "instant_lead_response",
        sender_from: fromNumber,
        sender_source: "AdminSettings.twilio_from_number",
        normalized_phone: normalizedPhone,
        raw_phone: rawPhone,
        status_callback_present: !!statusCallbackUrl,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    // Send email if address present
    if (leadData.email) {
      const firstName = leadData.first_name || leadData.full_name?.split(" ")[0] || "there";
      const businessName = Deno.env.get("DEFAULT_BUSINESS_NAME") || "ClientSurge Systems";
      await sendResendEmail(base44, lead_id, leadData.email, firstName, businessName);
    }

    return json({ success: true, message_id: messageSid, normalized_phone: normalizedPhone });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    return json({ error: error.message }, 500);
  }
});

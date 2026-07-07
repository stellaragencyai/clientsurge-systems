import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Inlined shared helpers ──
function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

const FALLBACK_SENDER = "noreply@clientsurgesystems.com";

function getApprovedEmailSender(settings = {}, options = {}) {
  const configured = String(settings?.resend_from_email || "").trim();
  if (configured && configured.includes("@")) return configured;
  const envSender = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (envSender && envSender.includes("@")) return envSender;
  return FALLBACK_SENDER;
}

function getEmailOutreachGate(context = "email outreach") {
  const proofStatus = String(Deno.env.get("EMAIL_DELIVERABILITY_PROOF_STATUS") || "").trim().toLowerCase();
  const proofReadyValues = ["verified", "passed", "production_verified"];
  if (proofReadyValues.includes(proofStatus)) {
    return { ok: true, reason: null, proof_status: proofStatus || "verified" };
  }
  return {
    ok: false,
    reason: `Email outreach blocked: deliverability proof not complete (context: ${context}). Set EMAIL_DELIVERABILITY_PROOF_STATUS=verified to enable.`,
    proof_status: proofStatus || "missing",
  };
}

function appendSmsOptOut(message) {
  if (!message) return "";
  const trimmed = message.trim();
  if (/\bSTOP\b/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

async function twilioFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    throw new Error(`Twilio request failed: ${err.message || "network error"}`);
  }
}

async function resendFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    throw new Error(`Resend request failed: ${err.message || "network error"}`);
  }
}

// ── Credentials ──
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ── Twilio SMS sender ──
async function sendTwilioSms(toNumber, messageBody) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error("Twilio credentials missing");
  }
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const response = await twilioFetch(TWILIO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: TWILIO_FROM_NUMBER,
      To: toNumber,
      Body: appendSmsOptOut(messageBody),
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.sid;
}

// ── Resend email sender ──
async function sendResendEmail(to, subject, body, fromEmail) {
  if (!RESEND_API_KEY) {
    throw new Error("Resend API key missing");
  }

  const response = await resendFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      text: body,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Resend error: ${error?.message || response.status}`);
  }

  const data = await response.json();
  return data.id;
}

// ── Duplicate check (past 7 days) ──
async function checkDuplicateReviewRequest(base44, phone, email) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const query = {
    event_type: "review_request",
    status: "sent",
    created_date: { $gte: sevenDaysAgo },
  };

  try {
    let recentEvents = [];
    if (phone) {
      const phoneEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { ...query, channel: "sms", subject: { $regex: phone.replace(/\D/g, "") } },
        "-created_date",
        1
      );
      if (phoneEvents?.length > 0) recentEvents.push(phoneEvents[0]);
    }
    if (email) {
      const emailEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { ...query, channel: "email", subject: email },
        "-created_date",
        1
      );
      if (emailEvents?.length > 0) recentEvents.push(emailEvents[0]);
    }
    return recentEvents.length > 0;
  } catch (err) {
    console.warn("[SendReviewRequest] Duplicate check failed:", err.message);
    return false;
  }
}

// ── Main handler ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      customer_name,
      customer_phone,
      customer_email,
      business_name,
      google_review_link,
      yelp_review_link,
      preferred_channel = "both",
      skip_duplicate_check = false,
      client_id,
      lead_id,
    } = await req.json();

    // ── DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
    const _obsStartTime = Date.now();
    let _obsCtx = null;
    if (client_id) {
      try {
        const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
          '-created_date', 1
        );
        const deployment = deployments?.[0] || null;
        if (deployment) {
          const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
            deployment_id: deployment.id, module_key: 'review_reactivation'
          });
          if (permRes.data?.authorized !== true) {
            await base44.asServiceRole.functions.invoke('logAutomationExecution', {
              client_deployment_id: deployment.id, client_id: client_id,
              module_key: 'review_reactivation', trigger_event: 'review_request',
              execution_status: 'blocked',
              error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
              error_code: permRes.data?.reason || 'module_not_authorized',
              lead_id: lead_id || null,
            }).catch(() => {});
            return secureJson({ success: false, blocked: true, reason: permRes.data?.reason, message: 'Module not authorized for this deployment' }, { status: 403 });
          }
          _obsCtx = { deployment_id: deployment.id, client_id: client_id, module_key: 'review_reactivation', trigger_event: 'review_request', lead_id: lead_id || null };
        }
      } catch (err) {
        console.warn('[sendReviewRequest] Observability init failed:', err.message);
      }
    }

    // ── TENANT SCOPE GUARDRAIL (inlined) ──
    if (!client_id) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: lead_id || undefined,
          channel: 'sms', direction: 'outbound', event_type: 'tenant_scope_blocked',
          provider: 'twilio', status: 'failed', error_message: 'missing_client_id_tenant_scope',
          metadata_json: JSON.stringify({ trigger_name: 'sendReviewRequest', customer_phone, customer_email }),
        });
      } catch (_) {}
      return secureJson({ error: 'Outbound blocked: missing client_id tenant scope', success: false, reason: 'missing_client_id_tenant_scope', safe_to_continue: true });
    }
    const sendClientId = client_id;
    const sendClientProjectId = null;

    // Validation
    const errors = [];
    if (!customer_name || typeof customer_name !== "string") errors.push("customer_name is required");
    if (!business_name || typeof business_name !== "string") errors.push("business_name is required");
    if (!google_review_link || typeof google_review_link !== "string") errors.push("google_review_link is required");
    if (!["sms", "email", "both"].includes(preferred_channel)) errors.push('preferred_channel must be "sms", "email", or "both"');
    if ((preferred_channel === "sms" || preferred_channel === "both") && !customer_phone) errors.push("customer_phone is required for SMS channel");
    if ((preferred_channel === "email" || preferred_channel === "both") && !customer_email) errors.push("customer_email is required for email channel");

    if (errors.length > 0) {
      return secureJson({ success: false, errors }, { status: 400 });
    }

    // Duplicate check
    if (!skip_duplicate_check) {
      const isDuplicate = await checkDuplicateReviewRequest(base44, customer_phone, customer_email);
      if (isDuplicate) {
        return secureJson({ success: false, error: "Review request already sent in the last 7 days", skipped: true }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const fromEmail = getApprovedEmailSender({}, { preferLeads: true });

    const smsBodies = [
      `Hi ${customer_name.split(" ")[0]}, we'd love your feedback! Share your experience with ${business_name}: ${google_review_link}`,
      `Hey ${customer_name.split(" ")[0]}, if you enjoyed working with us, we'd appreciate a quick review: ${google_review_link}`,
    ];
    const smsBody = appendSmsOptOut(smsBodies[Math.floor(Math.random() * smsBodies.length)]);

    const emailSubject = `Share Your Experience with ${business_name}`;
    const emailBody = `Hi ${customer_name},\n\nWe hope you had a great experience with ${business_name}. Your feedback means the world to us!\n\nWould you mind taking a moment to leave a review?\n\n🌟 Google Review: ${google_review_link}\n${yelp_review_link ? `⭐ Yelp Review: ${yelp_review_link}\n` : ""}\nThank you!\n\n${business_name} Team`;

    // Send SMS
    let smsSent = false;
    let smsId = null;
    let smsError = null;

    if (preferred_channel === "sms" || preferred_channel === "both") {
      try {
        smsId = await sendTwilioSms(customer_phone, smsBody);
        smsSent = true;
        await base44.asServiceRole.entities.CommunicationEvent.create({
          client_id: sendClientId, client_project_id: sendClientProjectId, tenant_scope_status: 'scoped',
          channel: "sms", direction: "outbound", event_type: "review_request", provider: "twilio",
          provider_from_number: TWILIO_FROM_NUMBER,
          status: "sent", subject: customer_phone, message_body: smsBody, provider_message_id: smsId,
          metadata_json: JSON.stringify({ customer_name, business_name, google_review_link, yelp_review_link, timestamp: now }),
        });
      } catch (err) {
        smsError = err.message;
        console.error(`[SendReviewRequest] SMS send failed: ${err.message}`);
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "sms", direction: "outbound", event_type: "review_request", provider: "twilio",
            status: "failed", subject: customer_phone, message_body: smsBody, error_message: smsError,
            metadata_json: JSON.stringify({ customer_name, business_name, timestamp: now }),
          });
        } catch (logErr) {
          console.warn("[SendReviewRequest] Failed to log SMS error event:", logErr.message);
        }
      }
    }

    // Send Email
    let emailSent = false;
    let emailId = null;
    let emailError = null;

    if (preferred_channel === "email" || preferred_channel === "both") {
      try {
        const sendGate = getEmailOutreachGate("review request email");
        if (!sendGate.ok) {
          emailError = sendGate.reason;
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "email", direction: "outbound", event_type: "review_request", provider: "resend",
            status: "blocked", subject: emailSubject, message_body: emailBody, error_message: emailError,
            metadata_json: JSON.stringify({ customer_name, customer_email, business_name, timestamp: now, proof_status: sendGate.proof_status, requires_owner_action: true }),
          });
          throw new Error(sendGate.reason);
        }

        emailId = await sendResendEmail(customer_email, emailSubject, emailBody, fromEmail);
        emailSent = true;
        await base44.asServiceRole.entities.CommunicationEvent.create({
          client_id: sendClientId, client_project_id: sendClientProjectId, tenant_scope_status: 'scoped',
          channel: "email", direction: "outbound", event_type: "review_request", provider: "resend",
          provider_from_email: fromEmail,
          status: "sent", subject: emailSubject, message_body: emailBody, provider_message_id: emailId,
          metadata_json: JSON.stringify({ customer_name, customer_email, business_name, google_review_link, yelp_review_link, timestamp: now }),
        });
      } catch (err) {
        emailError = err.message;
        console.error(`[SendReviewRequest] Email send failed: ${err.message}`);
        try {
          await base44.asServiceRole.entities.CommunicationEvent.create({
            channel: "email", direction: "outbound", event_type: "review_request", provider: "resend",
            status: "failed", subject: emailSubject, message_body: emailBody, error_message: emailError,
            metadata_json: JSON.stringify({ customer_name, customer_email, business_name, timestamp: now }),
          });
        } catch (logErr) {
          console.warn("[SendReviewRequest] Failed to log email error event:", logErr.message);
        }
      }
    }

    const allFailed = (preferred_channel === "sms" || preferred_channel === "both") && !smsSent
      && (preferred_channel === "email" || preferred_channel === "both") && !emailSent;

    // ── DEPLOYMENT OBSERVABILITY: Log execution result ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: allFailed ? 'failed' : 'completed',
          error_message: allFailed ? [smsError, emailError].filter(Boolean).join('; ') : null,
          error_code: allFailed ? 'review_send_failed' : null,
          external_provider_reference: smsId || emailId || null,
          execution_time_ms: Date.now() - _obsStartTime,
        });
        if (allFailed) {
          await base44.asServiceRole.functions.invoke('calculateDeploymentHealth', { deployment_id: _obsCtx.deployment_id });
        }
      } catch (_) {}
    }

    return secureJson({
      success: !allFailed,
      sms_sent: smsSent,
      email_sent: emailSent,
      sms_id: smsId,
      email_id: emailId,
      errors: [smsError, emailError].filter(Boolean),
    });
  } catch (error) {
    console.error("[SendReviewRequest] Fatal error:", error.message);
    return secureJson({ success: false, error: error.message }, { status: 500 });
  }
});
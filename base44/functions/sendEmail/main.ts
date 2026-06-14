import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resendFetch } from "../_shared/resendFetch.js";

const CLIENTSURGE_DOMAIN = "clientsurgesystems.com";
const PROOF_READY_VALUES = new Set(["verified", "passed", "production_verified"]);

function env(name) {
  return String(Deno.env.get(name) || "").trim();
}

function isSafeTestSend(email, subject) {
  return Boolean(
    env("EMAIL_TEST_MODE").toLowerCase() === "true" &&
    env("TEST_EMAIL_RECIPIENT") &&
    email.trim().toLowerCase() === env("TEST_EMAIL_RECIPIENT").toLowerCase() &&
    String(subject || "").startsWith("[TEST]")
  );
}

function deliverabilityProofReady() {
  return PROOF_READY_VALUES.has(env("EMAIL_DELIVERABILITY_PROOF_STATUS").toLowerCase());
}

function senderAddress() {
  return (
    env("RESEND_FROM_LEADS") ||
    env("RESEND_FROM_EMAIL") ||
    env("SUPPORT_EMAIL") ||
    `support@${CLIENTSURGE_DOMAIN}`
  );
}

Deno.serve(async (req) => {
  try {
    const { email, subject, body, leadId } = await req.json();

    if (!email || !subject || !body) {
      return secureJson({ error: 'Email, subject, and body required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return secureJson({
        error: 'Resend API key not configured',
        email_sent: false,
        email_warning: "Email provider not configured",
        safe_to_continue: false,
        requires_owner_action: true,
      }, { status: 500 });
    }

    if (!isSafeTestSend(email, subject) && !deliverabilityProofReady()) {
      return secureJson({
        error: "Direct email sending is blocked until deliverability proof is complete or an explicit [TEST] send targets TEST_EMAIL_RECIPIENT.",
        email_sent: false,
        safe_to_continue: false,
        requires_owner_action: true,
        proof_status: env("EMAIL_DELIVERABILITY_PROOF_STATUS") || "missing",
      }, { status: 403 });
    }

    const response = await resendFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ClientSurge Systems <${senderAddress()}>`,
        reply_to: env("RESEND_REPLY_TO_LEADS") || env("ADMIN_EMAIL") || `nolan@${CLIENTSURGE_DOMAIN}`,
        to: email,
        subject,
        html: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return secureJson({ error: 'Failed to send email', details: data }, { status: 500 });
    }

    // Log email in database
    const base44 = createClientFromRequest(req);
    if (leadId) {
      await base44.entities.Emails.create({
        lead_id: leadId,
        email_address: email,
        subject,
        body,
        status: 'sent',
      });
    }

    return secureJson({ success: true, emailId: data.id });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});

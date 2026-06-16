import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CLIENTSURGE_DOMAIN = "clientsurgesystems.com";
const PROOF_READY_VALUES = new Set(["verified", "passed", "production_verified"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function env(name) {
  return String(Deno.env.get(name) || "").trim();
}

function safeResendFrom() {
  const configured = env("RESEND_FROM_EMAIL");
  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return "ClientSurge Systems <system@clientsurgesystems.com>";
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

Deno.serve(async (req) => {
  try {
    const { email, subject, body, leadId } = await req.json();

    if (!email || !subject || !body) {
      return json({ error: 'Email, subject, and body required' }, 400);
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return json({
        error: 'Resend API key not configured',
        email_sent: false,
        email_warning: "Email provider not configured",
        safe_to_continue: false,
        requires_owner_action: true,
      }, 500);
    }

    if (!isSafeTestSend(email, subject) && !deliverabilityProofReady()) {
      return json({
        error: "Direct email sending is blocked until deliverability proof is complete or an explicit [TEST] send targets TEST_EMAIL_RECIPIENT.",
        email_sent: false,
        safe_to_continue: false,
        requires_owner_action: true,
        proof_status: env("EMAIL_DELIVERABILITY_PROOF_STATUS") || "missing",
      }, 403);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: safeResendFrom(),
        reply_to: env("RESEND_REPLY_TO_LEADS") || env("ADMIN_EMAIL") || `nolan@${CLIENTSURGE_DOMAIN}`,
        to: email,
        subject,
        html: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return json({ error: 'Failed to send email', details: data }, 500);
    }

    const base44 = createClientFromRequest(req);

    // Log CommunicationEvent for observability
    try {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: leadId || undefined,
        channel: 'email',
        direction: 'outbound',
        event_type: 'email_sent',
        provider: 'resend',
        status: 'sent',
        subject: subject,
        message_body: body,
        provider_message_id: data.id || null,
      });
    } catch (_) {
      // Non-blocking: event log failure should not break the main flow
    }

    // Legacy Emails entity — keep for backward compatibility
    if (leadId) {
      try {
        await base44.entities.Emails.create({
          lead_id: leadId,
          email_address: email,
          subject,
          body,
          status: 'sent',
        });
      } catch (_) {
        // Non-blocking
      }
    }

    return json({ success: true, emailId: data.id });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
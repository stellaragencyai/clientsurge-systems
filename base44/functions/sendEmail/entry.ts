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

/**
 * Resolve Resend sender from AdminSettings or fallback.
 * Returns { sender, from_address, sender_source }
 */
async function resolveResendSender(base44) {
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const configuredEmail = settings?.[0]?.resend_from_email;
    const fallbackEmail = 'noreply@clientsurgesystems.com';

    // Use configured sender if valid
    if (configuredEmail && configuredEmail.includes("@")) {
      return {
        sender: configuredEmail,
        from_address: configuredEmail,
        sender_source: 'admin_settings',
      };
    }

    // Fall back to verified sender
    return {
      sender: fallbackEmail,
      from_address: fallbackEmail,
      sender_source: 'fallback_verified',
    };
  } catch (error) {
    console.warn('[sendEmail] Failed to resolve sender from AdminSettings:', error.message);
    // Safe fallback
    return {
      sender: 'noreply@clientsurgesystems.com',
      from_address: 'noreply@clientsurgesystems.com',
      sender_source: 'fallback_verified',
    };
  }
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

    const base44 = createClientFromRequest(req);

    // ── TENANT SCOPE GUARDRAIL (inlined) ──
    let sendClientId = null;
    let sendClientProjectId = null;
    if (leadId) {
      try {
        const lead = await base44.asServiceRole.entities.Leads.get(leadId);
        if (lead) {
          sendClientId = lead.client_id || null;
          sendClientProjectId = lead.client_project_id || null;
        }
      } catch (_) {
        try {
          const wl = await base44.asServiceRole.entities.WebsiteLead.get(leadId);
          if (wl) {
            sendClientId = wl.client_id || null;
            sendClientProjectId = wl.client_project_id || null;
          }
        } catch (_) {}
      }
    }
    if (!sendClientId && !leadId) {
      // No lead context — treat as system internal (admin notifications)
      sendClientId = null;
    } else if (!sendClientId) {
      try {
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: leadId || undefined,
          channel: 'email', direction: 'outbound', event_type: 'tenant_scope_blocked',
          provider: 'resend', status: 'failed',
          error_message: 'missing_client_id_tenant_scope',
          metadata_json: JSON.stringify({ to: email, trigger_name: 'sendEmail' }),
        });
      } catch (_) {}
      return json({ error: 'Outbound email blocked: missing client_id tenant scope', email_sent: false, reason: 'missing_client_id_tenant_scope', safe_to_continue: true }, 200);
    }

    // Resolve sender from AdminSettings
    const senderInfo = await resolveResendSender(base44);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderInfo.from_address,
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

    // Resend 'sent' status = provider accepted, not final delivery
    const deliveryStatus = data.id ? 'sent' : 'unknown';

    // Log CommunicationEvent with sender info
    try {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id: leadId || undefined,
        client_id: sendClientId,
        client_project_id: sendClientProjectId,
        tenant_scope_status: 'scoped',
        channel: 'email',
        direction: 'outbound',
        event_type: 'email_sent',
        provider: 'resend',
        provider_from_email: senderInfo.from_address,
        status: deliveryStatus,
        subject: subject,
        message_body: body,
        provider_message_id: data.id || null,
        metadata_json: JSON.stringify({
          sender_from: senderInfo.from_address,
          sender_source: senderInfo.sender_source,
        }),
      });
    } catch (_) {}

    // Legacy Emails entity — keep for backward compatibility
    if (leadId) {
      try {
        await base44.asServiceRole.entities.Emails.create({
          lead_id: leadId,
          client_id: sendClientId,
          client_project_id: sendClientProjectId,
          tenant_scope_status: 'scoped',
          email_address: email,
          subject,
          body,
          status: 'sent',
          provider_from_email: senderInfo.from_address,
        });
      } catch (_) {}
    }

    return json({ success: true, emailId: data.id, sender_source: senderInfo.sender_source });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
});
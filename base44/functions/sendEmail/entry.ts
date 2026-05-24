import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
} from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const email = payload.email || payload.to;
    const subject = payload.subject;
    const body = payload.body || payload.html || payload.text;
    const leadId = payload.leadId || payload.lead_id;

    if (!email || !subject || !body) {
      return Response.json({ error: 'Email, subject, and body required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const settings = await base44.asServiceRole.entities.AdminSettings.list()
      .then((records: Record<string, unknown>[]) => records?.[0] || null)
      .catch(() => null);
    const settingsFromEmail =
      typeof settings?.resend_from_email === 'string' ? settings.resend_from_email.trim() : '';
    const envFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || '';
    const fromEmail = settingsFromEmail || envFromEmail || 'system@clientsurgesystems.com';
    let lead = null;
    if (leadId) {
      lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId).catch(() => null);
    }

    const result = await sendCommunicationViaOutbox({
      base44,
      channel: "email",
      provider: "resend",
      recipient: email,
      subject,
      body,
      html: payload.html || body,
      from: `ClientSurge Systems <${fromEmail}>`,
      lead,
      leadId,
      orderId: payload.order_id,
      clientProjectId: payload.client_project_id,
      source: payload.source || "sendEmail",
      sourceRecordId: payload.source_record_id || leadId || payload.event_id,
      templateKey: payload.template_key || "manual_email",
      messageType: payload.message_type || "transactional",
      consentBasis: payload.consent_basis,
      consentSnapshot: payload.consent_snapshot,
      metadata: payload.metadata || {},
      idempotencyKey: payload.idempotency_key,
      providerSend: (providerPayload) => sendResendEmailProvider({
        ...providerPayload,
        env: (name) => Deno.env.get(name),
        fetchImpl: fetch,
      }),
    });

    if (!result.success && !result.suppressed && result.failed) {
      return Response.json({ error: 'Failed to send email', details: result }, { status: 500 });
    }

    return Response.json({
      success: result.success,
      suppressed: result.suppressed || false,
      duplicate: result.duplicate || false,
      reason: result.reason,
      emailId: result.provider_message_id,
      outbox_id: result.outbox?.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

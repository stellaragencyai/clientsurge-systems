import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  sendCommunicationViaOutbox,
  sendTwilioSmsProvider,
} from "../_shared/communicationOutbox.js";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const phone = payload.phone || payload.to;
    const message = payload.message || payload.body;
    const leadId = payload.leadId || payload.lead_id;

    if (!phone || !message) {
      return Response.json({ error: 'Phone and message required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    let lead = null;
    if (leadId) {
      lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId).catch(() => null);
    }

    const result = await sendCommunicationViaOutbox({
      base44,
      channel: "sms",
      provider: "twilio",
      recipient: phone,
      body: message,
      from: payload.from,
      lead,
      leadId,
      orderId: payload.order_id,
      clientProjectId: payload.client_project_id,
      source: payload.source || "sendSMS",
      sourceRecordId: payload.source_record_id || leadId || payload.event_id,
      templateKey: payload.template_key || "manual_sms",
      messageType: payload.message_type || "transactional",
      consentBasis: payload.consent_basis,
      consentSnapshot: payload.consent_snapshot,
      enforceQuietHours: payload.enforce_quiet_hours,
      metadata: payload.metadata || {},
      idempotencyKey: payload.idempotency_key,
      providerSend: (providerPayload) => sendTwilioSmsProvider({
        ...providerPayload,
        env: (name) => Deno.env.get(name),
        fetchImpl: fetch,
      }),
    });

    if (!result.success && !result.suppressed && result.failed) {
      return Response.json({ error: 'Failed to send SMS', details: result }, { status: 500 });
    }

    return Response.json({
      success: result.success,
      suppressed: result.suppressed || false,
      duplicate: result.duplicate || false,
      reason: result.reason,
      messageSid: result.provider_message_id,
      outbox_id: result.outbox?.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

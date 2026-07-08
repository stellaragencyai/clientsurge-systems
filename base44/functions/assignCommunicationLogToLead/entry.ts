import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function safeJsonParse(value: unknown) {
  if (!value || typeof value !== 'string') return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const logId = body.log_id || body.logId;
    const leadId = body.lead_id || body.leadId;

    if (!logId || !leadId) {
      return Response.json(
        { success: false, error: 'log_id and lead_id are required' },
        { status: 400 }
      );
    }

    const log = await base44.asServiceRole.entities.CommunicationEvent.get(logId);
    if (!log) {
      return Response.json({ success: false, error: 'Communication log not found' }, { status: 404 });
    }

    const lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId);
    if (!lead) {
      return Response.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const metadata = safeJsonParse(log.metadata_json);

    const reassignedEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
      context_type: 'website_lead',
      context_id: leadId,
      channel: log.channel,
      direction: log.direction,
      event_type: 'sms_received',
      provider: log.provider,
      status: 'received',
      subject: `[MANUAL] ${log.subject || 'Assigned communication'}`,
      message_body: log.message_body,
      provider_message_id: log.provider_message_id,
      metadata_json: JSON.stringify({
        ...metadata,
        manually_assigned: true,
        original_log_id: log.id,
        assigned_by_user_id: user.id || null,
        assigned_by_email: user.email || null,
        assigned_at: new Date().toISOString(),
      }),
    });

    await base44.asServiceRole.entities.WebsiteLead.update(leadId, {
      reply_status: 'responded',
      lead_status: 'responded',
      automation_enabled: false,
    });

    return Response.json({
      success: true,
      reassigned_event_id: reassignedEvent?.id || null,
      original_log_id: logId,
      lead_id: leadId,
    });
  } catch (error: any) {
    console.error('[assignCommunicationLogToLead]', error?.message || error);
    return Response.json(
      {
        success: false,
        error: 'Failed to assign communication log',
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function logCommunicationEvent(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: {
    lead_id: string;
    status: 'sent' | 'failed' | 'processed';
    subject: string;
    message_body: string;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: payload.lead_id,
    channel: 'webhook',
    direction: 'system',
    event_type: 'webhook_sent',
    provider: 'zapier',
    status: payload.status,
    subject: payload.subject,
    message_body: payload.message_body,
    error_message: payload.error_message,
    metadata_json: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);

    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const webhookUrl = Deno.env.get('EXTERNAL_WEBHOOK_URL') || Deno.env.get('WEBHOOK_URL');

    if (!webhookUrl) {
      await logCommunicationEvent(base44, {
        lead_id,
        status: 'failed',
        subject: 'CRM sync skipped',
        message_body: 'No CRM webhook URL configured.',
        error_message: 'missing_webhook_url',
        metadata: { action: 'crm_sync', configured: false },
      });

      return Response.json({ success: false, error: 'CRM webhook URL not configured' }, { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'clientsurge_website',
        intake_type: lead.intake_type || 'legacy',
        lead: {
          id: lead.id,
          full_name: lead.full_name,
          business_name: lead.business_name,
          email: lead.email,
          phone: lead.phone,
          business_type: lead.business_type,
          problem: lead.problem,
          status: lead.status,
          source: lead.source,
          created_date: lead.created_date,
          booked_at: lead.booked_at,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      await logCommunicationEvent(base44, {
        lead_id,
        status: 'failed',
        subject: 'CRM sync failed',
        message_body: 'Lead sync to CRM webhook failed.',
        error_message: errorBody || `http_${response.status}`,
        metadata: { action: 'crm_sync', status_code: response.status },
      });

      return Response.json({ success: false, error: 'CRM sync failed' }, { status: 502 });
    }

    await logCommunicationEvent(base44, {
      lead_id,
      status: 'sent',
      subject: 'CRM sync sent',
      message_body: 'Lead sync payload sent to configured CRM webhook.',
      metadata: { action: 'crm_sync', webhook_url_configured: true },
    });

    return Response.json({ success: true, lead_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CRM sync failed';
    return Response.json({ error: message }, { status: 500 });
  }
});

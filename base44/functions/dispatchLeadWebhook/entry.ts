import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const settings = await base44.asServiceRole.entities.AdminSettings.list();
    const adminSettings = settings.length > 0 ? settings[0] : null;

    if (!adminSettings?.webhook_enabled || !adminSettings?.webhook_url) {
      return Response.json({ message: 'Webhooks not configured' }, { status: 200 });
    }

    // Build standardized webhook payload
    const payload = {
      event: 'lead_created',
      timestamp: new Date().toISOString(),
      lead: {
        id: lead.id,
        full_name: lead.name,
        business_name: lead.business_name,
        email: lead.email,
        phone: lead.phone,
        niche: lead.niche,
        monthly_leads: lead.monthly_leads,
        status: 'NEW',
      },
      context: {
        source: lead.source || 'web_form',
      },
    };

    let webhookResponse;
    let webhookStatus = 'sent';
    let errorMessage = null;

    try {
      const response = await fetch(adminSettings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      webhookResponse = await response.text();
      if (!response.ok) {
        webhookStatus = 'failed';
        errorMessage = `HTTP ${response.status}: ${webhookResponse}`;
      }
    } catch (err) {
      webhookStatus = 'failed';
      errorMessage = err.message;
    }

    // Log webhook dispatch
    await base44.entities.CommunicationEvent.create({
      lead_id: lead_id,
      channel: 'webhook',
      direction: 'outbound',
      event_type: 'webhook_sent',
      provider: 'external',
      status: webhookStatus,
      message_body: JSON.stringify(payload),
      error_message: errorMessage,
    });

    return Response.json({
      success: webhookStatus === 'sent',
      status: webhookStatus,
      error: errorMessage,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
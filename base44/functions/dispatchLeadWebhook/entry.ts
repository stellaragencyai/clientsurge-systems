import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { leadId } = await req.json();

    if (!leadId) {
      return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Fetch lead data
    const leads = await base44.asServiceRole.entities.Leads.filter({ id: leadId });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];

    // Prepare JSON output for external automation (n8n, Zapier, etc.)
    const webhookPayload = {
      name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      issue: lead.problem || '',
      source: lead.source || 'form',
      status: lead.status,
      timestamp: new Date().toISOString(),
    };

    // Send to external webhook URL if configured
    const webhookUrl = Deno.env.get('EXTERNAL_WEBHOOK_URL');
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
    }

    return Response.json({ success: true, payload: webhookPayload });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event !== 'lead_created') {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    // Prepare structured webhook payload
    const payload = {
      event: 'lead_created',
      timestamp: new Date().toISOString(),
      lead: {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        niche: data.niche,
        monthly_leads: data.monthly_leads,
        status: 'NEW',
        source: 'website',
      },
    };

    // Send to webhook endpoint (n8n, Zapier, etc.)
    const webhookUrl = Deno.env.get('WEBHOOK_URL');
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.log('Webhook failed (non-blocking):', err.message);
      }
    }

    // Send admin notification (optional)
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    if (adminEmail) {
      try {
        await base44.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `New Lead: ${data.name}`,
          body: `A new lead has been submitted.\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nBusiness: ${data.business_name}`,
        });
      } catch (err) {
        console.log('Email failed (non-blocking):', err.message);
      }
    }

    return Response.json({ success: true, payload });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
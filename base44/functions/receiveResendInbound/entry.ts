import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Resend Inbound Handler
 * Receives incoming email replies from leads/customers
 */

async function findLeadByEmail(base44, email) {
  try {
    const leads = await base44.entities.Leads.filter({ email }, '-created_date', 1);
    return leads.length > 0 ? leads[0] : null;
  } catch (e) {
    console.warn(`Could not find lead for email ${email}:`, e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { type, email, message_id, bounced, created_at } = body;

    if (!email) {
      return Response.json({ error: 'Email required in webhook' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Handle different Resend event types
    if (type === 'email.replied') {
      // High-intent signal: lead replied to your email
      const lead = await findLeadByEmail(base44, email);

      if (lead) {
        // Update lead status and mark as high-priority
        await base44.entities.Leads.update(lead.id, {
          outreach_status: 'replied',
          last_contacted_at: new Date().toISOString(),
          activation_priority: 'Hot',
        });

        // Log the reply event
        await base44.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'inbound',
          event_type: 'email_replied',
          provider: 'resend',
          status: 'received',
          message_body: 'Lead replied to broadcast email',
          metadata_json: JSON.stringify({
            from_email: email,
            message_id,
            received_at: created_at,
          }),
        });
      }

      return Response.json({ success: true, event: 'email_replied', lead_updated: !!lead });
    }

    if (type === 'email.bounced') {
      // Bad email — mark for removal
      const lead = await findLeadByEmail(base44, email);

      if (lead) {
        await base44.entities.Leads.update(lead.id, {
          email_bounced: true,
          do_not_contact: true,
          outreach_status: 'bounced',
        });

        await base44.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'system',
          event_type: 'email_bounced',
          provider: 'resend',
          status: 'failed',
          metadata_json: JSON.stringify({ bounced_email: email, bounced }),
        });
      }

      return Response.json({ success: true, event: 'email_bounced', lead_updated: !!lead });
    }

    if (type === 'email.opened') {
      const lead = await findLeadByEmail(base44, email);

      if (lead) {
        await base44.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'system',
          event_type: 'email_opened',
          provider: 'resend',
          status: 'processed',
          metadata_json: JSON.stringify({ opened_at: created_at }),
        });
      }

      return Response.json({ success: true, event: 'email_opened' });
    }

    if (type === 'email.clicked') {
      const lead = await findLeadByEmail(base44, email);

      if (lead) {
        await base44.entities.CommunicationEvent.create({
          lead_id: lead.id,
          channel: 'email',
          direction: 'system',
          event_type: 'email_clicked',
          provider: 'resend',
          status: 'processed',
          metadata_json: JSON.stringify({ clicked_at: created_at }),
        });
      }

      return Response.json({ success: true, event: 'email_clicked' });
    }

    return Response.json({ success: true, event: type, message: 'Webhook received' });
  } catch (error) {
    console.error('Resend Inbound Handler Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
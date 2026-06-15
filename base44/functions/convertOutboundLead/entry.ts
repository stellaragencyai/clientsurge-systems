import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Convert Outbound Lead: Converts outbound lead to Order + Client when deal closes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      outbound_lead_id,
      order_id,
      package_type,
      total_value,
    } = await req.json();

    const lead = await base44.asServiceRole.entities.OutboundLead.get(outbound_lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const results = {
      converted: false,
      order_created: false,
      client_created: false,
    };

    // Create or link Order
    let finalOrderId = order_id;
    if (!order_id) {
      const newOrder = await base44.asServiceRole.entities.Order.create({
        customer_email: lead.email,
        customer_name: lead.contact_name,
        customer_phone: lead.phone,
        business_name: lead.business_name,
        payment_status: 'paid',
        order_status: 'paid_setup_in_progress',
        total_setup: total_value || 0,
        total_monthly: 0,
      }).catch(() => null);

      if (newOrder) {
        finalOrderId = newOrder.id;
        results.order_created = true;
      }
    }

    // Create Client if needed
    const existingClients = await base44.asServiceRole.entities.Client.filter(
      { email: lead.email },
      '-created_date',
      1
    ).catch(() => []);

    let clientId = null;
    if (!existingClients?.length) {
      const newClient = await base44.asServiceRole.entities.Client.create({
        full_name: lead.contact_name,
        business_name: lead.business_name,
        email: lead.email,
        phone: lead.phone,
        website: lead.company_website,
        industry: lead.industry,
        status: 'Onboarding',
      }).catch(() => null);

      if (newClient) {
        clientId = newClient.id;
        results.client_created = true;
      }
    } else {
      clientId = existingClients[0].id;
    }

    // Update lead status
    await base44.asServiceRole.entities.OutboundLead.update(lead.id, {
      outreach_status: 'converted',
      conversion_at: new Date().toISOString(),
      converted_order_id: finalOrderId,
      converted_client_id: clientId,
    }).catch(() => {});

    // Log conversion activity
    await base44.asServiceRole.entities.OutboundActivity.create({
      outbound_lead_id: lead.id,
      activity_type: 'conversion_event',
      occurred_at: new Date().toISOString(),
    }).catch(() => {});

    results.converted = true;

    console.log(`[convertOutboundLead] Lead converted:`, {
      lead_id: lead.id,
      order_id: finalOrderId,
      client_id: clientId,
    });

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('[convertOutboundLead] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
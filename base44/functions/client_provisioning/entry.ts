import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Client Provisioning Processor: Handles client + project initialization
 * Part of orchestration pipeline (stage 2)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      workflow_id,
      resource_type,
      resource_id,
      client_id,
      client_project_id,
    } = await req.json();

    const results = {
      success: false,
      provisioned: false,
      client_updated: false,
    };

    // Get order/resource details
    if (resource_type === 'order') {
      const order = await base44.asServiceRole.entities.Order.get(resource_id);
      if (!order) {
        return Response.json({ error: 'Order not found' }, { status: 404 });
      }

      // Ensure Client exists
      if (!client_id) {
        const newClient = await base44.asServiceRole.entities.Client.create({
          full_name: order.customer_name,
          business_name: order.business_name,
          email: order.customer_email,
          phone: order.customer_phone,
          status: 'Onboarding',
        });

        results.client_updated = true;
        console.log(`[client_provisioning] Client created:`, newClient.id);
      } else {
        results.client_updated = true;
        console.log(`[client_provisioning] Client already exists:`, client_id);
      }

      results.provisioned = true;
    }

    results.success = true;

    return Response.json(results);
  } catch (error) {
    console.error('[client_provisioning] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
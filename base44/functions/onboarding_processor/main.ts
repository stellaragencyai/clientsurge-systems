import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Onboarding Processor: Initializes onboarding workflows
 * Part of orchestration pipeline (stage 3)
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
      onboarding_initialized: false,
      client_project_created: false,
    };

    // Initialize ClientProject if needed
    if (resource_type === 'order' && client_id) {
      // Check if ClientProject exists
      const existingProjects = await base44.asServiceRole.entities.ClientProject.filter(
        { client_id, plan: 'Starter System' },
        '-created_date',
        1
      ).catch(() => []);

      if (!existingProjects?.length) {
        const order = await base44.asServiceRole.entities.Order.get(resource_id);
        const newProject = await base44.asServiceRole.entities.ClientProject.create({
          client_id,
          client_email: order.customer_email,
          client_name: order.customer_name,
          business_name: order.business_name,
          plan: 'Starter System',
          client_project_status: 'Payment Received',
        });

        results.client_project_created = true;
        console.log(`[onboarding_processor] ClientProject created:`, newProject.id);
      }

      results.onboarding_initialized = true;
    }

    results.success = true;

    return Response.json(results);
  } catch (error) {
    console.error('[onboarding_processor] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
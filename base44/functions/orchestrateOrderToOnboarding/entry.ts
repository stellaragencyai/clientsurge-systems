import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * SaaS Workflow Orchestration: Order → Client → ClientProject → Subscription → ClientInstallationOS
 * Triggered when a new Order is created with payment_status = 'paid'
 * Initializes complete onboarding workflow automatically
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Skip if payment not completed
    if (order.payment_status !== 'paid') {
      return Response.json({
        success: true,
        skipped: true,
        reason: 'Order payment not yet completed',
        payment_status: order.payment_status,
      });
    }

    // Skip if already orchestrated (idempotency)
    if (order.client_id && order.client_project_id) {
      return Response.json({
        success: true,
        skipped: true,
        reason: 'Order already orchestrated',
        client_id: order.client_id,
        client_project_id: order.client_project_id,
      });
    }

    const results = {};

    // STEP 1: Create Client if missing
    if (!order.client_id) {
      const client = await base44.asServiceRole.entities.Client.create({
        full_name: order.customer_name,
        business_name: order.business_name,
        email: order.customer_email,
        phone: order.customer_phone,
        industry: 'Services',
        status: 'In Setup',
        lifecycle_stage: 'setup_in_progress',
        onboarding_started_at: new Date().toISOString(),
        notes: `[ORCHESTRATION] Auto-created from Order ${order.id}`,
      });
      results.client_id = client.id;

      // Link Order to Client
      await base44.asServiceRole.entities.Order.update(order.id, {
        client_id: client.id,
      });

      console.log(`[orchestrateOrderToOnboarding] Created Client ${client.id}`);
    } else {
      results.client_id = order.client_id;
    }

    const clientId = results.client_id || order.client_id;

    // STEP 2: Create ClientProject if missing
    if (!order.client_project_id) {
      const clientProject = await base44.asServiceRole.entities.ClientProject.create({
        client_id: clientId,
        client_email: order.customer_email,
        contact_email: order.customer_email,
        client_name: order.customer_name,
        business_name: order.business_name,
        plan: order.selected_package_type || 'Starter System',
        client_project_status: 'Onboarding Pending',
        step_onboarding: 'in_progress',
      });
      results.client_project_id = clientProject.id;

      // Link Order to ClientProject
      await base44.asServiceRole.entities.Order.update(order.id, {
        client_project_id: clientProject.id,
      });

      console.log(`[orchestrateOrderToOnboarding] Created ClientProject ${clientProject.id}`);
    } else {
      results.client_project_id = order.client_project_id;
    }

    const clientProjectId = results.client_project_id || order.client_project_id;

    // STEP 3: Create Subscription if needed
    if (!order.subscription_id && order.total_monthly > 0) {
      const subscription = await base44.asServiceRole.entities.Subscription.create({
        client_id: clientId,
        order_id: order.id,
        stripe_customer_id: order.stripe_customer_id,
        stripe_subscription_id: order.stripe_subscription_id,
        plan_type: order.selected_package_type || 'starter_system',
        status: 'active',
        current_period_start: order.current_period_start || new Date().toISOString(),
        current_period_end: order.current_period_end,
        services_included: order.pricing_summary?.selected_service_keys || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      results.subscription_id = subscription.id;

      // Link Order to Subscription
      await base44.asServiceRole.entities.Order.update(order.id, {
        subscription_id: subscription.id,
      });

      console.log(`[orchestrateOrderToOnboarding] Created Subscription ${subscription.id}`);
    } else {
      results.subscription_id = order.subscription_id;
    }

    // STEP 4: Delegate to initializeInstallOS for canonical Pro activation foundation
    // FIX 1A.4-1: Previously created ClientInstallationOS without checklists/steps/session.
    // Now delegates to initializeInstallOS which is idempotent and seeds:
    //   - ClientInstallationOS
    //   - Six canonical Pro AutomationChecklist records
    //   - Six standard AutomationChecklistStep records per checklist
    //   - ActivationWizardSession
    try {
      const installResult = await base44.asServiceRole.functions.invoke("initializeInstallOS", {
        order_id: order.id,
      });
      results.installation_os_id = installResult?.install_os_id || null;
      console.log(`[orchestrateOrderToOnboarding] initializeInstallOS completed for order ${order.id}`);
    } catch (installError) {
      console.error(`[orchestrateOrderToOnboarding] initializeInstallOS failed: ${installError.message}`);
      results.install_error = installError.message;
    }

    // STEP 5: Update Order install status
    await base44.asServiceRole.entities.Order.update(order.id, {
      order_status: 'paid_setup_in_progress',
      pipeline_status: 'Ready for Install',
      install_initialized_at: new Date().toISOString(),
    });

    console.log(`[orchestrateOrderToOnboarding] Orchestration complete for order ${order_id}:`, results);

    return Response.json({
      success: true,
      order_id,
      ...results,
      workflow_stage: 'setup_initiated',
    });
  } catch (error) {
    console.error('[orchestrateOrderToOnboarding] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Onboarding Orchestration Synchronization
 * Syncs Order → ClientInstallationOS → OnboardingClient → AutomationChecklist
 * Ensures unified onboarding_stage across all entities
 * 
 * Triggered by: Order payments, checklist updates, installation status changes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { order_id, client_id } = await req.json();
    if (!order_id && !client_id) {
      return Response.json({ error: 'Provide order_id or client_id' }, { status: 400 });
    }

    // Step 1: Fetch source entities
    let order, installationOS, onboardingClient, automationChecklist;

    if (order_id) {
      order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    } else {
      const orders = await base44.asServiceRole.entities.Order.filter({ client_id }, '-created_date', 1);
      order = orders[0];
      if (!order) return Response.json({ error: 'No orders found for client' }, { status: 404 });
    }

    const cid = order.client_id;
    const cPid = order.client_project_id;

    // Fetch related entities in parallel
    const [instOS, onbClient, autoCList, currentOrch] = await Promise.all([
      base44.asServiceRole.entities.ClientInstallationOS?.filter({ order_id: order.id }, '-created_date', 1)
        .then(r => r[0])
        .catch(() => null),
      base44.asServiceRole.entities.OnboardingClient?.filter({ order_id: order.id }, '-created_date', 1)
        .then(r => r[0])
        .catch(() => null),
      base44.asServiceRole.entities.AutomationChecklist?.filter({ order_id: order.id }, '-created_date', 1)
        .then(r => r[0])
        .catch(() => null),
      base44.asServiceRole.entities.OnboardingOrchestration?.filter({ order_id: order.id }, '-created_date', 1)
        .then(r => r[0])
        .catch(() => null),
    ]);

    installationOS = instOS;
    onboardingClient = onbClient;
    automationChecklist = autoCList;

    // Step 2: Determine unified stage from Order
    let unified_stage = 'intake_received';
    const orderStatus = order.order_status || order.payment_status;

    if (orderStatus === 'fully_live') {
      unified_stage = 'live';
    } else if (orderStatus === 'partially_live') {
      unified_stage = 'testing';
    } else if (orderStatus === 'paid_setup_in_progress') {
      unified_stage = 'setup_in_progress';
    } else if (orderStatus === 'paid') {
      unified_stage = 'setup_in_progress';
    }

    // Override with installation OS if more advanced
    if (installationOS?.pipeline_status === 'Live') {
      unified_stage = 'live';
    } else if (installationOS?.pipeline_status === 'Testing') {
      unified_stage = 'testing';
    } else if (installationOS?.pipeline_status === 'Configuring') {
      unified_stage = 'setup_in_progress';
    } else if (installationOS?.pipeline_status === 'Error') {
      unified_stage = 'blocked';
    }

    // Step 3: Calculate checklist completion
    let completion_percentage = 0;
    let completed_steps = 0;
    let total_steps = 0;

    if (automationChecklist) {
      const stepsCompleted = automationChecklist.steps_completed || [];
      total_steps = automationChecklist.required_tasks?.length || 0;
      completed_steps = stepsCompleted.length;
      completion_percentage = total_steps > 0 ? Math.round((completed_steps / total_steps) * 100) : 0;
    }

    // Step 4: Identify blockers
    const blockers = [];
    const missing_setup_items = [];

    if (installationOS?.pipeline_error) {
      blockers.push({
        blocker_id: `inst_error_${Date.now()}`,
        entity_type: 'ClientInstallationOS',
        description: installationOS.pipeline_error,
        severity: 'critical',
        identified_at: new Date().toISOString(),
      });
      unified_stage = 'blocked';
    }

    // Check for missing credentials
    if (!order.items?.[0]?.service_key && onboardingClient?.status !== 'Live') {
      missing_setup_items.push('service_configuration');
    }
    if (!onboardingClient?.twilio_number && !order.installation_configuration?.shared?.twilio_business_phone) {
      missing_setup_items.push('phone_number');
    }
    if (!onboardingClient?.booking_link && !order.installation_configuration?.services?.ai_booking_agent?.booking_link) {
      missing_setup_items.push('booking_link');
    }

    // Step 5: Create or update OrchestrationRecord
    const orchestration = {
      order_id: order.id,
      client_id: cid,
      client_project_id: cPid,
      onboarding_client_id: onboardingClient?.id,
      installation_os_id: installationOS?.id,
      automation_checklist_id: automationChecklist?.id,
      business_name: order.business_name || onboardingClient?.business_name || 'Unknown',
      client_email: order.customer_email || onboardingClient?.email || '',
      unified_stage,
      order_status: orderStatus,
      installation_status: installationOS?.pipeline_status || 'Paid',
      checklist_status: automationChecklist?.status || 'not_started',
      completion_metrics: {
        total_checklist_steps: total_steps,
        completed_steps,
        completion_percentage,
        last_updated_at: new Date().toISOString(),
      },
      blockers,
      missing_setup_items,
      ready_to_go_live: completion_percentage === 100 && blockers.length === 0,
      last_sync_at: new Date().toISOString(),
    };

    let result;
    if (currentOrch?.id) {
      // Update existing orchestration record
      result = await base44.asServiceRole.entities.OnboardingOrchestration.update(currentOrch.id, orchestration);
    } else {
      // Create new orchestration record
      result = await base44.asServiceRole.entities.OnboardingOrchestration.create(orchestration);
    }

    // Step 6: Propagate unified_stage back to related entities (idempotent)
    const updatePromises = [];

    if (installationOS && !installationOS.onboarding_unified_stage) {
      updatePromises.push(
        base44.asServiceRole.entities.ClientInstallationOS.update(installationOS.id, {
          onboarding_unified_stage: unified_stage,
        }).catch(e => console.error('Failed to update ClientInstallationOS:', e))
      );
    }

    if (onboardingClient && onboardingClient.onboarding_stage !== unified_stage) {
      updatePromises.push(
        base44.asServiceRole.entities.OnboardingClient.update(onboardingClient.id, {
          onboarding_stage: unified_stage,
        }).catch(e => console.error('Failed to update OnboardingClient:', e))
      );
    }

    if (automationChecklist && !automationChecklist.onboarding_unified_stage) {
      updatePromises.push(
        base44.asServiceRole.entities.AutomationChecklist.update(automationChecklist.id, {
          onboarding_unified_stage: unified_stage,
        }).catch(e => console.error('Failed to update AutomationChecklist:', e))
      );
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    return Response.json({
      success: true,
      orchestration: result?.data || orchestration,
      synchronized_entities: {
        order: order.id,
        installation_os: installationOS?.id,
        onboarding_client: onboardingClient?.id,
        automation_checklist: automationChecklist?.id,
      },
    });
  } catch (error) {
    console.error('[syncOnboardingOrchestration]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
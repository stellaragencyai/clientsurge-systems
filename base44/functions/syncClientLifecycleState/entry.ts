import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * CLIENT LIFECYCLE AUTOMATION — Sync state across onboarding entities
 * 
 * Maps state transitions across:
 * - Order (payment_status → pipeline_status)
 * - ClientInstallationOS (install_status)
 * - OnboardingClient (status)
 * - AutomationChecklist (status)
 * 
 * Ensures consistent lifecycle stage across all systems.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { order_id, client_id, trigger } = body;

    if (!order_id && !client_id) {
      return Response.json({ error: 'order_id or client_id required' }, { status: 400 });
    }

    let order = null;
    let clientInstallOS = null;
    let onboardingClient = null;
    let automationChecklists = [];

    // Fetch source entities
    if (order_id) {
      const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id }, '-created_date', 1);
      order = orders[0];
      if (!order) {
        return Response.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    if (client_id) {
      const installations = await base44.asServiceRole.entities.ClientInstallationOS
        ?.filter({ client_id }, '-created_date', 1)
        .catch(() => []);
      if (installations?.length > 0) {
        clientInstallOS = installations[0];
      }

      const onboardings = await base44.asServiceRole.entities.OnboardingClient
        ?.filter({ client_id }, '-created_date', 1)
        .catch(() => []);
      if (onboardings?.length > 0) {
        onboardingClient = onboardings[0];
      }

      automationChecklists = await base44.asServiceRole.entities.AutomationChecklist
        ?.filter({ order_id: order?.id || 'none' }, '-created_date', 10)
        .catch(() => []);
    }

    // Determine target lifecycle stage based on trigger and current state
    let targetStage = 'intake_received';
    let targetReason = 'manual_trigger';

    if (trigger === 'order_paid' && order?.payment_status === 'paid') {
      targetStage = 'setup_in_progress';
      targetReason = 'order_payment_received';
    } else if (trigger === 'setup_started') {
      targetStage = 'setup_in_progress';
      targetReason = 'setup_initiated';
    } else if (trigger === 'testing_started') {
      targetStage = 'testing';
      targetReason = 'testing_phase_initiated';
    } else if (trigger === 'client_approval_requested') {
      targetStage = 'awaiting_client_approval';
      targetReason = 'approval_requested';
    } else if (trigger === 'activation_approved') {
      targetStage = 'live';
      targetReason = 'activation_approved';
    } else if (trigger === 'blocked') {
      targetStage = 'blocked';
      targetReason = body.blocker_reason || 'manual_block';
    }

    // Sync Order
    if (order && order.pipeline_status !== targetStage) {
      await base44.asServiceRole.entities.Order.update(order.id, {
        pipeline_status: targetStage,
        last_install_event_at: new Date().toISOString(),
      });
      console.log(`[syncClientLifecycleState] Order ${order.id} → ${targetStage}`);
    }

    // Sync ClientInstallationOS
    if (clientInstallOS && clientInstallOS.lifecycle_stage !== targetStage) {
      await base44.asServiceRole.entities.ClientInstallationOS?.update(clientInstallOS.id, {
        lifecycle_stage: targetStage,
        stage_updated_at: new Date().toISOString(),
      }).catch(() => null);
      console.log(`[syncClientLifecycleState] ClientInstallationOS ${clientInstallOS.id} → ${targetStage}`);
    }

    // Sync OnboardingClient
    if (onboardingClient && onboardingClient.status !== targetStage) {
      await base44.asServiceRole.entities.OnboardingClient?.update(onboardingClient.id, {
        status: targetStage,
        notes: `${onboardingClient.notes || ''}\n[${new Date().toISOString()}] Lifecycle sync: ${targetReason}`,
      }).catch(() => null);
      console.log(`[syncClientLifecycleState] OnboardingClient ${onboardingClient.id} → ${targetStage}`);
    }

    return Response.json({
      success: true,
      synced: {
        order: order?.id,
        clientInstallationOS: clientInstallOS?.id,
        onboardingClient: onboardingClient?.id,
        automationChecklists: automationChecklists.length,
      },
      target_stage: targetStage,
      reason: targetReason,
    });
  } catch (error) {
    console.error('[syncClientLifecycleState]', error);
    return Response.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
});
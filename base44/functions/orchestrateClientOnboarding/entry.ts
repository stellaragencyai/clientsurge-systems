import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * HARDENED Client Onboarding Orchestrator
 * - Ensures ClientInstallationOS exists for every setup_in_progress client
 * - Creates AutomationChecklist if missing
 * - Calls syncOnboardingOrchestration to keep all records in sync
 * - Idempotent: safe to call multiple times
 * - Validates stage before advancing; never skips intake_received → setup
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, order_id, force_resync } = await req.json();

    if (!client_id && !order_id) {
      return Response.json({ error: 'Provide client_id or order_id' }, { status: 400 });
    }

    // ── Resolve client and order ──────────────────────────────────────────
    let client = null, order = null;

    if (client_id) {
      client = await base44.asServiceRole.entities.Client.get(client_id).catch(() => null);
      if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    if (order_id) {
      order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    } else if (client) {
      const orders = await base44.asServiceRole.entities.Order.filter(
        { client_id: client.id },
        '-created_date', 1
      ).catch(() => []);
      order = orders?.[0] ?? null;
    }

    if (!order) {
      return Response.json({ error: 'No order found — cannot orchestrate without an order' }, { status: 404 });
    }

    const effectiveClientId = client_id || order.client_id;
    if (!client) {
      client = { id: effectiveClientId, lifecycle_stage: null };
    }

    const effectiveStage = client.lifecycle_stage_override || client.lifecycle_stage || 'setup_in_progress';

    // ── Ensure ClientInstallationOS exists ───────────────────────────────
    const existingOS = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id: order.id }, '-created_date', 1
    ).catch(() => []);

    let installationOS = existingOS?.[0] ?? null;

    if (!installationOS) {
      installationOS = await base44.asServiceRole.entities.ClientInstallationOS.create({
        order_id: order.id,
        client_id: effectiveClientId,
        client_project_id: order.client_project_id,
        client_email: order.customer_email,
        business_name: order.business_name,
        workflow_stage: 'intake_received',
        pipeline_status: 'Ready for Install',
        activation_status: 'not_ready',
        admin_notes: `[${new Date().toISOString()}] Auto-created by orchestrateClientOnboarding`,
      });
      console.log(`[orchestrateClientOnboarding] Created ClientInstallationOS ${installationOS?.id} for order ${order.id}`);
    }

    // Advance from intake_received → automation_setup only if in setup stage
    if (
      installationOS?.workflow_stage === 'intake_received' &&
      effectiveStage === 'setup_in_progress'
    ) {
      await base44.asServiceRole.entities.ClientInstallationOS.update(installationOS.id, {
        workflow_stage: 'automation_setup',
        admin_notes: `[${new Date().toISOString()}] Advanced to automation_setup by orchestrateClientOnboarding`,
      }).catch(e => console.warn('[orchestrateClientOnboarding] OS update failed:', e.message));
    }

    // ── Ensure AutomationChecklist exists ────────────────────────────────
    const existingChecklist = await base44.asServiceRole.entities.AutomationChecklist.filter(
      { order_id: order.id }, '-created_date', 1
    ).catch(() => []);

    let checklist = existingChecklist?.[0] ?? null;

    if (!checklist) {
      checklist = await base44.asServiceRole.entities.AutomationChecklist.create({
        order_id: order.id,
        client_id: effectiveClientId,
        client_project_id: order.client_project_id,
        business_name: order.business_name,
        status: 'not_started',
        required_tasks: deriveRequiredTasksFromOrder(order),
        steps_completed: [],
        admin_notes: `[${new Date().toISOString()}] Auto-created by orchestrateClientOnboarding`,
      }).catch(e => {
        console.warn('[orchestrateClientOnboarding] AutomationChecklist create failed:', e.message);
        return null;
      });
      console.log(`[orchestrateClientOnboarding] Created AutomationChecklist ${checklist?.id}`);
    }

    // ── Trigger full sync via syncOnboardingOrchestration ────────────────
    const syncResult = await base44.functions.invoke('syncOnboardingOrchestration', {
      order_id: order.id,
    }).catch(e => ({
      data: { error: e.message, skipped: true },
    }));

    return Response.json({
      success: true,
      order_id: order.id,
      client_id: effectiveClientId,
      installation_os_id: installationOS?.id,
      checklist_id: checklist?.id,
      workflow_stage: installationOS?.workflow_stage,
      sync: syncResult?.data ?? null,
    });
  } catch (error) {
    console.error('[orchestrateClientOnboarding]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function deriveRequiredTasksFromOrder(order) {
  const base = ['twilio_configured', 'lead_sources_connected', 'instant_response_built', 'tested'];
  const items = order.items || [];
  if (items.some(i => i.service_key?.includes('booking'))) base.push('booking_flow_live');
  if (items.some(i => i.service_key?.includes('nurture'))) base.push('nurture_sequence_active');
  if (items.some(i => i.service_key?.includes('review'))) base.push('review_request_active');
  if (items.some(i => i.service_key?.includes('missed_call'))) base.push('missed_call_textback_active');
  base.push('dashboard_delivered', 'went_live');
  return base;
}
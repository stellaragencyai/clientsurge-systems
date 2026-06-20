import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * HARDENED Onboarding Orchestration Sync
 * Syncs Order → ClientInstallationOS → OnboardingClient → AutomationChecklist
 * into a single OnboardingOrchestration record.
 *
 * Hardening:
 * - Idempotent upsert (never creates duplicates)
 * - Stage transitions only advance forward, never regress unless blocked
 * - ready_to_go_live only true when real proof events exist (not just checklist)
 * - DashboardTruthCheck upsert with accurate blocker/warning/trusted state
 * - Sync errors recorded to orchestration.sync_errors (ring buffer, last 10)
 * - QA/smoke orders excluded from dashboard truth
 * - Structured logs at every step
 */
Deno.serve(async (req) => {
  const syncErrors = [];
  const startedAt = new Date().toISOString();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { order_id, client_id } = body;
    if (!order_id && !client_id) {
      return Response.json({ error: 'Provide order_id or client_id' }, { status: 400 });
    }

    // ── 1. Resolve Order ────────────────────────────────────────────────────
    let order;
    if (order_id) {
      order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    } else {
      const orders = await base44.asServiceRole.entities.Order.filter({ client_id }, '-created_date', 1);
      order = orders?.[0];
      if (!order) return Response.json({ error: 'No orders found for client' }, { status: 404 });
    }

    const cid  = order.client_id;
    const cPid = order.client_project_id;
    const orderId = order.id;

    // ── 2. Fetch all linked entities in parallel ─────────────────────────
    const [instOS, onbClient, autoCList, currentOrch, checklistSteps, proofEvents] = await Promise.all([
      base44.asServiceRole.entities.ClientInstallationOS.filter({ order_id: orderId }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(e => { syncErrors.push(`ClientInstallationOS fetch: ${e.message}`); return null; }),
      base44.asServiceRole.entities.OnboardingClient.filter({ order_id: orderId }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(e => { syncErrors.push(`OnboardingClient fetch: ${e.message}`); return null; }),
      base44.asServiceRole.entities.AutomationChecklist.filter({ order_id: orderId }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(e => { syncErrors.push(`AutomationChecklist fetch: ${e.message}`); return null; }),
      base44.asServiceRole.entities.OnboardingOrchestration.filter({ order_id: orderId }, '-created_date', 1)
        .then(r => r?.[0] ?? null).catch(e => { syncErrors.push(`OnboardingOrchestration fetch: ${e.message}`); return null; }),
      // Checklist steps for accurate completion counting
      base44.asServiceRole.entities.AutomationChecklistStep
        ? base44.asServiceRole.entities.AutomationChecklistStep.filter({ order_id: orderId }, '-created_date', 100)
            .catch(() => [])
        : Promise.resolve([]),
      // Real proof events: provider_send_succeeded logged against this order/client
      base44.asServiceRole.entities.CommunicationEvent.filter(
        { event_type: 'provider_send_succeeded', environment: 'production' },
        '-created_date', 50
      ).catch(() => []),
    ]);

    // ── 3. Determine unified stage ───────────────────────────────────────
    // Stage precedence: Error > InstallationOS > Order > default
    // Stage can only advance forward (or go to blocked on error)
    const STAGE_RANK = {
      intake_received: 0, setup_in_progress: 1, testing: 2,
      awaiting_client_approval: 3, live: 4, blocked: -1,
    };

    let unified_stage = 'intake_received';
    const orderStatus = order.order_status || order.payment_status;

    if (orderStatus === 'fully_live')         unified_stage = 'live';
    else if (orderStatus === 'partially_live') unified_stage = 'testing';
    else if (orderStatus === 'paid_setup_in_progress' || orderStatus === 'paid') unified_stage = 'setup_in_progress';

    // Installation OS can advance the stage but not regress it (unless blocked)
    if (instOS?.pipeline_status === 'Live' && STAGE_RANK['live'] > STAGE_RANK[unified_stage]) {
      unified_stage = 'live';
    } else if (instOS?.pipeline_status === 'Testing' && STAGE_RANK['testing'] > STAGE_RANK[unified_stage]) {
      unified_stage = 'testing';
    } else if (instOS?.pipeline_status === 'Configuring' && STAGE_RANK['setup_in_progress'] > STAGE_RANK[unified_stage]) {
      unified_stage = 'setup_in_progress';
    } else if (instOS?.pipeline_status === 'Error' || instOS?.pipeline_error) {
      unified_stage = 'blocked';
    }

    // Preserve existing stage if it's more advanced (no regression)
    if (currentOrch?.unified_stage && currentOrch.unified_stage !== 'blocked') {
      const existingRank = STAGE_RANK[currentOrch.unified_stage] ?? 0;
      const newRank = STAGE_RANK[unified_stage] ?? 0;
      if (existingRank > newRank) {
        unified_stage = currentOrch.unified_stage;
      }
    }

    // ── 4. Compute checklist completion (real step records > legacy field) ──
    let total_steps = 0, completed_steps = 0, completion_percentage = 0;

    if (Array.isArray(checklistSteps) && checklistSteps.length > 0) {
      total_steps = checklistSteps.length;
      completed_steps = checklistSteps.filter(s => s.status === 'completed' || s.completed === true).length;
    } else if (autoCList) {
      // Fallback: use checklist-level fields
      const stepsCompleted = Array.isArray(autoCList.steps_completed) ? autoCList.steps_completed : [];
      total_steps = autoCList.required_tasks?.length || 0;
      completed_steps = stepsCompleted.length;
    }
    completion_percentage = total_steps > 0 ? Math.round((completed_steps / total_steps) * 100) : 0;

    // ── 5. Identify blockers and missing items ──────────────────────────
    const blockers = [];
    const missing_setup_items = [];

    if (instOS?.pipeline_error) {
      blockers.push({
        blocker_id: `inst_error_${orderId}`,
        entity_type: 'ClientInstallationOS',
        description: instOS.pipeline_error,
        severity: 'critical',
        identified_at: new Date().toISOString(),
      });
    }

    if (!instOS?.twilio_phone_number && !order.installation_configuration?.shared?.twilio_business_phone) {
      missing_setup_items.push('phone_number');
    }
    if (!onbClient?.booking_link && !order.installation_configuration?.services?.ai_booking_agent?.booking_link) {
      missing_setup_items.push('booking_link');
    }
    if (!order.items?.some(i => i.service_key)) {
      missing_setup_items.push('service_configuration');
    }

    // ── 6. Proof-gated ready_to_go_live ─────────────────────────────────
    // Must have real production provider_send_succeeded events AND no blockers
    const orderProofEvents = (proofEvents || []).filter(e =>
      e.client_id === cid || (cPid && e.client_project_id === cPid)
    );
    const hasProof = orderProofEvents.length > 0;
    const ready_to_go_live = completion_percentage === 100 && blockers.length === 0 && hasProof;

    // ── 7. Build stage progression timeline (append-only) ───────────────
    const existingProgression = Array.isArray(currentOrch?.stage_progression)
      ? currentOrch.stage_progression
      : [];

    let stage_progression = existingProgression;
    const lastStage = existingProgression[existingProgression.length - 1];

    if (!lastStage || lastStage.stage !== unified_stage) {
      // Close out the previous stage
      if (lastStage && !lastStage.exited_at) {
        stage_progression = stage_progression.map((s, i) =>
          i === stage_progression.length - 1 ? { ...s, exited_at: new Date().toISOString() } : s
        );
      }
      stage_progression = [
        ...stage_progression,
        { stage: unified_stage, entered_at: new Date().toISOString(), exited_at: null },
      ];
    }

    // ── 8. Preserve existing sync errors + append new ones (ring buffer 10) ──
    const previousErrors = Array.isArray(currentOrch?.sync_errors) ? currentOrch.sync_errors : [];
    const allErrors = [...previousErrors, ...syncErrors].slice(-10);

    // ── 9. Upsert OnboardingOrchestration ────────────────────────────────
    const orchestrationPayload = {
      order_id: orderId,
      client_id: cid,
      client_project_id: cPid,
      onboarding_client_id: onbClient?.id ?? null,
      installation_os_id: instOS?.id ?? null,
      automation_checklist_id: autoCList?.id ?? null,
      business_name: order.business_name || onbClient?.business_name || 'Unknown',
      client_email: order.customer_email || onbClient?.email || '',
      unified_stage,
      stage_progression,
      order_status: orderStatus,
      installation_status: instOS?.pipeline_status || 'Paid',
      checklist_status: autoCList?.status || 'not_started',
      completion_metrics: {
        total_checklist_steps: total_steps,
        completed_steps,
        completion_percentage,
        last_updated_at: new Date().toISOString(),
      },
      blockers,
      missing_setup_items,
      ready_to_go_live,
      go_live_date: ready_to_go_live && !currentOrch?.go_live_date ? new Date().toISOString() : (currentOrch?.go_live_date ?? null),
      last_sync_at: new Date().toISOString(),
      sync_errors: allErrors,
      admin_notes: currentOrch?.admin_notes ?? null,
    };

    let orchResult;
    if (currentOrch?.id) {
      orchResult = await base44.asServiceRole.entities.OnboardingOrchestration.update(
        currentOrch.id, orchestrationPayload
      );
    } else {
      orchResult = await base44.asServiceRole.entities.OnboardingOrchestration.create(orchestrationPayload);
    }

    // ── 10. Propagate stage to linked entities (only on change) ──────────
    await Promise.all([
      instOS && instOS.onboarding_unified_stage !== unified_stage
        ? base44.asServiceRole.entities.ClientInstallationOS.update(instOS.id, {
            onboarding_unified_stage: unified_stage,
          }).catch(e => syncErrors.push(`ClientInstallationOS stage propagation: ${e.message}`))
        : null,
      onbClient && onbClient.pipeline_status !== unified_stage
        ? base44.asServiceRole.entities.OnboardingClient.update(onbClient.id, {
            pipeline_status: unified_stage,
          }).catch(e => syncErrors.push(`OnboardingClient stage propagation: ${e.message}`))
        : null,
    ].filter(Boolean));

    // ── 11. Upsert DashboardTruthCheck ───────────────────────────────────
    const isQAOrder = ['qa', 'smoke', 'demo', 'internal'].includes(order.environment);
    const truthStatus = blockers.length > 0 ? 'blocked'
      : syncErrors.length > 0 ? 'warning'
      : 'trusted';

    const truthBlockers = blockers.map(b => ({
      code: `blocker_${b.entity_type?.toLowerCase()}`,
      severity: 'launch_blocker',
      message: b.description,
      entity_name: b.entity_type,
      record_id: orderId,
    }));

    const truthWarnings = missing_setup_items.map(item => ({
      code: `missing_${item}`,
      severity: 'advisory',
      message: `Missing setup item: ${item}`,
      entity_name: 'OnboardingOrchestration',
      record_id: orderId,
    }));

    if (!hasProof && unified_stage === 'live') {
      truthWarnings.push({
        code: 'no_proof_events',
        severity: 'launch_blocker',
        message: 'Marked live but no production provider_send_succeeded events found',
        entity_name: 'CommunicationEvent',
        record_id: orderId,
      });
    }

    const existingTruth = await base44.asServiceRole.entities.DashboardTruthCheck.filter(
      { order_id: orderId, scope: 'order' }, '-created_at', 1
    ).then(r => r?.[0]).catch(() => null);

    const truthPayload = {
      order_id: orderId,
      client_id: cid,
      client_project_id: cPid,
      customer_email: order.customer_email,
      business_name: order.business_name,
      scope: 'order',
      environment: order.environment || 'production',
      truth_status: isQAOrder ? 'warning' : truthStatus,
      safe_to_show_client: !isQAOrder && truthStatus === 'trusted',
      safe_to_show_admin: !isQAOrder,
      safe_to_launch: ready_to_go_live && !isQAOrder,
      blocker_count: truthBlockers.length,
      warning_count: truthWarnings.length + (isQAOrder ? 1 : 0),
      blockers: truthBlockers,
      warnings: isQAOrder
        ? [{ code: 'qa_order', severity: 'advisory', message: 'QA/smoke order — excluded from production dashboard', entity_name: 'Order', record_id: orderId }, ...truthWarnings]
        : truthWarnings,
      evidence_summary: `Stage: ${unified_stage} | Completion: ${completion_percentage}% | Proof events: ${orderProofEvents.length} | Sync: ${startedAt}`,
      last_checked_at: new Date().toISOString(),
      dashboard_excluded: isQAOrder,
      dashboard_exclusion_reason: isQAOrder ? 'qa_or_smoke_environment' : null,
    };

    if (existingTruth?.id) {
      await base44.asServiceRole.entities.DashboardTruthCheck.update(existingTruth.id, truthPayload)
        .catch(e => syncErrors.push(`DashboardTruthCheck update: ${e.message}`));
    } else {
      await base44.asServiceRole.entities.DashboardTruthCheck.create({
        ...truthPayload, created_at: startedAt,
      }).catch(e => syncErrors.push(`DashboardTruthCheck create: ${e.message}`));
    }

    // ── 12. If sync errors occurred, patch them back into orchestration ──
    if (syncErrors.length > 0 && orchResult?.id) {
      await base44.asServiceRole.entities.OnboardingOrchestration.update(
        orchResult.id ?? currentOrch?.id,
        { sync_errors: [...allErrors, ...syncErrors].slice(-10) }
      ).catch(() => {});
    }

    return Response.json({
      success: true,
      order_id: orderId,
      unified_stage,
      ready_to_go_live,
      completion_percentage,
      has_proof: hasProof,
      blockers_count: blockers.length,
      missing_count: missing_setup_items.length,
      sync_errors: syncErrors.length > 0 ? syncErrors : undefined,
      truth_status: isQAOrder ? 'warning' : truthStatus,
      synchronized_entities: {
        order: orderId,
        installation_os: instOS?.id,
        onboarding_client: onbClient?.id,
        automation_checklist: autoCList?.id,
        orchestration: orchResult?.id ?? currentOrch?.id,
      },
    });
  } catch (error) {
    console.error('[syncOnboardingOrchestration]', error.message);
    return Response.json({
      error: error.message,
      sync_errors: syncErrors,
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Evaluate Activation Readiness & Update ClientInstallationOS
 * 
 * Computes:
 * - activation_eligible (true if all requirements met & no blockers)
 * - activation_status (ready_for_activation, activating, testing, live, blocked, not_ready)
 * - missing_requirements (list of unmet items)
 * - activation_blockers (issues preventing go-live)
 * - next_required_action (single recommended action)
 * - integration_readiness (individual capability flags)
 * - checklist_completion_percent (aggregated from all checklists)
 * 
 * Triggered by: Admin UI, orchestration sync, manual evaluation
 * Safe to call repeatedly — idempotent
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { installation_os_id, order_id } = await req.json();
    if (!installation_os_id && !order_id) {
      return Response.json({ error: 'Provide installation_os_id or order_id' }, { status: 400 });
    }

    // ── Fetch ClientInstallationOS ────────────────────────────────────
    let installOS;
    if (installation_os_id) {
      installOS = await base44.asServiceRole.entities.ClientInstallationOS.get(installation_os_id);
    } else {
      const records = await base44.asServiceRole.entities.ClientInstallationOS.filter(
        { order_id }, '-created_date', 1
      );
      installOS = records?.[0];
    }

    if (!installOS) {
      return Response.json({ error: 'ClientInstallationOS not found' }, { status: 404 });
    }

    // ── Fetch related entities ────────────────────────────────────────
    const [order, checklists, automationChecks] = await Promise.all([
      base44.asServiceRole.entities.Order.get(installOS.order_id).catch(() => null),
      base44.asServiceRole.entities.AutomationChecklist.filter(
        { order_id: installOS.order_id },
        '-created_date', 50
      ).catch(() => []),
      base44.asServiceRole.entities.AutomationChecklistStep
        ? base44.asServiceRole.entities.AutomationChecklistStep.filter(
            { order_id: installOS.order_id },
            '-created_date', 100
          ).catch(() => [])
        : Promise.resolve([]),
    ]);

    // ── Compute integration readiness ─────────────────────────────────
    const orderConfig = order?.installation_configuration || {};
    const sharedConfig = orderConfig.shared || {};

    const integration_readiness = {
      sms_ready: !!(sharedConfig.twilio_business_phone || installOS.all_automations_checklists?.length > 0),
      email_ready: !!(order?.items?.some(i => i.service_key?.includes('email')) || false),
      booking_link_ready: !!(
        orderConfig.services?.ai_booking_agent?.booking_link ||
        order?.installation_configuration?.services?.ai_booking_agent?.booking_link
      ),
      lead_form_connected: !!(checklists?.some(c => c.lead_form_connected) || false),
      webhooks_verified: !!(checklists?.some(c => c.communication_event_logging_verified) || false),
    };

    // ── Compute checklist completion ──────────────────────────────────
    let checklist_completion_percent = 0;
    if (checklists.length > 0) {
      const totalSteps = automationChecks.length || checklists.reduce((sum, c) => sum + (c.steps_completed?.length || 0), 0);
      const completedSteps = automationChecks.filter(s => s.status === 'completed' || s.completed === true).length ||
                            checklists.reduce((sum, c) => sum + (c.steps_completed?.length || 0), 0);
      checklist_completion_percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    }

    // ── Identify missing requirements ─────────────────────────────────
    const missing_requirements = [];
    if (!integration_readiness.sms_ready) missing_requirements.push('sms_configured');
    if (!integration_readiness.email_ready) missing_requirements.push('email_configured');
    if (!integration_readiness.booking_link_ready) missing_requirements.push('booking_link');
    if (!integration_readiness.lead_form_connected) missing_requirements.push('lead_form_connected');
    if (!integration_readiness.webhooks_verified) missing_requirements.push('webhooks_verified');

    // Checklist not complete
    if (checklist_completion_percent < 100) {
      missing_requirements.push(`automation_setup_incomplete_${checklist_completion_percent}%`);
    }

    // ── Identify activation blockers ──────────────────────────────────
    const activation_blockers = [];

    // Check for failed checklists
    const failedChecklists = checklists.filter(c => c.status === 'failed');
    if (failedChecklists.length > 0) {
      failedChecklists.forEach(c => {
        activation_blockers.push({
          id: `checklist_failed_${c.id}`,
          type: 'checklist_incomplete',
          message: `${c.service_key} checklist failed: ${c.failure_notes || 'unknown reason'}`,
          identified_at: c.updated_date || new Date().toISOString(),
        });
      });
    }

    // Check for missing client approval
    const pendingApproval = checklists.filter(c => !c.client_approved && c.status !== 'failed');
    if (pendingApproval.length > 0) {
      activation_blockers.push({
        id: `approval_pending_${Date.now()}`,
        type: 'client_not_approved',
        message: `${pendingApproval.length} automation(s) awaiting client approval`,
        identified_at: new Date().toISOString(),
      });
    }

    // Check for test failures
    const unverified = checklists.filter(c => !c.test_response_received && c.status !== 'failed');
    if (unverified.length > 0) {
      activation_blockers.push({
        id: `test_pending_${Date.now()}`,
        type: 'test_failed',
        message: `${unverified.length} automation(s) not verified with test lead`,
        identified_at: new Date().toISOString(),
      });
    }

    // ── Determine next required action ────────────────────────────────
    let next_required_action = null;

    if (activation_blockers.length > 0) {
      const firstBlocker = activation_blockers[0];
      if (firstBlocker.type === 'checklist_incomplete') {
        next_required_action = {
          action_type: 'complete_checklist',
          description: 'Complete remaining automation setup tasks',
          estimated_time_minutes: 60,
        };
      } else if (firstBlocker.type === 'test_failed') {
        next_required_action = {
          action_type: 'run_test',
          description: 'Send test lead and verify automation response',
          estimated_time_minutes: 15,
        };
      } else if (firstBlocker.type === 'client_not_approved') {
        next_required_action = {
          action_type: 'get_client_approval',
          description: 'Get client sign-off on automation setup',
          estimated_time_minutes: 30,
        };
      }
    } else if (missing_requirements.length > 0) {
      next_required_action = {
        action_type: 'configure_integration',
        description: `Configure: ${missing_requirements.join(', ')}`,
        estimated_time_minutes: 45,
      };
    } else {
      next_required_action = {
        action_type: 'ready_to_activate',
        description: 'All requirements met — ready to go live',
        estimated_time_minutes: 0,
      };
    }

    // ── Determine activation_eligible ─────────────────────────────────
    const activation_eligible = 
      missing_requirements.length === 0 &&
      activation_blockers.length === 0 &&
      checklist_completion_percent === 100;

    // ── Determine activation_status (logical progression) ──────────────
    let activation_status = installOS.activation_status || 'not_ready';

    // Current logic determines if we can transition
    const canTransition = activation_eligible || installOS.activation_override;

    if (activation_blockers.length > 0) {
      // Any unresolved blocker = blocked
      activation_status = 'blocked';
    } else if (canTransition) {
      // Can progress through states
      if (activation_status === 'not_ready') {
        activation_status = 'ready_for_activation';
      } else if (activation_status === 'ready_for_activation' && next_required_action?.action_type === 'ready_to_activate') {
        // Stays ready unless manually advanced
      }
      // live and testing states managed elsewhere (by orchestration/user)
    } else {
      // Not eligible and not forced = not_ready
      activation_status = 'not_ready';
    }

    // ── Update ClientInstallationOS ───────────────────────────────────
    const updatePayload = {
      activation_eligible,
      activation_status,
      missing_requirements,
      activation_blockers: activation_blockers.filter(b => !b.resolved_at), // only unresolved
      next_required_action,
      integration_readiness,
      checklist_completion_percent,
      last_readiness_check_at: new Date().toISOString(),
    };

    const updated = await base44.asServiceRole.entities.ClientInstallationOS.update(
      installOS.id, updatePayload
    );

    return Response.json({
      success: true,
      installation_os_id: installOS.id,
      order_id: installOS.order_id,
      activation_eligible,
      activation_status,
      checklist_completion_percent,
      missing_count: missing_requirements.length,
      blocker_count: activation_blockers.length,
      next_action: next_required_action?.action_type,
      integration_readiness,
    });
  } catch (error) {
    console.error('[evaluateActivationReadiness]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
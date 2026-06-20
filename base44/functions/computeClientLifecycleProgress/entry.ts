import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * CLIENT LIFECYCLE PROGRESS COMPUTATION
 * 
 * Calculates:
 * - onboarding_completion_percentage (0–100)
 * - checklist_completion_percentage (0–100)
 * - setup_health_status (on_track / delayed / blocked)
 * - blockers list
 * - next_step recommendation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { order_id, client_id } = body;

    if (!order_id && !client_id) {
      return Response.json({ error: 'order_id or client_id required' }, { status: 400 });
    }

    let order = null;
    let clientInstallOS = null;
    let onboardingClient = null;
    let automationChecklists = [];
    let adminSettings = null;

    // Fetch entities
    if (order_id) {
      const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id }, '-created_date', 1);
      order = orders[0];
    }

    if (client_id || order?.client_id) {
      const cid = client_id || order?.client_id;
      const installations = await base44.asServiceRole.entities.ClientInstallationOS
        ?.filter({ client_id: cid }, '-created_date', 1)
        .catch(() => []);
      if (installations?.length > 0) {
        clientInstallOS = installations[0];
      }

      const onboardings = await base44.asServiceRole.entities.OnboardingClient
        ?.filter({ client_id: cid }, '-created_date', 1)
        .catch(() => []);
      if (onboardings?.length > 0) {
        onboardingClient = onboardings[0];
      }

      const checklists = await base44.asServiceRole.entities.AutomationChecklist
        ?.filter({ order_id: order?.id || 'none' }, '-created_date', 20)
        .catch(() => []);
      if (checklists?.length > 0) {
        automationChecklists = checklists;
      }
    }

    // Fetch admin settings for defaults
    const settings = await base44.asServiceRole.entities.AdminSettings.filter({}, '-created_date', 1).catch(() => []);
    adminSettings = settings[0];

    // === BLOCKERS DETECTION ===
    const blockers = [];

    // Missing Twilio config
    if (!adminSettings?.twilio_account_sid_present || !adminSettings?.twilio_auth_token_present) {
      blockers.push({
        code: 'TWILIO_NOT_CONFIGURED',
        severity: 'critical',
        message: 'Twilio SMS/voice not configured. Admin must set up Twilio credentials.',
      });
    }

    // Missing booking link
    if (!onboardingClient?.booking_link && !adminSettings?.booking_link_default) {
      blockers.push({
        code: 'BOOKING_LINK_MISSING',
        severity: 'high',
        message: 'No booking link configured. Client must provide or admin must set default.',
      });
    }

    // Missing onboarding fields
    const requiredOnboardingFields = ['business_name', 'owner_name', 'email', 'phone'];
    const missingFields = requiredOnboardingFields.filter(f => !onboardingClient?.[f]);
    if (missingFields.length > 0) {
      blockers.push({
        code: 'ONBOARDING_INCOMPLETE',
        severity: 'medium',
        message: `Missing onboarding fields: ${missingFields.join(', ')}`,
      });
    }

    // Failed checklist steps
    const failedSteps = automationChecklists.filter(c => c.status === 'failed');
    if (failedSteps.length > 0) {
      blockers.push({
        code: 'CHECKLIST_FAILURES',
        severity: 'high',
        message: `${failedSteps.length} checklist step(s) failed and need resolution.`,
      });
    }

    // === PROGRESS CALCULATION ===

    // Onboarding completion (0–100)
    const onboardingTotal = requiredOnboardingFields.length + 3; // + booking_link, website, notes
    const onboardingCompleted = requiredOnboardingFields.filter(f => onboardingClient?.[f]).length +
      (onboardingClient?.booking_link ? 1 : 0) +
      (onboardingClient?.website ? 1 : 0) +
      (onboardingClient?.notes ? 1 : 0);
    const onboarding_completion_percentage = Math.round((onboardingCompleted / onboardingTotal) * 100);

    // Checklist completion (0–100)
    const checklistTotal = automationChecklists.length || 1;
    const checklistCompleted = automationChecklists.filter(c => c.status === 'complete').length;
    const checklist_completion_percentage = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

    // === HEALTH STATUS ===
    let setup_health_status = 'on_track';
    if (blockers.some(b => b.severity === 'critical')) {
      setup_health_status = 'blocked';
    } else if (blockers.some(b => b.severity === 'high') || (order && new Date(order.created_date).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 && checklist_completion_percentage < 50)) {
      setup_health_status = 'delayed';
    }

    // === NEXT STEP RECOMMENDATION ===
    let next_step = 'System is live';
    if (order?.pipeline_status === 'blocked') {
      next_step = 'Resolve blockers before proceeding';
    } else if (onboarding_completion_percentage < 100) {
      next_step = 'Complete onboarding form';
    } else if (checklist_completion_percentage < 100) {
      next_step = `Run checklist steps (${checklistCompleted}/${checklistTotal} complete)`;
    } else if (order?.order_status !== 'fully_live') {
      next_step = 'Approve activation and mark system live';
    }

    return Response.json({
      timestamp: new Date().toISOString(),
      progress: {
        onboarding_completion_percentage,
        checklist_completion_percentage,
        setup_health_status,
      },
      blockers: blockers,
      blocker_count: blockers.length,
      next_step,
      lifecycle_stage: clientInstallOS?.lifecycle_stage || order?.pipeline_status || 'unknown',
    });
  } catch (error) {
    console.error('[computeClientLifecycleProgress]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
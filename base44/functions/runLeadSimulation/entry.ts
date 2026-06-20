import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * runLeadSimulation — Safe admin-only simulation function
 *
 * SAFETY GUARANTEES:
 * - Never calls Twilio, Resend, Stripe, or any external API
 * - Never creates real Leads records
 * - Never creates real AutomationJobs for client execution
 * - Only reads AutomationRule records to evaluate conditions
 * - All output is in-memory — nothing is persisted to production tables
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only gate
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { lead, failure_toggles = {} } = await req.json();

    if (!lead || !lead.email) {
      return Response.json({ error: 'Lead data required' }, { status: 400 });
    }

    const now = () => new Date().toISOString();
    const stepResults = {};
    const warnings = [];

    // ── STEP 1: Lead Created ──────────────────────────────────────────────────
    await delay(80);

    const hasMissingData = failure_toggles.missing_lead_data;
    const leadIsValid = lead.full_name && lead.email && lead.phone && !hasMissingData;

    stepResults.lead_created = {
      status: leadIsValid ? 'success' : 'failed',
      timestamp: now(),
      logs: [
        { type: 'info', message: `[sim] Lead: ${lead.full_name} <${lead.email}>` },
        { type: 'info', message: `[sim] Industry: ${lead.industry} | Intent: ${lead.intent_level} | Source: ${lead.source}` },
        ...(!leadIsValid ? [{ type: 'error', message: '[sim] Missing required lead fields (toggled)' }] : []),
      ],
      warning: hasMissingData ? 'Missing lead data toggle is ON — lead validation fails' : null,
    };

    if (!leadIsValid) {
      warnings.push('Lead creation failed due to missing data toggle');
      return buildResponse(stepResults, warnings, 'lead_created');
    }

    // ── STEP 2: Lead Processed ────────────────────────────────────────────────
    await delay(80);

    const intentScore = lead.intent_level === 'hot' ? 85 : lead.intent_level === 'warm' ? 55 : 20;

    stepResults.lead_processed = {
      status: 'success',
      timestamp: now(),
      logs: [
        { type: 'info', message: `[sim] Score computed: ${intentScore}/100` },
        { type: 'info', message: `[sim] Segment: ${intentScore >= 80 ? 'HOT_LEADS' : intentScore >= 50 ? 'HIGH_INTENT' : 'COLD'}` },
        { type: 'info', message: `[sim] Canonical ID: sim_${lead.email.replace(/[^a-z0-9]/gi, '_')}` },
      ],
    };

    // ── STEP 3: Automation Evaluated ─────────────────────────────────────────
    await delay(100);

    const automationBlocked = failure_toggles.automation_not_triggered;
    let matchedRules = [];

    try {
      const rules = await base44.asServiceRole.entities.AutomationRule.filter(
        { status: 'active' },
        '-created_date',
        10
      ).catch(() => []);
      matchedRules = (rules || []).filter(r => !r.industry || r.industry === lead.industry);
    } catch (e) {
      warnings.push('Could not load automation rules: ' + e.message);
    }

    stepResults.automation_evaluated = {
      status: automationBlocked ? 'failed' : 'success',
      timestamp: now(),
      logs: [
        { type: 'info', message: `[sim] Found ${matchedRules.length} active rules` },
        { type: 'info', message: `[sim] Matching rules for industry "${lead.industry}": ${matchedRules.length}` },
        ...(automationBlocked
          ? [{ type: 'error', message: '[sim] Automation suppressed by failure toggle' }]
          : [{ type: 'info', message: '[sim] Rules would fire: instant_lead_response, intent_classifier' }]
        ),
      ],
      warning: automationBlocked ? 'Automation trigger toggle is ON — no jobs would be created' : null,
    };

    if (automationBlocked) {
      warnings.push('Automation evaluation blocked — no jobs queued');
    }

    // ── STEP 4: Messaging Queued ──────────────────────────────────────────────
    await delay(80);

    const messagingBlocked = failure_toggles.messaging_not_sent || automationBlocked;

    stepResults.messaging_queued = {
      status: messagingBlocked ? 'failed' : 'success',
      timestamp: now(),
      logs: [
        { type: 'info', message: '[sim] ⚠️  No real messages will be sent — simulation mode' },
        ...(messagingBlocked
          ? [{ type: 'error', message: '[sim] Messaging suppressed by failure toggle or blocked automation' }]
          : [
              { type: 'info', message: `[sim] Would queue SMS to: ${lead.phone}` },
              { type: 'info', message: `[sim] Would queue email to: ${lead.email}` },
            ]
        ),
      ],
      warning: messagingBlocked
        ? 'Messaging toggle is ON — messages would not be dispatched'
        : 'Simulation: messages were NOT actually sent',
    };

    if (messagingBlocked) {
      warnings.push('Messaging not dispatched due to toggle or upstream failure');
    }

    // ── STEP 5: Event Logged ──────────────────────────────────────────────────
    await delay(60);

    const simulatedEventId = `sim_event_${Date.now()}`;

    stepResults.event_logged = {
      status: 'success',
      timestamp: now(),
      logs: [
        { type: 'info', message: `[sim] Would create CommunicationEvent: ${simulatedEventId}` },
        { type: 'info', message: `[sim] Channel: ${messagingBlocked ? 'internal' : lead.phone ? 'sms' : 'email'}` },
        { type: 'info', message: '[sim] Event NOT written to production — simulation only' },
      ],
    };

    // ── STEP 6: Funnel Updated ────────────────────────────────────────────────
    await delay(failure_toggles.funnel_update_delay ? 300 : 80);

    const funnelDelayed = failure_toggles.funnel_update_delay;
    stepResults.funnel_updated = {
      status: 'success',
      timestamp: now(),
      logs: [
        funnelDelayed
          ? { type: 'info', message: '[sim] Funnel update delayed (toggle active) — would retry after 5s' }
          : { type: 'info', message: '[sim] Would move lead to stage: Contacted' },
        { type: 'info', message: '[sim] Funnel record NOT written to production' },
      ],
      warning: funnelDelayed ? 'Funnel update delay toggle is ON — latency introduced' : null,
    };

    if (funnelDelayed) {
      warnings.push('Funnel update was delayed — may cause dashboard lag in real scenario');
    }

    // ── STEP 7: Completed ─────────────────────────────────────────────────────
    await delay(60);

    const allSuccess = Object.values(stepResults).every(s => s.status === 'success');

    stepResults.completed = {
      status: allSuccess ? 'success' : 'failed',
      timestamp: now(),
      logs: [
        { type: 'info', message: `[sim] Simulation complete — ${allSuccess ? 'all steps passed' : 'some steps failed'}` },
        { type: 'info', message: '[sim] No production data was modified' },
      ],
    };

    // ── Summary ───────────────────────────────────────────────────────────────
    const failedSteps = Object.entries(stepResults)
      .filter(([, r]) => r.status === 'failed')
      .map(([k]) => k);

    const bottleneckStage = failedSteps.length > 0
      ? STEP_LABELS[failedSteps[0]] || failedSteps[0]
      : null;

    const funnelOutcome = messagingBlocked
      ? 'Lead stuck at Contacted — no outreach sent'
      : `Lead progressed to Contacted${funnelDelayed ? ' (with delay)' : ''}`;

    return Response.json({
      success: true,
      steps: stepResults,
      summary: {
        steps_completed: Object.values(stepResults).filter(s => s.status === 'success').length,
        failed_steps: failedSteps.length,
        bottleneck_stage: bottleneckStage,
        funnel_outcome: funnelOutcome,
        warnings,
        simulation_id: `sim_${Date.now()}`,
        simulated_at: now(),
        safety_note: 'No production data was modified. No real messages were sent.',
      },
    });
  } catch (error) {
    console.error('[runLeadSimulation] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function buildResponse(stepResults, warnings, failedAt) {
  return Response.json({
    success: false,
    steps: stepResults,
    summary: {
      steps_completed: Object.values(stepResults).filter(s => s.status === 'success').length,
      failed_steps: 1,
      bottleneck_stage: STEP_LABELS[failedAt] || failedAt,
      funnel_outcome: 'Simulation aborted — lead did not enter pipeline',
      warnings,
    },
  });
}

const STEP_LABELS = {
  lead_created: 'Lead Created',
  lead_processed: 'Lead Processed',
  automation_evaluated: 'Automation Evaluated',
  messaging_queued: 'Messaging Queued',
  event_logged: 'Event Logged',
  funnel_updated: 'Funnel Updated',
  completed: 'Completed',
};
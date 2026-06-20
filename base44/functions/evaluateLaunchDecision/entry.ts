import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'https://deno.land/std@0.208.0/uuid/mod.ts';

/**
 * EVALUATE LAUNCH DECISION — Deterministic Go/No-Go/Conditional-Go Logic
 *
 * Evaluates readiness checklist and determines launch decision with reasoning.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { launch_id } = await req.json();
    if (!launch_id) {
      return Response.json({ error: 'Missing launch_id' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // ── FETCH LATEST CHECKLIST ─────────────────────────────────────────────
    const checklists = await base44.asServiceRole.entities.LaunchChecklistEngine.filter(
      { launch_id },
      '-completed_at',
      1
    );

    if (!checklists || checklists.length === 0) {
      return Response.json({ error: 'No checklist found — evaluate readiness first' }, { status: 400 });
    }

    const checklist = checklists[0];
    const requiredFixes = [];
    let decision = 'GO';
    let riskLevel = 'low';
    let decisionReason = '';

    // ── CRITICAL BLOCKERS (NO_GO) ──────────────────────────────────────────
    const criticalChecks = [
      { name: 'Stripe', ready: checklist.stripe_ready },
      { name: 'GA4', ready: checklist.ga4_ready },
      { name: 'Onboarding', ready: checklist.onboarding_ready },
    ];

    const failedCritical = criticalChecks.filter((c) => !c.ready);

    if (failedCritical.length > 0) {
      decision = 'NO_GO';
      riskLevel = 'critical';
      decisionReason = `Critical systems not ready: ${failedCritical.map((c) => c.name).join(', ')}`;
      requiredFixes.push(...checklist.missing_items || []);
    }

    // ── CONDITIONAL CHECKS ────────────────────────────────────────────────
    if (decision === 'GO') {
      const minorIssues = [];

      if (!checklist.landing_pages_ready) {
        minorIssues.push('Not all landing pages live');
      }
      if (!checklist.pricing_page_ready) {
        minorIssues.push('Pricing page traffic low');
      }
      if (!checklist.automation_ready) {
        minorIssues.push('Automation engine unstable');
      }
      if (!checklist.tracking_integrated) {
        minorIssues.push('Tracking integration incomplete');
      }

      if (minorIssues.length > 2) {
        decision = 'CONDITIONAL_GO';
        riskLevel = 'high';
        decisionReason = `Multiple minor issues detected: ${minorIssues.join(', ')}. Proceed with caution.`;
        requiredFixes.push(...minorIssues);
      } else if (minorIssues.length > 0) {
        decision = 'CONDITIONAL_GO';
        riskLevel = 'medium';
        decisionReason = `Minor issues found: ${minorIssues.join(', ')}. Can proceed with monitoring.`;
        requiredFixes.push(...minorIssues);
      } else if (checklist.score < 85) {
        decision = 'CONDITIONAL_GO';
        riskLevel = 'medium';
        decisionReason = `Readiness score ${checklist.score}% is below target of 85%. Proceed with caution.`;
      } else {
        decisionReason = 'All systems ready. Safe to launch.';
        riskLevel = 'low';
      }
    }

    // ── CREATE DECISION RECORD ─────────────────────────────────────────────
    const decisionId = uuidv4();
    const decisionRecord = await base44.asServiceRole.entities.LaunchDecisionEngine.create({
      decision_id: decisionId,
      launch_id,
      decision,
      decision_reason: decisionReason,
      required_fixes: requiredFixes,
      risk_level: riskLevel,
      approved_by: user.email,
      approved_at: now,
    });

    // ── UPDATE LAUNCH STATE ────────────────────────────────────────────────
    const existingState = await base44.asServiceRole.entities.LaunchExecutionState.filter(
      { launch_id },
      '-created_date',
      1
    );

    if (existingState && existingState.length > 0) {
      await base44.asServiceRole.entities.LaunchExecutionState.update(existingState[0].id, {
        status: decision === 'GO' ? 'launching' : decision === 'NO_GO' ? 'failed' : 'pre_launch',
        last_updated_at: now,
        notes: decisionReason,
      });
    }

    return Response.json({
      success: true,
      decision_id: decisionId,
      decision,
      risk_level: riskLevel,
      decision_reason: decisionReason,
      required_fixes: requiredFixes,
    });
  } catch (error) {
    console.error('[evaluateLaunchDecision]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
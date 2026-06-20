import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'https://deno.land/std@0.208.0/uuid/mod.ts';

/**
 * EVALUATE LAUNCH READINESS — Pre-Launch System Health Check
 *
 * Evaluates all systems (GA4, Stripe, Landing Pages, Onboarding, Automation, Tracking)
 * and produces a LaunchChecklistEngine record + updates LaunchExecutionState.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const { launch_id, client_project_id } = await req.json();
    if (!launch_id || !client_project_id) {
      return Response.json({ error: 'Missing launch_id or client_project_id' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const missingItems = [];
    let score = 100;

    // ── CHECK GA4 ──────────────────────────────────────────────────────────
    let ga4Ready = false;
    try {
      const ga4Config = await base44.asServiceRole.entities.GA4Configuration.filter(
        { enabled: true },
        '-created_at',
        1
      );
      if (ga4Config && ga4Config.length > 0 && ga4Config[0].setup_status === 'active') {
        ga4Ready = true;
      } else {
        missingItems.push('GA4 not configured or inactive');
        score -= 15;
      }
    } catch (err) {
      missingItems.push(`GA4 check failed: ${err.message}`);
      score -= 15;
    }

    // ── CHECK STRIPE ───────────────────────────────────────────────────────
    let stripeReady = false;
    try {
      const stripeMappings = await base44.asServiceRole.entities.StripeMappingReference.filter(
        { is_active: true },
        '-created_at',
        1
      );
      if (stripeMappings && stripeMappings.length > 0) {
        stripeReady = true;
      } else {
        missingItems.push('Stripe products/prices not configured');
        score -= 20;
      }
    } catch (err) {
      missingItems.push(`Stripe check failed: ${err.message}`);
      score -= 20;
    }

    // ── CHECK LANDING PAGES ────────────────────────────────────────────────
    let landingPagesReady = false;
    try {
      const analytics = await base44.asServiceRole.entities.LandingPageAnalytics.list(
        '-date',
        100
      );
      const uniquePages = new Set(analytics.map((a) => a.page_key) || []);
      if (uniquePages.size >= 9) {
        // At least 9 of 11 industry pages
        landingPagesReady = true;
      } else {
        missingItems.push(`Only ${uniquePages.size} landing pages live (need 9+)`);
        score -= 12;
      }
    } catch (err) {
      missingItems.push(`Landing pages check failed: ${err.message}`);
      score -= 12;
    }

    // ── CHECK PRICING PAGE ─────────────────────────────────────────────────
    let pricingPageReady = false;
    try {
      const pricingAnalytics = await base44.asServiceRole.entities.LandingPageAnalytics.filter(
        { page_key: 'pricing' },
        '-date',
        1
      );
      if (pricingAnalytics && pricingAnalytics.length > 0 && pricingAnalytics[0].sessions > 0) {
        pricingPageReady = true;
      } else {
        missingItems.push('Pricing page not live or no traffic');
        score -= 10;
      }
    } catch (err) {
      missingItems.push(`Pricing page check failed: ${err.message}`);
      score -= 10;
    }

    // ── CHECK ONBOARDING ───────────────────────────────────────────────────
    let onboardingReady = false;
    try {
      const onboardingOrch = await base44.asServiceRole.entities.OnboardingOrchestration.filter(
        { client_project_id },
        '-created_date',
        1
      );
      if (onboardingOrch && onboardingOrch.length > 0) {
        const record = onboardingOrch[0];
        if (record.completion_metrics && record.completion_metrics.completion_percentage >= 80) {
          onboardingReady = true;
        } else {
          missingItems.push('Onboarding not sufficiently configured');
          score -= 15;
        }
      } else {
        missingItems.push('No onboarding orchestration found');
        score -= 15;
      }
    } catch (err) {
      missingItems.push(`Onboarding check failed: ${err.message}`);
      score -= 15;
    }

    // ── CHECK AUTOMATION ───────────────────────────────────────────────────
    let automationReady = false;
    try {
      const automationJobs = await base44.asServiceRole.entities.AutomationJob.filter(
        { status: 'active' },
        '-created_date',
        10
      );
      if (automationJobs && automationJobs.length > 0) {
        const recentSuccessCount = automationJobs.filter((j) => j.last_error === null).length;
        if (recentSuccessCount >= automationJobs.length * 0.8) {
          automationReady = true;
        } else {
          missingItems.push('Automation engine has high failure rate');
          score -= 12;
        }
      } else {
        missingItems.push('No active automation jobs found');
        score -= 12;
      }
    } catch (err) {
      missingItems.push(`Automation check failed: ${err.message}`);
      score -= 12;
    }

    // ── CHECK TRACKING INTEGRATION ─────────────────────────────────────────
    let trackingIntegrated = false;
    try {
      const conversionEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.filter(
        {},
        '-timestamp',
        1
      );
      if (conversionEvents && conversionEvents.length > 0) {
        trackingIntegrated = true;
      } else {
        missingItems.push('No conversion tracking events recorded');
        score -= 8;
      }
    } catch (err) {
      missingItems.push(`Tracking check failed: ${err.message}`);
      score -= 8;
    }

    // ── CHECK CONVERSION TRACKING ──────────────────────────────────────────
    let conversionTrackingReady = false;
    try {
      const ctrEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.filter(
        { event_type: { $in: ['form_submit', 'checkout_click'] } },
        '-timestamp',
        1
      );
      if (ctrEvents && ctrEvents.length > 0) {
        conversionTrackingReady = true;
      } else {
        missingItems.push('Conversion events not tracking');
        score -= 8;
      }
    } catch (err) {
      missingItems.push(`Conversion tracking check failed: ${err.message}`);
      score -= 8;
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // ── CREATE OR UPDATE CHECKLIST ─────────────────────────────────────────
    const checklistId = uuidv4();
    const checklist = await base44.asServiceRole.entities.LaunchChecklistEngine.create({
      checklist_id: checklistId,
      launch_id,
      ga4_ready: ga4Ready,
      stripe_ready: stripeReady,
      landing_pages_ready: landingPagesReady,
      pricing_page_ready: pricingPageReady,
      onboarding_ready: onboardingReady,
      automation_ready: automationReady,
      tracking_integrated: trackingIntegrated,
      conversion_tracking_ready: conversionTrackingReady,
      score,
      missing_items: missingItems,
      completed_at: now,
    });

    // ── UPDATE LAUNCH EXECUTION STATE ──────────────────────────────────────
    const existingState = await base44.asServiceRole.entities.LaunchExecutionState.filter(
      { launch_id },
      '-created_date',
      1
    );

    if (existingState && existingState.length > 0) {
      await base44.asServiceRole.entities.LaunchExecutionState.update(existingState[0].id, {
        readiness_score: score,
        blockers_count: missingItems.length,
        critical_blockers_count: missingItems.length > 3 ? 1 : 0,
        last_updated_at: now,
      });
    } else {
      await base44.asServiceRole.entities.LaunchExecutionState.create({
        launch_id,
        client_project_id,
        status: 'pre_launch',
        readiness_score: score,
        blockers_count: missingItems.length,
        critical_blockers_count: missingItems.length > 3 ? 1 : 0,
        last_updated_at: now,
      });
    }

    return Response.json({
      success: true,
      checklist_id: checklistId,
      readiness_score: score,
      missing_items: missingItems,
    });
  } catch (error) {
    console.error('[evaluateLaunchReadiness]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
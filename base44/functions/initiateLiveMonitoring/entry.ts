import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'https://deno.land/std@0.208.0/uuid/mod.ts';

/**
 * INITIATE LIVE MONITORING — Post-Launch Surveillance
 *
 * After GO decision, begins real-time monitoring for:
 * - Traffic drops
 * - Conversion drop-offs
 * - Checkout failures
 * - Onboarding failures
 * - Tracking failures
 *
 * Creates LaunchMonitoringSystem alerts + LaunchKPIMetrics records.
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
    const alerts = [];

    // ── ESTABLISH BASELINES FROM ANALYTICS ────────────────────────────────
    const analytics = await base44.asServiceRole.entities.LandingPageAnalytics.filter(
      {},
      '-date',
      50
    ).catch(() => []);

    const benchmarks = {
      avg_traffic: 0,
      avg_conversion_rate: 0.025,
      avg_bounce_rate: 0.5,
      avg_pricing_conversion: 0.02,
      avg_checkout_conversion: 0.015,
    };

    if (analytics && analytics.length > 0) {
      const totalSessions = analytics.reduce((sum, a) => sum + (a.sessions || 0), 0);
      const totalConversions = analytics.reduce((sum, a) => sum + (a.cta_clicks || 0), 0);

      benchmarks.avg_traffic = Math.round(totalSessions / analytics.length);
      benchmarks.avg_conversion_rate = totalSessions > 0 ? totalConversions / totalSessions : 0.025;
      benchmarks.avg_bounce_rate = analytics.reduce((sum, a) => sum + (a.bounce_rate || 0), 0) / analytics.length / 100;
    }

    // ── CHECK FOR TRAFFIC ANOMALIES ────────────────────────────────────────
    const recentTraffic = analytics.length > 0 ? analytics[0].sessions || 0 : 0;
    if (recentTraffic < benchmarks.avg_traffic * 0.5) {
      alerts.push({
        alert_id: uuidv4(),
        alert_type: 'traffic_drop',
        severity: 'high',
        detected_metric: 'sessions',
        current_value: recentTraffic,
        benchmark_value: benchmarks.avg_traffic,
        variance_percent: ((recentTraffic - benchmarks.avg_traffic) / benchmarks.avg_traffic) * 100,
      });
    }

    // ── CHECK FOR CONVERSION ANOMALIES ─────────────────────────────────────
    const recentConvRate = analytics.length > 0 && (analytics[0].sessions || 0) > 0
      ? (analytics[0].cta_clicks || 0) / analytics[0].sessions
      : 0;

    if (recentConvRate < benchmarks.avg_conversion_rate * 0.6) {
      alerts.push({
        alert_id: uuidv4(),
        alert_type: 'conversion_drop',
        severity: 'high',
        detected_metric: 'conversion_rate',
        current_value: recentConvRate * 100,
        benchmark_value: benchmarks.avg_conversion_rate * 100,
        variance_percent: ((recentConvRate - benchmarks.avg_conversion_rate) / benchmarks.avg_conversion_rate) * 100,
      });
    }

    // ── CHECK CHECKOUT CONVERSION ──────────────────────────────────────────
    const recentCheckoutConv = analytics.length > 0 ? (analytics[0].checkout_clicks || 0) : 0;
    if (recentCheckoutConv < benchmarks.avg_checkout_conversion * 100 * 0.4) {
      alerts.push({
        alert_id: uuidv4(),
        alert_type: 'checkout_failure',
        severity: 'critical',
        detected_metric: 'checkout_conversions',
        current_value: recentCheckoutConv,
        benchmark_value: benchmarks.avg_checkout_conversion * 100,
        variance_percent: ((recentCheckoutConv - benchmarks.avg_checkout_conversion * 100) / (benchmarks.avg_checkout_conversion * 100)) * 100,
      });
    }

    // ── CHECK ONBOARDING HEALTH ────────────────────────────────────────────
    const onboardingRecords = await base44.asServiceRole.entities.OnboardingOrchestration.filter(
      { unified_stage: 'live' },
      '-created_date',
      100
    ).catch(() => []);

    const blockedCount = onboardingRecords.filter((r) => r.activation_blockers && r.activation_blockers.length > 0).length;
    if (onboardingRecords.length > 0 && blockedCount / onboardingRecords.length > 0.2) {
      alerts.push({
        alert_id: uuidv4(),
        alert_type: 'onboarding_failure',
        severity: 'high',
        detected_metric: 'blocked_onboardings',
        current_value: blockedCount,
        benchmark_value: onboardingRecords.length * 0.1,
        variance_percent: ((blockedCount - onboardingRecords.length * 0.1) / (onboardingRecords.length * 0.1)) * 100,
      });
    }

    // ── CHECK TRACKING HEALTH ──────────────────────────────────────────────
    const trackingEvents = await base44.asServiceRole.entities.ConversionTrackingEvent.filter(
      {},
      '-timestamp',
      1000
    ).catch(() => []);

    if (trackingEvents.length < 10) {
      alerts.push({
        alert_id: uuidv4(),
        alert_type: 'tracking_failure',
        severity: 'critical',
        detected_metric: 'tracking_events',
        current_value: trackingEvents.length,
        benchmark_value: 100,
        variance_percent: ((trackingEvents.length - 100) / 100) * 100,
      });
    }

    // ── CREATE MONITORING RECORDS ──────────────────────────────────────────
    for (const alertData of alerts) {
      await base44.asServiceRole.entities.LaunchMonitoringSystem.create({
        ...alertData,
        launch_id,
        status: 'active',
        triggered_at: now,
      }).catch((err) => console.error('[initiateLiveMonitoring] alert creation failed:', err));
    }

    // ── CREATE KPI BASELINE ────────────────────────────────────────────────
    const kpiRecord = await base44.asServiceRole.entities.LaunchKPIMetrics.create({
      launch_id,
      metric_window: '24h',
      traffic: recentTraffic,
      conversions: analytics.length > 0 ? analytics[0].cta_clicks || 0 : 0,
      conversion_rate: recentConvRate * 100,
      revenue: 0,
      bounce_rate: analytics.length > 0 ? analytics[0].bounce_rate || 0 : 0,
      avg_session_time: 0,
      pricing_page_conversion: analytics.length > 0 ? (analytics[0].cta_clicks || 0) * 0.3 : 0,
      checkout_conversion: recentCheckoutConv,
      measured_at: now,
    });

    return Response.json({
      success: true,
      alerts_created: alerts.length,
      alerts,
      kpi_baseline_created: true,
    });
  } catch (error) {
    console.error('[initiateLiveMonitoring]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
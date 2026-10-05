import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

/**
 * Get Sales Automation Metrics: Dashboard endpoint returning conversion, funnel, and attribution data
 * Combines ConversionFunnel, ABTestVariant, and ConversionOptimizationSignal metrics
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);
    const url = new URL(req.url);
    const payload = req.method === 'GET' ? {} : await req.json().catch(() => ({}));
    const clientId = payload.client_id || url.searchParams.get('client_id');
    const clientProjectId = payload.client_project_id || url.searchParams.get('client_project_id');
    const period = payload.period || url.searchParams.get('period') || '30d';

    if (!clientProjectId) {
      return secureJson({ error: 'client_project_id required' }, { status: 400 });
    }

    console.log('[getSalesAutomationMetrics] Fetching metrics for', {
      clientProjectId,
      period,
    });

    // Fetch conversion funnel metrics
    const funnelResult = await base44.asServiceRole.functions
      .invoke('computeConversionFunnel', {
        client_id: clientId,
        client_project_id: clientProjectId,
        metric_period: period,
      })
      .catch(() => ({ data: { funnel: null } }));

    // Fetch revenue attribution
    const attributionResult = await base44.asServiceRole.functions
      .invoke('computeRevenueAttribution', {
        client_id: clientId,
        client_project_id: clientProjectId,
        metric_period: period,
      })
      .catch(() => ({ data: { attribution: null } }));

    // Fetch active A/B tests
    const abTests = await base44.asServiceRole.entities.ABTestVariant.filter(
      {
        client_project_id: clientProjectId,
        status: { $in: ['running', 'completed'] },
      },
      '-started_at',
      50
    ).catch(() => []);

    // Fetch optimization signals
    const signals = await base44.asServiceRole.entities.ConversionOptimizationSignal.filter(
      {
        client_project_id: clientProjectId,
        status: { $in: ['active', 'investigating'] },
      },
      '-severity',
      50
    ).catch(() => []);

    // Compute summary
    const funnelData = funnelResult.data?.funnel;
    const summary = {
      period,
      conversion_funnel: {
        top_to_bottom_conversion_percent: funnelData?.top_to_bottom_conversion_percent || 0,
        biggest_drop_off_stage: funnelData?.biggest_drop_off_stage,
        biggest_drop_off_percent: funnelData?.biggest_drop_off_percent || 0,
        stage_summary: (funnelData?.funnel_stages || []).map(stage => ({
          stage: stage.stage_name,
          count: stage.total_count,
          conversion_pct: Number(stage.conversion_from_previous_percent).toFixed(2),
        })),
      },
      revenue_attribution: {
        total_revenue: attributionResult.data?.attribution?.total_revenue_attributed || 0,
        by_source: attributionResult.data?.attribution?.attribution_by_source || {},
        by_utm: attributionResult.data?.attribution?.attribution_by_utm || {},
      },
      ab_tests_active: (abTests || []).filter(t => t.status === 'running').length,
      ab_tests_completed: (abTests || []).filter(t => t.status === 'completed').length,
      optimization_signals: {
        critical: (signals || []).filter(s => s.severity === 'critical').length,
        high: (signals || []).filter(s => s.severity === 'high').length,
        medium: (signals || []).filter(s => s.severity === 'medium').length,
        low: (signals || []).filter(s => s.severity === 'low').length,
      },
      top_signals: (signals || [])
        .slice(0, 5)
        .map(s => ({
          signal_type: s.signal_type,
          title: s.title,
          severity: s.severity,
          metric_affected: s.metric_affected,
          variance_percent: s.variance_percent,
        })),
    };

    console.log('[getSalesAutomationMetrics] Metrics compiled:', {
      overall_conversion: summary.conversion_funnel.top_to_bottom_conversion_percent,
      signals_count: signals?.length || 0,
      ab_tests_running: summary.ab_tests_active,
    });

    return secureJson({
      success: true,
      summary,
      funnel: funnelData,
      attribution: attributionResult.data?.attribution,
      ab_tests: abTests,
      signals,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }

    console.error('[getSalesAutomationMetrics] Error:', error.message);
    return secureJson({ error: 'Unable to load sales automation metrics' }, { status: 500 });
  }
});

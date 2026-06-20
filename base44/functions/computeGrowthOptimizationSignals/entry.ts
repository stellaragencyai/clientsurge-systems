import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { v4 as uuidv4 } from 'https://deno.land/std@0.208.0/uuid/mod.ts';

/**
 * COMPUTE GROWTH OPTIMIZATION SIGNALS — Admin-Only Analytics Engine
 *
 * Analyzes landing page performance across all industries and generates
 * actionable optimization signals and recommendations.
 *
 * Does NOT execute changes—recommendations only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const now = new Date();
    const results = {
      signals_generated: 0,
      actions_suggested: 0,
      pages_analyzed: 0,
      insights: [],
    };

    // ── FETCH OPTIMIZATION RULES ──────────────────────────────────────────────
    const rules = await base44.asServiceRole.entities.AutoOptimizationRule.filter(
      { enabled: true },
      '-created_at',
      100
    ).catch(() => []);

    if (!rules || rules.length === 0) {
      return Response.json({
        success: true,
        message: 'No optimization rules enabled. Create rules to auto-generate signals.',
        results,
      });
    }

    // ── FETCH LANDING PAGE ANALYTICS (last 7 days) ────────────────────────────
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const analytics = await base44.asServiceRole.entities.LandingPageAnalytics.filter(
      { date: { $gte: sevenDaysAgo } },
      '-date',
      500
    ).catch(() => []);

    // Group by page_key to get aggregated metrics
    const pageMetrics = {};
    for (const record of analytics || []) {
      if (!pageMetrics[record.page_key]) {
        pageMetrics[record.page_key] = {
          page_key: record.page_key,
          total_sessions: 0,
          total_conversions: 0,
          total_bounces: 0,
          total_scroll_completions: 0,
          records_count: 0,
        };
      }
      pageMetrics[record.page_key].total_sessions += record.sessions || 0;
      pageMetrics[record.page_key].total_conversions += record.cta_clicks || 0;
      pageMetrics[record.page_key].total_bounces += Math.floor(
        ((record.bounce_rate || 0) / 100) * (record.sessions || 0)
      );
      pageMetrics[record.page_key].total_scroll_completions += Math.floor(
        ((record.scroll_completion_rate || 0) / 100) * (record.sessions || 0)
      );
      pageMetrics[record.page_key].records_count++;
    }

    // ── CALCULATE BENCHMARKS (across all pages) ───────────────────────────────
    let totalSessions = 0;
    let totalConversions = 0;
    for (const page of Object.values(pageMetrics)) {
      totalSessions += page.total_sessions;
      totalConversions += page.total_conversions;
    }
    const benchmarkConversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 2.5;
    const benchmarkBounceRate = 50; // Industry avg
    const benchmarkScrollCompletion = 65;

    // ── PROCESS EACH RULE ─────────────────────────────────────────────────────
    for (const rule of rules) {
      for (const [pageKey, metrics] of Object.entries(pageMetrics)) {
        if (
          rule.applies_to_industries?.length > 0 &&
          !rule.applies_to_industries.includes(pageKey)
        ) {
          continue;
        }

        if (metrics.records_count < rule.min_sample_size) continue;

        const signalTriggered = evaluateRule(rule, metrics, benchmarkConversionRate, benchmarkBounceRate, benchmarkScrollCompletion);

        if (signalTriggered) {
          results.signals_generated++;

          // Create signal
          const signal = await base44.asServiceRole.entities.GrowthOptimizationSignal.create({
            signal_id: uuidv4(),
            page_key: pageKey,
            industry: pageKey.replace(/_/g, ' ').toUpperCase(),
            signal_type: rule.signal_type,
            severity: rule.severity,
            metric_affected: rule.metric,
            current_value: signalTriggered.current,
            benchmark_value: signalTriggered.benchmark,
            variance_percent: signalTriggered.variance,
            confidence_score: 85,
            impact_estimate: estimateImpact(rule.signal_type, metrics),
            data_source: 'landing_page_analytics',
            samples_analyzed: metrics.records_count,
            triggered_at: now.toISOString(),
            status: 'new',
          }).catch((err) => {
            console.error('[computeGrowthOptimizationSignals] signal create failed:', err);
            return null;
          });

          if (signal) {
            results.insights.push({
              page: pageKey,
              type: rule.signal_type,
              message: signalTriggered.message,
            });

            // Create associated action
            const action = await base44.asServiceRole.entities.OptimizationAction.create({
              action_id: uuidv4(),
              signal_id: signal.id,
              action_type: deriveActionType(rule.signal_type),
              target_page: pageKey,
              title: rule.action_template,
              instruction: generateInstruction(rule.signal_type, pageKey),
              expected_outcome: signalTriggered.expected_improvement,
              priority: rule.severity === 'critical' ? 'high' : rule.severity === 'high' ? 'medium' : 'low',
              estimated_effort: 'moderate',
              status: 'suggested',
              confidence_score: 85,
              created_at: now.toISOString(),
            }).catch((err) => {
              console.error('[computeGrowthOptimizationSignals] action create failed:', err);
              return null;
            });

            if (action) results.actions_suggested++;
          }
        }
      }
    }

    results.pages_analyzed = Object.keys(pageMetrics).length;

    return Response.json({
      success: true,
      analyzed_at: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('[computeGrowthOptimizationSignals]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function evaluateRule(rule, metrics, benchmarkCR, benchmarkBR, benchmarkSC) {
  const conversionRate = metrics.total_sessions > 0 ? (metrics.total_conversions / metrics.total_sessions) * 100 : 0;
  const bounceRate = metrics.total_sessions > 0 ? (metrics.total_bounces / metrics.total_sessions) * 100 : 0;
  const scrollCompletion = metrics.total_sessions > 0 ? (metrics.total_scroll_completions / metrics.total_sessions) * 100 : 0;

  let triggered = false;
  let current = 0;
  let benchmark = 0;
  let variance = 0;
  let message = '';
  let expectedImprovement = '';

  if (rule.metric === 'conversion_rate') {
    current = conversionRate;
    benchmark = benchmarkCR;
    variance = current - benchmark;
    if (variance < -20) {
      triggered = true;
      message = `Conversion rate is ${current.toFixed(1)}% vs benchmark ${benchmark.toFixed(1)}% (${variance.toFixed(0)}%)`;
      expectedImprovement = `+${Math.abs(variance).toFixed(0)}% conversion improvement`;
    }
  } else if (rule.metric === 'bounce_rate') {
    current = bounceRate;
    benchmark = benchmarkBR;
    variance = current - benchmark;
    if (variance > 15) {
      triggered = true;
      message = `Bounce rate is ${current.toFixed(1)}% vs benchmark ${benchmark.toFixed(1)}% (${variance.toFixed(0)}% above)`;
      expectedImprovement = `Reduce bounce by ${Math.min(variance, 15).toFixed(0)}%`;
    }
  } else if (rule.metric === 'scroll_depth') {
    current = scrollCompletion;
    benchmark = benchmarkSC;
    variance = current - benchmark;
    if (variance < -20) {
      triggered = true;
      message = `Scroll completion is ${current.toFixed(1)}% vs benchmark ${benchmark.toFixed(1)}% (${variance.toFixed(0)}%)`;
      expectedImprovement = `+${Math.abs(variance).toFixed(0)}% engagement`;
    }
  }

  return triggered ? { current, benchmark, variance, message, expected_improvement: expectedImprovement } : null;
}

function deriveActionType(signalType) {
  const map = {
    high_bounce: 'copy_change',
    low_ctr: 'cta_change',
    weak_cta: 'button_position',
    pricing_underperformance: 'pricing_adjustment',
    drop_off: 'layout_change',
    low_engagement: 'design_improvement',
  };
  return map[signalType] || 'copy_change';
}

function generateInstruction(signalType, pageKey) {
  const instructions = {
    high_bounce: `The ${pageKey} page has a high bounce rate. Consider: (1) Simplifying hero copy, (2) Moving CTA higher, (3) Removing friction from initial view.`,
    low_ctr: `CTA click-through on ${pageKey} is underperforming. Test: (1) Different CTA copy, (2) Changing button color, (3) Adding social proof near CTA.`,
    weak_cta: `The CTA on ${pageKey} appears weak. Try: (1) Making it more action-oriented ('Get Started Now' vs 'Learn More'), (2) Increasing visual prominence.`,
    pricing_underperformance: `Pricing page needs improvement. Test: (1) Plan comparison clarity, (2) Highlighting recommended tier, (3) Adding money-back guarantee.`,
    drop_off: `Users are dropping off on ${pageKey}. Analyze: (1) Which section breaks engagement?, (2) Simplify flow, (3) Remove unnecessary form fields.`,
    low_engagement: `Engagement is low on ${pageKey}. Improve: (1) Visual hierarchy, (2) Content relevance, (3) Add video or interactive elements.`,
  };
  return instructions[signalType] || `Optimize ${pageKey} for better conversion.`;
}

function estimateImpact(signalType, metrics) {
  const avgConversionValue = 500; // Assumed $500 per conversion
  const potentialGain = metrics.total_sessions * 0.05 * avgConversionValue; // 5% improvement estimate

  if (metrics.total_sessions > 10000) {
    return `+$${Math.round(potentialGain / 1000)}K monthly potential`;
  } else if (metrics.total_sessions > 1000) {
    return `+$${Math.round(potentialGain)} monthly potential`;
  }
  return 'High impact potential';
}
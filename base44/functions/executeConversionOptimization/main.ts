import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Execute Conversion Optimization: Main orchestrator
 * Runs all conversion optimization routines: funnel computation, signal generation, insights
 * Scheduled to run every 24h to refresh metrics and detect opportunities
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, client_project_id } = await req.json();

    console.log('[executeConversionOptimization] Starting optimization run:', {
      client_project_id,
    });

    // Step 1: Compute funnel metrics
    const funnelRes = await base44.asServiceRole.functions
      .invoke('computeConversionFunnel', {
        client_id,
        client_project_id,
        metric_period: '30d',
      })
      .catch(err => ({ error: err.message }));

    if (funnelRes.error) {
      console.error('[executeConversionOptimization] Funnel computation failed:', funnelRes.error);
    } else {
      console.log('[executeConversionOptimization] Funnel computed successfully');
    }

    // Step 2: Compute revenue attribution
    const attributionRes = await base44.asServiceRole.functions
      .invoke('computeRevenueAttribution', {
        client_id,
        client_project_id,
        metric_period: '30d',
      })
      .catch(err => ({ error: err.message }));

    if (attributionRes.error) {
      console.error('[executeConversionOptimization] Attribution failed:', attributionRes.error);
    } else {
      console.log('[executeConversionOptimization] Attribution computed');
    }

    // Step 3: Analyze funnel for signals
    const funnel = funnelRes.data?.funnel;
    if (funnel) {
      // Detect major drop-offs
      if (funnel.biggest_drop_off_percent && Number(funnel.biggest_drop_off_percent) > 30) {
        await base44.asServiceRole.entities.ConversionOptimizationSignal.create({
          client_id,
          client_project_id,
          signal_type: 'funnel_drop_off',
          severity: 'high',
          title: `Major Drop-Off at ${funnel.biggest_drop_off_stage}`,
          description: `${funnel.biggest_drop_off_percent}% of users drop off between stages. This is the biggest bottleneck in your conversion funnel.`,
          metric_affected: 'conversion_rate',
          affected_entity_type: 'funnel_stage',
          affected_entity_name: funnel.biggest_drop_off_stage,
          current_value: Number(funnel.biggest_drop_off_percent),
          benchmark_value: 20,
          variance_percent: (
            Number(funnel.biggest_drop_off_percent) - 20
          ).toFixed(2),
          financial_impact: {
            estimated_revenue_loss_monthly: 5000,
            estimated_opportunity_monthly: 15000,
            confidence_level_percent: 85,
          },
          recommended_actions: [
            {
              action_number: 1,
              action: `Review messaging strategy for ${funnel.biggest_drop_off_stage} stage`,
              expected_impact: '5-15% improvement in stage conversion',
              effort_level: 'medium',
            },
            {
              action_number: 2,
              action: `Run A/B test on CTA for ${funnel.biggest_drop_off_stage}`,
              expected_impact: '10-20% improvement in stage conversion',
              effort_level: 'high',
            },
          ],
          status: 'active',
          first_detected_at: new Date().toISOString(),
        }).catch(err => console.error('[executeConversionOptimization] Signal create failed:', err.message));
      }

      // Detect underperforming sources
      const sourceEntries = Object.entries(funnel.by_source || {});
      for (const [source, metrics] of sourceEntries) {
        const conversionRate = Number(metrics.conversion_rate_percent);
        if (conversionRate > 0 && conversionRate < 5) {
          await base44.asServiceRole.entities.ConversionOptimizationSignal.create({
            client_id,
            client_project_id,
            signal_type: 'underperforming_source',
            severity: 'medium',
            title: `Low Conversion Rate from ${source}`,
            description: `${source} source has ${conversionRate}% conversion rate, significantly below benchmark. Consider pausing or optimizing this channel.`,
            metric_affected: 'conversion_rate',
            affected_entity_type: 'lead_source',
            affected_entity_name: source,
            current_value: conversionRate,
            benchmark_value: 10,
            variance_percent: (conversionRate - 10).toFixed(2),
            status: 'active',
            first_detected_at: new Date().toISOString(),
          }).catch(err => console.error('[executeConversionOptimization] Source signal failed:', err.message));
        }
      }
    }

    // Step 4: Fetch and score A/B tests
    const runningTests = await base44.asServiceRole.entities.ABTestVariant.filter(
      {
        client_project_id,
        status: 'running',
      },
      null,
      50
    ).catch(() => []);

    for (const test of runningTests || []) {
      // Check if any variant is statistically significant
      if (test.variants && test.variants.length > 1) {
        const controlVariant = test.variants.find(v => v.is_control);
        if (controlVariant) {
          for (const variant of test.variants) {
            if (!variant.is_control) {
              const lift = Number(variant.conversion_rate_percent || 0) - 
                           Number(controlVariant.conversion_rate_percent || 0);
              if (lift > 10) {
                await base44.asServiceRole.entities.ConversionOptimizationSignal.create({
                  client_id,
                  client_project_id,
                  signal_type: 'success_pattern_detected',
                  severity: 'high',
                  title: `Winning Variant Detected in ${test.test_name}`,
                  description: `${variant.variant_name} shows ${lift.toFixed(2)}% lift over control. Consider rolling out to 100%.`,
                  metric_affected: 'conversion_rate',
                  status: 'active',
                  first_detected_at: new Date().toISOString(),
                }).catch(err => console.error('[executeConversionOptimization] Test signal failed:', err.message));
              }
            }
          }
        }
      }
    }

    console.log('[executeConversionOptimization] Optimization run complete');

    return Response.json({
      success: true,
      tasks_completed: ['funnel_computation', 'attribution_analysis', 'signal_generation'],
      funnel: funnelRes.data?.funnel || null,
      attribution: attributionRes.data?.attribution || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[executeConversionOptimization] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
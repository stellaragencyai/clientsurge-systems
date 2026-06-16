import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Compute Event Pipeline Metrics: Derives normalized event views for dashboards
 * Provides efficiency scores, dedup summaries, collapse statistics
 * 
 * Scheduled: runs every hour per tenant
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { client_id, client_project_id, period = '24h' } = await req.json();

    const results = {
      computed: false,
      period,
      metrics: {},
    };

    // Calculate time range
    const now = new Date();
    let periodMs = 86400000; // 24h default
    if (period === '1h') periodMs = 3600000;
    if (period === '7d') periodMs = 604800000;
    if (period === '30d') periodMs = 2592000000;

    const periodStart = new Date(now.getTime() - periodMs);

    // Fetch all dedup/collapse logs in period
    const dedupLogs = await base44.asServiceRole.entities.EventDedupLog.filter(
      {
        client_id,
        client_project_id,
      },
      '-created_at',
      10000
    ).then(logs => logs?.filter(l => new Date(l.created_at) > periodStart) || [])
      .catch(() => []);

    // Aggregate metrics
    const metrics = {
      client_id,
      client_project_id,
      metric_period: period,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      total_raw_events: 0,
      unique_events_count: 0,
      duplicate_events_count: 0,
      collapsed_event_groups: 0,
      collapsed_events_total: 0,
      failed_events_count: 0,
      replay_detected_count: 0,
      by_event_type: {},
      by_channel: {},
      top_collapsed_sources: [],
      computed_at: now.toISOString(),
    };

    // Process dedup logs
    for (const log of dedupLogs) {
      const duplicateCount = log.duplicate_event_ids?.length || 0;

      if (log.dedup_type === 'strict_duplicate') {
        metrics.unique_events_count++;
        metrics.duplicate_events_count += duplicateCount;
      } else if (log.dedup_type === 'collapsed_group') {
        metrics.collapsed_event_groups++;
        metrics.collapsed_events_total += duplicateCount;
      } else if (log.dedup_type === 'replay_detected') {
        metrics.replay_detected_count++;
      } else if (log.status === 'failed') {
        metrics.failed_events_count++;
      }

      // By event type
      if (!metrics.by_event_type[log.event_type]) {
        metrics.by_event_type[log.event_type] = { total: 0, unique: 0, duplicates: 0 };
      }
      metrics.by_event_type[log.event_type].total++;
      if (log.dedup_type === 'strict_duplicate') {
        metrics.by_event_type[log.event_type].unique++;
        metrics.by_event_type[log.event_type].duplicates += duplicateCount;
      }

      // By channel
      if (!metrics.by_channel[log.channel]) {
        metrics.by_channel[log.channel] = { total: 0, unique: 0 };
      }
      metrics.by_channel[log.channel].total++;
      if (log.dedup_type === 'strict_duplicate') {
        metrics.by_channel[log.channel].unique++;
      }
    }

    // Calculate totals
    metrics.total_raw_events =
      metrics.unique_events_count +
      metrics.duplicate_events_count +
      metrics.collapsed_events_total;

    // Calculate efficiency score
    if (metrics.total_raw_events > 0) {
      metrics.processing_efficiency_score =
        Math.round((metrics.unique_events_count / metrics.total_raw_events) * 100);
    }

    // Store metrics
    await base44.asServiceRole.entities.EventPipelineMetrics.create(metrics).catch(() => {});

    results.computed = true;
    results.metrics = metrics;

    console.log(`[computeEventPipelineMetrics] Metrics computed:`, {
      client_id,
      client_project_id,
      period,
      efficiency: metrics.processing_efficiency_score,
    });

    return Response.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[computeEventPipelineMetrics] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
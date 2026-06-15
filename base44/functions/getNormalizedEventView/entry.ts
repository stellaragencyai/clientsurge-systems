import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Get Normalized Event View: Returns clean, deduplicated event stream for dashboards
 * No duplicate noise, proper collapse groups, full auditability
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');
    const clientProjectId = url.searchParams.get('client_project_id');
    const eventType = url.searchParams.get('event_type');
    const period = url.searchParams.get('period') || '24h';

    // Calculate time range
    const now = new Date();
    let periodMs = 86400000; // 24h default
    if (period === '1h') periodMs = 3600000;
    if (period === '7d') periodMs = 604800000;
    if (period === '30d') periodMs = 2592000000;

    const periodStart = new Date(now.getTime() - periodMs);

    // Fetch dedup logs (canonical events only)
    const dedupLogs = await base44.asServiceRole.entities.EventDedupLog.filter(
      {
        client_id: clientId,
        client_project_id: clientProjectId,
        dedup_type: { $in: ['strict_duplicate', 'collapsed_group'] },
      },
      '-created_at',
      1000
    ).then(logs =>
      logs
        ?.filter(l => new Date(l.created_at) > periodStart)
        ?.filter(l => !eventType || l.event_type === eventType) || []
    )
      .catch(() => []);

    // Transform to normalized view
    const normalizedEvents = dedupLogs.map(log => ({
      canonical_event_id: log.canonical_event_id,
      event_type: log.event_type,
      channel: log.channel,
      processing_state: log.processing_state,
      duplicate_count: log.duplicate_count || 0,
      collapsed_group_size: log.dedup_type === 'collapsed_group' ? (log.duplicate_count || 1) : null,
      time_window_start: log.time_window_start,
      time_window_end: log.time_window_end,
      failure_reason: log.failure_reason || null,
      created_at: log.created_at,
      metadata: log.metadata_json ? JSON.parse(log.metadata_json) : null,
    }));

    // Aggregate summary
    const summary = {
      total_canonical_events: normalizedEvents.length,
      total_suppressed_duplicates: normalizedEvents.reduce((sum, e) => sum + (e.duplicate_count || 0), 0),
      collapsed_groups: normalizedEvents.filter(e => e.collapsed_group_size).length,
      events_in_collapsed_groups: normalizedEvents
        .filter(e => e.collapsed_group_size)
        .reduce((sum, e) => sum + (e.collapsed_group_size || 0), 0),
      failed_events: normalizedEvents.filter(e => e.failure_reason).length,
      by_processing_state: {},
      by_event_type: {},
    };

    // Count by processing state
    for (const event of normalizedEvents) {
      summary.by_processing_state[event.processing_state] =
        (summary.by_processing_state[event.processing_state] || 0) + 1;
      summary.by_event_type[event.event_type] =
        (summary.by_event_type[event.event_type] || 0) + 1;
    }

    return Response.json({
      success: true,
      period,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      summary,
      normalized_events: normalizedEvents.slice(0, 100), // Pagination
      total_events: normalizedEvents.length,
    });
  } catch (error) {
    console.error('[getNormalizedEventView] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
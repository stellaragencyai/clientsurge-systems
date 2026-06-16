import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Scale Metrics: Real-time observability into event queue, processing pipelines, rate limits
 * Used by Mission Control dashboard
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const clientId = url.searchParams.get('client_id');

    const metrics = {
      timestamp: new Date().toISOString(),
      queue_depth: 0,
      processing_rate: 0,
      failure_rate: 0,
      rate_limited_events: 0,
      dead_letters: 0,
      by_event_category: {},
      by_processor_type: {},
    };

    // Queue depth (queued + processing)
    const queuedCount = await base44.asServiceRole.entities.EventQueue.filter(
      { status: 'queued' },
      '-created_date',
      1000
    ).then(e => e?.length || 0).catch(() => 0);

    const processingCount = await base44.asServiceRole.entities.EventQueue.filter(
      { status: 'processing' },
      '-created_date',
      1000
    ).then(e => e?.length || 0).catch(() => 0);

    metrics.queue_depth = queuedCount + processingCount;

    // Completed in last hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    const completedRecent = await base44.asServiceRole.entities.EventQueue.filter(
      { status: 'completed' },
      '-created_date',
      10000
    ).then(events => events?.filter(e => new Date(e.completed_at) > oneHourAgo).length || 0)
      .catch(() => 0);

    const failedRecent = await base44.asServiceRole.entities.EventQueue.filter(
      { status: 'failed' },
      '-created_date',
      10000
    ).then(events => events?.filter(e => new Date(e.last_retry_at) > oneHourAgo).length || 0)
      .catch(() => 0);

    if (completedRecent + failedRecent > 0) {
      metrics.processing_rate = Math.round((completedRecent / (completedRecent + failedRecent)) * 100);
      metrics.failure_rate = 100 - metrics.processing_rate;
    }

    // Rate limited events
    const rateLimited = await base44.asServiceRole.entities.EventQueue.filter(
      { rate_limited: true },
      '-created_date',
      10000
    ).then(e => e?.length || 0).catch(() => 0);
    metrics.rate_limited_events = rateLimited;

    // Dead letters
    const deadLetters = await base44.asServiceRole.entities.DeadLetterLog.filter(
      {},
      '-created_date',
      1000
    ).then(e => e?.length || 0).catch(() => 0);
    metrics.dead_letters = deadLetters;

    return Response.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('[getScaleMetrics] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
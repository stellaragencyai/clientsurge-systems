/**
 * SPEED OPTIMIZATION #5: Idempotency Key TTL Pruning
 * Weekly scheduled job. Archives IdempotencyKey records older than 90 days.
 * Prevents unbounded table growth that slows every lookup scan.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const authHeader = req.headers.get('Authorization') || '';
    const isScheduled = authHeader.includes(Deno.env.get('AUTOMATION_SHARED_SECRET') || '');
    if (!isScheduled) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    }

    // FIX #22: Enforce 30-day TTL (down from 90 days) to prevent unbounded table growth
    const cutoffDays = 30;
    const cutoff = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000).toISOString();

    // Also hard-delete entries older than 90 days to reclaim storage
    const hardDeleteCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    let totalArchived = 0;
    let totalDeleted = 0;
    let page = 0;
    const batchSize = 50;

    while (true) {
      const old = await base44.asServiceRole.entities.IdempotencyKey.filter(
        {},
        'created_date',
        batchSize
      ).catch(() => []);

      const toHardDelete = (old || []).filter(k => k.created_date < hardDeleteCutoff);
      const toArchive = (old || []).filter(k => k.created_date >= hardDeleteCutoff && k.created_date < cutoff && k.status === 'completed');

      if (toHardDelete.length === 0 && toArchive.length === 0) break;

      // Hard delete very old keys (>90 days)
      for (const key of toHardDelete) {
        await base44.asServiceRole.entities.IdempotencyKey.delete(key.id).catch(() => null);
        totalDeleted++;
      }

      // Archive 30-90 day old completed keys
      for (const key of toArchive) {
        await base44.asServiceRole.entities.IdempotencyKey.update(key.id, {
          status: 'skipped',
          metadata_json: JSON.stringify({ archived_at: new Date().toISOString(), original_status: key.status, reason: 'ttl_30d' }),
        }).catch(() => null);
        totalArchived++;
      }

      page++;
      if ((toHardDelete.length + toArchive.length) < batchSize) break;
      if (page > 20) break; // Safety: max 1000 per run
    }

    console.log(`[prune-idempotency] Archived=${totalArchived}, HardDeleted=${totalDeleted}, TTL=${cutoffDays}d`);
    return Response.json({ success: true, archived: totalArchived, hard_deleted: totalDeleted, cutoff_days: cutoffDays, cutoff_date: cutoff });

  } catch (error) {
    console.error('[prune-idempotency] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
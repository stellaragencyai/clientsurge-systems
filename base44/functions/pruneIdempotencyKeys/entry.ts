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

    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch in batches of 50 to avoid memory issues
    let totalArchived = 0;
    let page = 0;
    const batchSize = 50;

    while (true) {
      const old = await base44.asServiceRole.entities.IdempotencyKey.filter(
        { status: 'completed' },
        'created_date',
        batchSize
      ).catch(() => []);

      const toArchive = (old || []).filter(k => k.created_date < cutoff);
      if (toArchive.length === 0) break;

      for (const key of toArchive) {
        await base44.asServiceRole.entities.IdempotencyKey.update(key.id, {
          status: 'skipped',
          metadata_json: JSON.stringify({ archived_at: new Date().toISOString(), original_status: key.status }),
        }).catch(() => null);
        totalArchived++;
      }

      page++;
      if (toArchive.length < batchSize) break;
      if (page > 20) break; // Safety limit: max 1000 per run
    }

    console.log(`[prune-idempotency] Archived ${totalArchived} old keys`);
    return Response.json({ success: true, archived: totalArchived, cutoff_date: cutoff });

  } catch (error) {
    console.error('[prune-idempotency] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
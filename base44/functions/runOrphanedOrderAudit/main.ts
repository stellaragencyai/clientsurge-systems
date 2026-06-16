/**
 * Task 1 — Orphaned Order Cleanup
 * Finds and flags orders without funnel_identity_id
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 200);
    const orphans = orders.filter((o) => !o.funnel_identity_id);

    for (const order of orphans) {
      await base44.asServiceRole.entities.Order.update(order.id, {
        notes: [order.notes, '[AUDIT] Missing funnel_identity_id — requires review']
          .filter(Boolean).join('\n'),
      }).catch((e) => console.error(`Flag failed for order ${order.id}:`, e.message));
    }

    console.log(`Orphaned order audit: ${orphans.length} flagged`);
    return Response.json({ success: true, flagged: orphans.length, ids: orphans.map((o) => o.id) });
  } catch (error) {
    console.error('runOrphanedOrderAudit error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
/**
 * Task 1 — Orphaned order audit helper
 * Identifies & flags orders without a valid funnel_identity_id
 */

export async function findOrphanedOrders(base44, limit = 100) {
  try {
    const orders = await base44.asServiceRole.entities.Order.list('-created_date', limit);
    return orders.filter((o) => !o.funnel_identity_id);
  } catch (err) {
    console.error('findOrphanedOrders error:', err.message);
    return [];
  }
}

export async function flagOrphanedOrders(base44) {
  const orphans = await findOrphanedOrders(base44);
  for (const order of orphans) {
    await base44.asServiceRole.entities.Order.update(order.id, {
      notes: [order.notes, '[AUDIT] Missing funnel_identity_id — requires review'].filter(Boolean).join('\n'),
    }).catch((e) => console.error(`Failed to flag order ${order.id}:`, e.message));
  }
  return orphans.length;
}

Deno.serve(() => new Response('shared module', { status: 200 }));
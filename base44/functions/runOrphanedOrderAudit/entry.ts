import { resendFetch } from "../_shared/resendFetch.js";
/**
 * FIX #13-15, #18: Orphaned Order Audit
 * Detects: missing funnel_identity_id, stuck pending payments (>6h unpaid), DLQ accumulation.
 * Admin notified via email if critical orphans found.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

    const orders = await base44.asServiceRole.entities.Order.list('-created_date', 200);

    // FIX #18: Detect orders stuck in pending/unpaid for >6 hours
    const stuckOrders = orders.filter((o) =>
      (o.payment_status === 'pending' || o.payment_status === 'unpaid' || !o.payment_status) &&
      o.created_date < sixHoursAgo
    );

    // Orphaned orders (missing funnel_identity_id)
    const orphans = orders.filter((o) => !o.funnel_identity_id);

    // FIX #14: Check DeadLetterLog accumulation
    let dlqCount = 0;
    try {
      const dlq = await base44.asServiceRole.entities.DeadLetterLog.list('-created_date', 100);
      dlqCount = (dlq || []).filter((d) => !d.resolved).length;
    } catch (_e) {}

    // Flag orphans
    for (const order of orphans) {
      await base44.asServiceRole.entities.Order.update(order.id, {
        notes: [order.notes, `[AUDIT ${now.toISOString()}] Missing funnel_identity_id — requires review`]
          .filter(Boolean).join('\n'),
      }).catch((e) => console.error(`Flag failed for order ${order.id}:`, e.message));
    }

    // Notify admin if critical issues found
    const criticalIssues = stuckOrders.length > 0 || dlqCount > 10;
    if (criticalIssues) {
      const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || Deno.env.get('ADMIN_EMAIL');
      const resendKey = Deno.env.get('RESEND_API_KEY');
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'support@clientsurgesystems.com';
      if (resendKey && adminEmail) {
        await resendFetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `ClientSurge Systems <${fromEmail}>`,
            to: [adminEmail],
            subject: `🚨 Daily Order Audit — ${stuckOrders.length} Stuck Payments, DLQ: ${dlqCount}`,
            html: `
              <h2>Daily Order Audit Report</h2>
              <p><strong>Orphaned Orders (missing funnel_identity_id):</strong> ${orphans.length}</p>
              <p><strong>Stuck Payments (>6h unpaid):</strong> ${stuckOrders.length}</p>
              ${stuckOrders.length > 0 ? `<ul>${stuckOrders.map(o => `<li>${o.id} — ${o.customer_email} — created: ${o.created_date}</li>`).join('')}</ul>` : ''}
              <p><strong>Unresolved Dead Letter Queue entries:</strong> ${dlqCount}</p>
              <p><em>Audit run at: ${now.toISOString()}</em></p>
            `,
          }),
        }).catch(e => console.error('[runOrphanedOrderAudit] Admin email failed:', e.message));
      }
    }

    console.log(`[runOrphanedOrderAudit] orphans=${orphans.length} stuck=${stuckOrders.length} dlq=${dlqCount}`);
    return Response.json({
      success: true,
      flagged_orphans: orphans.length,
      stuck_payments: stuckOrders.length,
      dlq_unresolved: dlqCount,
      admin_notified: criticalIssues,
    });
  } catch (error) {
    console.error('runOrphanedOrderAudit error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
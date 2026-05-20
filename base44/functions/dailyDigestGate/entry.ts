/**
 * dailyDigestGate.ts — #113
 * Gate: skip sendDailyDigest if leads_today === 0 AND orders_today === 0.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString();

    const [leads, orders] = await Promise.all([
      base44.asServiceRole.entities.SpaLead.list().catch(() => []),
      base44.asServiceRole.entities.Order.list().catch(() => []),
    ]);

    const leadsToday = (leads||[]).filter((l:any) => l.created_date >= todayStr).length;
    const ordersToday = (orders||[]).filter((o:any) => o.created_date >= todayStr && o.payment_status === "paid").length;

    if (leadsToday === 0 && ordersToday === 0) {
      return Response.json({ success: true, skipped: true, reason: "No leads or orders today — digest skipped" });
    }

    // Delegate to actual digest function
    const digest = await base44.asServiceRole.functions.invoke("sendDailyDigest", {}).catch((e:any) => ({ error: e.message }));
    return Response.json({ success: true, skipped: false, leads_today: leadsToday, orders_today: ordersToday, digest });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

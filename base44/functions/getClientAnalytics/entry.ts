/**
 * getClientAnalytics — #155
 * Replaces all hardcoded mock data with real entity queries.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, period_days = 30 } = await req.json();

    const sinceDate = new Date(Date.now() - period_days * 86400000).toISOString();

    // Real entity queries — no mock data (#155)
    const [orders, leads, onboardings] = await Promise.all([
      order_id
        ? base44.asServiceRole.entities.Order.filter({ id: order_id }).catch(() => [])
        : base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []),
      base44.asServiceRole.entities.SpaLead.list().catch(() => []),
      base44.asServiceRole.entities.ClientOnboarding.list().catch(() => []),
    ]);

    const paidOrders = (orders || []).filter((o: any) => o.payment_status === "paid");
    const mrr = paidOrders.reduce((s: number, o: any) => s + (Number(o.monthly_rate) || 0), 0);
    const arr = mrr * 12;
    const setupRevenue = paidOrders.reduce((s: number, o: any) => s + (Number(o.setup_fee) || 0), 0);

    const recentLeads = (leads || []).filter((l: any) => l.created_date >= sinceDate);
    const contacted = recentLeads.filter((l: any) => l.status === "Contacted" || l.status === "Booked").length;
    const booked = recentLeads.filter((l: any) => l.demo_booked || l.status === "Booked").length;
    const responseRate = recentLeads.length > 0 ? Math.round((contacted / recentLeads.length) * 100) : 0;

    return Response.json({
      success: true,
      metrics: {
        mrr, arr, setup_revenue: setupRevenue,
        total_clients: paidOrders.length,
        active_leads: recentLeads.length,
        contacts: contacted, booked,
        response_rate: responseRate,
        period_days,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

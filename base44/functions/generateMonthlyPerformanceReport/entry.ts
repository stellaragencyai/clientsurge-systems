/**
 * generateMonthlyPerformanceReport — #422 #422a #422b #422d
 * Elite perk #2. Runs 1st of month.
 * Queries real entity data + sends HTML report to client.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

// #422a: data queries per metric
async function gatherMetrics(base44: any, order_id: string, order: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  const [leads, onboarding] = await Promise.all([
    base44.asServiceRole.entities.SpaLead.filter({ created_by: order.created_by }).catch(() => []),
    base44.asServiceRole.entities.ClientOnboarding.filter({ email: order.client_email }).catch(() => []),
  ]);

  const monthLeads = (leads || []).filter((l: any) => l.created_date >= startOfMonth && l.created_date <= endOfMonth);
  const totalLeads = monthLeads.length;
  const contacted = monthLeads.filter((l: any) => l.status === "Contacted" || l.status === "Booked").length;
  const booked = monthLeads.filter((l: any) => l.demo_booked || l.status === "Booked").length;
  const responseRate = totalLeads > 0 ? Math.round((contacted / totalLeads) * 100) : 0;
  const bookingRate = totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0;

  return { totalLeads, contacted, booked, responseRate, bookingRate, period: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}` };
}

// #422b: HTML report template
function buildReportHtml(client_name: string, metrics: any): string {
  return `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;">
    <h2 style="color:#0A0F1E;font-size:22px;font-weight:800;margin:0 0 4px">Monthly Performance Report</h2>
    <p style="color:#6B7280;font-size:13px;margin:0 0 28px">${metrics.period} · ${client_name}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px">
      ${[
        ["Total Leads", metrics.totalLeads, "#00D4FF"],
        ["Leads Contacted", metrics.contacted, "#00FFB3"],
        ["Demos Booked", metrics.booked, "#A78BFA"],
        ["Response Rate", `${metrics.responseRate}%`, "#F59E0B"],
      ].map(([label, val, color]) => `<div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px">
        <p style="color:#6B7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">${label}</p>
        <p style="color:${color};font-size:26px;font-weight:900;margin:0">${val}</p>
      </div>`).join("")}
    </div>
    <p style="color:#374151;font-size:14px;line-height:1.7">Your AI system processed <b>${metrics.totalLeads} leads</b> last month with a <b>${metrics.responseRate}% response rate</b>. ${metrics.booked > 0 ? `<b>${metrics.booked} demos were booked</b> — great progress!` : "Keep building momentum — we're here to help."}</p>
    <p style="color:#6B7280;font-size:13px;margin-top:24px">Questions about your results? Reply to this email or call Nolan directly.</p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    // If no order_id, run for ALL elite orders
    let orders: any[] = [];
    if (order_id) {
      const o = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (o) orders = [o];
    } else {
      orders = await base44.asServiceRole.entities.Order.filter({ package_key: "elite", payment_status: "paid" }).catch(() => []);
    }

    let sent = 0;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    for (const order of (orders || [])) {
      const metrics = await gatherMetrics(base44, order.id, order);
      const html = buildReportHtml(order.client_name || "Client", metrics);

      if (order.client_email && resendKey) {
        await resendFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "system@clientsurgesystems.com",
            reply_to: "nolan@clientsurgesystems.com",
            to: order.client_email,
            subject: `📊 Your ${metrics.period} Performance Report — ${order.client_name}`,
            html,
          }),
        }).catch(() => {});
        sent++;
      }
    }

    return Response.json({ success: true, reports_sent: sent, total_orders: orders.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

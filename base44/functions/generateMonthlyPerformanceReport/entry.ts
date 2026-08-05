import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * generateMonthlyPerformanceReport — #422 #422a #422b #422c #422d
 * FIX: Was using non-existent SpaLead entity and client_email field on Order.
 * Now uses canonical Leads entity, CommunicationLog, and saves to Reports entity.
 * Runs for all pro_system / elite tier paid orders.
 */

const ELITE_KEYS = new Set(["pro_system", "elite_system", "elite", "pro"]);

async function gatherMetrics(base44, order) {
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const period = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString("en-US", {
    month: "long", year: "numeric",
  });

  let leads = [];
  const clientProjectId = order.client_project_id;

  if (clientProjectId) {
    leads = await base44.asServiceRole.entities.Leads.filter(
      { client_project_id: clientProjectId },
      "-created_date",
      200
    ).catch(() => []);
  } else if (order.customer_email) {
    leads = await base44.asServiceRole.entities.Leads.filter(
      { email: order.customer_email },
      "-created_date",
      200
    ).catch(() => []);
  }

  const monthLeads = (leads || []).filter(l =>
    l.created_date >= startOfLastMonth && l.created_date <= endOfLastMonth
  );

  const totalLeads = monthLeads.length;
  const contacted = monthLeads.filter(l =>
    l.outreach_status === "contacted" || l.crm_stage === "Contacted" || l.lead_state === "ENGAGED"
  ).length;
  const booked = monthLeads.filter(l =>
    l.lead_state === "BOOKED" || l.crm_stage === "Audit Booked" || l.status === "Booked"
  ).length;
  const responseRate = totalLeads > 0 ? Math.round((contacted / totalLeads) * 100) : 0;
  const bookingRate = totalLeads > 0 ? Math.round((booked / totalLeads) * 100) : 0;

  // Query CommunicationLog for actual send counts this month
  let smsSent = 0, emailSent = 0;
  if (clientProjectId) {
    const commLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
      { related_entity_type: "Leads" },
      "-created_date",
      200
    ).catch(() => []);
    const monthLogs = (commLogs || []).filter(c =>
      c.sent_at >= startOfLastMonth && c.sent_at <= endOfLastMonth && c.delivery_status !== "skipped"
    );
    smsSent = monthLogs.filter(c => c.channel === "sms").length;
    emailSent = monthLogs.filter(c => c.channel === "email").length;
  }

  return { totalLeads, contacted, booked, responseRate, bookingRate, smsSent, emailSent, period };
}

function buildReportHtml(clientName, metrics) {
  const cards = [
    ["Total Leads", metrics.totalLeads, "#00AEEF"],
    ["Leads Contacted", metrics.contacted, "#10b981"],
    ["Demos Booked", metrics.booked, "#A78BFA"],
    ["Response Rate", `${metrics.responseRate}%`, "#F59E0B"],
    ["SMS Sent", metrics.smsSent, "#0088CC"],
    ["Emails Sent", metrics.emailSent, "#003B8F"],
  ];

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;">
    <h2 style="color:#0A0F1E;font-size:22px;font-weight:800;margin:0 0 4px;">Monthly Performance Report</h2>
    <p style="color:#6B7280;font-size:13px;margin:0 0 28px;">${metrics.period} · ${clientName}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;">
      ${cards.map(([label, val, color]) => `
      <div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;">
        <p style="color:#6B7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">${label}</p>
        <p style="color:${color};font-size:26px;font-weight:900;margin:0;">${val}</p>
      </div>`).join("")}
    </div>
    <p style="color:#374151;font-size:14px;line-height:1.7;">Your AI system processed <b>${metrics.totalLeads} leads</b> in ${metrics.period} with a <b>${metrics.responseRate}% response rate</b>. ${metrics.booked > 0 ? `<b>${metrics.booked} demos were booked</b> — great progress!` : "Keep building momentum — we're here to help."}</p>
    <p style="color:#6B7280;font-size:13px;margin-top:24px;">Questions about your results? Reply to this email and our team will help.</p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json().catch(() => ({}));

    let orders = [];
    if (order_id) {
      const o = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (o) orders = [o];
    } else {
      // Run for all paid Elite/Pro orders
      const all = await base44.asServiceRole.entities.Order.filter(
        { payment_status: "paid" },
        "-created_date",
        100
      ).catch(() => []);
      orders = (all || []).filter(o =>
        ELITE_KEYS.has(o.package_key) ||
        ELITE_KEYS.has(o.package_type) ||
        ELITE_KEYS.has(o.selected_package_type)
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";
    let sent = 0;

    for (const order of orders) {
      const customerEmail = order.customer_email;
      if (!customerEmail) continue;

      const metrics = await gatherMetrics(base44, order);
      const clientName = order.customer_name || order.business_name || "Client";
      const html = buildReportHtml(clientName, metrics);

      // #422c: Save report to Reports entity
      base44.asServiceRole.entities.Reports.create({
        order_id: order.id,
        client_email: customerEmail,
        report_month: metrics.period,
        total_leads: metrics.totalLeads,
        leads_contacted: metrics.contacted,
        bookings_created: metrics.booked,
        response_rate: metrics.responseRate,
        sms_sent: metrics.smsSent,
        emails_sent: metrics.emailSent,
        report_html: html.slice(0, 5000),
        delivered_at: new Date().toISOString(),
      }).catch(() => {});

      if (resendKey) {
        const res = await resendFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `ClientSurge Systems <${fromEmail}>`,
            reply_to: "nolan@clientsurgesystems.com",
            to: customerEmail,
            subject: `📊 Your ${metrics.period} Performance Report — ${clientName}`,
            html,
          }),
        }).catch(() => null);
        if (res?.ok) sent++;
      }

      console.log(`[generateMonthlyPerformanceReport] Report for ${customerEmail}: ${metrics.totalLeads} leads, ${metrics.responseRate}% response`);
    }

    return new Response(JSON.stringify({ success: true, reports_sent: sent, total_orders: orders.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generateMonthlyPerformanceReport]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
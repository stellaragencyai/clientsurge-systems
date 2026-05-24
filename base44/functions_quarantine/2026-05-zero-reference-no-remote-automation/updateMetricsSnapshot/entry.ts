/**
 * Update Metrics Snapshot - runs hourly
 * Aggregates all lead/booking data into easy-to-read metrics
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id, period = "today" } = await req.json();

    if (!project_id) {
      return Response.json({ error: "project_id required" }, { status: 400 });
    }

    console.log(`[Metrics] Updating snapshot for ${period}`);

    const { startDate, endDate } = getPeriodRange(period);

    // Get all leads in period
    const leads = await base44.asServiceRole.entities.Leads.filter({}, "-created_date", 5000);
    const leadsInPeriod = leads.filter((l) => {
      const created = new Date(l.created_date);
      return created >= startDate && created <= endDate;
    });

    // Get all events for these leads
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      {},
      "-created_date",
      10000
    );
    const leadIds = new Set(leadsInPeriod.map((l) => l.id));
    const eventsInPeriod = events.filter((e) => leadIds.has(e.lead_id));

    // Calculate metrics
    const metrics = {
      leads_captured: leadsInPeriod.length,
      leads_responded: new Set(
        eventsInPeriod.filter((e) => e.direction === "inbound").map((e) => e.lead_id)
      ).size,
      leads_booked: leadsInPeriod.filter((l) => l.status === "Booked").length,
      avg_response_time_minutes: calculateAvgResponseTime(eventsInPeriod),
      booking_rate_percent: calculateBookingRate(leadsInPeriod),
      response_rate_percent:
        leadsInPeriod.length > 0
          ? Math.round(
              (new Set(
                eventsInPeriod
                  .filter((e) => e.direction === "inbound")
                  .map((e) => e.lead_id)
              ).size /
                leadsInPeriod.length) *
                100
            )
          : 0,
      sla_misses: calculateSLAMisses(leadsInPeriod, eventsInPeriod),
      churn_risk_count: leadsInPeriod.filter(
        (l) => l.activation_priority === "High" && l.status === "Booked"
      ).length,
      automations_fired: eventsInPeriod.filter(
        (e) => e.event_type.includes("automation")
      ).length,
      ai_decisions_made: eventsInPeriod.length, // Placeholder
    };

    // Generate alerts
    const alerts = generateAlerts(metrics);

    // Find top closer
    const closers = await base44.asServiceRole.entities.Leads.filter(
      { status: "Booked" },
      "-created_date",
      5000
    );
    const topCloser = getTopCloser(closers.filter((l) => leadIds.has(l.id)));

    // Save snapshot
    await base44.asServiceRole.entities.MetricsSnapshot.create({
      project_id,
      period,
      snapshot_date: new Date().toISOString(),
      leads_captured: metrics.leads_captured,
      leads_responded: metrics.leads_responded,
      response_rate_percent: metrics.response_rate_percent,
      avg_response_time_minutes: metrics.avg_response_time_minutes,
      leads_booked: metrics.leads_booked,
      booking_rate_percent: metrics.booking_rate_percent,
      revenue_booked: 0, // Would calculate from booked leads
      top_closer: topCloser?.assigned_to,
      top_closer_rate: topCloser?.rate,
      sla_misses: metrics.sla_misses,
      churn_risk_count: metrics.churn_risk_count,
      automations_fired: metrics.automations_fired,
      ai_decisions_made: metrics.ai_decisions_made,
      alerts,
    });

    console.log(`[Metrics] ✅ Snapshot saved`);

    return Response.json({
      success: true,
      project_id,
      period,
      metrics,
      alerts,
    });
  } catch (error) {
    console.error("[Metrics] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function getPeriodRange(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "this_week":
      const d = new Date(now);
      d.setDate(now.getDate() - now.getDay());
      startDate = d;
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "all_time":
      startDate = new Date("2020-01-01");
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { startDate, endDate: now };
}

function calculateAvgResponseTime(events) {
  const responsePairs = [];
  events.forEach((e) => {
    if (e.direction === "outbound") {
      const reply = events.find(
        (r) =>
          r.lead_id === e.lead_id &&
          r.direction === "inbound" &&
          new Date(r.created_date) > new Date(e.created_date)
      );
      if (reply) {
        const minutes = Math.round(
          (new Date(reply.created_date) - new Date(e.created_date)) / 60000
        );
        responsePairs.push(minutes);
      }
    }
  });

  return responsePairs.length > 0
    ? Math.round(
        responsePairs.reduce((a, b) => a + b, 0) / responsePairs.length
      )
    : null;
}

function calculateBookingRate(leads) {
  if (leads.length === 0) return 0;
  const booked = leads.filter((l) => l.status === "Booked").length;
  return Math.round((booked / leads.length) * 100);
}

function calculateSLAMisses(leads, events) {
  let misses = 0;
  leads.forEach((lead) => {
    const firstOutbound = events.find(
      (e) => e.lead_id === lead.id && e.direction === "outbound"
    );
    const created = new Date(lead.created_date);
    if (firstOutbound) {
      const responseTime = Math.round(
        (new Date(firstOutbound.created_date) - created) / 60000
      );
      if (responseTime > 60) misses++; // 60 min SLA
    }
  });
  return misses;
}

function generateAlerts(metrics) {
  const alerts = [];

  if (metrics.response_rate_percent < 80) {
    alerts.push({
      type: "yellow",
      message: `Low response rate: ${metrics.response_rate_percent}% (target: 90%+)`,
    });
  }

  if (metrics.sla_misses > 0) {
    alerts.push({
      type: "red",
      message: `${metrics.sla_misses} leads missed SLA`,
    });
  }

  if (metrics.leads_booked > 5) {
    alerts.push({
      type: "green",
      message: `🎉 Record bookings: ${metrics.leads_booked}`,
    });
  }

  if (metrics.churn_risk_count > 0) {
    alerts.push({
      type: "yellow",
      message: `${metrics.churn_risk_count} customers at churn risk`,
    });
  }

  return alerts;
}

function getTopCloser(leads) {
  const closers = {};
  leads.forEach((l) => {
    closers[l.assigned_to] = (closers[l.assigned_to] || 0) + 1;
  });

  let topEmail = null;
  let topCount = 0;
  Object.entries(closers).forEach(([email, count]) => {
    if (count > topCount) {
      topEmail = email;
      topCount = count;
    }
  });

  return topEmail
    ? { assigned_to: topEmail, rate: Math.round((topCount / leads.length) * 100) }
    : null;
}
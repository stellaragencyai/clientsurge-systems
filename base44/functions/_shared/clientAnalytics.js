const LEAD_RESPONSE_STATUSES = new Set([
  "Contacted",
  "Replied",
  "Qualified",
  "Booking Prompt Sent",
  "Booked",
  "Closed",
]);

const BOOKED_STATUSES = new Set(["Booked", "Closed"]);

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDateValue(record) {
  return record?.created_date || record?.created_at || record?.updated_date || "";
}

function isWithinPeriod(record, sinceDate) {
  const value = getDateValue(record);
  return value ? value >= sinceDate : false;
}

function getOrderMonthly(order) {
  return toNumber(
    order?.total_monthly ||
      order?.monthly_rate ||
      order?.pricing_summary?.total_monthly
  );
}

function getOrderSetup(order) {
  return toNumber(
    order?.total_setup ||
      order?.setup_fee ||
      order?.pricing_summary?.total_setup
  );
}

function normalizeLeadStatus(status) {
  return typeof status === "string" && status.trim() ? status.trim() : "New";
}

function buildPipeline(leads) {
  const counts = new Map();
  for (const lead of leads) {
    const status = normalizeLeadStatus(lead.status);
    counts.set(status, (counts.get(status) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

function buildWeekBuckets(leads, { now = new Date(), periodDays = 30 } = {}) {
  const bucketCount = Math.max(1, Math.ceil(periodDays / 7));
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (bucketCount - index - 1) * 7);
    return {
      start,
      week: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      leads: 0,
    };
  });

  for (const lead of leads) {
    const created = new Date(getDateValue(lead));
    if (Number.isNaN(created.getTime())) continue;
    const bucket = buckets
      .slice()
      .reverse()
      .find((entry) => created >= entry.start);
    if (bucket) bucket.leads += 1;
  }

  return buckets.map(({ week, leads }) => ({ week, leads }));
}

function countEvents(events, predicate) {
  return events.filter(predicate).length;
}

export function buildClientAnalytics({
  orders = [],
  leads = [],
  events = [],
  periodDays = 30,
  now = new Date(),
} = {}) {
  const sinceDate = new Date(now.getTime() - periodDays * 86400000).toISOString();
  const paidOrders = orders.filter((order) => order?.payment_status === "paid");
  const recentLeads = leads.filter((lead) => isWithinPeriod(lead, sinceDate));
  const respondedLeads = recentLeads.filter((lead) =>
    LEAD_RESPONSE_STATUSES.has(normalizeLeadStatus(lead.status))
  );
  const bookedLeads = recentLeads.filter(
    (lead) => lead.demo_booked || lead.booked_at || BOOKED_STATUSES.has(normalizeLeadStatus(lead.status))
  );
  const qualifiedLeads = recentLeads.filter((lead) =>
    ["Qualified", "Booking Prompt Sent", "Booked", "Closed"].includes(normalizeLeadStatus(lead.status))
  );
  const periodEvents = events.filter((event) => isWithinPeriod(event, sinceDate));
  const mrr = paidOrders.reduce((sum, order) => sum + getOrderMonthly(order), 0);
  const setupRevenue = paidOrders.reduce((sum, order) => sum + getOrderSetup(order), 0);
  const smsSent = countEvents(periodEvents, (event) => event.channel === "sms" && event.status !== "failed");
  const emailSent = countEvents(periodEvents, (event) => event.channel === "email" && event.status !== "failed");
  const failedEvents = countEvents(periodEvents, (event) => event.status === "failed");
  const totalAutomations = countEvents(periodEvents, (event) =>
    ["workflow_triggered", "sms_sent", "email_sent", "provider_send_succeeded"].includes(event.event_type)
  );

  const totals = {
    totalLeads: recentLeads.length,
    bookedLeads: bookedLeads.length,
    qualifiedLeads: qualifiedLeads.length,
    conversionRate:
      recentLeads.length > 0 ? Math.round((bookedLeads.length / recentLeads.length) * 100) : 0,
    responseRate:
      recentLeads.length > 0 ? Math.round((respondedLeads.length / recentLeads.length) * 100) : 0,
    smsSent,
    emailSent,
    totalAutomations,
    failedEvents,
    estimatedRevenue: setupRevenue,
  };

  return {
    success: true,
    lastUpdated: now.toISOString(),
    period_days: periodDays,
    totals,
    pipeline: buildPipeline(recentLeads),
    weeksData: buildWeekBuckets(recentLeads, { now, periodDays }),
    metrics: {
      mrr,
      arr: mrr * 12,
      setup_revenue: setupRevenue,
      total_clients: paidOrders.length,
      active_leads: recentLeads.length,
      contacts: respondedLeads.length,
      booked: bookedLeads.length,
      response_rate: totals.responseRate,
      period_days: periodDays,
    },
  };
}

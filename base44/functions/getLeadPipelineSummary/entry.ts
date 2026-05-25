import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 250;
const EVENT_LIMIT = 5000;
const LEAD_PIPELINE_MAX_FETCH = 5000;
const PRIORITY_MAP = { Hot: 4, High: 3, Medium: 2, Low: 1 };

function getNextAction(lead) {
  const status = lead.status || "New";
  const actions = {
    New: { label: "Send initial outreach", detail: "Lead is new — reach out to qualify and gauge interest." },
    Contacted: { label: "Follow up on contact", detail: "Already contacted. Follow up if no reply in 24-48h." },
    Replied: { label: "Qualify the reply", detail: "They replied — assess intent and move to Qualified or close." },
    Qualified: { label: "Send booking prompt", detail: "Lead is qualified — send a booking link or schedule a call." },
    "Booking Prompt Sent": { label: "Confirm booking", detail: "Booking link was sent — confirm if they've scheduled." },
    Booked: { label: "Prepare for meeting", detail: "Meeting is booked — prep notes and confirm attendance." },
    Closed: { label: "Post-sale follow-up", detail: "Deal closed — send onboarding info and next steps." },
  };
  return actions[status] || { label: "Review lead", detail: "Review lead context and decide next action." };
}

function getRecommendedOffer(lead) {
  const score = lead.lead_score || 0;
  const status = lead.status || "New";
  if (score >= 75 || status === "Booked" || status === "Qualified") {
    return { package_key: "elite_system", package_name: "Elite System", primary_service_name: "Full-Stack Automation" };
  }
  if (score >= 50) {
    return { package_key: "growth_system", package_name: "Growth System", primary_service_name: "Response + Nurture" };
  }
  if (score >= 25) {
    return { package_key: "starter_system", package_name: "Starter System", primary_service_name: "Response + Booking" };
  }
  return { package_key: "single_service", package_name: "Single Service", primary_service_name: "One Core Automation" };
}

function classifySegment(lead) {
  const status = lead.status || "New";
  const score = lead.lead_score || 0;
  const priority = lead.activation_priority || "Low";
  if (status === "Booked") return "awaiting_close";
  if (status === "Booking Prompt Sent" || status === "Qualified") return "follow_up";
  if (priority === "Hot" || priority === "High") return "high_value_outreach";
  if (["Closed", "Rejected"].includes(status)) return "reactivation";
  if (status === "Contacted" || status === "Replied") return "follow_up";
  if (score >= 60) return "nurture";
  return "low_priority";
}

function buildLeadPipelineSnapshot({ leads, filters = {}, limit = 100, offset = 0 }) {
  const status_counts = {};
  for (const lead of leads) {
    const s = lead.status || "New";
    status_counts[s] = (status_counts[s] || 0) + 1;
  }

  const segment_counts = { follow_up: 0, awaiting_close: 0, high_value_outreach: 0, nurture: 0, reactivation: 0, low_priority: 0, demo_requested: 0 };
  for (const lead of leads) {
    const seg = classifySegment(lead);
    if (seg in segment_counts) segment_counts[seg]++;
    if (lead.ai_intent === "booking_ready") segment_counts.demo_requested++;
  }

  const recommended_offer_counts = { starter_system: 0, growth_system: 0, elite_system: 0, single_service: 0 };
  for (const lead of leads) {
    const offer = getRecommendedOffer(lead);
    if (offer.package_key in recommended_offer_counts) recommended_offer_counts[offer.package_key]++;
  }

  const priority_queue = [...leads]
    .filter((l) => !["Closed", "Rejected"].includes(l.status))
    .sort((a, b) => {
      const pa = PRIORITY_MAP[a.activation_priority] || 0;
      const pb = PRIORITY_MAP[b.activation_priority] || 0;
      if (pb !== pa) return pb - pa;
      return (b.lead_score || 0) - (a.lead_score || 0);
    })
    .slice(0, 10)
    .map((lead) => ({ ...lead, next_action: getNextAction(lead), recommended_offer: getRecommendedOffer(lead) }));

  const now = Date.now();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now - (6 - i) * 86400000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const label = dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = leads.filter((l) => {
      const t = new Date(l.created_date).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    }).length;
    return { date: label, leads: count };
  });

  const recent_lead_activity = [...leads]
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 20)
    .map((lead) => ({
      ...lead,
      next_action: getNextAction(lead),
      recommended_offer: getRecommendedOffer(lead),
      recent_movement: { detail: `Status: ${lead.status || "New"} · Score: ${lead.lead_score || 0}` },
    }));

  let filteredLeads = [...leads];
  if (filters.status && filters.status !== "all") {
    filteredLeads = filteredLeads.filter((l) => l.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filteredLeads = filteredLeads.filter(
      (l) =>
        (l.full_name || "").toLowerCase().includes(q) ||
        (l.business_name || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q)
    );
  }

  const total = filteredLeads.length;
  const paginated = filteredLeads
    .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
    .slice(offset, offset + limit)
    .map((lead) => ({ ...lead, next_action: getNextAction(lead), recommended_offer: getRecommendedOffer(lead) }));

  return {
    summary: { total_leads: leads.length, status_counts, segment_counts, recommended_offer_counts, recent_lead_activity, priority_queue, last7Days },
    leads: paginated,
    pagination: { total, limit, offset, has_more: offset + limit < total },
    filter_options: { statuses: Object.keys(status_counts) },
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const isSuperAdmin = user?.role === "super_admin";

    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(filters.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(filters.offset) || 0, 0);

    const leads = await base44.asServiceRole.entities.Leads.list('-updated_date', LEAD_PIPELINE_MAX_FETCH);
    const scopedLeads = isSuperAdmin
      ? leads || []
      : (leads || []).filter((lead) => lead.assigned_to === user.email);

    const snapshot = buildLeadPipelineSnapshot({
      leads: scopedLeads,
      filters,
      limit,
      offset,
    });

    return Response.json(snapshot);
  } catch (error) {
    console.error('Error in getLeadPipelineSummary:', error);
    return Response.json({ error: error.message || 'Failed to load lead pipeline summary' }, { status: 500 });
  }
});

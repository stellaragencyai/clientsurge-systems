/**
 * getAdminAnalytics — extended metrics for the admin analytics dashboard.
 *
 * Returns:
 *  - users: total, active, admins
 *  - leads: totals, status counts, avg score, high intent
 *  - last30Days: daily bucketed lead volume
 *  - funnel: New→Contacted→Qualified→Booked conversion rates
 *  - rep_performance: per-assignee stats (assigned, booked, response time)
 *  - drip: per-step send/fail counts from DripCampaign records
 *  - enrichment: enriched vs un-enriched counts
 *  - time_to_contact: avg hours from lead create → first_contacted_at
 *  - recent_activity: last 30 CommunicationEvents
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function formatDay(date) {
  return date.toISOString().slice(0, 10);
}

function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDay(d));
  }
  return days;
}

function hoursBetween(a, b) {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const [users, leads, events, drips] = await Promise.all([
      base44.asServiceRole.entities.User.list("-created_date", 500),
      base44.asServiceRole.entities.Leads.list("-created_date", 2000),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 300),
      base44.asServiceRole.entities.DripCampaign.list("-created_date", 2000),
    ]);

    const allLeads = leads || [];
    const allUsers = users || [];
    const allDrips = drips || [];

    // ── Users ────────────────────────────────────────────────────────────────
    const activeUserCount = allUsers.filter((u) => u.role !== "admin").length;
    const adminCount = allUsers.filter((u) => u.role === "admin").length;

    // ── 30-day lead volume ───────────────────────────────────────────────────
    const days = getLast30Days();
    const leadsByDay = {};
    days.forEach((d) => { leadsByDay[d] = 0; });
    for (const lead of allLeads) {
      const day = formatDay(new Date(lead.created_date));
      if (day in leadsByDay) leadsByDay[day]++;
    }
    const last30Days = days.map((d) => ({ date: d.slice(5), leads: leadsByDay[d] }));

    // ── Pipeline status counts ────────────────────────────────────────────────
    const statusCounts = {};
    for (const lead of allLeads) {
      const s = lead.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    // ── Lead scores ───────────────────────────────────────────────────────────
    const scored = allLeads.filter((l) => l.lead_score != null && l.lead_score > 0);
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, l) => sum + l.lead_score, 0) / scored.length) : 0;
    const highIntentCount = scored.filter((l) => l.lead_score >= 60).length;
    const totalLeads = allLeads.length;
    const newLast30 = Object.values(leadsByDay).reduce((a, b) => a + b, 0);

    // ── Funnel conversion rates ───────────────────────────────────────────────
    const total = totalLeads || 1;
    const contacted = (statusCounts["Contacted"] || 0) + (statusCounts["Replied"] || 0) +
      (statusCounts["Qualified"] || 0) + (statusCounts["Booking Prompt Sent"] || 0) +
      (statusCounts["Booked"] || 0) + (statusCounts["Closed"] || 0);
    const qualified = (statusCounts["Qualified"] || 0) + (statusCounts["Booking Prompt Sent"] || 0) +
      (statusCounts["Booked"] || 0) + (statusCounts["Closed"] || 0);
    const booked = (statusCounts["Booked"] || 0) + (statusCounts["Closed"] || 0);

    const funnel = [
      { stage: "New Leads", count: totalLeads, rate: 100 },
      { stage: "Contacted", count: contacted, rate: Math.round((contacted / total) * 100) },
      { stage: "Qualified", count: qualified, rate: Math.round((qualified / total) * 100) },
      { stage: "Booked", count: booked, rate: Math.round((booked / total) * 100) },
    ];

    // ── Rep performance ───────────────────────────────────────────────────────
    const repMap = {};
    for (const lead of allLeads) {
      if (!lead.assigned_to) continue;
      const rep = lead.assigned_to;
      if (!repMap[rep]) repMap[rep] = { assigned: 0, booked: 0, closed: 0, contact_times: [] };
      repMap[rep].assigned++;
      if (lead.status === "Booked" || lead.status === "Closed") repMap[rep].booked++;
      if (lead.status === "Closed") repMap[rep].closed++;
      const h = hoursBetween(lead.created_date, lead.last_contacted_at);
      if (h != null && h >= 0 && h < 168) repMap[rep].contact_times.push(h);
    }

    const rep_performance = Object.entries(repMap).map(([email, stats]) => ({
      email,
      name: allUsers.find((u) => u.email === email)?.full_name || email,
      assigned: stats.assigned,
      booked: stats.booked,
      book_rate: stats.assigned > 0 ? Math.round((stats.booked / stats.assigned) * 100) : 0,
      avg_time_to_contact_hours: stats.contact_times.length
        ? Math.round(stats.contact_times.reduce((a, b) => a + b, 0) / stats.contact_times.length * 10) / 10
        : null,
    })).sort((a, b) => b.booked - a.booked);

    // ── Drip campaign stats ───────────────────────────────────────────────────
    const drip = {
      total: allDrips.length,
      active: allDrips.filter((d) => d.status === "active").length,
      completed: allDrips.filter((d) => d.status === "completed").length,
      stopped: allDrips.filter((d) => d.status === "stopped").length,
      day1_sent: allDrips.filter((d) => d.day1_status === "sent").length,
      day3_sent: allDrips.filter((d) => d.day3_status === "sent").length,
      day7_sent: allDrips.filter((d) => d.day7_status === "sent").length,
      day1_failed: allDrips.filter((d) => d.day1_status === "failed").length,
      day3_failed: allDrips.filter((d) => d.day3_status === "failed").length,
      day7_failed: allDrips.filter((d) => d.day7_status === "failed").length,
    };

    // ── Enrichment stats ──────────────────────────────────────────────────────
    const enriched_count = allLeads.filter((l) => !!l.enriched_at).length;
    const enrichment = {
      enriched: enriched_count,
      not_enriched: totalLeads - enriched_count,
      rate: totalLeads > 0 ? Math.round((enriched_count / totalLeads) * 100) : 0,
    };

    // ── Time to first contact ─────────────────────────────────────────────────
    const contactTimes = allLeads
      .map((l) => hoursBetween(l.created_date, l.last_contacted_at))
      .filter((h) => h != null && h >= 0 && h < 168);
    const avg_time_to_contact_hours = contactTimes.length
      ? Math.round(contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length * 10) / 10 : null;

    // ── Recent activity log ───────────────────────────────────────────────────
    const recentActivity = (events || []).slice(0, 30).map((ev) => ({
      id: ev.id,
      lead_id: ev.lead_id,
      channel: ev.channel,
      direction: ev.direction,
      event_type: ev.event_type,
      provider: ev.provider,
      status: ev.status,
      subject: ev.subject,
      message_body: ev.message_body,
      created_date: ev.created_date,
    }));

    return Response.json({
      success: true,
      users: { total: allUsers.length, active: activeUserCount, admins: adminCount },
      leads: { total: totalLeads, new_last_30_days: newLast30, avg_score: avgScore, high_intent_count: highIntentCount, status_counts: statusCounts },
      last30Days,
      funnel,
      rep_performance,
      drip,
      enrichment,
      avg_time_to_contact_hours,
      recent_activity: recentActivity,
    });

  } catch (error) {
    console.error("getAdminAnalytics error:", error);
    return Response.json({ error: error.message || "Failed to load analytics" }, { status: 500 });
  }
});
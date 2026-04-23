/**
 * getAdminAnalytics — supplies extended metrics for the admin analytics dashboard:
 *  - Active user count (users with role != 'admin')
 *  - 30-day lead volume (daily bucketed)
 *  - Recent activity log (last 30 CommunicationEvents)
 *  - Lead pipeline status counts
 *  - Avg lead score
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function formatDay(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const [users, leads, events] = await Promise.all([
      base44.asServiceRole.entities.User.list("-created_date", 500),
      base44.asServiceRole.entities.Leads.list("-created_date", 2000),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 200),
    ]);

    // ── Active users ──────────────────────────────────────────────────────────
    const allUsers = users || [];
    const activeUserCount = allUsers.filter((u) => u.role !== "admin").length;
    const adminCount = allUsers.filter((u) => u.role === "admin").length;
    const totalUserCount = allUsers.length;

    // ── 30-day lead volume ────────────────────────────────────────────────────
    const days = getLast30Days();
    const leadsByDay = {};
    days.forEach((d) => { leadsByDay[d] = 0; });

    for (const lead of leads || []) {
      const day = formatDay(new Date(lead.created_date));
      if (day in leadsByDay) leadsByDay[day]++;
    }

    const last30Days = days.map((d) => ({
      date: d.slice(5), // MM-DD for display
      leads: leadsByDay[d],
    }));

    // ── Pipeline status counts ────────────────────────────────────────────────
    const statusCounts = {};
    for (const lead of leads || []) {
      const s = lead.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    // ── Lead scores ───────────────────────────────────────────────────────────
    const scored = (leads || []).filter((l) => l.lead_score != null && l.lead_score > 0);
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, l) => sum + l.lead_score, 0) / scored.length)
      : 0;
    const highIntentCount = scored.filter((l) => l.lead_score >= 60).length;

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

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalLeads = (leads || []).length;
    const newLast30 = Object.values(leadsByDay).reduce((a, b) => a + b, 0);

    return Response.json({
      success: true,
      users: {
        total: totalUserCount,
        active: activeUserCount,
        admins: adminCount,
      },
      leads: {
        total: totalLeads,
        new_last_30_days: newLast30,
        avg_score: avgScore,
        high_intent_count: highIntentCount,
        status_counts: statusCounts,
      },
      last30Days,
      recent_activity: recentActivity,
    });

  } catch (error) {
    console.error("getAdminAnalytics error:", error);
    return Response.json({ error: error.message || "Failed to load analytics" }, { status: 500 });
  }
});
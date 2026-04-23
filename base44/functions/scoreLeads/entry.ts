/**
 * scoreLeads — batch-scores all Leads and persists lead_score (1–100).
 *
 * Scoring model (additive, capped at 100):
 *
 * PIPELINE STATUS (up to 30 pts)
 *   New              →  5
 *   Contacted        → 10
 *   Replied          → 18
 *   Qualified        → 22
 *   Booking Prompt   → 26
 *   Booked           → 30
 *   Closed           →  0  (already converted — remove from active scoring)
 *
 * RECENCY — days since created (up to 20 pts)
 *   0–2 days         → 20
 *   3–7 days         → 15
 *   8–14 days        → 10
 *   15–30 days       →  5
 *   >30 days         →  0
 *
 * COMMUNICATION ACTIVITY — outbound events (up to 25 pts)
 *   1 event          →  8
 *   2–3 events       → 14
 *   4–6 events       → 20
 *   7+ events        → 25
 *
 * INBOUND REPLY — any inbound event (up to 15 pts)
 *   1 inbound        →  8
 *   2+ inbound       → 15
 *
 * RECENCY OF LAST CONTACT (up to 10 pts)
 *   Contacted <24h   → 10
 *   <3 days          →  7
 *   <7 days          →  4
 *   never contacted  →  0
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const STATUS_SCORE = {
  New: 5,
  Contacted: 10,
  Replied: 18,
  Qualified: 22,
  "Booking Prompt Sent": 26,
  Booked: 30,
  Closed: 0,
};

function daysSince(isoDate) {
  if (!isoDate) return 9999;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function recencyScore(days) {
  if (days <= 2) return 20;
  if (days <= 7) return 15;
  if (days <= 14) return 10;
  if (days <= 30) return 5;
  return 0;
}

function activityScore(outboundCount) {
  if (outboundCount >= 7) return 25;
  if (outboundCount >= 4) return 20;
  if (outboundCount >= 2) return 14;
  if (outboundCount >= 1) return 8;
  return 0;
}

function inboundScore(inboundCount) {
  if (inboundCount >= 2) return 15;
  if (inboundCount >= 1) return 8;
  return 0;
}

function lastContactScore(days) {
  if (days < 1) return 10;
  if (days < 3) return 7;
  if (days < 7) return 4;
  return 0;
}

function computeScore(lead, eventsByLead) {
  const events = eventsByLead[lead.id] || [];

  const outbound = events.filter((e) => e.direction === "outbound").length;
  const inbound = events.filter((e) => e.direction === "inbound").length;

  const score =
    (STATUS_SCORE[lead.status] ?? 5) +
    recencyScore(daysSince(lead.created_date)) +
    activityScore(outbound) +
    inboundScore(inbound) +
    lastContactScore(daysSince(lead.last_contacted_at));

  return Math.min(100, Math.max(1, score));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both admin-triggered and scheduled (no user) calls
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const leadIdFilter = payload?.lead_id ?? null; // optional single-lead mode

    // Fetch leads & events
    const [leads, events] = await Promise.all([
      leadIdFilter
        ? base44.asServiceRole.entities.Leads.filter({ id: leadIdFilter })
        : base44.asServiceRole.entities.Leads.list("-created_date", 2000),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 2000),
    ]);

    if (!leads?.length) {
      return Response.json({ success: true, scored: 0, message: "No leads to score" });
    }

    // Index events by lead_id
    const eventsByLead = {};
    for (const ev of events || []) {
      if (!ev.lead_id) continue;
      (eventsByLead[ev.lead_id] ??= []).push(ev);
    }

    // Score and persist in parallel (batched to avoid rate limits)
    const updates = leads.map((lead) => {
      const score = computeScore(lead, eventsByLead);
      return { lead, score };
    });

    const BATCH = 20;
    let updated = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      await Promise.all(
        batch.map(({ lead, score }) => {
          if (lead.lead_score === score) return Promise.resolve(); // skip no-ops
          return base44.asServiceRole.entities.Leads.update(lead.id, { lead_score: score });
        })
      );
      updated += batch.length;
    }

    return Response.json({
      success: true,
      scored: updates.length,
      updated,
      scores: updates.map(({ lead, score }) => ({ id: lead.id, name: lead.full_name, score })),
    });

  } catch (error) {
    console.error("scoreLeads error:", error);
    return Response.json({ error: error.message || "Scoring failed" }, { status: 500 });
  }
});
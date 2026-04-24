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
 *   Closed           →  0
 *
 * RECENCY — days since created (up to 20 pts)
 *   0–2 days  → 20 | 3–7 → 15 | 8–14 → 10 | 15–30 → 5 | >30 → 0
 *
 * COMMUNICATION ACTIVITY — outbound events (up to 25 pts)
 *   1 → 8 | 2–3 → 14 | 4–6 → 20 | 7+ → 25
 *
 * INBOUND REPLY (up to 15 pts)
 *   1 → 8 | 2+ → 15
 *
 * RECENCY OF LAST CONTACT (up to 10 pts)
 *   <24h → 10 | <3d → 7 | <7d → 4
 *
 * ENRICHMENT BONUS (up to 10 pts — new)
 *   Has industry_tags    → +3
 *   Has social_profiles  → +3
 *   company_size known   → +2
 *   Has website          → +2
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const STATUS_SCORE = {
  New: 5, Contacted: 10, Replied: 18, Qualified: 22,
  "Booking Prompt Sent": 26, Booked: 30, Closed: 0,
};

function daysSince(isoDate) {
  if (!isoDate) return 9999;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function recencyScore(days) {
  if (days <= 2) return 20; if (days <= 7) return 15;
  if (days <= 14) return 10; if (days <= 30) return 5; return 0;
}

function activityScore(n) {
  if (n >= 7) return 25; if (n >= 4) return 20; if (n >= 2) return 14; if (n >= 1) return 8; return 0;
}

function inboundScore(n) { return n >= 2 ? 15 : n >= 1 ? 8 : 0; }

function lastContactScore(days) {
  if (days < 1) return 10; if (days < 3) return 7; if (days < 7) return 4; return 0;
}

function enrichmentBonus(lead) {
  let bonus = 0;
  if (Array.isArray(lead.industry_tags) && lead.industry_tags.length > 0) bonus += 3;
  if (lead.social_profiles && Object.keys(lead.social_profiles).some((k) => lead.social_profiles[k])) bonus += 3;
  if (lead.company_size && lead.company_size !== "unknown") bonus += 2;
  if (lead.website) bonus += 2;
  return bonus;
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
    lastContactScore(daysSince(lead.last_contacted_at)) +
    enrichmentBonus(lead);

  return Math.min(100, Math.max(1, score));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const leadIdFilter = payload?.lead_id ?? null;

    const [leads, events] = await Promise.all([
      leadIdFilter
        ? base44.asServiceRole.entities.Leads.filter({ id: leadIdFilter })
        : base44.asServiceRole.entities.Leads.list("-created_date", 2000),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 2000),
    ]);

    if (!leads?.length) {
      return Response.json({ success: true, scored: 0, message: "No leads to score" });
    }

    const eventsByLead = {};
    for (const ev of events || []) {
      if (!ev.lead_id) continue;
      (eventsByLead[ev.lead_id] ??= []).push(ev);
    }

    const updates = leads.map((lead) => ({ lead, score: computeScore(lead, eventsByLead) }));

    const BATCH = 20;
    let updated = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      await Promise.all(
        batch.map(({ lead, score }) => {
          if (lead.lead_score === score) return Promise.resolve();
          return base44.asServiceRole.entities.Leads.update(lead.id, { lead_score: score });
        })
      );
      updated += batch.length;
    }

    return Response.json({
      success: true, scored: updates.length, updated,
      scores: updates.map(({ lead, score }) => ({ id: lead.id, name: lead.full_name, score })),
    });

  } catch (error) {
    console.error("scoreLeads error:", error);
    return Response.json({ error: error.message || "Scoring failed" }, { status: 500 });
  }
});
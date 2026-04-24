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
 *   0–2 days → 20 | 3–7 → 15 | 8–14 → 10 | 15–30 → 5 | >30 → 0
 *
 * COMMUNICATION ACTIVITY — outbound CommunicationEvents (up to 25 pts)
 *   1 → 8 | 2–3 → 14 | 4–6 → 20 | 7+ → 25
 *
 * INBOUND REPLY (up to 15 pts)
 *   1 → 8 | 2+ → 15
 *
 * RECENCY OF LAST CONTACT (up to 10 pts)
 *   <24h → 10 | <3d → 7 | <7d → 4
 *
 * EMAIL ENGAGEMENT — opens + clicks from EmailCampaignRecipient (up to 15 pts)
 *   1+ opens  → +5  | 3+ opens  → +8  | 5+ opens  → +10
 *   1+ clicks → +5  (stacks with opens, max 15)
 *
 * CALL SENTIMENT — from reply_sentiment set by processCallRecording (up to 15 pts)
 *   Positive → +15 | Neutral → +5 | Negative → -5
 *
 * ENRICHMENT BONUS (up to 10 pts)
 *   Has industry_tags → +3 | social_profiles → +3 | company_size known → +2 | website → +2
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

function emailEngagementScore(opens, clicks) {
  let pts = 0;
  if (opens >= 5) pts += 10;
  else if (opens >= 3) pts += 8;
  else if (opens >= 1) pts += 5;
  if (clicks >= 1) pts += 5;
  return Math.min(pts, 15);
}

function callSentimentScore(lead) {
  // reply_sentiment is updated by both analyzeReplySentiment and processCallRecording
  if (lead.reply_sentiment === "Positive") return 15;
  if (lead.reply_sentiment === "Neutral") return 5;
  if (lead.reply_sentiment === "Negative") return -5;
  return 0;
}

function enrichmentBonus(lead) {
  let bonus = 0;
  if (Array.isArray(lead.industry_tags) && lead.industry_tags.length > 0) bonus += 3;
  if (lead.social_profiles && Object.keys(lead.social_profiles).some((k) => lead.social_profiles[k])) bonus += 3;
  if (lead.company_size && lead.company_size !== "unknown") bonus += 2;
  if (lead.website) bonus += 2;
  return bonus;
}

function computeScore(lead, eventsByLead, emailStatsByLead) {
  const events = eventsByLead[lead.id] || [];
  const outbound = events.filter((e) => e.direction === "outbound").length;
  const inbound = events.filter((e) => e.direction === "inbound").length;

  const emailStats = emailStatsByLead[lead.id] || { opens: 0, clicks: 0 };

  const score =
    (STATUS_SCORE[lead.status] ?? 5) +
    recencyScore(daysSince(lead.created_date)) +
    activityScore(outbound) +
    inboundScore(inbound) +
    lastContactScore(daysSince(lead.last_contacted_at)) +
    emailEngagementScore(emailStats.opens, emailStats.clicks) +
    callSentimentScore(lead) +
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

    const [leads, events, emailRecipients] = await Promise.all([
      leadIdFilter
        ? base44.asServiceRole.entities.Leads.filter({ id: leadIdFilter })
        : base44.asServiceRole.entities.Leads.list("-created_date", 2000),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 2000),
      base44.asServiceRole.entities.EmailCampaignRecipient.list("-created_date", 5000),
    ]);

    if (!leads?.length) {
      return Response.json({ success: true, scored: 0, message: "No leads to score" });
    }

    const eventsByLead = {};
    for (const ev of events || []) {
      if (!ev.lead_id) continue;
      (eventsByLead[ev.lead_id] ??= []).push(ev);
    }

    // Aggregate email opens + clicks per lead_id
    const emailStatsByLead = {};
    for (const r of emailRecipients || []) {
      if (!r.lead_id) continue;
      if (!emailStatsByLead[r.lead_id]) emailStatsByLead[r.lead_id] = { opens: 0, clicks: 0 };
      emailStatsByLead[r.lead_id].opens += r.open_count || 0;
      emailStatsByLead[r.lead_id].clicks += r.click_count || 0;
    }

    const updates = leads.map((lead) => ({ lead, score: computeScore(lead, eventsByLead, emailStatsByLead) }));

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
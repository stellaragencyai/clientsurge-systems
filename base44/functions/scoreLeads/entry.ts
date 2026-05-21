/**
 * scoreLeads — redeployed 2026-05-02
 * Batch re-scores ALL Leads and persists lead_score + activation_priority.
 * Admin-only. Called manually from Priority Queue "Re-Score" button or on a schedule.
 *
 * Scoring model (additive, capped at 100):
 *   Status           up to 30 pts
 *   Recency          up to 20 pts
 *   Outbound comms   up to 25 pts
 *   Inbound replies  up to 15 pts
 *   Last contact     up to 10 pts
 *   Email engagement up to 15 pts  (opens + clicks from EmailCampaignRecipient)
 *   Reply sentiment  up to 15 pts  (set by analyzeReplySentiment / processCallRecording)
 *   Enrichment bonus up to 10 pts
 *
 * activation_priority:
 *   "Hot"    → score ≥70 AND (hot status OR positive sentiment)
 *   "High"   → score ≥70
 *   "Medium" → score ≥45
 *   "Low"    → below 45
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
// Inlined from _shared/automationSecurity.js (relative imports not supported in deployed Deno runtime)
function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
function getBearerToken(req) {
  const authorization = req.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return "";
  return token.trim();
}
function allowAnonymousAutomation(req) {
  const configuredSecret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (!configuredSecret) return true;
  const candidateSecret = req.headers.get("x-automation-secret") || getBearerToken(req);
  return constantTimeEqual(candidateSecret || "", configuredSecret);
}

const LEAD_LIMIT = 10000;
const EVENT_LIMIT = 10000;
const EMAIL_RECIPIENT_LIMIT = 10000;

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

function sentimentScore(lead) {
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

function computeActivationPriority(score, lead) {
  const hotStatus = ["Replied", "Qualified", "Booking Prompt Sent"].includes(lead.status);
  const positiveSignal = lead.reply_sentiment === "Positive";
  if (score >= 70 && (hotStatus || positiveSignal)) return "Hot";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function computeScore(lead, eventsByLead, emailStatsByLead) {
  const events = eventsByLead[lead.id] || [];
  const outbound = events.filter((e) => e.direction === "outbound").length;
  const inbound = events.filter((e) => e.direction === "inbound").length;
  const emailStats = emailStatsByLead[lead.id] || { opens: 0, clicks: 0 };

  const raw =
    (STATUS_SCORE[lead.status] ?? 5) +
    recencyScore(daysSince(lead.created_date)) +
    activityScore(outbound) +
    inboundScore(inbound) +
    lastContactScore(daysSince(lead.last_contacted_at)) +
    emailEngagementScore(emailStats.opens, emailStats.clicks) +
    sentimentScore(lead) +
    enrichmentBonus(lead);

  return Math.min(100, Math.max(1, raw));
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }
    if (!user && !allowAnonymousAutomation(req)) {
      return Response.json({ error: "Forbidden: Trusted automation only" }, { status: 403 });
    }

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const leadIdFilter = payload?.lead_id ?? null;

    console.log(`[scoreLeads] Starting batch score${leadIdFilter ? ` for lead ${leadIdFilter}` : " for all leads"}`);

    const [leads, events, emailRecipients] = await Promise.all([
      leadIdFilter
        ? base44.asServiceRole.entities.Leads.filter({ id: leadIdFilter })
        : base44.asServiceRole.entities.Leads.list("-created_date", LEAD_LIMIT),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", EVENT_LIMIT),
      base44.asServiceRole.entities.EmailCampaignRecipient.list("-created_date", EMAIL_RECIPIENT_LIMIT),
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

    // Index email stats by lead_id
    const emailStatsByLead = {};
    for (const r of emailRecipients || []) {
      if (!r.lead_id) continue;
      if (!emailStatsByLead[r.lead_id]) emailStatsByLead[r.lead_id] = { opens: 0, clicks: 0 };
      emailStatsByLead[r.lead_id].opens += r.open_count || 0;
      emailStatsByLead[r.lead_id].clicks += r.click_count || 0;
    }

    // Compute scores
    const updates = leads.map((lead) => {
      const score = computeScore(lead, eventsByLead, emailStatsByLead);
      const priority = computeActivationPriority(score, lead);
      return { lead, score, priority };
    });

    // Batch-write only changed records (20 at a time)
    const BATCH = 20;
    let updated = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      await Promise.all(
        batch.map(({ lead, score, priority }) => {
          if (lead.lead_score === score && lead.activation_priority === priority) return Promise.resolve();
          updated++;
          return base44.asServiceRole.entities.Leads.update(lead.id, {
            lead_score: score,
            activation_priority: priority,
          });
        })
      );
    }

    console.log(`[scoreLeads] Done — scored ${updates.length} leads, updated ${updated}`);

    return Response.json({
      success: true,
      scored: updates.length,
      updated,
      data_window: {
        limits: {
          leads: leadIdFilter ? 1 : LEAD_LIMIT,
          events: EVENT_LIMIT,
          email_recipients: EMAIL_RECIPIENT_LIMIT,
        },
        truncated: {
          leads_capped: !leadIdFilter && (leads || []).length >= LEAD_LIMIT,
          events_capped: (events || []).length >= EVENT_LIMIT,
          email_recipients_capped: (emailRecipients || []).length >= EMAIL_RECIPIENT_LIMIT,
        },
      },
      scores: updates.map(({ lead, score, priority }) => ({
        id: lead.id,
        name: lead.full_name,
        score,
        priority,
      })),
    });

  } catch (error) {
    console.error("[scoreLeads] scoreLeads error:", error);
    return Response.json({ error: error.message || "Scoring failed" }, { status: 500 });
  }
});
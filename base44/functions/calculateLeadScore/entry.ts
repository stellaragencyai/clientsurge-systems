/**
 * calculateLeadScore
 *
 * Can be called two ways:
 *   1. Entity automation payload: { event: { entity_id }, data: { ...leadFields } }
 *   2. Manual/frontend call:      { lead_id: "abc123" }
 *
 * Scoring model (additive, capped at 100):
 *   Status           up to 30 pts
 *   Recency          up to 20 pts
 *   Outbound comms   up to 25 pts
 *   Inbound replies  up to 15 pts
 *   Last contact     up to 10 pts
 *   Email engagement up to 15 pts  (opens + clicks from EmailCampaignRecipient)
 *   Reply sentiment  up to 15 pts
 *   Enrichment bonus up to 10 pts
 *
 * After scoring, writes back:
 *   - lead_score        (0–100 int)
 *   - activation_priority ("Hot" | "High" | "Medium" | "Low")
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { allowAnonymousAutomation } from "../_shared/automationSecurity.js";

const STATUS_SCORE = {
  New: 5, Contacted: 10, Replied: 18, Qualified: 22,
  "Booking Prompt Sent": 26, Booked: 30, Closed: 0,
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

function activityScore(n) {
  if (n >= 7) return 25;
  if (n >= 4) return 20;
  if (n >= 2) return 14;
  if (n >= 1) return 8;
  return 0;
}

function inboundScore(n) { return n >= 2 ? 15 : n >= 1 ? 8 : 0; }

function lastContactScore(days) {
  if (days < 1) return 10;
  if (days < 3) return 7;
  if (days < 7) return 4;
  return 0;
}

function emailEngagementScore(opens, clicks) {
  let pts = 0;
  if (opens >= 5) pts += 10;
  else if (opens >= 3) pts += 8;
  else if (opens >= 1) pts += 5;
  if (clicks >= 1) pts += 5;
  return Math.min(pts, 15);
}

function sentimentScore(sentiment) {
  if (sentiment === "Positive") return 15;
  if (sentiment === "Neutral") return 5;
  if (sentiment === "Negative") return -5;
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

function activationPriority(score, lead) {
  const hotStatus = ["Replied", "Qualified", "Booking Prompt Sent"].includes(lead.status);
  const positiveSignal = lead.reply_sentiment === "Positive";
  if (score >= 70 && (hotStatus || positiveSignal)) return "Hot";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationPayload = !!(body?.event?.entity_id || body?.data?.id);

    // Auth check — allow automation (no user) or admin
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }
    if (!user && (!isAutomationPayload || !allowAnonymousAutomation(req))) {
      return Response.json({ error: "Forbidden: Trusted automation only" }, { status: 403 });
    }

    // Support both entity automation payload and direct call
    const leadId = body?.lead_id || body?.event?.entity_id || body?.data?.id || null;

    if (!leadId) {
      return Response.json({ error: "Missing lead_id" }, { status: 400 });
    }

    // Fetch lead + communication events + email engagement in parallel
    const [leadList, events, emailRecipients] = await Promise.all([
      base44.asServiceRole.entities.Leads.filter({ id: leadId }),
      base44.asServiceRole.entities.CommunicationEvent.filter({ lead_id: leadId }),
      base44.asServiceRole.entities.EmailCampaignRecipient.filter({ lead_id: leadId }),
    ]);

    if (!leadList?.length) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leadList[0];

    // Tally communication events
    const outbound = (events || []).filter((e) => e.direction === "outbound").length;
    const inbound = (events || []).filter((e) => e.direction === "inbound").length;

    // Tally email engagement
    const totalOpens = (emailRecipients || []).reduce((s, r) => s + (r.open_count || 0), 0);
    const totalClicks = (emailRecipients || []).reduce((s, r) => s + (r.click_count || 0), 0);

    // Compute score
    const breakdown = {
      status:       STATUS_SCORE[lead.status] ?? 5,
      recency:      recencyScore(daysSince(lead.created_date)),
      outbound:     activityScore(outbound),
      inbound:      inboundScore(inbound),
      last_contact: lastContactScore(daysSince(lead.last_contacted_at)),
      email_opens:  emailEngagementScore(totalOpens, totalClicks),
      sentiment:    sentimentScore(lead.reply_sentiment),
      enrichment:   enrichmentBonus(lead),
    };

    const rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const finalScore = Math.min(100, Math.max(1, rawScore));
    const priority = activationPriority(finalScore, lead);

    // Persist only if changed (avoids infinite automation loops)
    const scoreChanged = lead.lead_score !== finalScore;
    const priorityChanged = lead.activation_priority !== priority;

    if (scoreChanged || priorityChanged) {
      await base44.asServiceRole.entities.Leads.update(leadId, {
        lead_score: finalScore,
        activation_priority: priority,
      });
    }

    console.log(`[calculateLeadScore] ${lead.full_name} → score=${finalScore} priority=${priority}`, breakdown);

    return Response.json({
      success: true,
      lead_id: leadId,
      score: finalScore,
      activation_priority: priority,
      changed: scoreChanged || priorityChanged,
      breakdown,
    });
  } catch (error) {
    console.error("calculateLeadScore error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * calculateLeadScore — self-contained (no _shared imports)
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

function allowAnonymousAutomation(req) {
  const secret = Deno.env.get("AUTOMATION_SHARED_SECRET");
  if (!secret) return true;
  const auth = req.headers.get("authorization") || "";
  const [scheme, token] = auth.split(/\s+/, 2);
  const candidate = (scheme?.toLowerCase() === "bearer" ? token : "") || req.headers.get("x-automation-secret") || "";
  return constantTimeEqual(candidate.trim(), secret);
}

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
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationPayload = !!(body?.event?.entity_id || body?.data?.id);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") return json({ error: "Forbidden: Admin only" }, 403);
    if (!user && (!isAutomationPayload || !allowAnonymousAutomation(req))) {
      return json({ error: "Forbidden: Trusted automation only" }, 403);
    }

    const leadId = body?.lead_id || body?.event?.entity_id || body?.data?.id || null;
    if (!leadId) return json({ error: "Missing lead_id" }, 400);

    const [leadList, events, emailRecipients] = await Promise.all([
      base44.asServiceRole.entities.Leads.filter({ id: leadId }),
      base44.asServiceRole.entities.CommunicationEvent.filter({ lead_id: leadId }),
      base44.asServiceRole.entities.EmailCampaignRecipient.filter({ lead_id: leadId }),
    ]);

    if (!leadList?.length) return json({ error: "Lead not found" }, 404);
    const lead = leadList[0];

    const outbound = (events || []).filter((e) => e.direction === "outbound").length;
    const inbound = (events || []).filter((e) => e.direction === "inbound").length;
    const totalOpens = (emailRecipients || []).reduce((s, r) => s + (r.open_count || 0), 0);
    const totalClicks = (emailRecipients || []).reduce((s, r) => s + (r.click_count || 0), 0);

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

    const scoreChanged = lead.lead_score !== finalScore;
    const priorityChanged = lead.activation_priority !== priority;

    if (scoreChanged || priorityChanged) {
      await base44.asServiceRole.entities.Leads.update(leadId, {
        lead_score: finalScore,
        activation_priority: priority,
      });
    }

    console.log(`[calculateLeadScore] ${lead.full_name} → score=${finalScore} priority=${priority}`);
    return json({ success: true, lead_id: leadId, score: finalScore, activation_priority: priority, changed: scoreChanged || priorityChanged, breakdown });
  } catch (error) {
    console.error("[calculateLeadScore] error:", error);
    return json({ error: error.message }, 500);
  }
});
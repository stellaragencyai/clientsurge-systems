import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * computeLeadIntelligence — Scores a single page (batch) of leads.
 * 
 * Call with { skip: 0 } to start, then increment by batch_size for subsequent pages.
 * The scheduled automation calls this incrementally via the automationProcessor.
 * 
 * Scoring (0-100):
 * - Lead Score baseline (0-30)
 * - CRM Stage intent (0-30)
 * - Status engagement (0-20)
 * - Recency decay (0-20)
 */

function computeIntelligenceScore(lead) {
  let score = 0;
  const now = Date.now();

  // 1. Lead Score baseline (0-30 pts)
  score += (Math.min(lead.lead_score || 0, 100) / 100) * 30;

  // 2. Intent via CRM Stage (0-30 pts)
  const stageWeight = {
    "Won Pending Payment": 1.0, "Won": 1.0, "Audit Booked": 1.0,
    "Proposal Sent": 0.9, "Replied": 0.85, "Opened / Clicked": 0.65,
    "Contacted": 0.45, "Follow Up Later": 0.35,
    "Not Contacted": 0.0, "Lost": 0.0,
  };
  score += (stageWeight[lead.crm_stage] || 0) * 30;

  // 3. Status engagement (0-20 pts)
  const statusWeight = {
    "Booked": 1.0, "Qualified": 0.8, "Replied": 0.7,
    "Contacted": 0.5, "New": 0.2, "Closed": 0,
  };
  score += (statusWeight[lead.status] || 0) * 20;

  // 4. Recency decay (0-20 pts)
  if (lead.last_activity_at) {
    const days = (now - new Date(lead.last_activity_at).getTime()) / 86400000;
    score += Math.max(0, 1 - days / 30) * 20;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

function segmentLead(lead, score) {
  if (score >= 80) return "HOT_LEADS";
  if (score >= 50) {
    if (lead.booking_status === "clicked" || lead.status === "Replied") return "HIGH_INTENT";
    return "NURTURE";
  }
  if (lead.last_activity_at) {
    const days = (Date.now() - new Date(lead.last_activity_at).getTime()) / 86400000;
    if (days > 30) return "DORMANT";
  }
  if (lead.status === "Contacted" || lead.status === "New") return "ENGAGED";
  return "COLD";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // Process one page at a time to stay within timeout limits
    const batchSize = 25;
    const skip = parseInt(body.skip || 0);

    const leads = await base44.asServiceRole.entities.Leads.filter({}, "-created_date", batchSize, skip);

    if (!leads || leads.length === 0) {
      return Response.json({ success: true, total_processed: 0, done: true, next_skip: skip });
    }

    let processed = 0;
    let failed = 0;

    for (const lead of leads) {
      const intelligenceScore = computeIntelligenceScore(lead);
      const intelligenceSegment = segmentLead(lead, intelligenceScore);
      const revenueImpact = intelligenceScore >= 80 ? 600 : intelligenceScore >= 50 ? 300 : 75;

      try {
        await base44.asServiceRole.entities.Leads.update(lead.id, {
          intelligence_score: intelligenceScore,
          intelligence_segment: intelligenceSegment,
          revenue_impact_estimate: revenueImpact,
        });
        processed++;
        await sleep(100); // Gentle rate-limit guard
      } catch (e) {
        failed++;
        if (e.message?.includes("Rate limit")) await sleep(2000);
      }
    }

    const nextSkip = skip + batchSize;
    const done = leads.length < batchSize;

    return Response.json({
      success: true,
      total_processed: processed,
      failed,
      done,
      next_skip: nextSkip,
      batch_size: batchSize,
      this_skip: skip,
    });
  } catch (error) {
    console.error("computeLeadIntelligence error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
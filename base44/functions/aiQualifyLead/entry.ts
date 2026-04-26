/**
 * aiQualifyLead — full AI qualification analysis for a single lead.
 *
 * Analyzes:
 *  - Lead form data (business type, problem, source)
 *  - Communication history (events, messages)
 *  - Enrichment data (tags, company size, socials)
 *  - Sentiment + intent signals
 *  - Lead score
 *
 * Returns:
 *  - qualification_tier: "Hot" | "Warm" | "Cold" | "Not Qualified"
 *  - qualification_summary: 2-3 sentence AI summary
 *  - follow_up_actions: array of 3 prioritized, personalized action suggestions
 *  - key_signals: array of signal strings that drove the qualification
 *  - recommended_offer: which plan/service fits best
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const EVENT_LIMIT = 200;
const MESSAGE_LIMIT = 50;
const VALID_TIERS = ["Hot", "Warm", "Cold", "Not Qualified"];
const VALID_CHANNELS = ["sms", "email", "call", "internal"];
const VALID_TIMINGS = ["now", "within 24h", "within 48h", "this week"];
const VALID_OFFERS = ["Starter System", "Growth System", "Pro System", "None — not a fit"];

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const leadId = body?.lead_id;
    if (!leadId) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    // Load lead + communication history in parallel
    const [lead, events, messages] = await Promise.all([
      base44.asServiceRole.entities.Leads.get(leadId),
      base44.asServiceRole.entities.CommunicationEvent.filter({ lead_id: leadId }, "-created_date", EVENT_LIMIT),
      base44.asServiceRole.entities.Messages.filter({ lead_id: leadId }, "-created_date", MESSAGE_LIMIT),
    ]);

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // Build communication context
    const outboundCount = (events || []).filter(e => e.direction === "outbound").length;
    const inboundMessages = (messages || []).filter(m => m.direction === "inbound");
    const lastInboundText = inboundMessages[0]?.message_text || null;
    const recentEvents = (events || []).slice(0, 10).map(e =>
      `[${e.direction}] ${e.event_type} via ${e.channel} — ${e.status}${e.subject ? `: ${e.subject}` : ""}`
    ).join("\n");

    const daysSince = (d) => d ? Math.round((Date.now() - new Date(d).getTime()) / 86400000) : null;

    const prompt = `You are an expert B2B sales qualification AI for a lead automation agency (ClientSurge Systems). 
Your job is to qualify leads for a done-for-you AI lead response and booking automation service.

The ideal client: a service business (med spa, dental, HVAC, real estate, etc.) that generates leads but loses them due to slow follow-up. They need automated SMS/email responses, follow-up sequences, and booking automation.

LEAD DATA:
- Name: ${lead.full_name || "Unknown"}
- Business: ${lead.business_name || "Unknown"} (${lead.business_type || "Unknown type"})
- Problem stated: ${lead.problem || "Not provided"}
- Source: ${lead.source || "Unknown"} / Intake: ${lead.intake_type || "Unknown"}
- Lead Score: ${lead.lead_score || 0}/100
- Status: ${lead.status || "New"}
- Created: ${daysSince(lead.created_date)} days ago
- Last contacted: ${lead.last_contacted_at ? `${daysSince(lead.last_contacted_at)} days ago` : "Never"}
- Reply sentiment: ${lead.reply_sentiment || "Unknown"}
- Sentiment reason: ${lead.reply_sentiment_reason || "N/A"}
- AI Intent: ${lead.ai_intent || "Unknown"}

ENRICHMENT DATA:
- Industry tags: ${(lead.industry_tags || []).join(", ") || "None"}
- Company size: ${lead.company_size || "Unknown"}
- Has website: ${lead.website ? "Yes" : "No"}
- Social profiles: ${lead.social_profiles ? Object.keys(lead.social_profiles).filter(k => lead.social_profiles[k]).join(", ") || "None found" : "Not enriched"}
- Enrichment notes: ${lead.enrichment_notes || "Not enriched"}

COMMUNICATION HISTORY:
- Outbound messages sent: ${outboundCount}
- Inbound replies received: ${inboundMessages.length}
- Last inbound message: ${lastInboundText ? `"${lastInboundText.slice(0, 200)}"` : "None"}
- Recent events:
${recentEvents || "No events logged"}

Based on ALL this data, provide a comprehensive lead qualification analysis. Return valid JSON only:

{
  "qualification_tier": "Hot" | "Warm" | "Cold" | "Not Qualified",
  "qualification_summary": "2-3 sentence summary explaining why this lead is qualified or not, what their situation looks like, and what opportunity exists",
  "key_signals": ["signal 1", "signal 2", "signal 3"],
  "follow_up_actions": [
    {
      "priority": 1,
      "action": "Short action title",
      "detail": "Specific instruction for what to do and say",
      "channel": "sms" | "email" | "call" | "internal",
      "timing": "now" | "within 24h" | "within 48h" | "this week"
    },
    {
      "priority": 2,
      "action": "...",
      "detail": "...",
      "channel": "...",
      "timing": "..."
    },
    {
      "priority": 3,
      "action": "...",
      "detail": "...",
      "channel": "...",
      "timing": "..."
    }
  ],
  "recommended_offer": "Starter System" | "Growth System" | "Pro System" | "None — not a fit",
  "offer_reason": "One sentence explaining why this offer fits",
  "confidence": 0.0-1.0
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          qualification_tier: { type: "string", enum: VALID_TIERS },
          qualification_summary: { type: "string" },
          key_signals: { type: "array", items: { type: "string" } },
          follow_up_actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                priority: { type: "number" },
                action: { type: "string" },
                detail: { type: "string" },
                channel: { type: "string", enum: VALID_CHANNELS },
                timing: { type: "string", enum: VALID_TIMINGS },
              },
              required: ["priority", "action", "detail", "channel", "timing"],
            }
          },
          recommended_offer: { type: "string", enum: VALID_OFFERS },
          offer_reason: { type: "string" },
          confidence: { type: "number" },
        },
        required: [
          "qualification_tier",
          "qualification_summary",
          "key_signals",
          "follow_up_actions",
          "recommended_offer",
          "offer_reason",
          "confidence",
        ],
      }
    });

    if (!VALID_TIERS.includes(result?.qualification_tier)) {
      return Response.json({ error: "AI qualification response was invalid" }, { status: 502 });
    }

    // Save key qualification fields back to lead
    const tierToCategory = {
      "Hot": "High-Value",
      "Warm": "High-Value",
      "Cold": "Standard",
      "Not Qualified": "Standard",
    };

    await base44.asServiceRole.entities.Leads.update(leadId, {
      lead_category: tierToCategory[result.qualification_tier] || "Standard",
      ai_last_classification: JSON.stringify({
        tier: result.qualification_tier,
        summary: result.qualification_summary,
        signals: result.key_signals,
        actions: result.follow_up_actions,
        recommended_offer: result.recommended_offer,
        offer_reason: result.offer_reason,
        generated_at: new Date().toISOString(),
      }),
      ai_confidence:
        typeof result.confidence === "number"
          ? Math.max(0, Math.min(1, result.confidence))
          : result.qualification_tier === "Hot"
            ? 0.9
            : result.qualification_tier === "Warm"
              ? 0.7
              : 0.5,
    });

    // Log event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: `AI Qualification: ${result.qualification_tier}`,
      message_body: result.qualification_summary,
      metadata_json: JSON.stringify({ source: "aiQualifyLead", tier: result.qualification_tier }),
    });

    return Response.json({
      success: true,
      lead_id: leadId,
      ...result,
    });

  } catch (error) {
    console.error("aiQualifyLead error:", error);
    return Response.json({ error: error.message || "Qualification failed" }, { status: 500 });
  }
});

/**
 * Lead Enrichment Function
 * Triggered: When a new Lead is created
 * Purpose: Extract industry, tags, and insights from company website using AI
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process new leads with a website
    if (event?.type !== "create" || !data?.website) {
      console.log("[enrichLeadWithAI] Skipping - no website or not a create event");
      return Response.json({ status: "skipped", reason: "no website" });
    }

    const leadId = data.id;
    const businessName = data.business_name || "Unknown";
    const website = data.website.trim();

    console.log(`[enrichLeadWithAI] Processing lead ${leadId}: ${businessName}`);

    // Validate website URL format
    if (!website.match(/^https?:\/\/.+\..+/)) {
      console.warn("[enrichLeadWithAI] Invalid website URL format:", website);
      return Response.json({ status: "skipped", reason: "invalid url" });
    }

    // ─────────────────────────────────────────────────────
    // STEP 1: Invoke AI to analyze the website
    // ─────────────────────────────────────────────────────
    console.log("[enrichLeadWithAI] Calling AI to analyze website:", website);

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a business intelligence analyst. Analyze the following company website and extract key information:

Website: ${website}
Company Name: ${businessName}

Please provide your response in JSON format with these exact fields:
{
  "industry": "single most specific industry/niche (e.g., 'Medical Spa', 'HVAC Services', 'Dental Practice')",
  "sub_industries": ["array", "of", "related", "niches"],
  "business_size": "solo|small|medium|large|enterprise",
  "services_offered": ["array", "of", "key", "services"],
  "key_insights": "2-3 sentence summary of what they do and their market positioning",
  "confidence": 0.0-1.0
}

Be specific and accurate. If you cannot access the site, return an empty industry but explain in key_insights.`,
      response_json_schema: {
        type: "object",
        properties: {
          industry: { type: "string" },
          sub_industries: { type: "array", items: { type: "string" } },
          business_size: {
            type: "string",
            enum: ["solo", "small", "medium", "large", "enterprise"],
          },
          services_offered: { type: "array", items: { type: "string" } },
          key_insights: { type: "string" },
          confidence: { type: "number" },
        },
        required: [
          "industry",
          "sub_industries",
          "business_size",
          "key_insights",
          "confidence",
        ],
      },
    });

    if (!aiResponse?.data) {
      console.warn("[enrichLeadWithAI] AI did not return structured data");
      return Response.json({ status: "failed", reason: "ai_response_invalid" });
    }

    const enrichment = aiResponse.data;
    console.log("[enrichLeadWithAI] AI analysis complete:", {
      industry: enrichment.industry,
      confidence: enrichment.confidence,
    });

    // ─────────────────────────────────────────────────────
    // STEP 2: Build tags and enrichment notes
    // ─────────────────────────────────────────────────────
    const tags = [];

    if (enrichment.industry) {
      tags.push(enrichment.industry);
    }

    if (enrichment.sub_industries?.length > 0) {
      tags.push(...enrichment.sub_industries);
    }

    if (enrichment.business_size) {
      tags.push(`Size: ${enrichment.business_size}`);
    }

    // Add confidence indicator
    if (enrichment.confidence >= 0.8) {
      tags.push("High Confidence");
    } else if (enrichment.confidence >= 0.5) {
      tags.push("Medium Confidence");
    } else {
      tags.push("Low Confidence");
    }

    const enrichmentNotes = `
Industry: ${enrichment.industry || "Unknown"}
Size: ${enrichment.business_size || "Unknown"}
Services: ${enrichment.services_offered?.join(", ") || "Not identified"}
Analysis Confidence: ${(enrichment.confidence * 100).toFixed(0)}%

Insights:
${enrichment.key_insights}
`.trim();

    console.log("[enrichLeadWithAI] Built enrichment package with", tags.length, "tags");

    // ─────────────────────────────────────────────────────
    // STEP 3: Update lead with enrichment data
    // ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Leads.update(leadId, {
      industry_tags: tags,
      enrichment_notes: enrichmentNotes,
      company_size: enrichment.business_size || "unknown",
      enriched_at: new Date().toISOString(),
    });

    console.log("[enrichLeadWithAI] Lead updated successfully");

    // ─────────────────────────────────────────────────────
    // STEP 4: Log the enrichment event
    // ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "lead_enrichment_completed",
      provider: "internal",
      status: "completed",
      subject: `Lead enriched: ${enrichment.industry || "Unknown industry"}`,
      message_body: enrichmentNotes,
      metadata_json: JSON.stringify({
        industry: enrichment.industry,
        confidence: enrichment.confidence,
        tags_applied: tags.length,
        website: website,
        timestamp: new Date().toISOString(),
      }),
    });

    return Response.json({
      status: "success",
      lead_id: leadId,
      industry: enrichment.industry,
      tags_applied: tags.length,
    });
  } catch (error) {
    console.error("[enrichLeadWithAI] Error:", error.message);
    return Response.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
});
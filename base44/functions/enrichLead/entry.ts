/**
 * enrichLead — auto-enrichment for the canonical Leads entity.
 *
 * Triggered by entity automation on Leads create, or called directly with { lead_id }.
 *
 * What it does:
 *  1. Loads the lead from the Leads entity
 *  2. Uses InvokeLLM with web search to scrape the business website + search for:
 *     - Industry tags (e.g. ["med spa", "aesthetics", "injectables"])
 *     - Company size estimate (solo / small / medium / large)
 *     - Social media profile URLs (Instagram, Facebook, LinkedIn, TikTok, Twitter)
 *     - A short enrichment summary
 *  3. Writes the results back to the Leads record
 *  4. Logs a CommunicationEvent
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { withTimeout } from "../_shared/timeout.js";

const ENRICH_LEAD_TIMEOUT_MS = 10_000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support automation payload shape AND direct { lead_id } call
    const leadId = body?.lead_id ?? body?.event?.entity_id ?? body?.data?.id ?? null;
    const leadData = body?.data ?? null;

    if (!leadId) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    // Load lead — use automation pre-loaded data if available
    const lead = (leadData?.id === leadId)
      ? leadData
      : await base44.asServiceRole.entities.Leads.get(leadId);

    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // Skip if already enriched recently (within 24h) to avoid redundant runs
    if (lead.enriched_at) {
      const hoursSince = (Date.now() - new Date(lead.enriched_at).getTime()) / 3600000;
      if (hoursSince < 24) {
        return Response.json({ success: true, skipped: true, reason: "Already enriched within 24h" });
      }
    }

    // Build the enrichment prompt
    const websiteHint = lead.website ? `Their website is: ${lead.website}.` : "";
    const prompt = `You are a business research assistant. Research the following business and extract structured metadata.

Business name: ${lead.business_name}
Business type: ${lead.business_type || "unknown"}
${websiteHint}
Location context: ${lead.source || "unknown source"}

Search the web for this business and extract:
1. industry_tags: 2-5 specific industry/niche tags (e.g. ["med spa", "aesthetics", "botox", "filler"])
2. company_size: one of "solo" (1 person), "small" (2-10), "medium" (11-50), "large" (50+), or "unknown"
3. social_profiles: object with any found URLs for keys: instagram, facebook, linkedin, tiktok, twitter (only include ones you actually find, omit others)
4. website: the business website URL if found (or confirm the one provided)
5. enrichment_notes: 1-2 sentence summary of what you found about this business (services, positioning, online presence)

Return ONLY valid JSON matching this schema — no markdown, no explanation.`;

    let enriched: any = {};
    try {
      enriched = await withTimeout(
        base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              industry_tags:     { type: "array", items: { type: "string" } },
              company_size:      { type: "string" },
              social_profiles:   { type: "object" },
              website:           { type: "string" },
              enrichment_notes:  { type: "string" }
            }
          }
        }),
        ENRICH_LEAD_TIMEOUT_MS,
        "enrichLead InvokeLLM"
      );
    } catch (llmErr) {
      const message = llmErr instanceof Error ? llmErr.message : String(llmErr);
      console.error("enrichLead LLM error:", message);
      // Still write a partial enrichment record so we don't retry in a loop
      await base44.asServiceRole.entities.Leads.update(leadId, {
        enriched_at: new Date().toISOString(),
        enrichment_notes: `Enrichment attempted but failed: ${message}`
      });
      return Response.json({ success: false, error: message }, { status: 502 });
    }

    // Validate company_size against allowed enum values
    const validSizes = ["solo", "small", "medium", "large", "unknown"];
    const companySize = validSizes.includes(enriched.company_size) ? enriched.company_size : "unknown";

    // Build update payload — only write fields that came back with real values
    const update: any = {
      enriched_at: new Date().toISOString(),
      enrichment_notes: enriched.enrichment_notes || null,
      company_size: companySize,
    };

    if (Array.isArray(enriched.industry_tags) && enriched.industry_tags.length > 0) {
      update.industry_tags = enriched.industry_tags.slice(0, 8); // cap at 8 tags
    }

    if (enriched.social_profiles && typeof enriched.social_profiles === "object") {
      update.social_profiles = enriched.social_profiles;
    }

    // Only update website if we don't already have one and the LLM found one
    if (!lead.website && enriched.website) {
      update.website = enriched.website;
    }

    await base44.asServiceRole.entities.Leads.update(leadId, update);

    // Log event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: "Lead auto-enriched",
      message_body: `Enrichment complete. Tags: ${(update.industry_tags || []).join(", ") || "none"}. Size: ${companySize}. ${enriched.enrichment_notes || ""}`,
      metadata_json: JSON.stringify({ source: "enrichLead", lead_id: leadId, tags: update.industry_tags, size: companySize }),
    });

    return Response.json({
      success: true,
      lead_id: leadId,
      enriched: update,
    });

  } catch (error) {
    console.error("enrichLead error:", error);
    const message = error instanceof Error ? error.message : "Enrichment failed";
    return Response.json({ error: message }, { status: 500 });
  }
});

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";
import { withTimeout } from "../_shared/timeout.js";
import {
  buildIndustryDataQualityFlags,
  classifyLeadIndustry,
  serializeIndustryClassification,
} from "../_shared/industryClassifier.ts";

const ENRICH_LEAD_TIMEOUT_MS = 10_000;

function mergeTags(canonicalLabel, enrichedTags, existingTags) {
  const seen = new Set();
  const output = [];
  for (const value of [canonicalLabel, ...(enrichedTags || []), ...(existingTags || [])]) {
    const text = String(value || "").trim();
    const key = text.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output.slice(0, 8);
}

function industryUpdate(lead, classification, now, enrichedTags = null) {
  const industry = classification.status === "classified"
    ? classification.industry_label
    : classification.status === "excluded_test"
      ? "Internal Test / Excluded"
      : "Needs Manual Review";

  return {
    industry,
    industry_tags: mergeTags(industry, enrichedTags, lead.industry_tags),
    assigned_agent_name: classification.routing.agent_name,
    ai_last_classification: serializeIndustryClassification(classification),
    ai_confidence: classification.confidence,
    data_quality_flags: buildIndustryDataQualityFlags(lead.data_quality_flags, classification),
    data_quality_checked_at: now,
    audited_at: now,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const leadId = body?.lead_id ?? body?.event?.entity_id ?? body?.data?.id ?? null;
    const leadData = body?.data ?? null;

    if (!leadId) return secureJson({ error: "lead_id is required" }, { status: 400 });

    const lead = leadData?.id === leadId
      ? leadData
      : await base44.asServiceRole.entities.Leads.get(leadId);

    if (!lead) return secureJson({ error: "Lead not found" }, { status: 404 });

    const now = new Date().toISOString();

    // Even when enrichment is fresh, re-run the deterministic classifier so a
    // legacy or corrected taxonomy cannot leave the canonical industry stale.
    if (lead.enriched_at) {
      const hoursSince = (Date.now() - new Date(lead.enriched_at).getTime()) / 3_600_000;
      if (hoursSince < 24) {
        const classification = classifyLeadIndustry(lead);
        const classificationUpdate = industryUpdate(lead, classification, now);
        await base44.asServiceRole.entities.Leads.update(leadId, classificationUpdate);
        return secureJson({
          success: true,
          skipped_enrichment: true,
          reason: "Already enriched within 24h; canonical industry refreshed",
          classification,
        });
      }
    }

    const websiteHint = lead.website ? `Their website is: ${lead.website}.` : "";
    const prompt = `You are a business research assistant. Research the business and return factual structured metadata.

Business name: ${lead.business_name}
Business type supplied by import/form: ${lead.business_type || "unknown"}
${websiteHint}
Location/source context: ${lead.source || "unknown"}

Extract:
1. industry_tags: 2-5 specific services or niche terms. Do not repeat a broad imported label unless verified.
2. company_size: exactly one of solo, small, medium, large, unknown.
3. social_profiles: found URLs only for instagram, facebook, linkedin, tiktok, twitter.
4. website: verified official business website if found.
5. enrichment_notes: 1-2 factual sentences describing actual services and positioning.

Important distinctions:
- Nail salons, barber shops, hair salons, tanning and massage businesses are Beauty & Personal Care, not medical spas.
- Medical spas require medical-aesthetic evidence such as injectables, Botox, fillers, medical lasers, cosmetic surgery or clinical skin treatments.
- Physical therapy and chiropractic are not generic fitness businesses.
Return only valid JSON.`;

    let enriched = {};
    try {
      enriched = await withTimeout(
        base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              industry_tags: { type: "array", items: { type: "string" } },
              company_size: { type: "string" },
              social_profiles: { type: "object" },
              website: { type: "string" },
              enrichment_notes: { type: "string" },
            },
          },
        }),
        ENRICH_LEAD_TIMEOUT_MS,
        "enrichLead InvokeLLM",
      );
    } catch (llmError) {
      const message = llmError instanceof Error ? llmError.message : String(llmError);
      const fallbackClassification = classifyLeadIndustry(lead);
      await base44.asServiceRole.entities.Leads.update(leadId, {
        ...industryUpdate(lead, fallbackClassification, now),
        enriched_at: now,
        enrichment_notes: `Enrichment attempted but failed: ${message}`,
      });
      console.error("[enrichLead] LLM error:", message);
      return secureJson({
        success: false,
        error: message,
        classification: fallbackClassification,
      }, { status: 502 });
    }

    const validSizes = ["solo", "small", "medium", "large", "unknown"];
    const companySize = validSizes.includes(enriched.company_size) ? enriched.company_size : "unknown";
    const enrichedTags = Array.isArray(enriched.industry_tags)
      ? enriched.industry_tags.filter(Boolean).slice(0, 8)
      : [];

    const classificationInput = {
      ...lead,
      industry_tags: enrichedTags.length > 0 ? enrichedTags : lead.industry_tags,
      enrichment_notes: enriched.enrichment_notes || lead.enrichment_notes,
      website: lead.website || enriched.website,
    };
    const classification = classifyLeadIndustry(classificationInput);

    const update = {
      enriched_at: now,
      enrichment_notes: enriched.enrichment_notes || null,
      company_size: companySize,
      ...industryUpdate(lead, classification, now, enrichedTags),
    };

    if (enriched.social_profiles && typeof enriched.social_profiles === "object") {
      update.social_profiles = enriched.social_profiles;
    }
    if (!lead.website && enriched.website) update.website = enriched.website;

    await base44.asServiceRole.entities.Leads.update(leadId, update);

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: "Lead auto-enriched and industry-classified",
      message_body: `Industry: ${update.industry} (${classification.confidence}%, ${classification.status}). Tags: ${update.industry_tags.join(", ") || "none"}. Size: ${companySize}. ${enriched.enrichment_notes || ""}`,
      metadata_json: JSON.stringify({
        source: "enrichLead",
        lead_id: leadId,
        industry_key: classification.industry_key,
        industry: update.industry,
        classification_status: classification.status,
        confidence: classification.confidence,
        classifier_version: classification.classifier_version,
      }),
    });

    return secureJson({ success: true, lead_id: leadId, enriched: update, classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enrichment failed";
    console.error("[enrichLead]", error);
    return secureJson({ error: message }, { status: 500 });
  }
});

/**
 * enrichmentGuards.ts — #104 #140
 * #104: skip enrichment if lead.enriched_at < 7 days ago
 * #140: skip AI scoring if confidence < 0.6
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// #104: fresh enrichment guard
export function needsEnrichment(lead: any): boolean {
  if (!lead.enriched_at) return true;
  const age = Date.now() - new Date(lead.enriched_at).getTime();
  return age > SEVEN_DAYS_MS;
}

// #140: confidence threshold for AI scoring
export function meetsConfidenceThreshold(score_result: { confidence?: number; score?: number }): boolean {
  return (score_result.confidence ?? 1) >= 0.6;
}

// #139: scoring factor completeness check
export function scoringFactorsPresent(lead: any): { complete: boolean; missing: string[] } {
  const factors = ["phone", "business_name", "industry", "has_website"];
  const missing = factors.filter(f => lead[f] === undefined || lead[f] === null || lead[f] === "");
  return { complete: missing.length === 0, missing };
}

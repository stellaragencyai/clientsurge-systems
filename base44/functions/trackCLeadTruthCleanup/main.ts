import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.35";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import {
  TRACK_C_HARD_QUARANTINE_LEAD_IDS,
  buildTrackCLeadQuarantinePatch,
  isTrackCHardQuarantineLeadId,
} from "../_shared/trackCLeadTruth.js";

function normalizeRequestedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return TRACK_C_HARD_QUARANTINE_LEAD_IDS;
  const ids = value.map((id) => String(id || "").trim()).filter(Boolean);
  return ids.length ? ids : TRACK_C_HARD_QUARANTINE_LEAD_IDS;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run !== false;
    const now = new Date().toISOString();
    const requestedIds = normalizeRequestedIds(payload?.lead_ids);
    const ids = requestedIds.filter(isTrackCHardQuarantineLeadId);

    const results: Array<Record<string, unknown>> = [];
    let updated = 0;
    let alreadyQuarantined = 0;
    let notFound = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const lead = await base44.asServiceRole.entities.Leads.get(id).catch(() => null);
        if (!lead) {
          notFound += 1;
          results.push({ id, action: "not_found" });
          continue;
        }

        const patch = buildTrackCLeadQuarantinePatch(lead, now);
        if ((lead.quality_review_status || "active") === "quarantined") {
          alreadyQuarantined += 1;
          results.push({ id, action: "already_quarantined" });
          continue;
        }

        if (dryRun) {
          results.push({ id, action: "would_mark", patch });
          continue;
        }

        const updatedLead = await base44.asServiceRole.entities.Leads.update(id, patch);
        updated += 1;
        results.push({
          id,
          action: "marked",
          after: {
            quality_review_status: updatedLead?.quality_review_status,
            quality_confidence: updatedLead?.quality_confidence,
            audited_at: updatedLead?.audited_at,
          },
        });
      } catch (error) {
        failed += 1;
        results.push({
          id,
          action: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return secureJson({
      success: failed === 0,
      dry_run: dryRun,
      target_count: ids.length,
      updated,
      already_quarantined: alreadyQuarantined,
      not_found: notFound,
      failed,
      results,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Track C lead truth action failed";
    console.error("trackCLeadTruthCleanup error:", error);
    return secureJson({ error: message }, { status: 500 });
  }
});

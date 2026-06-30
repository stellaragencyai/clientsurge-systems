import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.35";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { createAuditLog } from "../shared/auditLog.ts";
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
    const user = await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run !== false;
    const now = new Date().toISOString();
    const requestedIds = normalizeRequestedIds(payload?.lead_ids);
    const ids = requestedIds.filter(isTrackCHardQuarantineLeadId);
    const rejectedIds = requestedIds.filter((id) => !isTrackCHardQuarantineLeadId(id));

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
        const before = {
          quality_review_status: lead.quality_review_status || "active",
          quality_reason: lead.quality_reason || null,
          quality_reason_codes: lead.quality_reason_codes || [],
        };

        if (before.quality_review_status === "quarantined") {
          alreadyQuarantined += 1;
          results.push({ id, action: "already_quarantined", before, patch });
          continue;
        }

        if (dryRun) {
          results.push({ id, action: "would_quarantine", before, patch });
          continue;
        }

        const updatedLead = await base44.asServiceRole.entities.Leads.update(id, patch);
        updated += 1;
        results.push({
          id,
          action: "quarantined",
          before,
          after: {
            quality_review_status: updatedLead?.quality_review_status,
            quality_confidence: updatedLead?.quality_confidence,
            audited_at: updatedLead?.audited_at,
          },
        });

        await createAuditLog(base44, {
          admin_email: user.email || "unknown_admin",
          action: "track_c_hard_quarantine_lead",
          entity_name: "Leads",
          record_id: id,
          before,
          after: patch,
          notes: "Track C safe cleanup: non-destructive quarantine only; no delete, no merge, no provider/payment change.",
        }).catch(() => null);
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
      rejected_ids: rejectedIds,
      results,
      safe_boundaries: {
        deleted_records: 0,
        merged_duplicates: 0,
        stripe_touched: false,
        provider_send_logic_touched: false,
      },
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Track C lead truth cleanup failed";
    console.error("trackCLeadTruthCleanup error:", error);
    return secureJson({ error: message }, { status: 500 });
  }
});

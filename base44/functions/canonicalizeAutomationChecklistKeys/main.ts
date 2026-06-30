import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.35";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

const LEGACY_KEY_MAP: Record<string, string> = {
  missed_call_textback: "missed_call_text_back",
  missed_call_txt_back: "missed_call_text_back",
  followup_sequences: "nurture_sequence_14d",
  nurture_14d: "nurture_sequence_14d",
  appointment_booking: "ai_booking_agent",
  booking_agent: "ai_booking_agent",
};

function normalizeAlias(raw: unknown) {
  const key = String(raw || "").trim().toLowerCase();
  return LEGACY_KEY_MAP[key] || null;
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

    const checklists = await base44.asServiceRole.entities.AutomationChecklist.list("-created_date", 500).catch(() => []);
    const legacyChecklists = (checklists || [])
      .map((checklist: Record<string, unknown>) => ({
        checklist,
        canonical_key: normalizeAlias(checklist.service_key),
      }))
      .filter((row) => row.canonical_key);

    const results: Array<Record<string, unknown>> = [];
    let checklistsUpdated = 0;
    let stepsUpdated = 0;
    let failed = 0;

    for (const row of legacyChecklists) {
      const checklist = row.checklist;
      const canonicalKey = row.canonical_key as string;
      const checklistId = String(checklist.id || "");
      const legacyKey = String(checklist.service_key || "");

      const result: Record<string, unknown> = {
        checklist_id: checklistId,
        legacy_key: legacyKey,
        canonical_key: canonicalKey,
        business_name: checklist.business_name || "",
        dry_run: dryRun,
      };

      try {
        if (!dryRun) {
          await base44.asServiceRole.entities.AutomationChecklist.update(checklistId, {
            service_key: canonicalKey,
            dashboard_truth_status: "trusted",
            dashboard_truth_notes: `Canonicalized service_key from ${legacyKey} to ${canonicalKey} by canonicalizeAutomationChecklistKeys at ${now}.`,
          });
          checklistsUpdated += 1;

          const steps = await base44.asServiceRole.entities.AutomationChecklistStep.filter(
            { automation_checklist_id: checklistId },
            "step_order",
            100,
          ).catch(() => []);

          for (const step of steps || []) {
            if (normalizeAlias(step.service_key) === canonicalKey || step.service_key === legacyKey) {
              await base44.asServiceRole.entities.AutomationChecklistStep.update(step.id, {
                service_key: canonicalKey,
              }).catch(() => null);
              stepsUpdated += 1;
            }
          }
        }
        result.action = dryRun ? "would_update" : "updated";
      } catch (error) {
        failed += 1;
        result.action = "failed";
        result.error = error instanceof Error ? error.message : "Unknown error";
      }

      results.push(result);
    }

    return secureJson({
      success: failed === 0,
      dry_run: dryRun,
      scanned_checklists: (checklists || []).length,
      legacy_records_found: legacyChecklists.length,
      checklists_updated: checklistsUpdated,
      steps_updated: stepsUpdated,
      failed,
      results,
      safety: {
        deleted_records: 0,
        merged_records: 0,
        lifecycle_fields_changed: false,
        payment_logic_changed: false,
        provider_logic_changed: false,
      },
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson({ error: error.message, code: error.code }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to canonicalize AutomationChecklist keys";
    console.error("canonicalizeAutomationChecklistKeys error:", error);
    return secureJson({ error: message }, { status: 500 });
  }
});

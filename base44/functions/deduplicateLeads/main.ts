import { secureJson } from "../_shared/response.ts";
/**
 * deduplicateLeads - #167/#506
 * Runs dedup on canonical Leads records.
 * Merges by phone hash or normalized phone number and keeps the highest lead_score.
 * Duplicate rows are marked/suppressed, not deleted, so launch data remains reversible.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { groupDuplicateLeads, selectLeadKeeper } from "./deduplicateLeads.shared.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const { dry_run = true } = await req.json().catch(() => ({}));

    const leads = await base44.asServiceRole.entities.Leads.list("-created_date", 25000).catch(() => []);
    const all = leads || [];
    const duplicateGroups = groupDuplicateLeads(all);

    let duplicates_found = 0;
    let merged = 0;
    const groups = [];

    for (const group of Object.values(duplicateGroups) as any[][]) {
      duplicates_found += group.length - 1;
      const keeper = selectLeadKeeper(group);
      const dupes = group.filter((lead) => lead.id !== keeper.id);
      groups.push({
        keeper_id: keeper.id,
        duplicate_ids: dupes.map((lead) => lead.id),
        key: group[0]?.phone_hash ? "phone_hash" : "phone",
      });

      if (!dry_run) {
        const markedAt = new Date().toISOString();
        let keeperNotes = keeper.notes || "";
        const mergedIds = new Set(keeper.dedupe_merged_ids || []);
        for (const dupe of dupes) {
          mergedIds.add(dupe.id);
          const mergedNotes = [
            keeperNotes,
            dupe.notes ? `[Merged from ${dupe.id}]: ${dupe.notes}` : null,
            `[Deduped ${new Date().toISOString()}]: merged duplicate lead ${dupe.id}`,
          ].filter(Boolean).join("\n");
          keeperNotes = mergedNotes;

          await base44.asServiceRole.entities.Leads.update(keeper.id, {
            notes: mergedNotes,
            dedupe_status: "keeper",
            dedupe_merged_ids: [...mergedIds],
          }).catch(() => {});
          await base44.asServiceRole.entities.Leads.update(dupe.id, {
            crm_stage: "Lost",
            outreach_status: "do_not_contact",
            do_not_contact: true,
            dedupe_status: "merged_duplicate",
            dedupe_duplicate_of: keeper.id,
            dedupe_group_key: group[0]?.phone_hash ? `hash:${group[0].phone_hash}` : `phone:${group[0]?.phone || ""}`,
            dedupe_marked_at: markedAt,
            notes: [
              dupe.notes || "",
              `[Deduped ${markedAt}]: non-destructively marked duplicate of ${keeper.id}`,
            ].filter(Boolean).join("\n"),
          }).catch(() => {});
          merged++;
        }
      }
    }

    return secureJson({
      success: true,
      dry_run,
      total_leads: all.length,
      duplicate_groups: Object.keys(duplicateGroups).length,
      duplicates_found,
      merged,
      groups,
    });
  } catch (err: any) {
    if (err instanceof AuthGuardError) {
      return secureJson({ error: err.message, code: err.code }, { status: err.status });
    }
    return secureJson({ error: err.message }, { status: 500 });
  }
});

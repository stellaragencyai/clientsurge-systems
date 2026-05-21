import { secureJson } from "../_shared/response.ts";
/**
 * deduplicateLeads - #167/#506
 * Runs dedup on all existing SpaLead records.
 * Merges by phone hash or normalized phone number, keeps highest lead_score, removes duplicates.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { groupDuplicateLeads, selectLeadKeeper } from "./deduplicateLeads.shared.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { dry_run = true } = await req.json().catch(() => ({}));

    const leads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    const all = leads || [];
    const duplicateGroups = groupDuplicateLeads(all);

    let duplicates_found = 0;
    let merged = 0;

    for (const group of Object.values(duplicateGroups) as any[][]) {
      duplicates_found += group.length - 1;
      const keeper = selectLeadKeeper(group);
      const dupes = group.filter((lead) => lead.id !== keeper.id);

      if (!dry_run) {
        for (const dupe of dupes) {
          if (dupe.notes) {
            await base44.asServiceRole.entities.SpaLead.update(keeper.id, {
              notes: [keeper.notes, `[Merged from ${dupe.id}]: ${dupe.notes}`].filter(Boolean).join("\n"),
            }).catch(() => {});
          }
          await base44.asServiceRole.entities.SpaLead.delete(dupe.id).catch(() => {});
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
    });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});

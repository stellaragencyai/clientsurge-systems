/**
 * deduplicateLeads — #167
 * Runs dedup on all existing SpaLead records.
 * Merges by phone number — keeps highest lead_score, removes duplicates.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { dry_run = true } = await req.json().catch(() => ({}));

    const leads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    const all = leads || [];

    // Group by normalised phone
    const byPhone: Record<string, any[]> = {};
    for (const l of all) {
      const phone = (l.phone || "").replace(/\D/g, "");
      if (!phone || phone.length < 7) continue;
      if (!byPhone[phone]) byPhone[phone] = [];
      byPhone[phone].push(l);
    }

    let duplicates_found = 0;
    let merged = 0;

    for (const [phone, group] of Object.entries(byPhone)) {
      if (group.length < 2) continue;
      duplicates_found += group.length - 1;

      // Keep the one with highest lead_score (or most recent)
      const keeper = group.sort((a, b) =>
        (b.lead_score || 0) - (a.lead_score || 0) || new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      )[0];

      const dupes = group.filter(l => l.id !== keeper.id);

      if (!dry_run) {
        for (const dupe of dupes) {
          // Merge notes before deleting
          if (dupe.notes) {
            await base44.asServiceRole.entities.SpaLead.update(keeper.id, {
              notes: [keeper.notes, `[Merged from ${dupe.id}]: ${dupe.notes}`].filter(Boolean).join("
"),
            }).catch(() => {});
          }
          await base44.asServiceRole.entities.SpaLead.delete(dupe.id).catch(() => {});
          merged++;
        }
      }
    }

    return Response.json({ success: true, dry_run, total_leads: all.length, duplicate_groups: Object.keys(byPhone).filter(k => byPhone[k].length > 1).length, duplicates_found, merged });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

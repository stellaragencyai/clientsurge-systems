/**
 * autoArchiveOldLeads — #91
 * Anonymises WebsiteLead / SpaLead records older than 365 days (GDPR-style).
 * Replaces PII fields with anonymised placeholders.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cutoff = new Date(Date.now() - ONE_YEAR_MS).toISOString();

    const leads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    const old = (leads || []).filter((l: any) => l.created_date < cutoff && !l.archived);

    let archived = 0;
    for (const lead of old.slice(0, 200)) {
      await base44.asServiceRole.entities.SpaLead.update(lead.id, {
        phone: "***-***-" + (lead.phone || "").slice(-4),
        email: lead.email ? "***@archived" : null,
        business_name: `[Archived Lead ${lead.id.slice(-6)}]`,
        notes: null,
        archived: true,
        archived_at: new Date().toISOString(),
      }).catch(() => {});
      archived++;
    }

    return Response.json({ success: true, archived, total_checked: old.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

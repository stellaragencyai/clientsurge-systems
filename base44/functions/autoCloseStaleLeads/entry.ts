/**
 * autoCloseStaleLeads — #108 #120
 * Daily: closes leads with no contact > 30 days. Sets status = "Closed - Stale".
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

    const leads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    const stale = (leads || []).filter((l: any) => {
      if (["Client", "Closed - Stale", "Disqualified"].includes(l.status)) return false;
      const lastContact = l.last_contacted || l.created_date;
      return lastContact < cutoff;
    });

    let closed = 0;
    for (const lead of stale.slice(0, 500)) {
      await base44.asServiceRole.entities.SpaLead.update(lead.id, {
        status: "Closed - Stale",
        notes: (lead.notes || "") + `
[Auto-closed ${new Date().toISOString().split("T")[0]}: no contact > 30 days]`,
      }).catch(() => {});
      closed++;
    }

    return Response.json({ success: true, closed, total_stale: stale.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

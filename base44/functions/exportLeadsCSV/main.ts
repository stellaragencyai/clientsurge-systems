import { secureJson } from "../_shared/response.ts";
/**
 * exportLeadsCSV — #110 #111
 * Returns CSV with Content-Disposition header. Supports filters + date range.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function toCSV(rows: any[], fields: string[]): string {
  const header = fields.join(",");
  const lines = rows.map(row =>
    fields.map(f => {
      const val = row[f] ?? "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
    }).join(",")
  );
  return [header, ...lines].join("\n");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type = "leads", industry, status, since, until } = await req.json().catch(() => ({}));

    let rows: any[] = [];
    let fields: string[] = [];

    if (type === "leads") {
      // #110: leads CSV
      const all = await base44.asServiceRole.entities.Leads.list().catch(() => []);
      rows = (all || []).filter((l: any) => {
        if (industry && l.industry !== industry) return false;
        if (status && l.status !== status) return false;
        if (since && l.created_date < since) return false;
        if (until && l.created_date > until) return false;
        return true;
      });
      fields = ["business_name", "phone", "email", "industry", "city", "state", "status", "lead_score", "source", "created_date", "last_contacted"];
    } else {
      // #111: communication logs CSV
      const all = await base44.asServiceRole.entities.CommunicationEvent?.list?.().catch(() => []);
      rows = (all || []).filter((e: any) => {
        if (since && e.created_date < since) return false;
        if (until && e.created_date > until) return false;
        return true;
      });
      fields = ["lead_id", "order_id", "direction", "channel", "status", "created_date"];
    }

    const csv = toCSV(rows, fields);
    const filename = `${type}_export_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Frame-Options": "DENY",
      },
    });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});

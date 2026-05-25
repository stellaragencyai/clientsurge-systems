/**
 * exportCommunicationLogs — #111
 * Returns communication events as CSV with optional date-range filtering.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function toCSV(rows: any[], fields: string[]): string {
  const header = fields.join(",");
  const lines = rows.map((row) =>
    fields
      .map((field) => {
        const raw = row[field] ?? "";
        const value = String(raw).replace(/"/g, '""');
        return value.includes(",") || value.includes('"') || value.includes("\n")
          ? `"${value}"`
          : value;
      })
      .join(",")
  );

  return [header, ...lines].join("\n");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { since, until } = await req.json().catch(() => ({}));

    const all = await base44.asServiceRole.entities.CommunicationEvent.list().catch(() => []);
    const rows = (all || []).filter((event: any) => {
      if (since && event.created_date < since) return false;
      if (until && event.created_date > until) return false;
      return true;
    });

    const csv = toCSV(rows, [
      "lead_id",
      "order_id",
      "direction",
      "channel",
      "status",
      "provider",
      "provider_message_id",
      "created_date",
    ]);

    const filename = `communication_logs_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "X-Frame-Options": "DENY",
      },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});

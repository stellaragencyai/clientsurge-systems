import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

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

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "super_admin") {
      return json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { since, until, limit = 1000 } = await req.json().catch(() => ({}));
    const safeLimit = Math.min(Math.max(Number(limit) || 1000, 1), 5000);

    const all = await base44.asServiceRole.entities.CommunicationEvent.list("-created_date", safeLimit).catch(() => []);
    const rows = (all || []).filter((event: any) => {
      if (since && event.created_date < since) return false;
      if (until && event.created_date > until) return false;
      return true;
    });

    const csv = toCSV(rows, [
      "created_date",
      "client_id",
      "lead_id",
      "order_id",
      "direction",
      "channel",
      "event_type",
      "status",
      "provider",
      "provider_message_id",
      "error_message",
    ]);

    const filename = `communication_logs_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "X-Frame-Options": "DENY",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return json({ success: false, error: err?.message || "Export failed" }, { status: 500 });
  }
});

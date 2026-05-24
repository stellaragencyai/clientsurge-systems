import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { createAuditLog } from "../shared/auditLog.ts";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const patch = payload?.settings || {};

    // Load current settings record
    const records = await base44.asServiceRole.entities.AdminSettings.list(null, 1);
    const existing = records?.[0];

    let settings;
    if (existing) {
      settings = await base44.asServiceRole.entities.AdminSettings.update(existing.id, patch);
    } else {
      settings = await base44.asServiceRole.entities.AdminSettings.create(patch);
    }

    await createAuditLog(base44, {
      admin_email: user.email,
      action: existing ? "update_admin_settings" : "create_admin_settings",
      entity_name: "AdminSettings",
      record_id: settings.id || existing?.id || null,
      before: existing || null,
      after: settings,
    });

    return Response.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update admin settings";
    return Response.json({ error: message }, { status: 500 });
  }
});

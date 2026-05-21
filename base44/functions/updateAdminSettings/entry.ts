import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { saveAdminSettings } from "../_shared/adminSettings.js";

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
    const patch = payload?.settings || payload || {};
    const settings = await saveAdminSettings({ base44, actor: user, patch });

    return Response.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update admin settings";
    return Response.json({ error: message }, { status: 500 });
  }
});

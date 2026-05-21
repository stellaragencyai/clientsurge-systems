import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { loadAdminSettings } from "../_shared/adminSettings.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const { settings } = await loadAdminSettings(base44);

    return Response.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return Response.json({ error: message }, { status: 500 });
  }
});

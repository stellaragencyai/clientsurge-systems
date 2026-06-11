import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";
import { loadAdminSettings } from "../_shared/adminSettings.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const { settings } = await loadAdminSettings(base44);

    return secureJson({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return secureJson({ error: message }, { status: 500 });
  }
});

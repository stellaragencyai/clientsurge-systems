import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";
import { loadAdminSettings } from "../_shared/adminSettings.js";
import {
  GA4_MEASUREMENT_ID,
  isAdmin,
  listGa4ConfigurationRecords,
  summarizeGa4Records,
} from "../_shared/ga4Configuration.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) {
      return secureJson({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const { settings } = await loadAdminSettings(base44);
    const records = await listGa4ConfigurationRecords(base44).catch(() => []);
    const ga4Status = summarizeGa4Records(records, GA4_MEASUREMENT_ID);

    return secureJson({
      success: true,
      settings,
      ga4_status: ga4Status,
      ga4_migration: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return secureJson({ success: false, error: message }, { status: 500 });
  }
});

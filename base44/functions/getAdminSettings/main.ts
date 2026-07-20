import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../shared/response.ts";
import { loadAdminSettings } from "../shared/adminSettings.js";
import {
  isGa4Admin,
  queryAllGa4Records,
  summarizeGa4Records,
} from "../shared/ga4Configuration.ts";

async function readGa4Status(base44: any) {
  const records = await queryAllGa4Records(base44);

  return summarizeGa4Records(records);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isGa4Admin(user)) {
      return secureJson({ error: "Admin access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const { settings } = await loadAdminSettings(base44);
    const ga4_status = await readGa4Status(base44);

    return secureJson({
      success: true,
      settings,
      ga4_status,
      ga4_migration: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load admin settings";
    return secureJson({ error: message }, { status: 500 });
  }
});

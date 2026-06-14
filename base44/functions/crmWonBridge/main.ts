import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { bridgeCrmWonToPayment } from "../_shared/crmWonBridge.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));
    const leadId = payload?.lead_id;

    if (!leadId) {
      return secureJson({ error: "lead_id is required" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(leadId).catch(() => null);
    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    const result = await bridgeCrmWonToPayment({
      base44,
      lead,
      package_key: payload?.package_key,
      payment_source: payload?.payment_source,
      follow_up_date: payload?.follow_up_date,
      note: payload?.note,
      adminEmail: user.email || "admin",
    });

    return secureJson(result);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    const status = error?.status || 500;
    const code = error?.code || "crm_won_bridge_failed";
    const message = error instanceof Error ? error.message : "Failed to bridge CRM Won";
    return secureJson({ error: message, code }, { status });
  }
});

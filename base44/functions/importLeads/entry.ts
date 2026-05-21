import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import {
  applyLeadImport,
  LEAD_PIPELINE_MAX_FETCH,
  prepareLeadImport,
} from "../_shared/leadPipeline.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    const dryRun = payload?.dry_run !== false;
    const importSource = typeof payload?.import_source === "string" && payload.import_source.trim()
      ? payload.import_source.trim()
      : "manual_import";

    if (rows.length === 0) {
      return secureJson({ error: "rows is required and must be a non-empty array" }, { status: 400 });
    }

    if (dryRun) {
      const existingLeads = await base44.asServiceRole.entities.Leads.list("-created_date", LEAD_PIPELINE_MAX_FETCH);
      const preview = prepareLeadImport({
        rows,
        existingLeads,
        importSource,
      });

      return secureJson({
        success: true,
        dry_run: true,
        preview,
      });
    }

    const result = await applyLeadImport({
      base44,
      rows,
      importSource,
    });

    return secureJson({
      success: true,
      dry_run: false,
      result: {
        import_batch_id: result.import_batch_id,
        import_source: result.import_source,
        generated_at: result.generated_at,
        counts: result.counts,
        import_event_id: result.import_event_id,
        created: result.created.map((lead: Record<string, unknown>) => ({
          id: lead.id,
          full_name: lead.full_name,
          business_name: lead.business_name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
        })),
        updated: result.updated.map((lead: Record<string, unknown>) => ({
          id: lead.id,
          full_name: lead.full_name,
          business_name: lead.business_name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
        })),
        actions: result.actions,
      },
    });
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

    const message = error instanceof Error ? error.message : "Failed to import leads";
    return secureJson({ error: message }, { status: 500 });
  }
});

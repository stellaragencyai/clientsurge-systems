import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import {
  buildLeadPipelineSnapshot,
  LEAD_PIPELINE_MAX_FETCH,
} from "../_shared/leadPipeline.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const params = new URL(req.url).searchParams;
    const filters = {
      search: payload?.search ?? params.get("search") ?? "",
      status: payload?.status ?? params.get("status") ?? "all",
      source: payload?.source ?? params.get("source") ?? "all",
      intake_type: payload?.intake_type ?? params.get("intake_type") ?? "all",
      stage_group: payload?.stage_group ?? params.get("stage_group") ?? "all",
      segment: payload?.segment ?? params.get("segment") ?? "all",
    };
    const limit = Number(payload?.limit ?? params.get("limit") ?? 100);
    const offset = Number(payload?.offset ?? params.get("offset") ?? 0);

    const [leads, events] = await Promise.all([
      base44.asServiceRole.entities.Leads.list("-created_date", LEAD_PIPELINE_MAX_FETCH),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 200),
    ]);

    const snapshot = buildLeadPipelineSnapshot({
      leads: leads || [],
      events: events || [],
      filters,
      limit,
      offset,
    });

    return Response.json({
      success: true,
      ...snapshot,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to load lead pipeline summary";
    return Response.json({ error: message }, { status: 500 });
  }
});

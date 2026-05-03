import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { LeadIngestionAdminError, revokeOrderLeadIngestionCredentials } from "../_shared/leadIngestionAdmin.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const actor = await requireAdminUser(base44);
    const payload = await req.json().catch(() => ({}));

    const result = await revokeOrderLeadIngestionCredentials({
      base44,
      orderId: payload?.order_id,
      actor,
      requestUrl: req.url,
    });

    return Response.json({
      success: true,
      message: "Lead ingestion credentials revoked. Existing credentials can no longer ingest leads.",
      ...result,
    });
  } catch (error) {
    if (error instanceof AuthGuardError || error instanceof LeadIngestionAdminError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to revoke lead ingestion credentials";
    return Response.json({ error: message }, { status: 500 });
  }
});

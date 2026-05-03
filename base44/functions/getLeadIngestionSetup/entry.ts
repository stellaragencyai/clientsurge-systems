import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { LeadIngestionAdminError, getLeadIngestionSetupData } from "../_shared/leadIngestionAdmin.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const orderId = payload?.order_id || new URL(req.url).searchParams.get("order_id");
    const setup = await getLeadIngestionSetupData({
      base44,
      orderId,
      requestUrl: req.url,
    });

    return Response.json({
      success: true,
      setup,
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

    const message = error instanceof Error ? error.message : "Failed to load lead ingestion setup";
    return Response.json({ error: message }, { status: 500 });
  }
});

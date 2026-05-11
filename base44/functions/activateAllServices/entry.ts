/**
 * Legacy orchestration path retired.
 * Service activation must flow through the canonical shared install pipeline
 * and the admin install workspace, not this duplicate bulk configurator.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { order_id } = await req.json().catch(() => ({}));

  return Response.json(
    {
      success: false,
      order_id: order_id || null,
      legacy: true,
      error:
        "activateAllServices is retired. Use the canonical install pipeline and install workspace for tracked service activation.",
    },
    { status: 410 }
  );
});

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { buildPreparedSetupProposal } from "../_shared/assistedDeployment.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const orderId = payload?.order_id;

    if (!orderId) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const proposal = await buildPreparedSetupProposal({
      base44,
      order,
    });

    return Response.json({
      success: true,
      proposal,
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

    const message = error instanceof Error ? error.message : "Failed to prepare assisted setup";
    const status = message === "Order not found" ? 404 : message === "order_id is required" ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
});

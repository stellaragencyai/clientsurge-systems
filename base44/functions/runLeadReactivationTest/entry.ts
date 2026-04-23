import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { executeLeadReactivationTest, RuntimeExecutionError } from "../_shared/installRuntime.js";

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const payload = await req.json().catch(() => ({}));
    const { order_id, max_test_leads = 3 } = payload || {};

    if (!order_id) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const boundedTestLeads = Math.min(Math.max(Number(max_test_leads) || 3, 1), 3);
    const result = await executeLeadReactivationTest({
      base44,
      order,
      maxTestLeads: boundedTestLeads,
    });

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run lead reactivation test";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 :
      error instanceof RuntimeExecutionError ? error.status || 409 :
      500;

    return Response.json(
      {
        error: message,
        details: error instanceof RuntimeExecutionError ? error.details : undefined,
      },
      { status }
    );
  }
});

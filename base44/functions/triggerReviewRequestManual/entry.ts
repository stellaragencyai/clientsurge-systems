import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { executeManualReviewRequest } from "../_shared/canonicalAutomationRuntime.js";
import { RuntimeExecutionError } from "../_shared/installRuntime.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const orderId = typeof payload?.order_id === "string" ? payload.order_id : "";

    if (!orderId) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await executeManualReviewRequest({
      base44,
      order,
      recipientPhone: payload?.target_phone || "",
      recipientEmail: payload?.target_email || "",
      customerName: payload?.customer_name || "",
      now: payload?.now || new Date().toISOString(),
    });

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }

    const runtimeError = error instanceof RuntimeExecutionError ? error : null;
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to trigger review request",
        details: runtimeError?.details,
      },
      { status: runtimeError?.status || 500 }
    );
  }
});

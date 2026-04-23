import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { executeOrderServiceRuntime, RuntimeExecutionError } from "../_shared/installRuntime.js";

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
    const {
      order_id,
      target_phone,
      caller_name,
      caller_phone,
      consent_granted = true,
      business_is_open = true,
      call_status = "no-answer",
    } = payload || {};

    if (!order_id) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await executeOrderServiceRuntime({
      base44,
      order,
      serviceKey: "missed_call_text_back",
      runtimeType: "simulate_missed_call",
      recipientPhone: target_phone || caller_phone || order.customer_phone,
      runtimeData: {
        caller_name: caller_name || "Missed Caller",
        caller_phone: caller_phone || target_phone || order.customer_phone,
        call_status,
      },
      businessIsOpen: Boolean(business_is_open),
      consentGranted: Boolean(consent_granted),
    });

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to simulate missed call";
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

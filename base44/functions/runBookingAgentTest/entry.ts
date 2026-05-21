import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { executeBookingSimulation, RuntimeExecutionError } from "../_shared/installRuntime.js";

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdmin(base44);

    const payload = await req.json().catch(() => ({}));
    const {
      order_id,
      lead_name,
      lead_email,
      lead_phone,
      scheduled_at,
    } = payload || {};

    if (!order_id) {
      return secureJson({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return secureJson({ error: "Order not found" }, { status: 404 });
    }

    const result = await executeBookingSimulation({
      base44,
      order,
      runtimeType: "run_booking_agent_test",
      leadName: lead_name,
      leadEmail: lead_email,
      leadPhone: lead_phone,
      scheduledAt: scheduled_at,
    });

    return secureJson({
      success: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run booking agent test";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 :
      error instanceof RuntimeExecutionError ? error.status || 409 :
      500;

    return secureJson(
      {
        error: message,
        details: error instanceof RuntimeExecutionError ? error.details : undefined,
      },
      { status }
    );
  }
});

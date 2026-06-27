import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

class RuntimeExecutionError extends Error {
  constructor(message, details, status = 409) {
    super(message);
    this.details = details;
    this.status = status;
  }
}

/**
 * sendTestLead — Admin-only test function that sends a test lead through the instant response pipeline.
 * Delegates to handleInstantLeadResponse for runtime execution.
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { order_id, target_phone, lead_name, lead_phone } = payload || {};

    if (!order_id) {
      return secureJson({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return secureJson({ error: "Order not found" }, { status: 404 });
    }

    // Delegate to the instant lead response handler
    const result = await base44.functions.invoke("handleInstantLeadResponse", {
      order_id,
      lead_name: lead_name || "Test Lead",
      lead_phone: lead_phone || target_phone || order.customer_phone || "",
      test_mode: true,
    });

    return secureJson({
      success: true,
      result: result.data || result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send test lead";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 :
      500;

    return secureJson({ error: message }, { status });
  }
});
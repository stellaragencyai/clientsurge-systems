import { secureJson } from "../_shared/response.ts";
import { canAccessOrder, cleanString } from "../_shared/orderAccess.ts";
/**
 * getActivationProgress — #437
 * Returns { total_services, configured, live, errored } for an order.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const order_id = cleanString(body.order_id);
    const setupToken = cleanString(body.setup_token || body.token || body.access_token);
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    if (!canAccessOrder(base44, order, setupToken)) {
      return secureJson(
        { error: "Not authorized to access this order. Sign in or use a valid setup link." },
        { status: 403 },
      );
    }

    const activation = order.activation_log || [];
    const total = activation.length;
    const configured = activation.filter(s => s.status === "configured" || s.status === "live").length;
    const live = activation.filter(s => s.status === "live").length;
    const errored = activation.filter(s => s.status === "error").length;
    const pending = total - configured - errored;
    const percent = total > 0 ? Math.round((configured / total) * 100) : 0;

    return secureJson({
      success: true, order_id,
      total_services: total, configured, live, errored, pending,
      percent_complete: percent,
      is_complete: total > 0 && configured === total,
      activation_log: activation,
      workflow_stage: order.workflow_stage,
    });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});

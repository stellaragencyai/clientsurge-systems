import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import { ALLOWED_RUNTIME_INSTALL_STATUSES } from "../_shared/installRuntime.js";
import {
  buildInstallSnapshot,
  updateOrderInstallConfiguration,
} from "../_shared/installPipeline.js";

function getStatusCode(message) {
  if (message === "Admin access required") return 403;
  if (message === "Order not found") return 404;
  if (message === "order_id is required") return 400;
  return 500;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const payload = await req.json().catch(() => ({}));
    const { order_id, shared, services, note } = payload || {};

    if (!order_id) {
      throw new Error("order_id is required");
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) {
      throw new Error("Order not found");
    }

    const updatedOrder = await updateOrderInstallConfiguration({
      base44,
      order,
      patch: {
        ...(shared !== undefined ? { shared } : {}),
        ...(services !== undefined ? { services } : {}),
      },
      note,
    });

    const snapshot = buildInstallSnapshot(updatedOrder);

    return Response.json({
      success: true,
      order: {
        id: updatedOrder.id,
        pipeline_status: updatedOrder.pipeline_status,
        install_configuration: updatedOrder.install_configuration,
        items: snapshot.serviceStates.map((item) => ({
          service_key: item.service_key,
          install_status: item.install_status,
          configuration_complete: item.configuration_complete,
          missing_configuration_fields: item.missing_configuration_fields,
          allowed_next_statuses: item.allowed_next_statuses,
          runtime_ready: ALLOWED_RUNTIME_INSTALL_STATUSES.includes(item.install_status),
        })),
      },
      configuration_summary: updatedOrder.configuration_summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update install configuration";
    return Response.json({ error: message }, { status: getStatusCode(message) });
  }
});

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import { ALLOWED_RUNTIME_INSTALL_STATUSES } from "../_shared/installRuntime.js";
import {
  InstallTransitionError,
  buildInstallSnapshot,
  updateTrackedServiceInstallStatus,
} from "../_shared/installPipeline.js";

function getStatusCode(error) {
  if (error instanceof InstallTransitionError) {
    return error.code === "install_transition_not_allowed" ? 409 : 422;
  }

  const message = error instanceof Error ? error.message : "";
  if (message === "Admin access required") return 403;
  if (message === "Order not found" || message === "Tracked service not found on order") return 404;
  if (message === "order_id, service_key, and install_status are required" || message === "Invalid install status") return 400;
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
    const { order_id, service_key, install_status, note } = payload || {};

    if (!order_id || !service_key || !install_status) {
      throw new Error("order_id, service_key, and install_status are required");
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) {
      throw new Error("Order not found");
    }

    const updatedOrder = await updateTrackedServiceInstallStatus({
      base44,
      order,
      serviceKey: service_key,
      nextStatus: install_status,
      note,
    });

    const snapshot = buildInstallSnapshot(updatedOrder);
    const trackedService = snapshot.serviceStates.find((item) => item.service_key === service_key);

    return Response.json({
      success: true,
      order: {
        id: updatedOrder.id,
        pipeline_status: updatedOrder.pipeline_status,
        items: updatedOrder.items,
      },
      service: trackedService
        ? {
            service_key: trackedService.service_key,
            install_status: trackedService.install_status,
            configuration_complete: trackedService.configuration_complete,
            allowed_next_statuses: trackedService.allowed_next_statuses,
            runtime_ready: ALLOWED_RUNTIME_INSTALL_STATUSES.includes(trackedService.install_status),
          }
        : null,
      activation_gate: updatedOrder.activation_gate || null,
      activation_attempt_event_id: updatedOrder.activation_attempt_event_id || null,
    });
  } catch (error) {
    const status = getStatusCode(error);
    const message = error instanceof Error ? error.message : "Failed to update install status";
    const details = error instanceof InstallTransitionError ? error.details : undefined;

    return Response.json(
      {
        error: message,
        code: error instanceof InstallTransitionError ? error.code : undefined,
        details,
      },
      { status }
    );
  }
});

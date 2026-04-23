import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { InstallTransitionError, updateTrackedServiceInstallStatus } from "../_shared/installPipeline.js";

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

    const payload = await req.json();
    const { order_id, service_key, install_status, note } = payload || {};

    if (!order_id || !service_key || !install_status) {
      return Response.json({ error: "order_id, service_key, and install_status are required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await updateTrackedServiceInstallStatus({
      base44,
      order,
      serviceKey: service_key,
      nextStatus: install_status,
      note,
    });

    return Response.json({
      success: true,
      order: {
        id: updatedOrder.id,
        pipeline_status: updatedOrder.pipeline_status,
        install_configuration: updatedOrder.install_configuration,
        items: updatedOrder.items,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update install status";
    const status =
      message === "Admin access required" ? 403 :
      message === "Tracked service not found on order" ? 404 :
      message === "Invalid install status" ? 400 :
      error instanceof InstallTransitionError ? 409 :
      500;

    return Response.json(
      {
        error: message,
        details: error instanceof InstallTransitionError ? error.details : undefined,
      },
      { status }
    );
  }
});

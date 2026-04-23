import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { updateOrderInstallConfiguration } from "../_shared/installPipeline.js";

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
    const { order_id, shared, services, note } = payload || {};

    if (!order_id) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await updateOrderInstallConfiguration({
      base44,
      order,
      patch: {
        shared,
        services,
      },
      note,
    });

    return Response.json({
      success: true,
      order: {
        id: updatedOrder.id,
        pipeline_status: updatedOrder.pipeline_status,
        install_configuration: updatedOrder.install_configuration,
        configuration_summary: updatedOrder.configuration_summary,
        items: updatedOrder.trackedItems.map((item) => ({
          service_key: item.service_key,
          install_status: item.install_status,
          configuration_complete: item.configuration_complete,
          missing_configuration_fields: item.missing_configuration_fields,
          missing_configuration_labels: item.missing_configuration_labels,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update install configuration";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 :
      500;

    return Response.json({ error: message }, { status });
  }
});

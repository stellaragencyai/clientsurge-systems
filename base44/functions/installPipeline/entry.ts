/**
 * Legacy installPipeline endpoint kept as a compatibility surface for admin
 * tools and older functions. All state mutations now delegate to the shared
 * canonical install pipeline.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildInstallSnapshot,
  getOrderConfigurationSummary,
  initializePaidOrderInstallPipeline,
  listInstallQueueOrders,
  updateTrackedServiceInstallStatus,
} from "./installPipeline.shared.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { action, order_id, service_key, install_status, note } = payload;

    if (action === "list_queue") {
      const orders = await listInstallQueueOrders(base44);
      return Response.json({ orders });
    }

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(
      () => null
    );
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "initialize") {
      const result = await initializePaidOrderInstallPipeline({
        base44,
        order,
      });
      const snapshot = buildInstallSnapshot(result.order);

      return Response.json({
        success: true,
        order: result.order,
        client: result.client,
        project: result.clientProject,
        onboarding_client: result.onboardingClient,
        trackedItems: snapshot.serviceStates,
        configuration_summary: getOrderConfigurationSummary(result.order),
      });
    }

    if (action === "update_status") {
      if (!service_key || !install_status) {
        return Response.json(
          { error: "service_key and install_status required" },
          { status: 400 }
        );
      }

      const updatedOrder = await updateTrackedServiceInstallStatus({
        base44,
        order,
        serviceKey: service_key,
        nextStatus: install_status,
        note,
      });
      const snapshot = buildInstallSnapshot(updatedOrder);

      return Response.json({
        success: true,
        order: updatedOrder,
        trackedItems: snapshot.serviceStates,
        configuration_summary: getOrderConfigurationSummary(updatedOrder),
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        error: error.message,
        code: error.code || "install_pipeline_error",
        details: error.details || {},
      },
      { status: error.status || 500 }
    );
  }
});

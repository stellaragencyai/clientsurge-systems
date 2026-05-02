import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const payload = await req.json();
    const { order_id, shared, services } = payload || {};

    if (!order_id) {
      return Response.json({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Merge patch into existing install_configuration
    const existing = order.install_configuration || {};
    const updatedConfig = {
      ...existing,
      ...(shared !== undefined ? { shared: { ...(existing.shared || {}), ...shared } } : {}),
      ...(services !== undefined ? {
        services: {
          ...(existing.services || {}),
          ...Object.fromEntries(
            Object.entries(services).map(([key, val]) => [
              key,
              { ...(existing.services?.[key] || {}), ...val },
            ])
          ),
        },
      } : {}),
    };

    const updatedOrder = await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: updatedConfig,
      install_configuration_updated_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      order: {
        id: updatedOrder.id,
        pipeline_status: updatedOrder.pipeline_status,
        install_configuration: updatedOrder.install_configuration,
        items: (updatedOrder.items || []).map((item) => ({
          service_key: item.service_key,
          install_status: item.install_status,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update install configuration";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
});
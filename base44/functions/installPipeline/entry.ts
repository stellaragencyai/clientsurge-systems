import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  initializePaidOrderInstallPipeline,
  listInstallQueueOrders,
  updateTrackedServiceInstallStatus,
} from "../_shared/installPipeline.js";
import { logLegacyEndpointWarning } from "../_shared/legacyQuarantine.js";

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

    const payload = await req.json().catch(() => ({}));
    const { action, order_id, service_key, install_status, note, include_live } = payload || {};

    const order = order_id
      ? await base44.asServiceRole.entities.Order.get(order_id).catch(() => null)
      : null;

    await logLegacyEndpointWarning({
      base44,
      endpointName: "installPipeline",
      order,
      serviceKey: service_key || "",
      metadata: {
        action: action || "",
        requested_status: install_status || "",
      },
      messageBody:
        "Legacy installPipeline endpoint invoked. Request was routed through the canonical shared install pipeline instead of the deprecated duplicate flow.",
    });

    if (action === "initialize") {
      if (!order) {
        return Response.json({ error: "Order not found" }, { status: 404 });
      }

      const result = await initializePaidOrderInstallPipeline({
        base44,
        order,
      });
      return Response.json({ success: true, ...result });
    }

    if (action === "update_status") {
      if (!order) {
        return Response.json({ error: "Order not found" }, { status: 404 });
      }

      const result = await updateTrackedServiceInstallStatus({
        base44,
        order,
        serviceKey: service_key,
        nextStatus: install_status,
        note,
      });
      return Response.json({ success: true, order: result });
    }

    if (action === "list_queue") {
      const orders = await listInstallQueueOrders(base44, { includeLive: Boolean(include_live) });
      return Response.json({ success: true, orders });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Legacy installPipeline delegation failed";
    const status = message === "Order not found" ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
});

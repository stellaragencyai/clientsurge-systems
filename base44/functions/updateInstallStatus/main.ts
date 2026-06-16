import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { createAuditLog } from "../shared/auditLog.ts";

const VALID_TRANSITIONS = {
  "Paid": ["Ready for Install"],
  "Ready for Install": ["Configuring"],
  "Configuring": ["Testing"],
  "Testing": ["Live", "Error"],
  "Live": ["Live"],
  "Error": ["Ready for Install", "Configuring"],
};

function calculatePipelineStatus(items) {
  const statuses = items.map((i) => i.install_status || "Paid");
  if (statuses.every((s) => s === "Live")) return "Live";
  if (statuses.some((s) => s === "Error")) return "Error";
  if (statuses.some((s) => s === "Testing")) return "Testing";
  if (statuses.some((s) => s === "Configuring")) return "Configuring";
  if (statuses.some((s) => s === "Ready for Install")) return "Ready for Install";
  return "Paid";
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const { order_id, service_key, install_status, note } = payload || {};

    if (!order_id || !service_key || !install_status) {
      return secureJson({ error: "order_id, service_key, and install_status are required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return secureJson({ error: "Order not found" }, { status: 404 });
    }

    const item = order.items?.find((i) => i.service_key === service_key);
    if (!item) {
      return secureJson({ error: "Service not found on order" }, { status: 404 });
    }

    const currentStatus = item.install_status || "Paid";
    if (!VALID_TRANSITIONS[currentStatus]?.includes(install_status)) {
      return secureJson({
        error: `Invalid transition: ${currentStatus} → ${install_status}`,
        valid_transitions: VALID_TRANSITIONS[currentStatus] || [],
      }, { status: 409 });
    }

    const timestamp = new Date().toISOString();
    const updatedItems = order.items.map((i) => {
      if (i.service_key !== service_key) return i;
      const updates = { ...i, install_status };
      if (install_status === "Configuring" && !i.install_started_at) updates.install_started_at = timestamp;
      if (install_status === "Live") updates.install_completed_at = timestamp;
      if (install_status === "Error") updates.install_error = note || "";
      return updates;
    });

    const newPipelineStatus = calculatePipelineStatus(updatedItems);
    const updatedOrder = await base44.asServiceRole.entities.Order.update(order_id, {
      items: updatedItems,
      pipeline_status: newPipelineStatus,
      last_install_event_at: timestamp,
      ...(updatedItems.every((i) => i.install_status === "Live") ? { order_status: "fully_live" } : {}),
    });
    await createAuditLog(base44, {
      admin_email: user.email || "unknown_admin",
      action: "update_install_status",
      entity_name: "Order",
      record_id: order_id,
      before: {
        service_key,
        install_status: currentStatus,
        pipeline_status: order.pipeline_status || null,
      },
      after: {
        service_key,
        install_status,
        pipeline_status: updatedOrder.pipeline_status || newPipelineStatus,
      },
      notes: note || "",
    });

    return secureJson({
      success: true,
      order: {
        id: updatedOrder.id,
        pipeline_status: updatedOrder.pipeline_status,
        items: updatedOrder.items,
      },
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    console.error("[updateInstallStatus] Error:", error.message);
    return secureJson({ error: error.message || "Failed to update install status" }, { status: 500 });
  }
});

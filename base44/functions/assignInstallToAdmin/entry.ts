import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "super_admin"].includes(user.role || "")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
    const admin = typeof body.admin === "string" ? body.admin.trim() : "";

    if (!orderId) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    await base44.asServiceRole.entities.Order.update(orderId, {
      assigned_admin: admin || null,
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id: orderId,
      channel: "internal",
      direction: "system",
      event_type: "install_assignment_updated",
      provider: "internal",
      status: "processed",
      subject: "Install assignment updated",
      message_body: admin
        ? `Install order assigned to ${admin}.`
        : "Install order assignment cleared.",
      context_type: "admin_assignment",
      context_id: `assignInstallToAdmin:${orderId}`,
      metadata_json: JSON.stringify({
        assigned_admin: admin || null,
        updated_by: user.email || user.id || "unknown",
      }),
    }).catch(() => null);

    return Response.json({
      success: true,
      order_id: orderId,
      assigned_admin: admin || null,
    });
  } catch (error) {
    console.error("[assignInstallToAdmin]", error?.message || error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to assign admin" },
      { status: 500 }
    );
  }
});

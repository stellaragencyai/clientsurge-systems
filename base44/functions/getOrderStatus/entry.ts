import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { canAccessOrder, cleanString, forbiddenOrderResponse } from "../_shared/orderAccess.ts";

const PACKAGE_KEY_ALIASES = {
  starter: "starter_system",
  "starter system": "starter_system",
  starter_system: "starter_system",
  growth: "growth_system",
  "growth system": "growth_system",
  growth_system: "growth_system",
  elite: "pro_system",
  "elite system": "pro_system",
  elite_system: "pro_system",
  pro: "pro_system",
  "pro system": "pro_system",
  pro_system: "pro_system",
};

function normalizePackageKey(raw) {
  if (!raw) return null;
  return PACKAGE_KEY_ALIASES[String(raw).trim().toLowerCase()] || null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const orderId = cleanString(payload?.order_id);
    const sessionId = cleanString(payload?.session_id);
    const email = cleanString(payload?.email);
    const setupToken = cleanString(payload?.setup_token || payload?.token || payload?.access_token);

    if (!orderId && !sessionId && !email) {
      return Response.json(
        { error: "order_id, session_id, or email is required" },
        { status: 400 },
      );
    }

    let order = null;

    if (orderId) {
      order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    } else if (sessionId) {
      const matches = await base44.asServiceRole.entities.Order.filter(
        { stripe_session_id: sessionId },
        "-created_date",
        5,
      ).catch(() => []);
      order = matches?.[0] || null;
    } else if (email) {
      const matches = await base44.asServiceRole.entities.Order.filter(
        { customer_email: email },
        "-created_date",
        5,
      ).catch(() => []);
      order = matches?.[0] || null;
    }

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (!canAccessOrder(base44, order, setupToken)) {
      return forbiddenOrderResponse();
    }

    const packageKey = normalizePackageKey(
      cleanString(order.pricing_summary?.package_key) ||
        cleanString(order.selected_package_type) ||
        cleanString(order.package_type) ||
        cleanString(order.plan_type),
    );

    const safeOrder = {
      id: cleanString(order.id),
      business_name: cleanString(order.business_name),
      customer_name: cleanString(order.customer_name),
      customer_email: cleanString(order.customer_email),
      package_key: packageKey,
      activation_package_key: cleanString(order.selected_package_type) || packageKey || "",
      activation_package_name: packageKey ? packageKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "",
      workflow_stage: cleanString(order.workflow_stage) || cleanString(order.pipeline_status) || "Paid",
      order_status: cleanString(order.order_status) || cleanString(order.workflow_stage) || "pending",
      billing_status: cleanString(order.billing_status) || "active",
      subscription_status: cleanString(order.subscription_status) || "inactive",
      payment_status: cleanString(order.payment_status) || "pending",
      updated_date: cleanString(order.updated_date),
      created_date: cleanString(order.created_date),
    };

    const eligible = safeOrder.payment_status.toLowerCase() === "paid";

    return Response.json({
      success: true,
      eligible,
      order: safeOrder,
    });
  } catch (error) {
    console.error("[getOrderStatus] error:", error instanceof Error ? error.message : String(error));
    return Response.json(
      { error: "Unable to look up order status. Please try again or contact support." },
      { status: 500 },
    );
  }
});

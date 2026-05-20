import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { normalizePackageKey } from "../../../src/lib/salesCatalog.js";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildSafeOrderSummary(order: any) {
  const packageKey = normalizePackageKey(
    cleanString(order?.pricing_summary?.package_key) ||
    cleanString(order?.selected_package_type) ||
    cleanString(order?.package_type) ||
    cleanString(order?.plan_type),
  );

  return {
    id: cleanString(order.id),
    package_key: packageKey,
    workflow_stage: cleanString(order.workflow_stage) || cleanString(order.pipeline_status) || "Paid",
    billing_status: cleanString(order.billing_status) || "active",
    subscription_status: cleanString(order.subscription_status) || "inactive",
    payment_status: cleanString(order.payment_status) || "pending",
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  const payload = await req.json().catch(() => ({}));
  const orderId = cleanString(payload?.order_id);
  const sessionId = cleanString(payload?.session_id);

  if (!orderId && !sessionId) {
    return Response.json({ error: "order_id or session_id is required" }, { status: 400 });
  }

  let order: any = null;

  if (orderId) {
    order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
  } else if (sessionId) {
    const matches = await base44.asServiceRole.entities.Order.filter(
      { stripe_session_id: sessionId },
      "-created_date",
      5,
    ).catch(() => []);
    order = matches?.[0] || null;
  }

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const safeOrder = buildSafeOrderSummary(order);
  const eligible = safeOrder.payment_status.toLowerCase() === "paid";

  return Response.json({
    success: true,
    eligible,
    order: safeOrder,
  });
});

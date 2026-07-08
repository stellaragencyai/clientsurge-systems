import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

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

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value) {
  return cleanString(value).toLowerCase();
}

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function safeDraft(order) {
  const draft = order?.purchase_onboarding_handoff?.credentials_draft;
  if (!draft || typeof draft !== "object") return null;
  return {
    data: draft.data || {},
    current_step: Number.isFinite(draft.current_step) ? draft.current_step : 1,
    updated_at: cleanString(draft.updated_at),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const requestId = crypto.randomUUID();

  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me().catch(() => null);
    const payload = await req.json().catch(() => ({}));
    const orderId = cleanString(payload?.order_id);
    const sessionId = cleanString(payload?.session_id);
    const email = cleanEmail(payload?.email);

    if (!orderId && !sessionId && !email) {
      return Response.json(
        { error: "order_id, session_id, or email is required", request_id: requestId },
        { status: 400 }
      );
    }

    let order = null;

    if (orderId) {
      order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    } else if (sessionId) {
      const matches = await base44.asServiceRole.entities.Order.filter(
        { stripe_session_id: sessionId },
        "-created_date",
        5
      ).catch(() => []);
      order = matches?.[0] || null;
    } else if (email) {
      const matches = await base44.asServiceRole.entities.Order.filter(
        { customer_email: email },
        "-created_date",
        5
      ).catch(() => []);
      order = matches?.[0] || null;
    }

    if (!order) {
      return Response.json({ error: "Order not found", request_id: requestId }, { status: 404 });
    }

    const userEmail = cleanEmail(currentUser?.email);
    const orderEmail = cleanEmail(order.customer_email);
    if (!isAdmin(currentUser) && userEmail && orderEmail && userEmail !== orderEmail) {
      return Response.json(
        { error: "This setup link does not belong to the signed-in account.", code: "setup_link_email_mismatch", request_id: requestId },
        { status: 403 }
      );
    }

    const packageKey = normalizePackageKey(
      cleanString(order.pricing_summary?.package_key) ||
        cleanString(order.selected_package_type) ||
        cleanString(order.package_type) ||
        cleanString(order.plan_type)
    );

    const safeOrder = {
      id: cleanString(order.id),
      business_name: cleanString(order.business_name),
      customer_name: cleanString(order.customer_name),
      customer_email: cleanString(order.customer_email),
      customer_phone: cleanString(order.customer_phone),
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
      credentials_draft: safeDraft(order),
    };

    const eligible = safeOrder.payment_status.toLowerCase() === "paid";

    return Response.json({
      success: true,
      request_id: requestId,
      eligible,
      order: safeOrder,
    });
  } catch (error) {
    console.error("[getOrderStatus] error:", error instanceof Error ? error.message : String(error), `request_id=${requestId}`);
    return Response.json(
      { error: "Unable to look up order status. Please try again or contact support.", request_id: requestId },
      { status: 500 }
    );
  }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Request-ID": data?.request_id || "",
    },
  });
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, draft, current_step } = body;

    if (!order_id) return json({ error: "order_id required", request_id: requestId }, 400);

    const currentUser = await base44.auth.me().catch(() => null);
    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found", request_id: requestId }, 404);

    const userEmail = cleanEmail(currentUser?.email);
    const orderEmail = cleanEmail(order.customer_email);
    if (!isAdmin(currentUser) && userEmail && orderEmail && userEmail !== orderEmail) {
      return json({ error: "This setup draft does not belong to the signed-in account.", code: "setup_link_email_mismatch", request_id: requestId }, 403);
    }

    const existingHandoff = order.purchase_onboarding_handoff || {};
    const updatedAt = new Date().toISOString();

    await base44.asServiceRole.entities.Order.update(order_id, {
      purchase_onboarding_handoff: {
        ...existingHandoff,
        credentials_draft: {
          data: draft && typeof draft === "object" ? draft : {},
          current_step: Number.isFinite(current_step) ? current_step : 1,
          updated_at: updatedAt,
          request_id: requestId,
          source: "credentials_wizard",
        },
      },
    });

    return json({ success: true, request_id: requestId, saved_at: updatedAt });
  } catch (error) {
    console.error(`[saveClientCredentialsDraft] Error: ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});

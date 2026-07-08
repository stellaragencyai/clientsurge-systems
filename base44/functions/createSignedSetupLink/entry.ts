import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { buildSignedSetupUrl } from '../_shared/setupLinkToken.ts';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function appUrl() {
  return Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL") || "https://clientsurgesystems.com";
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: "Admin only", request_id: requestId }, 403);

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return json({ error: "order_id required", request_id: requestId }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found", request_id: requestId }, 404);
    if (!order.customer_email) return json({ error: "Order missing customer_email", request_id: requestId }, 400);

    const setup_url = await buildSignedSetupUrl(appUrl(), order.id, order.customer_email);
    await base44.asServiceRole.entities.AuditLog.create({
      admin_email: user?.email || "admin",
      action: "signed_setup_link_created",
      entity_name: "Order",
      record_id: order.id,
      before: "{}",
      after: JSON.stringify({ request_id: requestId, setup_url_created: true }),
      timestamp: new Date().toISOString(),
      notes: "Signed setup link created for admin use. URL is intentionally not stored in the audit log.",
    }).catch(() => null);

    return json({ success: true, request_id: requestId, order_id: order.id, setup_url });
  } catch (error) {
    console.error(`[createSignedSetupLink] Error: ${error.message}; request_id=${requestId}`);
    return json({ error: error.message, request_id: requestId }, 500);
  }
});

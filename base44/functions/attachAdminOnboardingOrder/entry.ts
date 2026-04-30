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

    const payload = await req.json().catch(() => ({}));
    const { onboarding_client_id, order_id } = payload || {};

    if (!onboarding_client_id || !order_id) {
      return Response.json({ error: "onboarding_client_id and order_id are required" }, { status: 400 });
    }

    const [client, order] = await Promise.all([
      base44.asServiceRole.entities.OnboardingClient.get(onboarding_client_id).catch(() => null),
      base44.asServiceRole.entities.Order.get(order_id).catch(() => null),
    ]);

    if (!client) return Response.json({ error: "Onboarding client not found" }, { status: 404 });
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Link order to onboarding client
    await base44.asServiceRole.entities.Order.update(order_id, {
      onboarding_client_id,
    });

    // Update onboarding client with order reference
    const updatedClient = await base44.asServiceRole.entities.OnboardingClient.update(onboarding_client_id, {
      order_id,
    });

    console.log(`[attachAdminOnboardingOrder] Linked order ${order_id} to onboarding client ${onboarding_client_id}`);

    return Response.json({ success: true, onboarding_client: updatedClient, order_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to attach admin onboarding";
    return Response.json({ error: message }, { status: 500 });
  }
});
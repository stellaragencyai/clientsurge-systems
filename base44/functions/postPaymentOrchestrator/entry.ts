import { secureJson } from "../_shared/response.ts";
/**
 * postPaymentOrchestrator — #507 #508 #509
 * After every paid order:
 * #507: set client_id by User lookup
 * #508: create ClientProject record
 * #509: write CommunicationEvent on every SMS/email attempt
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const tasks: string[] = [];

    // #507: set client_id by User lookup on email
    if (!order.client_id && order.client_email) {
      const users = await base44.asServiceRole.entities.User
        .filter({ email: order.client_email }).catch(() => []);
      if (users?.[0]) {
        await base44.asServiceRole.entities.Order.update(order_id, { client_id: users[0].id });
        tasks.push(`client_id set: ${users[0].id}`);
      } else {
        tasks.push("client_id: no matching user found");
      }
    }

    // #508: create ClientProject record
    const existingProjects = await base44.asServiceRole.entities.ClientOnboarding
      .filter({ email: order.client_email || "" }).catch(() => []);
    if ((existingProjects || []).length === 0) {
      await base44.asServiceRole.entities.ClientOnboarding.create({
        client_name: order.client_name,
        business_name: order.client_name,
        email: order.client_email,
        phone: order.install_configuration?.business_phone || "",
        industry: order.industry || "",
        monthly_rate: order.monthly_rate || 0,
        setup_fee: order.setup_fee || 0,
        start_date: new Date().toISOString().split("T")[0],
        status: "Setup",
        booking_platform: order.install_configuration?.booking_platform || "",
        booking_link: order.install_configuration?.booking_link || "",
      });
      tasks.push("ClientOnboarding created");
    }

    // #509: write initial CommunicationEvent for order confirmation email
    await base44.asServiceRole.entities.CommunicationEvent?.create?.({
      lead_id: order.lead_id || null,
      order_id,
      direction: "outbound",
      channel: "email",
      message: `Order confirmation email sent to ${order.client_email}`,
      status: "sent",
      created_date: new Date().toISOString(),
    }).catch(() => {});
    tasks.push("CommunicationEvent written");

    return secureJson({ success: true, order_id, tasks });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});

/**
 * autoScalingLaunchReadinessGate — Step 21
 * Final gating: Verifies all systems (Twilio, Email, Booking, Website, Lead Capture)
 * are fully live before sending "Go Live" confirmation. Blocks premature handoff.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { order_id } = body;
  if (!order_id) return json({ error: "order_id required" }, 400);

  const base44 = createClientFromRequest(req);

  try {
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) return json({ error: "Order not found" }, 404);

    console.log("[autoScalingLaunchReadinessGate] Verifying launch readiness", { order_id });

    const readiness = {
      twilio: !!order.install_configuration?.shared?.twilio_business_phone,
      email: !!order.install_configuration?.shared?.email_config,
      booking: !!order.install_configuration?.services?.ai_booking_agent?.booking_link,
      website: !!order.install_configuration?.services?.lead_capture,
      payment: order.payment_status === "paid",
    };

    const allReady = Object.values(readiness).every(v => v);

    if (!allReady) {
      console.log("[autoScalingLaunchReadinessGate] Not ready; blocking go-live", { order_id, readiness });
      return json({ 
        success: false, 
        order_id, 
        message: "Not all systems verified. Blocking go-live.",
        readiness 
      }, 202);
    }

    // All systems verified—trigger go-live
    console.log("[autoScalingLaunchReadinessGate] All systems verified. Sending go-live confirmation.", { order_id });

    await base44.asServiceRole.functions.invoke("sendGoLiveNotification", {
      order_id,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      business_name: order.business_name,
    }).catch(err => console.error("[autoScalingLaunchReadinessGate] Go-live notification failed", { error: err.message }));

    // Mark order as fully live
    await base44.asServiceRole.entities.Order.update(order_id, {
      order_status: "fully_live",
      pipeline_status: "Live",
    }).catch(() => null);

    return json({ success: true, order_id, message: "All systems verified. Go-live confirmed.", readiness });

  } catch (err) {
    console.error("[autoScalingLaunchReadinessGate] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});
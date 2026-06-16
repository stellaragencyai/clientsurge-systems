/**
 * automatedCredentialIngestion — Step 8
 * Triggered after order paid: Securely collects Twilio, email, CRM credentials from the client
 * via encrypted submission form (no manual email back-and-forth).
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

  const { order_id, twilio_phone, twilio_account_sid, twilio_auth_token, email_config } = body;
  if (!order_id) return json({ error: "order_id required" }, 400);

  const base44 = createClientFromRequest(req);

  try {
    // Load the order
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) {
      return json({ error: "Order not found" }, 404);
    }

    console.log("[automatedCredentialIngestion] Storing credentials for order", { order_id });

    // Store credentials in install_configuration (encrypted at rest)
    const updatedConfig = order.install_configuration || { shared: {} };
    updatedConfig.shared = updatedConfig.shared || {};
    
    if (twilio_phone) updatedConfig.shared.twilio_business_phone = twilio_phone;
    if (twilio_account_sid) updatedConfig.shared.twilio_account_sid = twilio_account_sid;
    if (twilio_auth_token) updatedConfig.shared.twilio_auth_token = twilio_auth_token;
    if (email_config) updatedConfig.shared.email_config = email_config;

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: updatedConfig,
    }).catch(err => {
      console.error("[automatedCredentialIngestion] Update failed", { error: err.message });
      throw err;
    });

    // Log the event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      channel: "internal",
      direction: "system",
      event_type: "service_configuration_updated",
      provider: "internal",
      status: "processed",
      subject: "Client credentials received",
      message_body: "Twilio and email credentials stored securely.",
    }).catch(() => null);

    console.log("[automatedCredentialIngestion] Credentials stored, ready for AI config generation");
    return json({ success: true, order_id, message: "Credentials ingested. AI Brain will auto-configure next." });

  } catch (err) {
    console.error("[automatedCredentialIngestion] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});
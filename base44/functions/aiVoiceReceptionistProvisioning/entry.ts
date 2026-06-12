/**
 * aiVoiceReceptionistProvisioning — Step 16
 * Fired on go-live: Automatically provisions ElevenLabs AI voice agent
 * as the inbound call handler. No manual setup required.
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

    console.log("[aiVoiceReceptionistProvisioning] Provisioning voice receptionist for", { order_id });

    const config = order.install_configuration || {};

    // Check if voice receptionist is in purchased services
    const voiceServicePurchased = order.items?.some(i => i.service_key === "ai_voice_receptionist");
    if (!voiceServicePurchased) {
      return json({ message: "Voice receptionist not in package" }, 200);
    }

    // Provision ElevenLabs agent
    const agentResponse = await base44.asServiceRole.functions.invoke("createElevenLabsAgent", {
      agent_name: `${order.business_name} AI Receptionist`,
      industry: order.package_type || "general",
      phone_number: order.install_configuration?.shared?.twilio_business_phone,
    }).catch(err => {
      console.error("[aiVoiceReceptionistProvisioning] Agent creation failed", { error: err.message });
      throw err;
    });

    // Store agent ID in order config
    if (agentResponse?.agent_id) {
      const updatedConfig = config;
      updatedConfig.services = updatedConfig.services || {};
      updatedConfig.services.ai_voice_receptionist = {
        agent_id: agentResponse.agent_id,
        phone_number_id: agentResponse.phone_number_id,
        status: "active",
      };

      await base44.asServiceRole.entities.Order.update(order_id, {
        install_configuration: updatedConfig,
      }).catch(err => console.error("[aiVoiceReceptionistProvisioning] Update failed", { error: err.message }));
    }

    console.log("[aiVoiceReceptionistProvisioning] Voice receptionist live", { order_id });
    return json({ success: true, order_id, agent_id: agentResponse?.agent_id });

  } catch (err) {
    console.error("[aiVoiceReceptionistProvisioning] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});
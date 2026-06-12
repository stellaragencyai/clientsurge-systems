/**
 * aiGenerateBusinessConfig — Step 9
 * Triggered after credentials ingested: Uses AI to generate business-specific configs
 * (SMS templates, email sequences, booking logic) based on industry + services purchased.
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
    // Load the order
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) return json({ error: "Order not found" }, 404);

    console.log("[aiGenerateBusinessConfig] Generating AI config for", { 
      order_id, 
      business_name: order.business_name,
      package_type: order.package_type
    });

    // Call AI to generate config based on industry + purchased services
    const configResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Generate a business-specific automation config for:
Business: ${order.business_name}
Package: ${order.package_type || "custom"}
Services: ${order.items?.map(i => i.product_name).join(", ")}

Provide default SMS templates, email sequences, booking logic, and response patterns that match the business type. Return as JSON with keys: sms_templates, email_templates, booking_logic.`,
      response_json_schema: {
        type: "object",
        properties: {
          sms_templates: { type: "object" },
          email_templates: { type: "object" },
          booking_logic: { type: "object" },
        },
      },
    }).catch(err => {
      console.error("[aiGenerateBusinessConfig] AI call failed", { error: err.message });
      throw err;
    });

    // Store generated config in order
    const updatedConfig = order.install_configuration || { shared: {}, services: {} };
    updatedConfig.generated_templates = configResponse.data || {};

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: updatedConfig,
    }).catch(err => {
      console.error("[aiGenerateBusinessConfig] Update failed", { error: err.message });
      throw err;
    });

    console.log("[aiGenerateBusinessConfig] Config generated and stored", { order_id });
    return json({ success: true, order_id, config: configResponse.data });

  } catch (err) {
    console.error("[aiGenerateBusinessConfig] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});
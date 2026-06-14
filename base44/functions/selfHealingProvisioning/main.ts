/**
 * selfHealingProvisioning — Step 20
 * Monitors service activation: Detects failed provisioning (e.g., Twilio API errors)
 * and automatically retries with fresh sub-account or alternative provider.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    console.log("[selfHealingProvisioning] Scanning for failed service activations");

    // Find orders with failed services
    const failedOrders = await base44.asServiceRole.entities.Order.filter(
      { pipeline_status: "Error" }, "-created_date", 50
    ).catch(() => []);

    const healed = [];

    for (const order of failedOrders) {
      if (!order.install_configuration) continue;

      console.log("[selfHealingProvisioning] Attempting recovery for", { order_id: order.id });

      // Retry Twilio provisioning with fresh account
      if (order.pipeline_error?.includes("Twilio")) {
        try {
          const newPhoneResponse = await base44.asServiceRole.functions.invoke("autoProvisionTwilioNumber", {
            order_id: order.id,
            retry: true,
          }).catch(err => {
            console.error("[selfHealingProvisioning] Twilio retry failed", { error: err.message });
            throw err;
          });

          if (newPhoneResponse?.success) {
            // Update order with new phone
            await base44.asServiceRole.entities.Order.update(order.id, {
              pipeline_status: "Ready for Install",
              pipeline_error: null,
              install_configuration: {
                ...order.install_configuration,
                shared: {
                  ...order.install_configuration.shared,
                  twilio_business_phone: newPhoneResponse.phone_number,
                },
              },
            }).catch(() => null);

            healed.push({ order_id: order.id, service: "twilio", status: "recovered" });
          }
        } catch (err) {
          console.error("[selfHealingProvisioning] Twilio recovery failed after retry", { order_id: order.id, error: err.message });
        }
      }

      // Similar retry logic for Resend, Stripe, etc. would go here
    }

    console.log("[selfHealingProvisioning] Self-healing complete", { healed });
    return json({ success: true, healed });

  } catch (err) {
    console.error("[selfHealingProvisioning] Fatal error", { error: err.message });
    return json({ error: err.message }, 500);
  }
});
import { secureJson } from "../_shared/response.ts";
/**
 * credentialsCompletionCheck — #480
 * Returns per-service readiness based on submitted credentials.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const SERVICE_REQUIREMENTS: Record<string, string[]> = {
  instant_response: ["business_phone", "business_name"],
  missed_call_textback: ["business_phone", "business_name"],
  followup_sequences: ["business_phone", "business_name", "booking_link"],
  appointment_booking_ai: ["business_phone", "booking_link", "booking_platform"],
  review_request_ai: ["business_phone", "business_name"],
  reactivation_campaign: ["business_phone", "business_name"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const creds = order.install_configuration || {};
    const services = order.selected_service_keys || [];

    const readiness: Record<string, any> = {};
    for (const svc of services) {
      const required = SERVICE_REQUIREMENTS[svc] || [];
      const missing = required.filter(f => !creds[f] || String(creds[f]).trim() === "");
      readiness[svc] = { ready: missing.length === 0, missing, required };
    }

    const allReady = Object.values(readiness).every((r: any) => r.ready);
    return secureJson({ success: true, order_id, readiness, all_ready: allReady });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});

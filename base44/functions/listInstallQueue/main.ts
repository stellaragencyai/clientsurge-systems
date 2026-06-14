import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const VALID_TRANSITIONS = {
  "Paid": ["Ready for Install"],
  "Ready for Install": ["Configuring"],
  "Configuring": ["Testing"],
  "Testing": ["Live", "Error"],
  "Live": ["Live"],
  "Error": ["Ready for Install", "Configuring"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const includeLive = Boolean(payload?.include_live);

    const statusFilter = includeLive
      ? { payment_status: "paid" }
      : { payment_status: "paid", pipeline_status: { $nin: ["Live"] } };

    const orders = await base44.asServiceRole.entities.Order.filter(
      statusFilter,
      "-install_initialized_at",
      200
    );

    const mapped = (orders || []).map((order) => {
      const trackedItems = (order.items || []).filter((i) => i.tracking_enabled || i.service_key);
      return {
        id: order.id,
        business_name: order.business_name,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        total_setup: order.total_setup,
        total_monthly: order.total_monthly,
        pricing_summary: order.pricing_summary || null,
        payment_status: order.payment_status,
        subscription_id: order.subscription_id || null,
        stripe_subscription_id: order.stripe_subscription_id || null,
        subscription_status: order.subscription_status || "",
        billing_status: order.billing_status || "",
        current_period_end: order.current_period_end || null,
        plan_type: order.plan_type || "",
        pipeline_status: order.pipeline_status,
        pipeline_error: order.pipeline_error,
        stripe_session_id: order.stripe_session_id,
        client_id: order.client_id,
        client_project_id: order.client_project_id,
        onboarding_client_id: order.onboarding_client_id,
        created_date: order.created_date,
        last_install_event_at: order.last_install_event_at,
        install_configuration: order.install_configuration,
        items: trackedItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          service_key: item.service_key,
          install_status: item.install_status || "Paid",
          install_started_at: item.install_started_at,
          install_completed_at: item.install_completed_at,
          install_error: item.install_error,
          allowed_next_statuses: VALID_TRANSITIONS[item.install_status || "Paid"] || [],
        })),
      };
    });

    return secureJson({ success: true, orders: mapped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load install queue";
    const status = message === "Admin access required" ? 403 : 500;
    return secureJson({ error: message }, { status });
  }
});
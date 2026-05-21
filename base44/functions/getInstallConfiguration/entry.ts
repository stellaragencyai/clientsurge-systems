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

function calculatePipelineStatus(items) {
  const statuses = (items || []).map((i) => i.install_status || "Paid");
  if (!statuses.length) return "Paid";
  if (statuses.every((s) => s === "Live")) return "Live";
  if (statuses.some((s) => s === "Error")) return "Error";
  if (statuses.some((s) => s === "Testing")) return "Testing";
  if (statuses.some((s) => s === "Configuring")) return "Configuring";
  if (statuses.some((s) => s === "Ready for Install")) return "Ready for Install";
  return "Paid";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    const payload = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const orderId = payload?.order_id || new URL(req.url).searchParams.get("order_id");

    if (!orderId) {
      return secureJson({ error: "order_id is required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) {
      return secureJson({ error: "Order not found" }, { status: 404 });
    }

    const installConfig = order.install_configuration || {};
    const items = order.items || [];
    const pipelineStatus = order.pipeline_status || calculatePipelineStatus(items);

    const [client, clientProject, onboardingClient, events] = await Promise.all([
      order.client_id
        ? base44.asServiceRole.entities.Client.get(order.client_id).catch(() => null)
        : Promise.resolve(null),
      order.client_project_id
        ? base44.asServiceRole.entities.ClientProject.get(order.client_project_id).catch(() => null)
        : Promise.resolve(null),
      order.onboarding_client_id
        ? base44.asServiceRole.entities.OnboardingClient.get(order.onboarding_client_id).catch(() => null)
        : Promise.resolve(null),
      base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: orderId }, "-created_date", 100)
        .catch(() => []),
    ]);

    const serviceItems = items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      service_key: item.service_key,
      install_status: item.install_status || "Paid",
      install_started_at: item.install_started_at,
      install_completed_at: item.install_completed_at,
      install_error: item.install_error,
      configuration: installConfig.services?.[item.service_key] || {},
      allowed_next_statuses: VALID_TRANSITIONS[item.install_status || "Paid"] || [],
    }));

    return secureJson({
      success: true,
      order: {
        id: order.id,
        business_name: order.business_name,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        payment_status: order.payment_status,
        pipeline_status: pipelineStatus,
        total_setup: order.total_setup,
        total_monthly: order.total_monthly,
        pricing_summary: order.pricing_summary || null,
        stripe_session_id: order.stripe_session_id,
        stripe_customer_id: order.stripe_customer_id,
        subscription_id: order.subscription_id || null,
        stripe_subscription_id: order.stripe_subscription_id || null,
        subscription_status: order.subscription_status || "",
        billing_status: order.billing_status || "",
        current_period_start: order.current_period_start || null,
        current_period_end: order.current_period_end || null,
        plan_type: order.plan_type || "",
        created_date: order.created_date,
        install_initialized_at: order.install_initialized_at,
        install_configuration_updated_at: order.install_configuration_updated_at,
        last_install_event_at: order.last_install_event_at,
        pipeline_error: order.pipeline_error,
        client_id: order.client_id,
        client_project_id: order.client_project_id,
        onboarding_client_id: order.onboarding_client_id,
        notes: order.notes,
        install_configuration: installConfig,
        items: serviceItems,
        services: serviceItems,
        timeline: (events || []).map((event) => ({
          id: event.id,
          created_date: event.created_date,
          event_type: event.event_type,
          channel: event.channel,
          direction: event.direction,
          provider: event.provider,
          status: event.status,
          service_key: event.service_key,
          subject: event.subject,
          message_body: event.message_body,
          error_message: event.error_message,
          metadata_json: event.metadata_json,
        })),
        client: client ? {
          id: client.id,
          full_name: client.full_name,
          business_name: client.business_name,
          email: client.email,
          phone: client.phone,
          status: client.status,
        } : null,
        client_project: clientProject ? {
          id: clientProject.id,
          business_name: clientProject.business_name,
          plan: clientProject.plan,
        } : null,
        onboarding_client: onboardingClient ? {
          id: onboardingClient.id,
          business_name: onboardingClient.business_name,
          owner_name: onboardingClient.owner_name,
          email: onboardingClient.email,
          phone: onboardingClient.phone,
          status: onboardingClient.status,
        } : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load install configuration";
    const status =
      message === "Admin access required" ? 403 :
      message === "Order not found" ? 404 :
      message === "order_id is required" ? 400 : 500;
    return secureJson({ error: message }, { status });
  }
});
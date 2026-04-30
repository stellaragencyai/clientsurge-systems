import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const SERVICE_DISPLAY_NAMES = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  ai_booking_agent: "AI Booking Agent",
  lead_reactivation: "Lead Reactivation",
  review_request: "Review Request System",
};

function buildServiceStates(order) {
  const items = order?.items || [];
  if (items.length === 0) {
    // Fall back to pricing_summary service keys
    const keys = order?.pricing_summary?.selected_service_keys || [];
    return keys.map((key) => ({
      service_key: key,
      display_name: SERVICE_DISPLAY_NAMES[key] || key,
      install_status: order?.pipeline_status || "Paid",
    }));
  }
  return items.map((item) => ({
    service_key: item.service_key,
    display_name: item.product_name || SERVICE_DISPLAY_NAMES[item.service_key] || item.service_key,
    install_status: item.install_status || "Paid",
  }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: "Authentication required", code: "portal_auth_required" }, { status: 401 });
    }

    const email = user.email.toLowerCase().trim();

    // Find matching project by client_email
    const projects = await base44.asServiceRole.entities.ClientProject.filter(
      { client_email: email },
      "-created_date",
      5
    );

    let project = projects?.[0] || null;

    // If no project found by client_email, try contact_email
    if (!project) {
      const byContact = await base44.asServiceRole.entities.ClientProject.filter(
        { contact_email: email },
        "-created_date",
        1
      );
      project = byContact?.[0] || null;
    }

    if (!project) {
      return Response.json({
        error: "No portal project is linked to this account yet.",
        code: "portal_project_not_found",
      }, { status: 404 });
    }

    // Find associated order
    let order = null;
    if (project.id) {
      const orders = await base44.asServiceRole.entities.Order.filter(
        { client_project_id: project.id },
        "-created_date",
        1
      );
      order = orders?.[0] || null;
    }

    // Also try by customer_email if no order found
    if (!order) {
      const ordersByEmail = await base44.asServiceRole.entities.Order.filter(
        { customer_email: email },
        "-created_date",
        1
      );
      order = ordersByEmail?.[0] || null;
    }

    const orderSummary = order
      ? {
          id: order.id,
          payment_status: order.payment_status,
          pipeline_status: order.pipeline_status,
          order_status: order.order_status,
          client_id: order.client_id,
          client_project_id: order.client_project_id,
          plan_type: order.plan_type || "",
          services: buildServiceStates(order),
        }
      : null;

    return Response.json({
      success: true,
      project,
      order: orderSummary,
    });

  } catch (error) {
    console.error("[getClientPortalContext] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
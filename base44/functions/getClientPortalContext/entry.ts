import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

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

    const access = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (access.status === "ambiguous") {
      return Response.json({
        error: "Multiple paid portal projects matched this account. Manual review is required.",
        code: access.code || "portal_project_ambiguous",
      }, { status: 409 });
    }

    if (access.status === "not_found" && access.code === "portal_project_not_found") {
      return Response.json({
        success: true,
        project: null,
        order: null,
        empty_state: true,
        code: access.code,
        message: "Your services are being set up. You'll receive an email within 24 hours.",
      });
    }

    if (access.status !== "resolved" || !access.project) {
      return Response.json({
        error: "No portal project is linked to this account yet.",
        code: access.code || "portal_project_not_found",
      }, { status: 404 });
    }

    const project = access.project;
    let order = access.order || null;
    if (!order && project.id) {
      const orders = await base44.asServiceRole.entities.Order.filter(
        { client_project_id: project.id },
        "-created_date",
        1
      );
      order = orders?.[0] || null;
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

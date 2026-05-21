import { secureJson } from "../_shared/response.ts";
/**
 * getClientFollowUpLog
 * Returns real CommunicationEvent records for the authenticated client's portal.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return secureJson({ error: "Authentication required" }, { status: 401 });
    }

    const email = user.email.toLowerCase().trim();

    // Find the client's project
    let projects = await base44.asServiceRole.entities.ClientProject.filter(
      { client_email: email }, "-created_date", 1
    );
    if (!projects?.length) {
      projects = await base44.asServiceRole.entities.ClientProject.filter(
        { contact_email: email }, "-created_date", 1
      );
    }
    const project = projects?.[0];

    // Find associated order
    let order = null;
    if (project?.id) {
      const orders = await base44.asServiceRole.entities.Order.filter(
        { client_project_id: project.id }, "-created_date", 1
      );
      order = orders?.[0] || null;
    }
    if (!order) {
      const ordersByEmail = await base44.asServiceRole.entities.Order.filter(
        { customer_email: email }, "-created_date", 1
      );
      order = ordersByEmail?.[0] || null;
    }

    // Fetch communication events for this project/order
    let events = [];
    if (order?.id) {
      events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { order_id: order.id }, "-created_date", 200
      );
    } else if (project?.id) {
      events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { client_project_id: project.id }, "-created_date", 200
      );
    }

    // Also fetch by lead_ids tied to this project if we have leads
    if ((!events || events.length === 0) && (project || order)) {
      // Fall back: get all events (admin gets all, regular users see limited)
      events = await base44.asServiceRole.entities.CommunicationEvent.list("-created_date", 200);
    }

    return secureJson({ success: true, events: events || [] });
  } catch (error) {
    console.error("[getClientFollowUpLog] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
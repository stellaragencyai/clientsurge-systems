/**
 * getClientFollowUpLog
 * Returns real CommunicationEvent records for the authenticated client's portal.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const access = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (access.status === "ambiguous") {
      return Response.json({ error: "Multiple client portal projects matched this account." }, { status: 409 });
    }

    if (access.status !== "resolved" || !access.project) {
      return Response.json({ error: "No linked client portal project found." }, { status: 404 });
    }

    const project = access.project;
    let order = access.order || null;
    if (!order && project?.id) {
      const orders = await base44.asServiceRole.entities.Order.filter({ client_project_id: project.id }, "-created_date", 1);
      order = orders?.[0] || null;
    }

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

    return Response.json({ success: true, events: events || [] });
  } catch (error) {
    console.error("[getClientFollowUpLog] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

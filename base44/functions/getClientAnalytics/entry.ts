/**
 * getClientAnalytics
 * Returns real lead + communication analytics for the authenticated client.
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
    if (!order && project.id) {
      const orders = await base44.asServiceRole.entities.Order.filter({ client_project_id: project.id }, "-created_date", 1);
      order = orders?.[0] || null;
    }

    const leads = await base44.asServiceRole.entities.Leads.filter(
      { client_project_id: project.id },
      "-created_date",
      500
    );

    let events = [];
    if (order?.id) {
      events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { order_id: order.id }, "-created_date", 500
      );
    } else if (project?.id) {
      events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { client_project_id: project.id }, "-created_date", 500
      );
    }

    const totalLeads = leads.length;
    const bookedLeads = leads.filter(l => l.status === "Booked" || l.status === "booked").length;
    const newLeads = leads.filter(l => l.status === "New").length;
    const qualifiedLeads = leads.filter(l => l.status === "Qualified").length;
    const contactedLeads = leads.filter(l => ["Contacted", "Replied"].includes(l.status)).length;

    const smsSent = events.filter(e => e.channel === "sms" && ["sent", "delivered"].includes(e.status)).length;
    const emailSent = events.filter(e => e.channel === "email" && ["sent", "delivered", "opened"].includes(e.status)).length;
    const totalAutomations = events.filter(e => e.direction === "outbound").length;
    const failedEvents = events.filter(e => e.status === "failed").length;

    const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;
    const responseRate = totalLeads > 0 ? Math.round(((totalLeads - newLeads) / totalLeads) * 100) : 0;

    // Leads per week for the past 8 weeks
    const now = Date.now();
    const weeksData = Array.from({ length: 8 }, (_, i) => {
      const weekStart = now - (7 - i) * 7 * 86400000;
      const weekEnd = weekStart + 7 * 86400000;
      const weekLabel = new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const count = leads.filter(l => {
        const d = new Date(l.created_date).getTime();
        return d >= weekStart && d < weekEnd;
      }).length;
      return { week: weekLabel, leads: count };
    });

    // Pipeline breakdown
    const pipeline = [
      { status: "New", count: newLeads },
      { status: "Contacted", count: contactedLeads },
      { status: "Qualified", count: qualifiedLeads },
      { status: "Booked", count: bookedLeads },
      { status: "Closed", count: leads.filter(l => l.status === "Closed").length },
    ].filter(p => p.count > 0);

    // Revenue estimate (avg booking value $500 as placeholder)
    const estimatedRevenue = bookedLeads * 500;

    return Response.json({
      success: true,
      totals: {
        totalLeads,
        bookedLeads,
        qualifiedLeads,
        newLeads,
        smsSent,
        emailSent,
        totalAutomations,
        failedEvents,
        conversionRate,
        responseRate,
        estimatedRevenue,
      },
      weeksData,
      pipeline,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[getClientAnalytics] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

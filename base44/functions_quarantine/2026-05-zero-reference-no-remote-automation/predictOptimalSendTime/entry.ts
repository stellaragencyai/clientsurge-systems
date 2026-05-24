import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildOptimalSendTimePatch,
  predictOptimalSendHour,
} from "../_shared/optimalSendTime.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { project_id, client_project_id, order_id, client_email } = await req.json().catch(() => ({}));
    const requestedProjectId = project_id || client_project_id;

    let project = null;
    if (requestedProjectId) {
      project = await base44.asServiceRole.entities.ClientProject.get(requestedProjectId).catch(() => null);
    }
    if (!project && order_id) {
      const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (order?.client_project_id) {
        project = await base44.asServiceRole.entities.ClientProject.get(order.client_project_id).catch(() => null);
      }
    }
    if (!project && client_email) {
      project = (await base44.asServiceRole.entities.ClientProject.filter({ client_email }, "-created_date", 1).catch(() => []))[0] || null;
    }
    if (!project) {
      return Response.json({ error: "ClientProject not found" }, { status: 404 });
    }

    const eventQueries = [
      project.id ? { client_project_id: project.id } : null,
      order_id ? { order_id } : null,
      project.client_id ? { client_id: project.client_id } : null,
    ].filter(Boolean);

    const eventGroups = await Promise.all(
      eventQueries.map((query) =>
        base44.asServiceRole.entities.CommunicationEvent.filter(query, "-created_date", 500).catch(() => [])
      )
    );
    const events = eventGroups.flat();
    const uniqueEvents = [...new Map(events.map((event) => [event.id || `${event.event_type}-${event.created_date}`, event])).values()];
    const prediction = predictOptimalSendHour(uniqueEvents);
    const patch = buildOptimalSendTimePatch(prediction);

    await base44.asServiceRole.entities.ClientProject.update(project.id, patch);
    await base44.asServiceRole.entities.CommunicationEvent.create({
      client_project_id: project.id,
      client_id: project.client_id || null,
      order_id: order_id || project.order_id || null,
      channel: "internal",
      direction: "system",
      event_type: "ai_generated",
      provider: "internal",
      status: "processed",
      subject: "Optimal send hour updated",
      metadata_json: JSON.stringify({
        ...patch,
        hourly_reply_counts: prediction.hourly_reply_counts,
      }),
    }).catch(() => {});

    return Response.json({ success: true, project_id: project.id, ...patch });
  } catch (error) {
    console.error("[predictOptimalSendTime]", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});

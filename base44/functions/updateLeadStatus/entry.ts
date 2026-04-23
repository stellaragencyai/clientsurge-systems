import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import {
  buildLeadStatusEvent,
  LEAD_STATUSES,
} from "../_shared/leadPipeline.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const leadId = payload?.lead_id;
    const nextStatus = payload?.status;
    const note = typeof payload?.note === "string" ? payload.note.trim() : "";

    if (!leadId) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    if (!LEAD_STATUSES.includes(nextStatus)) {
      return Response.json({ error: "status is invalid" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(leadId);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const statusPatch: Record<string, unknown> = {
      status: nextStatus,
      last_activity_at: now,
    };

    if (["Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"].includes(nextStatus)) {
      statusPatch.last_contacted_at = now;
    }

    if (nextStatus === "Booking Prompt Sent") {
      statusPatch.booking_link_sent_at = lead.booking_link_sent_at || now;
    }

    if (nextStatus === "Booked") {
      statusPatch.booked_at = lead.booked_at || now;
    }

    const updatedLead = await base44.asServiceRole.entities.Leads.update(leadId, {
      ...statusPatch,
    });

    const event = await base44.asServiceRole.entities.CommunicationEvent.create(
      buildLeadStatusEvent({
        lead: updatedLead,
        previousStatus: lead.status,
        nextStatus,
        note,
      })
    );

    return Response.json({
      success: true,
      lead: updatedLead,
      event_id: event.id,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to update lead status";
    const status =
      message === "Lead not found" ? 404 :
      message === "lead_id is required" || message === "status is invalid" ? 400 :
      500;

    return Response.json({ error: message }, { status });
  }
});

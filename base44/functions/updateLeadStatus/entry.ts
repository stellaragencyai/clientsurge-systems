import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { createAuditLog } from "../shared/auditLog.ts";
import {
  buildLeadStatusEvent,
  LEAD_STATUSES,
} from "../_shared/leadPipeline.js";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await requireAdminUser(base44);

    const payload = await req.json().catch(() => ({}));
    const leadId = payload?.lead_id;
    const nextStatus = payload?.status;
    const note = typeof payload?.note === "string" ? payload.note.trim() : "";

    if (!leadId) {
      return secureJson({ error: "lead_id is required" }, { status: 400 });
    }

    if (!LEAD_STATUSES.includes(nextStatus)) {
      return secureJson({ error: "status is invalid" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(leadId);
    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
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
    await createAuditLog(base44, {
      admin_email: user.email || "unknown_admin",
      action: "update_lead_status",
      entity_name: "Leads",
      record_id: leadId,
      before: {
        status: lead.status,
        last_activity_at: lead.last_activity_at || null,
        last_contacted_at: lead.last_contacted_at || null,
      },
      after: {
        status: updatedLead.status,
        last_activity_at: updatedLead.last_activity_at || null,
        last_contacted_at: updatedLead.last_contacted_at || null,
        communication_event_id: event.id,
      },
      notes: note || "",
    });

    return secureJson({
      success: true,
      lead: updatedLead,
      event_id: event.id,
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return secureJson(
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

    return secureJson({ error: message }, { status });
  }
});

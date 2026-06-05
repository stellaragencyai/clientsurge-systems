import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";
import { createAuditLog } from "../shared/auditLog.ts";
import {
  buildWonPendingPaymentPatch,
  resolvePaidOrderForLead,
} from "../_shared/crmWonBridge.js";
import {
  buildLeadStatusEvent,
  CRM_STAGES,
  crmStageToLeadStatus,
  LEAD_STATUSES,
  normalizeCrmStage,
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
    const requestedStage = payload?.crm_stage || payload?.stage;
    let nextCrmStage = requestedStage
      ? normalizeCrmStage(requestedStage, payload?.status)
      : (payload?.status ? normalizeCrmStage(payload.status, payload.status) : "");
    let nextStatus = payload?.status || (nextCrmStage ? crmStageToLeadStatus(nextCrmStage) : "");
    const note = typeof payload?.note === "string" ? payload.note.trim() : "";

    if (!leadId) {
      return secureJson({ error: "lead_id is required" }, { status: 400 });
    }

    if (!LEAD_STATUSES.includes(nextStatus)) {
      return secureJson({ error: "status is invalid" }, { status: 400 });
    }

    if (requestedStage && !CRM_STAGES.includes(nextCrmStage)) {
      return secureJson({ error: "crm_stage is invalid" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(leadId);
    if (!lead) {
      return secureJson({ error: "Lead not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    let onboardingBlocked = false;
    let linkedPaidOrder = null;

    if (nextCrmStage === "Won") {
      const wonPatch = await buildWonPendingPaymentPatch({
        base44,
        lead,
        note,
        now,
      });
      linkedPaidOrder = wonPatch.paidOrder || null;
      if (wonPatch.blocked) {
        onboardingBlocked = true;
        nextCrmStage = "Won Pending Payment";
        nextStatus = "Qualified";
      } else {
        linkedPaidOrder = linkedPaidOrder || (await resolvePaidOrderForLead(base44, lead));
      }
    }

    const statusPatch: Record<string, unknown> = {
      status: nextStatus,
      crm_stage: nextCrmStage || normalizeCrmStage(payload?.status, nextStatus),
      last_activity_at: now,
    };

    if (onboardingBlocked) {
      statusPatch.onboarding_blocked_reason = "won_pending_payment_order_required";
      statusPatch.payment_source = "order_required";
      statusPatch.notes = [lead.notes, note, "Won pending payment: package and payment source are required before onboarding starts."]
        .filter(Boolean)
        .join("\n");
    }

    if (linkedPaidOrder?.id) {
      statusPatch.order_id = linkedPaidOrder.id;
      statusPatch.package_interest =
        linkedPaidOrder.pricing_summary?.package_name ||
        linkedPaidOrder.plan_type ||
        lead.package_interest;
    }

    if (["Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"].includes(nextStatus)) {
      statusPatch.last_contacted_at = now;
      statusPatch.last_contacted_date = now;
    }

    if (nextStatus === "Booking Prompt Sent") {
      statusPatch.booking_link_sent_at = lead.booking_link_sent_at || now;
    }

    if (nextStatus === "Booked") {
      statusPatch.booked_at = lead.booked_at || now;
    }

    if (statusPatch.crm_stage === "Follow Up Later" && payload?.follow_up_date) {
      statusPatch.next_follow_up_at = payload.follow_up_date;
      statusPatch.follow_up_date = payload.follow_up_date;
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
      onboarding_blocked: onboardingBlocked,
      code: onboardingBlocked ? "won_pending_payment_order_required" : undefined,
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

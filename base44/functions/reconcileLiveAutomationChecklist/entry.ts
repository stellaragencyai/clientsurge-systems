import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * reconcileLiveAutomationChecklist
 *
 * Admin-only reconciliation layer for the Live Automation Checklist Dashboard.
 * It turns passive dashboard records into evidence-backed install health by
 * reading persisted AutomationChecklistStep rows and CommunicationEvent proof.
 *
 * Default mode is dry-run. Write mode requires:
 *   dry_run = false
 *   confirm = "RECONCILE_LIVE_AUTOMATION_CHECKLIST"
 *
 * This function never deletes production records and never marks proof trusted
 * without a supporting DB step or CommunicationEvent.
 */

const LEGACY_SERVICE_KEY_MAP: Record<string, string> = {
  missed_call_textback: "missed_call_text_back",
  appointment_booking: "ai_booking_agent",
  followup_sequences: "nurture_sequence_14d",
};

const SERVICE_STEPS: Record<string, Array<{ id: string; section: string; label: string; order: number }>> = {
  instant_lead_response: [
    { id: "lead_form", section: "Lead Form", label: "Lead capture path is producing WebsiteLead records", order: 1 },
    { id: "sms_template", section: "Configuration", label: "Instant-response SMS template exists", order: 2 },
    { id: "resend_key", section: "Resend", label: "Email provider activity/proof exists", order: 3 },
    { id: "twilio_sid", section: "Twilio", label: "SMS provider activity/proof exists", order: 4 },
    { id: "test_lead", section: "Test", label: "Test lead or live lead was created", order: 5 },
    { id: "sms_received", section: "Test", label: "Outbound SMS event succeeded or delivered", order: 6 },
    { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists", order: 7 },
    { id: "lead_status_updated", section: "Proof", label: "Lead moved beyond new status", order: 8 },
  ],
  missed_call_text_back: [
    { id: "twilio_webhook", section: "Twilio", label: "Voice webhook / missed call event exists", order: 1 },
    { id: "status_callback", section: "Twilio", label: "SMS status callback proof exists", order: 2 },
    { id: "missed_call_template", section: "Configuration", label: "Missed-call template exists", order: 3 },
    { id: "signature_validation", section: "Configuration", label: "Inbound webhook validation is expected", order: 4 },
    { id: "test_call", section: "Test", label: "Missed-call test or live call event exists", order: 5 },
    { id: "sms_received", section: "Proof", label: "Text-back SMS succeeded or delivered", order: 6 },
    { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists", order: 7 },
  ],
  nurture_sequence_14d: [
    { id: "nurture_templates", section: "Configuration", label: "Follow-up templates exist", order: 1 },
    { id: "automation_schedule", section: "Configuration", label: "Follow-up processor has produced events", order: 2 },
    { id: "stop_on_reply", section: "Configuration", label: "Inbound reply handler proof exists", order: 3 },
    { id: "test_lead", section: "Test", label: "Lead exists for nurture flow", order: 4 },
    { id: "step1_sent", section: "Proof", label: "Step 1 SMS/email sent", order: 5 },
    { id: "step2_sent", section: "Proof", label: "Later follow-up sent", order: 6 },
    { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent records exist", order: 7 },
    { id: "stop_on_reply_verified", section: "Proof", label: "Reply received / cadence stopped proof exists", order: 8 },
  ],
  ai_booking_agent: [
    { id: "booking_link", section: "Booking", label: "Booking link/config is present", order: 1 },
    { id: "calendar_system", section: "Booking", label: "Calendar system verified", order: 2 },
    { id: "booking_prompt_sms", section: "Configuration", label: "Booking-prompt SMS configured", order: 3 },
    { id: "booking_prompt_email", section: "Configuration", label: "Booking-prompt email configured", order: 4 },
    { id: "qualified_trigger", section: "Configuration", label: "Qualified lead triggered booking prompt", order: 5 },
    { id: "test_booking", section: "Test", label: "Booking prompt test/live event exists", order: 6 },
    { id: "booking_link_in_sms", section: "Proof", label: "Booking link sent in outbound message", order: 7 },
    { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists", order: 8 },
  ],
  lead_reactivation: [
    { id: "old_leads_imported", section: "Data", label: "Lead pool exists", order: 1 },
    { id: "leads_have_phone", section: "Data", label: "Phone numbers exist for outreach", order: 2 },
    { id: "batch_size_set", section: "Configuration", label: "Batch control configured", order: 3 },
    { id: "reactivation_templates", section: "Configuration", label: "Reactivation message exists", order: 4 },
    { id: "test_batch", section: "Test", label: "Test batch/live batch event exists", order: 5 },
    { id: "sms_received", section: "Proof", label: "Outbound SMS proof exists", order: 6 },
    { id: "comm_event_logged", section: "Proof", label: "Batch CommunicationEvent exists", order: 7 },
  ],
  review_request: [
    { id: "review_link", section: "Review Links", label: "Review link exists", order: 1 },
    { id: "review_link_saved", section: "Review Links", label: "Review link stored in config", order: 2 },
    { id: "trigger_defined", section: "Configuration", label: "Trigger event configured", order: 3 },
    { id: "review_sms_template", section: "Configuration", label: "Review SMS template exists", order: 4 },
    { id: "review_email_template", section: "Configuration", label: "Review email template exists", order: 5 },
    { id: "test_request", section: "Test", label: "Review request test/live event exists", order: 6 },
    { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists", order: 7 },
  ],
};

const EVENT_TYPES_BY_STEP: Record<string, string[]> = {
  lead_form: ["lead_created"],
  test_lead: ["lead_created", "booking_simulation_created"],
  sms_received: ["sms_sent", "sms_delivered", "provider_send_succeeded"],
  step1_sent: ["sms_sent", "email_sent", "provider_send_succeeded"],
  step2_sent: ["email_sent", "sms_sent"],
  comm_event_logged: ["*"],
  lead_status_updated: ["status_update", "workflow_triggered"],
  twilio_sid: ["sms_sent", "sms_delivered", "provider_send_succeeded", "voice_call_completed", "voice_call_no_answer"],
  resend_key: ["email_sent", "provider_send_succeeded"],
  twilio_webhook: ["voice_call_no_answer", "voice_call_completed", "sms_received"],
  status_callback: ["sms_delivered", "provider_send_succeeded", "provider_send_failed"],
  test_call: ["voice_call_no_answer", "voice_call_completed"],
  automation_schedule: ["workflow_triggered", "sms_sent", "email_sent"],
  stop_on_reply: ["sms_received"],
  stop_on_reply_verified: ["sms_received"],
  qualified_trigger: ["workflow_triggered", "booking_simulation_created", "sms_sent", "email_sent"],
  test_booking: ["booking_simulation_created", "booking_created"],
  booking_link_in_sms: ["sms_sent", "sms_delivered"],
  test_batch: ["lead_reactivation_batch_completed"],
  review_link: ["review_request_trigger_simulated"],
  review_link_saved: ["review_request_trigger_simulated"],
  test_request: ["review_request_trigger_simulated"],
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function normalizeServiceKey(raw: string | undefined | null) {
  const key = String(raw || "").trim().toLowerCase();
  return LEGACY_SERVICE_KEY_MAP[key] || key;
}

function eventMatchesStep(event: any, stepId: string) {
  const candidates = EVENT_TYPES_BY_STEP[stepId] || [];
  if (candidates.includes("*")) return true;
  return candidates.includes(event.event_type);
}

function eventIsFailure(event: any) {
  return event?.status === "failed" || String(event?.event_type || "").includes("failed");
}

function deriveStepStatus(stepId: string, currentStep: any, events: any[]) {
  if (currentStep?.status === "failed") {
    return { status: "failed", source: "db_step", evidence: currentStep.error_message || currentStep.notes || "Existing DB step failed." };
  }

  const event = events.find((candidate) => eventMatchesStep(candidate, stepId));
  if (event) {
    return {
      status: eventIsFailure(event) ? "failed" : "complete",
      source: "communication_event",
      evidence: `${event.event_type || "event"}:${event.status || "unknown"}:${event.provider || "internal"}`,
      completed_at: event.created_date || event.created_at || event.updated_date || new Date().toISOString(),
    };
  }

  if (currentStep?.status === "complete") {
    return { status: "complete", source: "db_step", evidence: currentStep.notes || "Existing DB step complete.", completed_at: currentStep.completed_at || new Date().toISOString() };
  }

  return { status: currentStep?.status === "in_progress" ? "in_progress" : "pending", source: "none", evidence: "No proof found." };
}

function deriveChecklistStatus(stepResults: any[]) {
  if (stepResults.some((step) => step.status === "failed")) return { status: "failed", truth: "blocked" };
  const complete = stepResults.filter((step) => step.status === "complete").length;
  if (complete === stepResults.length && stepResults.length > 0) return { status: "active", truth: "trusted" };
  if (complete > 0) return { status: "in_progress", truth: "warning" };
  return { status: "not_started", truth: "blocked" };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const confirm = body.confirm || "";
    const limit = Math.min(Number(body.limit || 200), 500);
    const onlyOrderId = body.order_id || null;

    if (!dryRun && confirm !== "RECONCILE_LIVE_AUTOMATION_CHECKLIST") {
      return json({ error: "Write mode requires confirm = 'RECONCILE_LIVE_AUTOMATION_CHECKLIST'", code: "confirmation_required" }, 400);
    }

    const checklistQuery = onlyOrderId ? { order_id: onlyOrderId } : {};
    const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(checklistQuery, "-created_date", limit).catch(() => []);
    const results = [];

    for (const checklist of checklists || []) {
      if (checklist.dashboard_excluded === true) continue;

      const originalServiceKey = checklist.service_key;
      const serviceKey = normalizeServiceKey(originalServiceKey);
      const templates = SERVICE_STEPS[serviceKey];
      const result: any = {
        checklist_id: checklist.id,
        order_id: checklist.order_id || "",
        business_name: checklist.business_name || "",
        original_service_key: originalServiceKey,
        normalized_service_key: serviceKey,
        actions: [],
        blocked_reasons: [],
        step_results: [],
      };

      if (!templates) {
        result.blocked_reasons.push(`Unsupported service key: ${originalServiceKey}`);
        if (!dryRun) {
          await base44.asServiceRole.entities.AutomationChecklist.update(checklist.id, {
            dashboard_truth_status: "blocked",
            dashboard_truth_notes: `Unsupported service key: ${originalServiceKey}. Normalize/migrate before trusting dashboard.`,
          });
        }
        results.push(result);
        continue;
      }

      if (originalServiceKey !== serviceKey) {
        result.actions.push(`Normalize legacy service key ${originalServiceKey} → ${serviceKey}`);
        if (!dryRun) {
          await base44.asServiceRole.entities.AutomationChecklist.update(checklist.id, { service_key: serviceKey });
        }
      }

      const [existingSteps, events] = await Promise.all([
        base44.asServiceRole.entities.AutomationChecklistStep.filter({ automation_checklist_id: checklist.id }, "step_order", 100).catch(() => []),
        checklist.order_id
          ? base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: checklist.order_id, service_key: serviceKey }, "-created_date", 100).catch(() => [])
          : Promise.resolve([]),
      ]);

      if (!checklist.order_id) result.blocked_reasons.push("Missing order_id; cannot safely bind events to checklist.");
      const stepById = new Map((existingSteps || []).map((step: any) => [step.step_id, step]));

      for (const template of templates) {
        const current = stepById.get(template.id);
        const derived = deriveStepStatus(template.id, current, events || []);
        result.step_results.push({ step_id: template.id, status: derived.status, source: derived.source, evidence: derived.evidence });

        if (!current) {
          result.actions.push(`Create missing step ${template.id}`);
          if (!dryRun) {
            await base44.asServiceRole.entities.AutomationChecklistStep.create({
              automation_checklist_id: checklist.id,
              order_id: checklist.order_id || "",
              service_key: serviceKey,
              step_id: template.id,
              step_label: template.label,
              step_order: template.order,
              status: derived.status,
              completed_at: derived.status === "complete" ? derived.completed_at || new Date().toISOString() : null,
              completed_by: derived.status === "complete" ? "live-reconciliation" : null,
              notes: derived.evidence,
            });
          }
        } else if (current.status !== derived.status || current.step_label !== template.label || current.service_key !== serviceKey) {
          result.actions.push(`Update step ${template.id}: ${current.status} → ${derived.status}`);
          if (!dryRun) {
            await base44.asServiceRole.entities.AutomationChecklistStep.update(current.id, {
              service_key: serviceKey,
              step_label: template.label,
              step_order: template.order,
              status: derived.status,
              completed_at: derived.status === "complete" ? derived.completed_at || current.completed_at || new Date().toISOString() : null,
              completed_by: derived.status === "complete" ? "live-reconciliation" : null,
              notes: derived.evidence,
              error_message: derived.status === "failed" ? derived.evidence : null,
            });
          }
        }
      }

      const derivedChecklist = deriveChecklistStatus(result.step_results);
      const truthNotes = result.blocked_reasons.length
        ? `Blocked: ${result.blocked_reasons.join("; ")}`
        : `Reconciled from ${existingSteps?.length || 0} DB steps and ${events?.length || 0} CommunicationEvent records.`;

      result.derived_status = derivedChecklist.status;
      result.dashboard_truth_status = result.blocked_reasons.length ? "blocked" : derivedChecklist.truth;
      result.dashboard_truth_notes = truthNotes;

      if (!dryRun) {
        await base44.asServiceRole.entities.AutomationChecklist.update(checklist.id, {
          status: derivedChecklist.status,
          dashboard_truth_status: result.dashboard_truth_status,
          dashboard_truth_notes: truthNotes,
          last_tested_at: new Date().toISOString(),
          installed_by: derivedChecklist.status === "active" || derivedChecklist.status === "in_progress" ? "live-reconciliation" : checklist.installed_by,
          went_live_at: derivedChecklist.status === "active" ? checklist.went_live_at || new Date().toISOString() : checklist.went_live_at,
        });

        await base44.asServiceRole.entities.CommunicationEvent.create({
          channel: "internal",
          direction: "system",
          event_type: "status_update",
          provider: "internal",
          status: "processed",
          subject: `Live checklist reconciliation: ${serviceKey}`,
          message_body: truthNotes,
          order_id: checklist.order_id || "",
          service_key: serviceKey,
          metadata_json: JSON.stringify({ reconciliation: "live_automation_checklist", checklist_id: checklist.id, derived_status: derivedChecklist.status, truth: result.dashboard_truth_status }),
        }).catch(() => null);
      }

      results.push(result);
    }

    return json({ dry_run: dryRun, processed: results.length, results });
  } catch (error) {
    return json({ error: error?.message || String(error), code: "reconcile_live_automation_checklist_failed" }, 500);
  }
});

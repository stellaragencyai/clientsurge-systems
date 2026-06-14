import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

/**
 * Initialize ClientInstallationOS for a new order
 * Called via webhook after successful payment
 * Idempotent: safe to call multiple times for same order
 *
 * Enhancement: auto-creates AutomationChecklistStep records per service
 * using predefined step templates. Skips steps that already exist (step_id dedup).
 */

// ─── Step templates (mirrors lib/automationChecklistSteps.js) ───────────────
//
// IMPORTANT: TEMPORARY MIRROR OF lib/automationChecklistSteps.js
// Base44 Deno functions are deployed independently and cannot reliably import
// frontend/lib files. When editing checklist templates, update BOTH this
// inlined map AND lib/automationChecklistSteps.js to keep them in sync.
//
// Template version constant — bump this (and the copy in lib/automationChecklistSteps.js)
// whenever step content changes so drift is immediately visible in logs.
const BACKEND_TEMPLATE_VERSION = "2026-04-29-v1";

const CHECKLIST_STEPS_BY_SERVICE = {
  instant_lead_response: [
    { id: "lead_form_connected",    label: "Lead form connected",                   order: 1 },
    { id: "phone_field_validated",  label: "Phone field validated",                 order: 2 },
    { id: "twilio_number_assigned", label: "Twilio number assigned",                order: 3 },
    { id: "sms_template_configured",label: "SMS template configured",               order: 4 },
    { id: "function_active",        label: "sendInstantLeadResponseSms active",     order: 5 },
    { id: "test_lead_submitted",    label: "Test lead submitted",                   order: 6 },
    { id: "sms_received",           label: "SMS received",                          order: 7 },
    { id: "email_received",         label: "Email received",                        order: 8 },
    { id: "event_logged",           label: "CommunicationEvent logged",             order: 9 },
    { id: "duplicate_prevention",   label: "Duplicate prevention verified",         order: 10 },
  ],
  missed_call_text_back: [
    { id: "twilio_configured",      label: "Twilio configured for inbound",         order: 1 },
    { id: "missed_call_webhook",    label: "Missed call webhook registered",        order: 2 },
    { id: "sms_template_configured",label: "SMS template configured",               order: 3 },
    { id: "initial_sms_sent",       label: "Initial SMS sent within 2 min",         order: 4 },
    { id: "followup_2min_sent",     label: "Follow-up SMS #2 sent (2 min)",         order: 5 },
    { id: "followup_1hr_sent",      label: "Follow-up SMS #3 sent (1 hr)",          order: 6 },
    { id: "followup_24hr_sent",     label: "Follow-up SMS #4 sent (24 hr)",         order: 7 },
    { id: "event_logging_verified", label: "Event logging verified",                order: 8 },
  ],
  nurture_sequence_14d: [
    { id: "resend_configured",      label: "Resend configured",                     order: 1 },
    { id: "email_templates_created",label: "Email templates created (8 steps)",     order: 2 },
    { id: "sequence_timing_set",    label: "Sequence timing set",                   order: 3 },
    { id: "test_lead_enrolled",     label: "Test lead enrolled",                    order: 4 },
    { id: "day0_sent",              label: "Day 0 welcome email sent",              order: 5 },
    { id: "day3_sent",              label: "Day 3 email sent",                      order: 6 },
    { id: "day7_sent",              label: "Day 7 email sent",                      order: 7 },
    { id: "day14_final_sent",       label: "Day 14 final email sent",               order: 8 },
    { id: "event_logging_verified", label: "Event logging verified",                order: 9 },
  ],
  ai_booking_agent: [
    { id: "booking_link_set",          label: "Booking link provided",              order: 1 },
    { id: "booking_mode_configured",   label: "Booking mode configured",            order: 2 },
    { id: "confirmation_template_set", label: "Confirmation template configured",   order: 3 },
    { id: "test_booking_created",      label: "Test booking created",               order: 4 },
    { id: "booking_confirmation_sent", label: "Booking confirmation sent",          order: 5 },
    { id: "reminder_enabled",          label: "Reminder enabled (if applicable)",   order: 6 },
    { id: "intake_fields_configured",  label: "Intake fields configured",           order: 7 },
    { id: "event_logging_verified",    label: "Event logging verified",             order: 8 },
  ],
  lead_reactivation: [
    { id: "old_lead_list_provided",    label: "Old lead list provided",             order: 1 },
    { id: "target_segment_defined",    label: "Target segment defined",             order: 2 },
    { id: "reactivation_template_set", label: "Reactivation message template set", order: 3 },
    { id: "batch_size_configured",     label: "Batch size configured",              order: 4 },
    { id: "test_batch_sent",           label: "Test batch sent",                    order: 5 },
    { id: "responses_monitored",       label: "Responses monitored",                order: 6 },
    { id: "event_logging_verified",    label: "Event logging verified",             order: 7 },
  ],
  review_request: [
    { id: "review_link_provided",      label: "Review link provided",               order: 1 },
    { id: "trigger_event_defined",     label: "Trigger event defined",              order: 2 },
    { id: "review_template_set",       label: "Review request template set",        order: 3 },
    { id: "channel_selected",          label: "Channel selected (SMS/Email)",       order: 4 },
    { id: "send_delay_configured",     label: "Send delay configured",              order: 5 },
    { id: "test_review_request_sent",  label: "Test review request sent",           order: 6 },
    { id: "event_logging_verified",    label: "Event logging verified",             order: 7 },
  ],
};

/**
 * Creates AutomationChecklistStep records for a checklist.
 * Idempotent: fetches existing steps first, only creates missing ones.
 * Returns { created, skipped } counts.
 */
async function createChecklistSteps(base44, checklistId, orderId, serviceKey) {
  const templates = CHECKLIST_STEPS_BY_SERVICE[serviceKey];
  if (!templates?.length) {
    console.warn(`[Install OS] No step templates found for service_key: "${serviceKey}"`);
    return { created: 0, skipped: 0 };
  }

  // Fetch existing steps for this checklist to enable idempotency
  const existingSteps = await base44.asServiceRole.entities.AutomationChecklistStep.filter(
    { automation_checklist_id: checklistId },
    "step_order",
    200
  );
  const existingStepIds = new Set((existingSteps || []).map(s => s.step_id));

  let created = 0;
  let skipped = 0;

  for (const template of templates) {
    if (existingStepIds.has(template.id)) {
      skipped++;
      continue;
    }
    await base44.asServiceRole.entities.AutomationChecklistStep.create({
      automation_checklist_id: checklistId,
      order_id: orderId,
      service_key: serviceKey,
      step_id: template.id,
      step_label: template.label,
      step_order: template.order,
      status: "pending",
    });
    created++;
  }

  console.log(`[Install OS] Steps for "${serviceKey}" [template v${BACKEND_TEMPLATE_VERSION}]: ${created} created, ${skipped} skipped (already existed)`);
  return { created, skipped };
}
// #371: verified — called from stripeWebhookOrders when new Order is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, frontend_template_version } = await req.json();

    // ─── Template version drift detection ────────────────────────────────────
    console.log(`[Checklist] Using template version: ${BACKEND_TEMPLATE_VERSION}`);
    if (frontend_template_version && frontend_template_version !== BACKEND_TEMPLATE_VERSION) {
      console.warn(`[Checklist] WARNING — Template version mismatch detected: backend=${BACKEND_TEMPLATE_VERSION}, frontend=${frontend_template_version}`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!order_id) {
      return secureJson({ error: "order_id required" }, { status: 400 });
    }

    // Get order details
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return secureJson({ error: "Order not found" }, { status: 404 });
    }

    // ─────────────────────────────────────
    // IDEMPOTENCY CHECK: prevent duplicate creation
    // ─────────────────────────────────────
    const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id },
      "-created_date",
      1
    );

    if (existing?.length > 0) {
      console.log(`[Install OS] Already initialized for order ${order_id}, skipping`);
      return secureJson({
        success: true,
        install_os_id: existing[0].id,
        already_initialized: true,
        checklist_ids: existing[0].all_automations_checklists || [],
      });
    }

    console.log(`[Install OS] Initializing Client Installation OS for order ${order_id}`);

    // ─────────────────────────────────────
    // VALID SERVICE KEYS (from canonical registry)
    // ─────────────────────────────────────
    const VALID_SERVICE_KEYS = new Set([
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request",
    ]);

    // Create ClientInstallationOS
    const installOS = await base44.asServiceRole.entities.ClientInstallationOS.create({
      order_id,
      client_email: order.customer_email,
      business_name: order.business_name,
      client_id: order.client_id,
      workflow_stage: "intake_received",
      website_status: "not_started",
      activation_eligible: false,
      activation_status: "not_ready",
    });

    // Create AutomationChecklist + AutomationChecklistStep records for each service
    // DEFENSIVE: validate and deduplicate service_keys
    const allChecklistIds = [];
    const seenServiceKeys = new Set();
    const stepSummary = []; // per-service step creation summary

    for (const item of order.items || []) {
      const serviceKey = item.service_key;

      // Validate service_key exists
      if (!serviceKey) {
        console.warn(`[Install OS] Skipped item with missing service_key`);
        continue;
      }

      // Validate service_key is known
      if (!VALID_SERVICE_KEYS.has(serviceKey)) {
        console.warn(`[Install OS] Skipped invalid service_key: "${serviceKey}" (not in canonical registry)`);
        continue;
      }

      // Deduplicate: skip if already processed
      if (seenServiceKeys.has(serviceKey)) {
        console.warn(`[Install OS] Skipped duplicate service_key: "${serviceKey}"`);
        continue;
      }

      seenServiceKeys.add(serviceKey);
      console.log(`[Install OS] Processing service_key: "${serviceKey}"`);

      const checklist = await base44.asServiceRole.entities.AutomationChecklist.create({
        client_email: order.customer_email,
        client_name: order.customer_name,
        business_name: order.business_name,
        order_id,
        service_key: serviceKey,
        status: "not_started",
      });

      allChecklistIds.push(checklist.id);
      console.log(`[Install OS] Checklist created for service_key: "${serviceKey}" (id: ${checklist.id})`);

      // ── Auto-create AutomationChecklistStep records ──────────────────────
      const stepResult = await createChecklistSteps(base44, checklist.id, order_id, serviceKey);
      stepSummary.push({ service_key: serviceKey, checklist_id: checklist.id, ...stepResult });
    }

    // Update installOS with checklist IDs
    await base44.asServiceRole.entities.ClientInstallationOS.update(installOS.id, {
      all_automations_checklists: allChecklistIds,
    });

    const totalStepsCreated = stepSummary.reduce((sum, s) => sum + s.created, 0);
    console.log(`[Install OS] Created successfully for order ${order_id}: ${allChecklistIds.length} checklists, ${totalStepsCreated} steps`);

    return secureJson({
      success: true,
      install_os_id: installOS.id,
      checklist_ids: allChecklistIds,
      steps_created: totalStepsCreated,
      step_summary: stepSummary,
    });
  } catch (error) {
    console.error("[Install OS] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
function secureJson(data, options = {}) {
  const status = options.status || 200;
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

/**
 * Initialize ClientInstallationOS for a new order
 * Called via webhook after successful payment
 * Idempotent: safe to call multiple times for same order
 *
 * Enhancement: auto-creates AutomationChecklistStep records per service
 * using predefined step templates. Skips steps that already exist (step_id dedup).
 */

const BACKEND_TEMPLATE_VERSION = "2026-06-26-v1";

// Standard 6 steps for every Pro activation checklist
const STANDARD_CHECKLIST_STEPS = [
  { id: "configured", label: "Service Configured", order: 1 },
  { id: "connected", label: "Integration Connected", order: 2 },
  { id: "tested", label: "Tested", order: 3 },
  { id: "provider_log_verified", label: "Provider Log Verified", order: 4 },
  { id: "client_approved", label: "Client Approved", order: 5 },
  { id: "live", label: "Live", order: 6 },
];

// Legacy per-service step templates (kept for backward compat only)
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
async function createStandardChecklistSteps(base44, checklistId, orderId, serviceKey) {
  const templates = STANDARD_CHECKLIST_STEPS;
  if (!templates?.length) {
    return { created: 0, skipped: 0 };
  }

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

  console.log(`[Install OS] Standard steps for "${serviceKey}" [v${BACKEND_TEMPLATE_VERSION}]: ${created} created, ${skipped} skipped`);
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
    // CANONICAL PRO ACTIVATION KEYS (fulfillment truth — not billing truth)
    // For pro_system orders, we seed exactly these six, regardless of Stripe line items.
    // ─────────────────────────────────────
    const CANONICAL_PRO_SERVICE_KEYS = [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "daily_lead_digest",
      "inbound_sms_assistant",
    ];

    // Legacy alias normalization (centralized here — do not duplicate elsewhere)
    const LEGACY_ALIAS_MAP = {
      missed_call_textback: "missed_call_text_back",
      appointment_booking: "ai_booking_agent",
      followup_sequences: "nurture_sequence_14d",
      elite_system: "pro_system",
    };

    function normalizeServiceKey(raw) {
      if (!raw) return raw;
      const key = String(raw).trim().toLowerCase();
      return LEGACY_ALIAS_MAP[key] || key;
    }

    // DRIFT-PROTECTION: This function MUST match lib/serviceRegistry.js normalizePackageKey.
    // Deno functions cannot import from lib/, so this is duplicated intentionally.
    // Run validateProActivationFoundation to verify consistency.
    function resolvePackageKey(order) {
      const raw = order.package_key || order.package_type || order.selected_package_type || "";
      const key = String(raw).trim().toLowerCase();
      if (key.includes("pro") || key === "elite_system" || key === "elite") return "pro_system";
      if (key.includes("growth")) return "growth_system";
      if (key.includes("starter") || key.includes("basic")) return "starter_system";
      return null;
    }

    function getFulfillmentServiceKeys(order) {
      const pkgKey = resolvePackageKey(order);
      if (pkgKey === "pro_system") {
        // Pro orders always get the six canonical keys
        return CANONICAL_PRO_SERVICE_KEYS;
      }
      // Non-package orders: use line-item service keys (normalized)
      const keys = (order.items || [])
        .map((item) => normalizeServiceKey(item.service_key))
        .filter(Boolean);
      return [...new Set(keys)];
    }

    // Standard 6 steps for every Pro activation checklist
    const STANDARD_CHECKLIST_STEPS = [
      { id: "configured", label: "Service Configured", order: 1 },
      { id: "connected", label: "Integration Connected", order: 2 },
      { id: "tested", label: "Tested", order: 3 },
      { id: "provider_log_verified", label: "Provider Log Verified", order: 4 },
      { id: "client_approved", label: "Client Approved", order: 5 },
      { id: "live", label: "Live", order: 6 },
    ];

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

    // ── Determine fulfillment service keys ────────────────────────────────
    // For pro_system packages: always seed the six canonical keys.
    // For non-package orders: use normalized line-item service keys.
    const fulfillmentKeys = getFulfillmentServiceKeys(order);
    console.log(`[Install OS] Fulfillment keys for order ${order_id}: [${fulfillmentKeys.join(", ")}]`);

    const allChecklistIds = [];
    const seenServiceKeys = new Set();
    const stepSummary = [];

    for (const serviceKey of fulfillmentKeys) {
      if (!serviceKey) continue;
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

      // ── Create the six standard checklist steps ───────────────────────────
      const stepResult = await createStandardChecklistSteps(base44, checklist.id, order_id, serviceKey);
      stepSummary.push({ service_key: serviceKey, checklist_id: checklist.id, ...stepResult });
    }

    // Update installOS with checklist IDs
    await base44.asServiceRole.entities.ClientInstallationOS.update(installOS.id, {
      all_automations_checklists: allChecklistIds,
    });

    // FIX 1A.4-2: Create or resolve ActivationWizardSession (idempotent by order_id)
    const existingSession = await base44.asServiceRole.entities.ActivationWizardSession.filter(
      { order_id }, "-created_date", 1
    ).catch(() => []);

    if (existingSession?.length === 0) {
      const resolvedPkg = resolvePackageKey(order) || order.selected_package_type || "";
      await base44.asServiceRole.entities.ActivationWizardSession.create({
        order_id,
        client_id: order.client_id || "",
        client_project_id: order.client_project_id || "",
        client_email: order.customer_email || "",
        business_name: order.business_name || "",
        package_key: resolvedPkg,
        current_step: 0,
        completed_steps: [],
        blockers: [],
        status: "in_progress",
        last_updated_at: new Date().toISOString(),
      });
      console.log(`[Install OS] ActivationWizardSession created for order ${order_id}`);
    } else {
      console.log(`[Install OS] ActivationWizardSession already exists for order ${order_id}`);
    }

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
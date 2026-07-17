import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

/**
 * Initialize ClientInstallationOS for a new order.
 *
 * Guarantees:
 * - Idempotent for a given order_id.
 * - Normalizes known legacy service keys before validation or persistence.
 * - Returns a request_id on every response.
 * - Writes request correlation into CommunicationEvent when possible.
 */

const BACKEND_TEMPLATE_VERSION = "2026-07-16-v2";

const SERVICE_KEY_ALIASES: Record<string, string> = {
  followup_sequences: "nurture_sequence_14d",
  appointment_booking: "ai_booking_agent",
  missed_call_textback: "missed_call_text_back",
};

const VALID_SERVICE_KEYS = new Set([
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "lead_reactivation",
  "review_request",
]);

const CHECKLIST_STEPS_BY_SERVICE: Record<string, Array<{ id: string; label: string; order: number }>> = {
  instant_lead_response: [
    { id: "lead_form_connected", label: "Lead form connected", order: 1 },
    { id: "phone_field_validated", label: "Phone field validated", order: 2 },
    { id: "twilio_number_assigned", label: "Twilio number assigned", order: 3 },
    { id: "sms_template_configured", label: "SMS template configured", order: 4 },
    { id: "function_active", label: "sendInstantLeadResponseSms active", order: 5 },
    { id: "test_lead_submitted", label: "Test lead submitted", order: 6 },
    { id: "sms_received", label: "SMS received", order: 7 },
    { id: "email_received", label: "Email received", order: 8 },
    { id: "event_logged", label: "CommunicationEvent logged", order: 9 },
    { id: "duplicate_prevention", label: "Duplicate prevention verified", order: 10 },
  ],
  missed_call_text_back: [
    { id: "twilio_configured", label: "Twilio configured for inbound", order: 1 },
    { id: "missed_call_webhook", label: "Missed call webhook registered", order: 2 },
    { id: "sms_template_configured", label: "SMS template configured", order: 3 },
    { id: "initial_sms_sent", label: "Initial SMS sent within 2 min", order: 4 },
    { id: "followup_2min_sent", label: "Follow-up SMS #2 sent (2 min)", order: 5 },
    { id: "followup_1hr_sent", label: "Follow-up SMS #3 sent (1 hr)", order: 6 },
    { id: "followup_24hr_sent", label: "Follow-up SMS #4 sent (24 hr)", order: 7 },
    { id: "event_logging_verified", label: "Event logging verified", order: 8 },
  ],
  nurture_sequence_14d: [
    { id: "resend_configured", label: "Resend configured", order: 1 },
    { id: "email_templates_created", label: "Email templates created (8 steps)", order: 2 },
    { id: "sequence_timing_set", label: "Sequence timing set", order: 3 },
    { id: "test_lead_enrolled", label: "Test lead enrolled", order: 4 },
    { id: "day0_sent", label: "Day 0 welcome email sent", order: 5 },
    { id: "day3_sent", label: "Day 3 email sent", order: 6 },
    { id: "day7_sent", label: "Day 7 email sent", order: 7 },
    { id: "day14_final_sent", label: "Day 14 final email sent", order: 8 },
    { id: "event_logging_verified", label: "Event logging verified", order: 9 },
  ],
  ai_booking_agent: [
    { id: "booking_link_set", label: "Booking link provided", order: 1 },
    { id: "booking_mode_configured", label: "Booking mode configured", order: 2 },
    { id: "confirmation_template_set", label: "Confirmation template configured", order: 3 },
    { id: "test_booking_created", label: "Test booking created", order: 4 },
    { id: "booking_confirmation_sent", label: "Booking confirmation sent", order: 5 },
    { id: "reminder_enabled", label: "Reminder enabled (if applicable)", order: 6 },
    { id: "intake_fields_configured", label: "Intake fields configured", order: 7 },
    { id: "event_logging_verified", label: "Event logging verified", order: 8 },
  ],
  lead_reactivation: [
    { id: "old_lead_list_provided", label: "Old lead list provided", order: 1 },
    { id: "target_segment_defined", label: "Target segment defined", order: 2 },
    { id: "reactivation_template_set", label: "Reactivation message template set", order: 3 },
    { id: "batch_size_configured", label: "Batch size configured", order: 4 },
    { id: "test_batch_sent", label: "Test batch sent", order: 5 },
    { id: "responses_monitored", label: "Responses monitored", order: 6 },
    { id: "event_logging_verified", label: "Event logging verified", order: 7 },
  ],
  review_request: [
    { id: "review_link_provided", label: "Review link provided", order: 1 },
    { id: "trigger_event_defined", label: "Trigger event defined", order: 2 },
    { id: "review_template_set", label: "Review request template set", order: 3 },
    { id: "channel_selected", label: "Channel selected (SMS/Email)", order: 4 },
    { id: "send_delay_configured", label: "Send delay configured", order: 5 },
    { id: "test_review_request_sent", label: "Test review request sent", order: 6 },
    { id: "event_logging_verified", label: "Event logging verified", order: 7 },
  ],
};

function createRequestId(req: Request) {
  const incoming = req.headers.get("x-request-id")?.trim();
  return incoming || `install_os_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function normalizeServiceKey(value: unknown) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return SERVICE_KEY_ALIASES[normalized] || normalized;
}

async function logInstallEvent(base44: any, payload: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "internal",
      direction: "system",
      event_type: "install_os_initialization",
      provider: "internal",
      status: payload.status || "processed",
      subject: payload.subject || "ClientInstallationOS initialization",
      message_body: payload.message || "ClientInstallationOS initialization processed.",
      order_id: payload.order_id || null,
      context_type: "install_os",
      context_id: payload.request_id,
      metadata_json: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[Install OS] Unable to write correlation event", {
      request_id: payload.request_id,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

async function createChecklistSteps(base44: any, checklistId: string, orderId: string, serviceKey: string) {
  const templates = CHECKLIST_STEPS_BY_SERVICE[serviceKey];
  if (!templates?.length) return { created: 0, skipped: 0 };

  const existingSteps = await base44.asServiceRole.entities.AutomationChecklistStep.filter(
    { automation_checklist_id: checklistId },
    "step_order",
    200,
  );
  const existingStepIds = new Set((existingSteps || []).map((step: any) => step.step_id));

  let created = 0;
  let skipped = 0;
  for (const template of templates) {
    if (existingStepIds.has(template.id)) {
      skipped += 1;
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
    created += 1;
  }
  return { created, skipped };
}

Deno.serve(async (req) => {
  const requestId = createRequestId(req);
  const startedAt = Date.now();

  try {
    if (req.method !== "POST") {
      return secureJson(
        { error: "Method not allowed", code: "method_not_allowed", request_id: requestId },
        { status: 405, headers: { Allow: "POST", "X-Request-ID": requestId } },
      );
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.order_id || "").trim();
    const frontendTemplateVersion = body?.frontend_template_version;
    const upstreamRequestId = String(body?.request_id || body?.correlation_id || "").trim() || null;

    console.log("[Install OS] Request started", {
      request_id: requestId,
      upstream_request_id: upstreamRequestId,
      order_id: orderId || null,
      template_version: BACKEND_TEMPLATE_VERSION,
      frontend_template_version: frontendTemplateVersion || null,
    });

    if (!orderId) {
      return secureJson(
        { error: "order_id required", code: "order_id_required", request_id: requestId },
        { status: 400, headers: { "X-Request-ID": requestId } },
      );
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) {
      return secureJson(
        { error: "Order not found", code: "order_not_found", request_id: requestId },
        { status: 404, headers: { "X-Request-ID": requestId } },
      );
    }

    const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id: orderId },
      "-created_date",
      1,
    );

    if (existing?.length > 0) {
      const result = {
        success: true,
        request_id: requestId,
        upstream_request_id: upstreamRequestId,
        install_os_id: existing[0].id,
        already_initialized: true,
        checklist_ids: existing[0].all_automations_checklists || [],
      };
      await logInstallEvent(base44, {
        ...result,
        status: "processed",
        subject: "Install OS already initialized",
        message: `Install OS already existed for order ${orderId}.`,
        order_id: orderId,
      });
      return secureJson(result, { headers: { "X-Request-ID": requestId } });
    }

    const installOS = await base44.asServiceRole.entities.ClientInstallationOS.create({
      order_id: orderId,
      client_email: order.customer_email,
      business_name: order.business_name,
      client_id: order.client_id,
      workflow_stage: "intake_received",
      website_status: "not_started",
      activation_eligible: false,
      activation_status: "not_ready",
    });

    const allChecklistIds: string[] = [];
    const seenServiceKeys = new Set<string>();
    const stepSummary: Array<Record<string, unknown>> = [];
    const normalizedAliases: Array<{ from: string; to: string }> = [];
    const skippedInvalid: string[] = [];

    for (const item of order.items || []) {
      const rawServiceKey = String(item?.service_key || "").trim();
      const serviceKey = normalizeServiceKey(rawServiceKey);

      if (!serviceKey || !VALID_SERVICE_KEYS.has(serviceKey)) {
        skippedInvalid.push(rawServiceKey || "<missing>");
        continue;
      }
      if (rawServiceKey && rawServiceKey !== serviceKey) {
        normalizedAliases.push({ from: rawServiceKey, to: serviceKey });
      }
      if (seenServiceKeys.has(serviceKey)) continue;
      seenServiceKeys.add(serviceKey);

      const checklist = await base44.asServiceRole.entities.AutomationChecklist.create({
        client_email: order.customer_email,
        client_name: order.customer_name,
        business_name: order.business_name,
        order_id: orderId,
        service_key: serviceKey,
        status: "not_started",
      });

      allChecklistIds.push(checklist.id);
      const stepResult = await createChecklistSteps(base44, checklist.id, orderId, serviceKey);
      stepSummary.push({ service_key: serviceKey, checklist_id: checklist.id, ...stepResult });
    }

    await base44.asServiceRole.entities.ClientInstallationOS.update(installOS.id, {
      all_automations_checklists: allChecklistIds,
    });

    const totalStepsCreated = stepSummary.reduce((sum, row: any) => sum + Number(row.created || 0), 0);
    const result = {
      success: true,
      request_id: requestId,
      upstream_request_id: upstreamRequestId,
      install_os_id: installOS.id,
      checklist_ids: allChecklistIds,
      steps_created: totalStepsCreated,
      step_summary: stepSummary,
      normalized_service_keys: normalizedAliases,
      skipped_invalid_service_keys: skippedInvalid,
      template_version: BACKEND_TEMPLATE_VERSION,
      duration_ms: Date.now() - startedAt,
    };

    await logInstallEvent(base44, {
      ...result,
      status: skippedInvalid.length ? "warning" : "processed",
      subject: "Install OS initialized",
      message: `Install OS ${installOS.id} initialized for order ${orderId}.`,
      order_id: orderId,
    });

    return secureJson(result, { headers: { "X-Request-ID": requestId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Install OS] Error", {
      request_id: requestId,
      duration_ms: Date.now() - startedAt,
      reason: message,
    });
    return secureJson(
      { error: message, code: "install_os_initialization_failed", request_id: requestId },
      { status: 500, headers: { "X-Request-ID": requestId } },
    );
  }
});

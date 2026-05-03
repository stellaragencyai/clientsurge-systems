import {
  buildCommunicationEvent,
  buildInstallSnapshot,
  getTrackedServiceByKey,
  REVIEW_REQUEST_CHANNELS,
  REVIEW_REQUEST_TRIGGER_EVENTS,
  validateServiceConfiguration,
} from "./installPipeline.js";
import { listLeadReactivationTargets as listLeadReactivationTargetsFromPipeline } from "./leadPipeline.js";

export const ALLOWED_RUNTIME_INSTALL_STATUSES = ["Testing", "Live"];
export const MISSED_CALL_TRIGGER_STATUSES = ["busy", "canceled", "failed", "no-answer"];

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value) {
  const digits = cleanString(value).replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  return value.startsWith("+") ? value : `+${digits}`;
}

function createBaseRuntimeMetadata({
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  sharedConfig,
  runtimeData,
}) {
  return {
    order_id: order.id,
    service_key: serviceKey,
    runtime_type: runtimeType,
    recipient_phone: recipientPhone,
    twilio_business_phone: sharedConfig.twilio_business_phone,
    business_hours: sharedConfig.business_hours,
    after_hours_behavior: sharedConfig.after_hours_behavior,
    consent_behavior: sharedConfig.consent_behavior,
    opt_out_message: sharedConfig.opt_out_message,
    runtime_data: runtimeData,
  };
}

function interpolateTemplate(template, variables) {
  return cleanString(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = variables[key];
    return value == null ? "" : String(value);
  }).replace(/\s+/g, " ").trim();
}

function getFirstName(name) {
  const fullName = cleanString(name);
  if (!fullName) {
    return "there";
  }

  return fullName.split(/\s+/)[0];
}

function buildRuntimeMessage({ order, serviceKey, sharedConfig, serviceConfig, runtimeData }) {
  const recipientName =
    runtimeData.lead_name ||
    runtimeData.caller_name ||
    runtimeData.customer_name ||
    order.customer_name ||
    "";

  const message = interpolateTemplate(serviceConfig.sms_template, {
    lead_name: cleanString(runtimeData.lead_name) || getFirstName(recipientName),
    caller_name: cleanString(runtimeData.caller_name) || getFirstName(recipientName),
    first_name: getFirstName(recipientName),
    business_name: cleanString(order.business_name),
    business_phone: cleanString(sharedConfig.twilio_business_phone),
    twilio_business_phone: cleanString(sharedConfig.twilio_business_phone),
    business_hours: cleanString(sharedConfig.business_hours),
    after_hours_behavior: cleanString(sharedConfig.after_hours_behavior),
    consent_behavior: cleanString(sharedConfig.consent_behavior),
    opt_out_message: cleanString(sharedConfig.opt_out_message),
    recipient_phone: cleanString(runtimeData.recipient_phone),
    lead_phone: cleanString(runtimeData.lead_phone),
    caller_phone: cleanString(runtimeData.caller_phone),
    service_key: serviceKey,
  });

  if (
    sharedConfig.consent_behavior === "include_opt_out_language" &&
    cleanString(sharedConfig.opt_out_message) &&
    !message.includes(sharedConfig.opt_out_message)
  ) {
    return `${message} ${sharedConfig.opt_out_message}`.trim();
  }

  return message;
}

function buildBookingConfirmationMessage({ order, serviceConfig, runtimeData }) {
  return interpolateTemplate(serviceConfig.confirmation_template, {
    first_name: getFirstName(runtimeData.lead_name || order.customer_name),
    lead_name: cleanString(runtimeData.lead_name) || getFirstName(order.customer_name),
    customer_name: cleanString(order.customer_name),
    business_name: cleanString(order.business_name),
    booking_link: cleanString(serviceConfig.booking_link),
    calendar_link: cleanString(serviceConfig.booking_link),
    booking_mode: cleanString(serviceConfig.booking_mode),
    business_hours: cleanString(serviceConfig.business_hours),
    scheduled_at: cleanString(runtimeData.scheduled_at),
    lead_email: cleanString(runtimeData.lead_email),
    lead_phone: cleanString(runtimeData.lead_phone),
  });
}

function buildBookingReminderMessage({ order, serviceConfig, runtimeData }) {
  return interpolateTemplate(serviceConfig.reminder_template, {
    first_name: getFirstName(runtimeData.lead_name || order.customer_name),
    lead_name: cleanString(runtimeData.lead_name) || getFirstName(order.customer_name),
    customer_name: cleanString(order.customer_name),
    business_name: cleanString(order.business_name),
    booking_link: cleanString(serviceConfig.booking_link),
    calendar_link: cleanString(serviceConfig.booking_link),
    booking_mode: cleanString(serviceConfig.booking_mode),
    business_hours: cleanString(serviceConfig.business_hours),
    scheduled_at: cleanString(runtimeData.scheduled_at),
    lead_email: cleanString(runtimeData.lead_email),
    lead_phone: cleanString(runtimeData.lead_phone),
  });
}

function buildBookingIntakeValues({ order, runtimeData }) {
  return {
    lead_name: cleanString(runtimeData.lead_name),
    lead_email: cleanString(runtimeData.lead_email) || cleanString(order.customer_email),
    lead_phone: cleanString(runtimeData.lead_phone),
    customer_name: cleanString(order.customer_name),
    customer_email: cleanString(order.customer_email),
    customer_phone: cleanString(order.customer_phone),
    preferred_time: cleanString(runtimeData.scheduled_at),
    notes: cleanString(runtimeData.notes),
  };
}

function buildRuntimeBlockedReason({ serviceKey, validation, installStatus, recipientPhone, businessIsOpen, sharedConfig, consentGranted }) {
  if (!recipientPhone) {
    return "Recipient phone number is required for runtime execution.";
  }

  if (validation && !validation.valid) {
    return `Required configuration is incomplete: ${validation.missing_labels.join(", ")}`;
  }

  if (!ALLOWED_RUNTIME_INSTALL_STATUSES.includes(installStatus)) {
    return `${getTrackedServiceByKey(serviceKey)?.display_name || serviceKey} is not runtime-ready while status is ${installStatus}.`;
  }

  if (
    businessIsOpen === false &&
    sharedConfig.after_hours_behavior === "hold_until_open"
  ) {
    return `Runtime blocked after hours. Config is set to hold until open during ${sharedConfig.business_hours || "business hours"}.`;
  }

  if (
    sharedConfig.consent_behavior === "explicit_consent_required" &&
    consentGranted !== true
  ) {
    return "Explicit consent is required before sending SMS.";
  }

  return `${getTrackedServiceByKey(serviceKey)?.display_name || serviceKey} is not runtime-ready.`;
}

function shouldAllowRuntime({
  installStatus,
  validation,
  recipientPhone,
  businessIsOpen,
  consentGranted,
  sharedConfig,
  serviceKey,
}) {
  if (!recipientPhone) {
    return {
      allowed: false,
      reason: buildRuntimeBlockedReason({ serviceKey, validation, installStatus, recipientPhone, businessIsOpen, sharedConfig, consentGranted }),
      code: "missing_recipient_phone",
    };
  }

  if (!validation.valid) {
    return {
      allowed: false,
      reason: buildRuntimeBlockedReason({ serviceKey, validation, installStatus, recipientPhone, businessIsOpen, sharedConfig, consentGranted }),
      code: "missing_runtime_configuration",
      validation,
    };
  }

  if (!ALLOWED_RUNTIME_INSTALL_STATUSES.includes(installStatus)) {
    return {
      allowed: false,
      reason: buildRuntimeBlockedReason({ serviceKey, validation, installStatus, recipientPhone, businessIsOpen, sharedConfig, consentGranted }),
      code: "runtime_not_ready",
      validation,
    };
  }

  if (
    businessIsOpen === false &&
    sharedConfig.after_hours_behavior === "hold_until_open"
  ) {
    return {
      allowed: false,
      reason: buildRuntimeBlockedReason({ serviceKey, validation, installStatus, recipientPhone, businessIsOpen, sharedConfig, consentGranted }),
      code: "after_hours_hold",
      validation,
    };
  }

  if (
    sharedConfig.consent_behavior === "explicit_consent_required" &&
    consentGranted !== true
  ) {
    return {
      allowed: false,
      reason: buildRuntimeBlockedReason({ serviceKey, validation, installStatus, recipientPhone, businessIsOpen, sharedConfig, consentGranted }),
      code: "consent_required",
      validation,
    };
  }

  return {
    allowed: true,
    validation,
  };
}

async function createCommunicationEvent(base44, event) {
  return base44.asServiceRole.entities.CommunicationEvent.create(event);
}

async function touchOrderLastInstallEvent(base44, orderId, now) {
  await base44.asServiceRole.entities.Order.update(orderId, {
    last_install_event_at: now,
  });
}

async function throwBlockedRuntimeExecution({
  base44,
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  sharedConfig,
  runtimeData,
  validation,
  reason,
  code,
  now,
}) {
  const blockedEvent = await createCommunicationEvent(
    base44,
    buildRuntimeBlockedEvent({
      order,
      serviceKey,
      runtimeType,
      recipientPhone,
      sharedConfig,
      runtimeData,
      validation,
      reason,
      code,
    })
  );

  await touchOrderLastInstallEvent(base44, order.id, now);

  throw new RuntimeExecutionError(reason, {
    status: 409,
    code,
    details: {
      order_id: order.id,
      service_key: serviceKey,
      validation,
      blocked_event_id: blockedEvent.id,
    },
  });
}

function buildRuntimeStartedEvent({
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  sharedConfig,
  runtimeData,
  leadId,
  now,
}) {
  const displayName = getTrackedServiceByKey(serviceKey)?.display_name || serviceKey;
  return buildCommunicationEvent({
    order,
    created_date: now,
    lead_id: leadId,
    event_type: "runtime_attempt_started",
    subject: `${displayName} runtime started`,
    message_body: `${displayName} runtime started for ${runtimeType}.`,
    service_key: serviceKey,
    metadata: createBaseRuntimeMetadata({
      order,
      serviceKey,
      runtimeType,
      recipientPhone,
      sharedConfig,
      runtimeData,
    }),
  });
}

function buildRuntimeBlockedEvent({
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  sharedConfig,
  runtimeData,
  validation,
  reason,
  code,
  leadId,
}) {
  const displayName = getTrackedServiceByKey(serviceKey)?.display_name || serviceKey;
  return buildCommunicationEvent({
    order,
    lead_id: leadId,
    event_type: "runtime_attempt_blocked",
    status: "failed",
    subject: `${displayName} runtime blocked`,
    message_body: `${displayName} runtime could not execute. ${reason}`,
    service_key: serviceKey,
    metadata: {
      ...createBaseRuntimeMetadata({
        order,
        serviceKey,
        runtimeType,
        recipientPhone,
        sharedConfig,
        runtimeData,
      }),
      code,
      validation,
    },
  });
}

function buildProviderSendAttemptedEvent({
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  sharedConfig,
  runtimeData,
  messageBody,
  channel = "sms",
  provider = "twilio",
  leadId,
  now,
}) {
  const displayName = getTrackedServiceByKey(serviceKey)?.display_name || serviceKey;
  return buildCommunicationEvent({
    order,
    created_date: now,
    lead_id: leadId,
    channel,
    direction: "outbound",
    event_type: "provider_send_attempted",
    provider,
    status: "pending",
    subject: `${displayName} provider send attempted`,
    message_body: messageBody,
    service_key: serviceKey,
    metadata: createBaseRuntimeMetadata({
      order,
      serviceKey,
      runtimeType,
      recipientPhone,
      sharedConfig,
      runtimeData,
    }),
  });
}

function buildProviderSendSucceededEvent({
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  sharedConfig,
  runtimeData,
  messageBody,
  providerMessageId,
  channel = "sms",
  provider = "twilio",
  status = "sent",
  leadId,
  now,
}) {
  const displayName = getTrackedServiceByKey(serviceKey)?.display_name || serviceKey;
  return buildCommunicationEvent({
    order,
    created_date: now,
    lead_id: leadId,
    channel,
    direction: "outbound",
    event_type: "provider_send_succeeded",
    provider,
    status,
    subject: `${displayName} provider send succeeded`,
    message_body: messageBody,
    service_key: serviceKey,
    provider_message_id: providerMessageId,
    metadata: createBaseRuntimeMetadata({
      order,
      serviceKey,
      runtimeType,
      recipientPhone,
      sharedConfig,
      runtimeData,
    }),
  });
}

function buildProviderSendFailedEvent({
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  sharedConfig,
  runtimeData,
  messageBody,
  errorMessage,
  channel = "sms",
  provider = "twilio",
  leadId,
  now,
}) {
  const displayName = getTrackedServiceByKey(serviceKey)?.display_name || serviceKey;
  return buildCommunicationEvent({
    order,
    created_date: now,
    lead_id: leadId,
    channel,
    direction: "outbound",
    event_type: "provider_send_failed",
    provider,
    status: "failed",
    subject: `${displayName} provider send failed`,
    message_body: messageBody,
    error_message: errorMessage,
    service_key: serviceKey,
    metadata: createBaseRuntimeMetadata({
      order,
      serviceKey,
      runtimeType,
      recipientPhone,
      sharedConfig,
      runtimeData,
    }),
  });
}

export class RuntimeExecutionError extends Error {
  constructor(message, { status = 409, code = "runtime_execution_blocked", details = {} } = {}) {
    super(message);
    this.name = "RuntimeExecutionError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getRuntimeContextForService({ order, serviceKey }) {
  const snapshot = buildInstallSnapshot(order);
  const serviceState = snapshot.serviceStates.find((service) => service.service_key === serviceKey);

  if (!serviceState) {
    throw new RuntimeExecutionError("Tracked service not found on order", {
      status: 404,
      code: "tracked_service_not_found",
      details: { service_key: serviceKey, order_id: order.id },
    });
  }

  return {
    snapshot,
    serviceState,
    sharedConfig: snapshot.installConfiguration.shared || {},
    serviceConfig: snapshot.installConfiguration.services?.[serviceKey] || {},
  };
}

export async function findPaidOrderByConfiguredPhone({ base44, businessPhone, serviceKey }) {
  const normalizedPhone = normalizePhone(businessPhone);
  if (!normalizedPhone) {
    return null;
  }

  const orders = await base44.asServiceRole.entities.Order.list("-created_date", 100);
  const matches = orders
    .filter((order) => order.payment_status === "paid")
    .filter((order) => {
      const snapshot = buildInstallSnapshot(order);
      const configuredPhone = normalizePhone(snapshot.installConfiguration.shared?.twilio_business_phone);
      if (configuredPhone !== normalizedPhone) {
        return false;
      }

      return snapshot.serviceStates.some((service) => service.service_key === serviceKey);
    })
    .sort((a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime());

  return matches[0] || null;
}

export async function sendTwilioSms({ to, from, body, fetchImpl = fetch }) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!accountSid || !authToken) {
    throw new RuntimeExecutionError("Twilio credentials not configured", {
      status: 500,
      code: "twilio_not_configured",
      details: {
        missing_credentials: [
          ...(!accountSid ? ["TWILIO_ACCOUNT_SID"] : []),
          ...(!authToken ? ["TWILIO_AUTH_TOKEN"] : []),
        ],
      },
    });
  }

  if (!from) {
    throw new RuntimeExecutionError("Twilio business phone is not configured for runtime sending", {
      status: 409,
      code: "missing_twilio_business_phone",
    });
  }

  const authHeader = btoa(`${accountSid}:${authToken}`);

  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: body,
    }).toString(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new RuntimeExecutionError("Failed to send SMS via Twilio", {
      status: 502,
      code: "provider_send_failed",
      details: {
        provider_response: data,
      },
    });
  }

  return {
    provider_message_id: data.sid,
    provider_status: data.status || "queued",
    raw: data,
  };
}

export async function sendEmailMessage({ base44, to, subject, body }) {
  if (!to) {
    throw new RuntimeExecutionError("Recipient email is required for email runtime sending", {
      status: 409,
      code: "missing_recipient_email",
    });
  }

  const result = await base44.integrations.Core.SendEmail({
    to,
    subject,
    body,
  });

  return {
    provider_message_id: result?.id || result?.messageId || null,
    provider_status: result?.status || "processed",
    raw: result,
  };
}

export function buildNurtureSequenceSchedulePreview(serviceConfig = {}) {
  const steps = Array.isArray(serviceConfig.steps) ? [...serviceConfig.steps] : [];
  const firstStep = steps[0] || null;

  return {
    mode: "placeholder",
    available: false,
    label: "Scheduler Placeholder",
    reason: "Live 14-day cron sequencing is not enabled yet. The admin test action triggers the first configured step only.",
    step_count: steps.length,
    first_step: firstStep,
  };
}

function buildLeadReactivationSummaryEvent({
  order,
  runtimeType,
  targetSegment,
  selectedLeads,
  maxBatchSize,
  now,
}) {
  return buildCommunicationEvent({
    order,
    channel: "internal",
    direction: "system",
    event_type: "lead_reactivation_batch_completed",
    provider: "internal",
    status: "processed",
    subject: "Lead reactivation batch completed",
    message_body: `Lead reactivation test processed ${selectedLeads.length} lead(s) for segment ${targetSegment}.`,
    service_key: "lead_reactivation",
    metadata: {
      order_id: order.id,
      service_key: "lead_reactivation",
      runtime_type: runtimeType,
      target_segment: targetSegment,
      selected_lead_ids: selectedLeads.map((lead) => lead.id),
      selected_lead_count: selectedLeads.length,
      max_batch_size: maxBatchSize,
      completed_at: now,
    },
  });
}

function buildReviewRequestTriggerSimulatedEvent({
  order,
  runtimeType,
  sharedConfig,
  runtimeData,
  serviceConfig,
  now,
}) {
  return buildReviewRequestTriggerEvent({
    order,
    runtimeType,
    sharedConfig,
    runtimeData,
    serviceConfig,
    now,
    simulated: true,
  });
}

function buildReviewRequestTriggerEvent({
  order,
  runtimeType,
  sharedConfig,
  runtimeData,
  serviceConfig,
  now,
  simulated = false,
}) {
  return buildCommunicationEvent({
    order,
    created_date: now,
    channel: "internal",
    direction: "system",
    event_type: simulated ? "review_request_trigger_simulated" : "review_request_trigger_received",
    provider: "internal",
    status: "processed",
    subject: simulated ? "Review request trigger simulated" : "Review request completion trigger received",
    message_body: simulated
      ? `Review request trigger simulated for ${order.business_name}.`
      : `Review request ${runtimeData.trigger_event || "completion"} trigger received for ${order.business_name}.`,
    service_key: "review_request",
    metadata: {
      ...createBaseRuntimeMetadata({
        order,
        serviceKey: "review_request",
        runtimeType,
        recipientPhone: runtimeData.recipient_phone,
        sharedConfig,
        runtimeData,
      }),
      review_link: serviceConfig.review_link,
      trigger_event: serviceConfig.trigger_event,
      channel: serviceConfig.channel,
      send_delay_minutes: serviceConfig.send_delay_minutes,
      fallback_internal_feedback_enabled: Boolean(serviceConfig.fallback_internal_feedback_enabled),
      trigger_source: runtimeData.trigger_source || (simulated ? "admin_test" : "automation_webhook"),
      completion_id: runtimeData.completion_id || null,
      occurred_at: runtimeData.occurred_at || null,
      proof_mode: simulated ? "SIMULATION_OR_LOCAL_TEST" : "LIVE_PROVIDER_PROOF",
    },
  });
}

function buildReviewRequestLiveProofEvent({
  order,
  runtimeType,
  sharedConfig,
  runtimeData,
  serviceConfig,
  now,
  provider,
  providerMessageId,
  leadId = null,
}) {
  return buildCommunicationEvent({
    order,
    created_date: now,
    lead_id: leadId,
    channel: serviceConfig.channel || "internal",
    direction: "system",
    event_type: "status_update",
    provider,
    status: "processed",
    subject: "Review Request Automation live trigger proof recorded",
    message_body: "A real completion trigger produced the canonical review-request runtime for this paid order.",
    service_key: "review_request",
    provider_message_id: providerMessageId || null,
    context_type: "provider_proof",
    context_id: `${order.id}:live_review_request_trigger:${runtimeData.completion_id || Date.parse(now)}`,
    metadata: {
      ...createBaseRuntimeMetadata({
        order,
        serviceKey: "review_request",
        runtimeType,
        recipientPhone: runtimeData.recipient_phone,
        sharedConfig,
        runtimeData,
      }),
      proof_kind: "live_review_request_trigger",
      proof_mode: "LIVE_PROVIDER_PROOF",
      trigger_event: runtimeData.trigger_event,
      channel: serviceConfig.channel,
      send_delay_minutes: serviceConfig.send_delay_minutes,
      trigger_source: runtimeData.trigger_source || "automation_webhook",
      completion_id: runtimeData.completion_id || null,
      occurred_at: runtimeData.occurred_at || now,
    },
  });
}

function buildReviewRequestMessage({ order, serviceConfig, runtimeData }) {
  return interpolateTemplate(serviceConfig.message_template, {
    first_name: getFirstName(runtimeData.customer_name || order.customer_name),
    customer_name: cleanString(runtimeData.customer_name) || cleanString(order.customer_name),
    business_name: cleanString(order.business_name),
    review_link: cleanString(serviceConfig.review_link),
    trigger_event: cleanString(serviceConfig.trigger_event),
    channel: cleanString(serviceConfig.channel),
    send_delay_minutes:
      serviceConfig.send_delay_minutes == null ? "" : String(serviceConfig.send_delay_minutes),
    customer_email: cleanString(runtimeData.recipient_email),
    customer_phone: cleanString(runtimeData.recipient_phone),
  });
}

export async function listLeadReactivationTargets({
  base44,
  order,
  targetSegment,
  maxBatchSize = 25,
  now = new Date().toISOString(),
}) {
  return listLeadReactivationTargetsFromPipeline({
    base44,
    order,
    targetSegment,
    maxBatchSize,
    now,
  });
}

export async function executeLeadReactivationTest({
  base44,
  order,
  runtimeType = "run_reactivation_test",
  maxTestLeads = 3,
  now = new Date().toISOString(),
}) {
  const { snapshot, serviceState, sharedConfig, serviceConfig } = getRuntimeContextForService({
    order,
    serviceKey: "lead_reactivation",
  });
  const validation = validateServiceConfiguration({
    orderLike: {
      ...order,
      items: snapshot.normalizedItems,
      install_configuration: snapshot.installConfiguration,
    },
    serviceKey: "lead_reactivation",
  });

  if (!validation.valid) {
    const reason = `Required configuration is incomplete: ${validation.missing_labels.join(", ")}`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "lead_reactivation",
        runtimeType,
        recipientPhone: "",
        sharedConfig,
        runtimeData: {
          target_segment: serviceConfig.target_segment,
          max_batch_size: serviceConfig.max_batch_size,
        },
        validation,
        reason,
        code: "missing_runtime_configuration",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "missing_runtime_configuration",
      details: {
        order_id: order.id,
        service_key: "lead_reactivation",
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  if (!ALLOWED_RUNTIME_INSTALL_STATUSES.includes(serviceState.install_status)) {
    const reason = `${serviceState.display_name || "Old Lead Reactivation"} is not runtime-ready while status is ${serviceState.install_status}.`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "lead_reactivation",
        runtimeType,
        recipientPhone: "",
        sharedConfig,
        runtimeData: {
          target_segment: serviceConfig.target_segment,
          max_batch_size: serviceConfig.max_batch_size,
        },
        validation,
        reason,
        code: "runtime_not_ready",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "runtime_not_ready",
      details: {
        order_id: order.id,
        service_key: "lead_reactivation",
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const hydratedOrder = {
    ...order,
    items: snapshot.normalizedItems,
    install_configuration: snapshot.installConfiguration,
  };
  const selectedLeads = await listLeadReactivationTargets({
    base44,
    order: hydratedOrder,
    targetSegment: serviceConfig.target_segment,
    maxBatchSize: Math.min(serviceConfig.max_batch_size || 25, Math.max(1, maxTestLeads)),
    now,
  });

  const createdEvents = [];
  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildRuntimeStartedEvent({
        order: hydratedOrder,
        serviceKey: "lead_reactivation",
        runtimeType,
        recipientPhone: "",
        sharedConfig,
        runtimeData: {
          target_segment: serviceConfig.target_segment,
          selected_lead_count: selectedLeads.length,
          max_batch_size: serviceConfig.max_batch_size,
        },
      })
    )
  );

  for (const lead of selectedLeads) {
    const messageBody = interpolateTemplate(serviceConfig.message_template, {
      lead_name: cleanString(lead.full_name) || "there",
      first_name: getFirstName(lead.full_name),
      business_name: cleanString(order.business_name),
      lead_email: cleanString(lead.email),
      lead_phone: cleanString(lead.phone),
      target_segment: cleanString(serviceConfig.target_segment),
    });
    const runtimeData = {
      lead_id: lead.id,
      lead_name: lead.full_name,
      lead_email: lead.email,
      lead_phone: lead.phone,
      target_segment: serviceConfig.target_segment,
      batch_size: selectedLeads.length,
    };

    createdEvents.push(
      await createCommunicationEvent(
        base44,
        {
          ...buildProviderSendAttemptedEvent({
            order: hydratedOrder,
            serviceKey: "lead_reactivation",
            runtimeType,
            recipientPhone: normalizePhone(lead.phone),
            sharedConfig,
            runtimeData,
            messageBody,
            channel: "internal",
            provider: "internal",
          }),
          lead_id: lead.id,
        }
      )
    );

    createdEvents.push(
      await createCommunicationEvent(
        base44,
        {
          ...buildProviderSendSucceededEvent({
            order: hydratedOrder,
            serviceKey: "lead_reactivation",
            runtimeType,
            recipientPhone: normalizePhone(lead.phone),
            sharedConfig,
            runtimeData,
            messageBody,
            providerMessageId: `reactivation:${order.id}:${lead.id}`,
            channel: "internal",
            provider: "internal",
            status: "processed",
          }),
          lead_id: lead.id,
        }
      )
    );
  }

  const summaryEvent = await createCommunicationEvent(
    base44,
    buildLeadReactivationSummaryEvent({
      order: hydratedOrder,
      runtimeType,
      targetSegment: serviceConfig.target_segment,
      selectedLeads,
      maxBatchSize: serviceConfig.max_batch_size,
      now,
    })
  );
  createdEvents.push(summaryEvent);

  await touchOrderLastInstallEvent(base44, order.id, now);

  return {
    success: true,
    order_id: order.id,
    service_key: "lead_reactivation",
    runtime_type: runtimeType,
    install_status: serviceState.install_status,
    configuration_complete: validation.valid,
    target_segment: serviceConfig.target_segment,
    target_size: selectedLeads.length,
    selected_lead_ids: selectedLeads.map((lead) => lead.id),
    selected_leads: selectedLeads.map((lead) => ({
      id: lead.id,
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
    })),
    max_batch_size: serviceConfig.max_batch_size,
    summary_event_id: summaryEvent.id,
    created_event_ids: createdEvents.map((event) => event.id),
  };
}

async function executeReviewRequestFlow({
  base44,
  order,
  runtimeType = "run_review_request_test",
  recipientPhone,
  recipientEmail,
  customerName,
  triggerEvent,
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
  sendEmail = sendEmailMessage,
  liveProviderSend = false,
  triggerSource = "admin_test",
  completionId = "",
  occurredAt = "",
  leadId = null,
}) {
  const { snapshot, serviceState, sharedConfig, serviceConfig } = getRuntimeContextForService({
    order,
    serviceKey: "review_request",
  });
  const validation = validateServiceConfiguration({
    orderLike: {
      ...order,
      items: snapshot.normalizedItems,
      install_configuration: snapshot.installConfiguration,
    },
    serviceKey: "review_request",
  });

  const resolvedTriggerEvent = REVIEW_REQUEST_TRIGGER_EVENTS.includes(triggerEvent)
    ? triggerEvent
    : serviceConfig.trigger_event;
  const resolvedChannel = serviceConfig.channel;
  const normalizedRecipientPhone = normalizePhone(recipientPhone || order.customer_phone);
  const normalizedRecipientEmail = cleanString(recipientEmail || order.customer_email);
  const runtimeRecipientPhone = resolvedChannel === "sms" ? normalizedRecipientPhone : "";
  const runtimeData = {
    trigger_event: resolvedTriggerEvent,
    configured_trigger_event: serviceConfig.trigger_event,
    channel: resolvedChannel,
    review_link: cleanString(serviceConfig.review_link),
    send_delay_minutes: serviceConfig.send_delay_minutes,
    fallback_internal_feedback_enabled: Boolean(serviceConfig.fallback_internal_feedback_enabled),
    recipient_email: normalizedRecipientEmail,
    recipient_phone: runtimeRecipientPhone,
    customer_name: cleanString(customerName) || cleanString(order.customer_name),
    trigger_source: cleanString(triggerSource) || (liveProviderSend ? "automation_webhook" : "admin_test"),
    completion_id: cleanString(completionId),
    occurred_at: cleanString(occurredAt) || now,
  };

  const recipientValidationErrors = [];
  if (!validation.valid) {
    recipientValidationErrors.push(...validation.missing_fields.map((field, index) => ({
      field,
      label: validation.missing_labels[index] || field,
    })));
  }
  if (resolvedChannel === "sms" && !normalizedRecipientPhone) {
    recipientValidationErrors.push({
      field: "runtime.recipient_phone",
      label: "Provide test phone",
    });
  }
  if (resolvedChannel === "email" && !normalizedRecipientEmail) {
    recipientValidationErrors.push({
      field: "runtime.recipient_email",
      label: "Provide test email",
    });
  }
  if (liveProviderSend && Number(serviceConfig.send_delay_minutes || 0) > 0) {
    recipientValidationErrors.push({
      field: "services.review_request.send_delay_minutes",
      label: "Set review delay to 0 minutes for live completion automation",
    });
  }

  const combinedValidation = recipientValidationErrors.length > validation.missing_fields.length
    ? {
        ...validation,
        valid: false,
        missing_fields: recipientValidationErrors.map((entry) => entry.field),
        missing_labels: recipientValidationErrors.map((entry) => entry.label),
      }
    : validation;

  if (!combinedValidation.valid) {
    const reason = `Required configuration is incomplete: ${combinedValidation.missing_labels.join(", ")}`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "review_request",
        runtimeType,
        recipientPhone: runtimeRecipientPhone,
        sharedConfig,
        runtimeData,
        validation: combinedValidation,
        reason,
        code: "missing_runtime_configuration",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "missing_runtime_configuration",
      details: {
        order_id: order.id,
        service_key: "review_request",
        validation: combinedValidation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  if (!ALLOWED_RUNTIME_INSTALL_STATUSES.includes(serviceState.install_status)) {
    const reason = `${serviceState.display_name || "Review Request Automation"} is not runtime-ready while status is ${serviceState.install_status}.`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "review_request",
        runtimeType,
        recipientPhone: runtimeRecipientPhone,
        sharedConfig,
        runtimeData,
        validation,
        reason,
        code: "runtime_not_ready",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "runtime_not_ready",
      details: {
        order_id: order.id,
        service_key: "review_request",
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const hydratedOrder = {
    ...order,
    items: snapshot.normalizedItems,
    install_configuration: snapshot.installConfiguration,
  };
  const messageBody = buildReviewRequestMessage({
    order: hydratedOrder,
    serviceConfig,
    runtimeData,
  });
  const createdEvents = [];

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildRuntimeStartedEvent({
        order: hydratedOrder,
        serviceKey: "review_request",
        runtimeType,
        recipientPhone: runtimeRecipientPhone,
        sharedConfig,
        runtimeData,
        leadId,
        now,
      })
    )
  );

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildReviewRequestTriggerEvent({
        order: hydratedOrder,
        runtimeType,
        sharedConfig,
        runtimeData,
        serviceConfig,
        now,
        simulated: !liveProviderSend,
      })
    )
  );

  if (!liveProviderSend) {
    createdEvents.push(
      await createCommunicationEvent(
        base44,
        buildProviderSendAttemptedEvent({
          order: hydratedOrder,
          serviceKey: "review_request",
          runtimeType,
          recipientPhone: runtimeRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody,
          channel: REVIEW_REQUEST_CHANNELS.includes(resolvedChannel) ? resolvedChannel : "internal",
          provider: "internal",
          leadId,
          now,
        })
      )
    );

    createdEvents.push(
      await createCommunicationEvent(
        base44,
        buildProviderSendSucceededEvent({
          order: hydratedOrder,
          serviceKey: "review_request",
          runtimeType,
          recipientPhone: runtimeRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody,
          providerMessageId: `review-request:${order.id}:${Date.parse(now)}`,
          channel: REVIEW_REQUEST_CHANNELS.includes(resolvedChannel) ? resolvedChannel : "internal",
          provider: "internal",
          status: "processed",
          leadId,
          now,
        })
      )
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    return {
      success: true,
      order_id: order.id,
      service_key: "review_request",
      runtime_type: runtimeType,
      install_status: serviceState.install_status,
      configuration_complete: validation.valid,
      trigger_event: resolvedTriggerEvent,
      channel: resolvedChannel,
      review_link: serviceConfig.review_link,
      send_delay_minutes: serviceConfig.send_delay_minutes,
      fallback_internal_feedback_enabled: Boolean(serviceConfig.fallback_internal_feedback_enabled),
      recipient_phone: runtimeRecipientPhone || null,
      recipient_email: resolvedChannel === "email" ? normalizedRecipientEmail : null,
      message_template: serviceConfig.message_template,
      message_preview: messageBody,
      placeholder_runtime: true,
      created_event_ids: createdEvents.map((event) => event.id),
    };
  }

  const liveProvider = resolvedChannel === "email" ? "resend" : "twilio";
  const liveSubject = `${order.business_name || "ClientSurge"} review request`;

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildProviderSendAttemptedEvent({
        order: hydratedOrder,
        serviceKey: "review_request",
        runtimeType,
        recipientPhone: runtimeRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody,
        channel: resolvedChannel,
        provider: liveProvider,
        leadId,
        now,
      })
    )
  );

  try {
    const sendResult = resolvedChannel === "email"
      ? await sendEmail({
          base44,
          to: normalizedRecipientEmail,
          subject: liveSubject,
          body: messageBody,
        })
      : await sendSms({
          to: runtimeRecipientPhone,
          from: sharedConfig.twilio_business_phone,
          body: messageBody,
          serviceKey: "review_request",
          orderId: order.id,
          runtimeType,
        });

    createdEvents.push(
      await createCommunicationEvent(
        base44,
        buildProviderSendSucceededEvent({
          order: hydratedOrder,
          serviceKey: "review_request",
          runtimeType,
          recipientPhone: runtimeRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody,
          providerMessageId: sendResult.provider_message_id,
          channel: resolvedChannel,
          provider: liveProvider,
          status: sendResult.provider_status || (resolvedChannel === "email" ? "processed" : "sent"),
          leadId,
          now,
        })
      )
    );

    const proofEvent = await createCommunicationEvent(
      base44,
      buildReviewRequestLiveProofEvent({
        order: hydratedOrder,
        runtimeType,
        sharedConfig,
        runtimeData,
        serviceConfig,
        now,
        provider: liveProvider,
        providerMessageId: sendResult.provider_message_id,
        leadId,
      })
    );
    createdEvents.push(proofEvent);

    await touchOrderLastInstallEvent(base44, order.id, now);

    return {
      success: true,
      order_id: order.id,
      service_key: "review_request",
      runtime_type: runtimeType,
      install_status: serviceState.install_status,
      configuration_complete: validation.valid,
      trigger_event: resolvedTriggerEvent,
      channel: resolvedChannel,
      review_link: serviceConfig.review_link,
      send_delay_minutes: serviceConfig.send_delay_minutes,
      fallback_internal_feedback_enabled: Boolean(serviceConfig.fallback_internal_feedback_enabled),
      recipient_phone: runtimeRecipientPhone || null,
      recipient_email: resolvedChannel === "email" ? normalizedRecipientEmail : null,
      message_template: serviceConfig.message_template,
      message_preview: messageBody,
      placeholder_runtime: false,
      provider_message_id: sendResult.provider_message_id,
      provider_status: sendResult.provider_status || (resolvedChannel === "email" ? "processed" : "sent"),
      proof_event_id: proofEvent.id,
      created_event_ids: createdEvents.map((event) => event.id),
    };
  } catch (error) {
    const runtimeError = error instanceof RuntimeExecutionError
      ? error
      : new RuntimeExecutionError(error instanceof Error ? error.message : "Review request send failed", {
          status: 502,
          code: "provider_send_failed",
        });

    const failedEvent = await createCommunicationEvent(
      base44,
      buildProviderSendFailedEvent({
        order: hydratedOrder,
        serviceKey: "review_request",
        runtimeType,
        recipientPhone: runtimeRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody,
        errorMessage: runtimeError.message,
        channel: resolvedChannel,
        provider: liveProvider,
        leadId,
        now,
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(runtimeError.message, {
      status: runtimeError.status || 502,
      code: runtimeError.code || "provider_send_failed",
      details: {
        ...(runtimeError.details || {}),
        order_id: order.id,
        service_key: "review_request",
        failed_event_id: failedEvent.id,
      },
    });
  }
}

export async function executeReviewRequestTest({
  base44,
  order,
  runtimeType = "run_review_request_test",
  recipientPhone,
  recipientEmail,
  customerName,
  triggerEvent,
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
  sendEmail = sendEmailMessage,
}) {
  return executeReviewRequestFlow({
    base44,
    order,
    runtimeType,
    recipientPhone,
    recipientEmail,
    customerName,
    triggerEvent,
    now,
    sendSms,
    sendEmail,
    liveProviderSend: false,
    triggerSource: "admin_test",
  });
}

export async function executeLiveReviewRequestTrigger({
  base44,
  order,
  recipientPhone,
  recipientEmail,
  customerName,
  triggerEvent,
  completionId,
  occurredAt,
  triggerSource = "automation_webhook",
  leadId = null,
  runtimeType = "review_request_live_trigger",
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
  sendEmail = sendEmailMessage,
}) {
  return executeReviewRequestFlow({
    base44,
    order,
    runtimeType,
    recipientPhone,
    recipientEmail,
    customerName,
    triggerEvent,
    now,
    sendSms,
    sendEmail,
    liveProviderSend: true,
    triggerSource,
    completionId,
    occurredAt,
    leadId,
  });
}

function buildBookingCreatedEvent({
  order,
  sharedConfig,
  runtimeData,
  bookingLink,
  bookingMode,
  confirmationMessage,
  now,
}) {
  return buildCommunicationEvent({
    order,
    created_date: now,
    channel: "internal",
    direction: "system",
    event_type: "booking_simulation_created",
    provider: "internal",
    status: "processed",
    subject: "Booking simulation created",
    message_body: `Booking simulation created for ${order.business_name}.`,
    service_key: "ai_booking_agent",
    metadata: {
      ...createBaseRuntimeMetadata({
        order,
        serviceKey: "ai_booking_agent",
        runtimeType: "simulate_booking",
        recipientPhone: runtimeData.recipient_phone,
        sharedConfig,
        runtimeData,
      }),
      booking_link: bookingLink,
      booking_mode: bookingMode,
      confirmation_message: confirmationMessage,
    },
  });
}

export async function executeBookingSimulation({
  base44,
  order,
  runtimeType = "simulate_booking",
  leadName,
  leadEmail,
  leadPhone,
  scheduledAt,
  now = new Date().toISOString(),
}) {
  const { snapshot, serviceState, sharedConfig, serviceConfig } = getRuntimeContextForService({
    order,
    serviceKey: "ai_booking_agent",
  });
  const validation = validateServiceConfiguration({
    orderLike: {
      ...order,
      items: snapshot.normalizedItems,
      install_configuration: snapshot.installConfiguration,
    },
    serviceKey: "ai_booking_agent",
  });
  const normalizedRecipientPhone = normalizePhone(leadPhone || order.customer_phone);
  const runtimeData = {
    lead_name: cleanString(leadName) || "Booking Test Lead",
    lead_email: cleanString(leadEmail) || cleanString(order.customer_email),
    lead_phone: normalizedRecipientPhone,
    scheduled_at: cleanString(scheduledAt) || now,
    booking_link: cleanString(serviceConfig.booking_link),
    booking_mode: cleanString(serviceConfig.booking_mode),
    reminder_enabled: Boolean(serviceConfig.reminder_enabled),
    service_business_hours: cleanString(serviceConfig.business_hours),
    notes: "",
  };
  const intakeValues = buildBookingIntakeValues({ order, runtimeData });
  const missingIntakeFields = (serviceConfig.intake_fields || []).filter((field) => !cleanString(intakeValues[field]));

  if (!validation.valid || missingIntakeFields.length > 0) {
    const reason = !validation.valid
      ? `Required configuration is incomplete: ${validation.missing_labels.join(", ")}`
      : `Required intake data is missing: ${missingIntakeFields.join(", ")}`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "ai_booking_agent",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        validation: missingIntakeFields.length > 0
          ? {
              ...validation,
              valid: false,
              missing_fields: [...validation.missing_fields, ...missingIntakeFields.map((field) => `intake_fields.${field}`)],
              missing_labels: [...validation.missing_labels, ...missingIntakeFields.map((field) => `Provide ${field.replaceAll("_", " ")}`)],
            }
          : validation,
        reason,
        code: missingIntakeFields.length > 0 ? "missing_booking_intake_fields" : "missing_runtime_configuration",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "missing_runtime_configuration",
      details: {
        order_id: order.id,
        service_key: "ai_booking_agent",
        validation: missingIntakeFields.length > 0
          ? {
              ...validation,
              valid: false,
              missing_fields: [...validation.missing_fields, ...missingIntakeFields.map((field) => `intake_fields.${field}`)],
              missing_labels: [...validation.missing_labels, ...missingIntakeFields.map((field) => `Provide ${field.replaceAll("_", " ")}`)],
            }
          : validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  if (!ALLOWED_RUNTIME_INSTALL_STATUSES.includes(serviceState.install_status)) {
    const reason = `${serviceState.display_name || "AI Booking Agent"} is not runtime-ready while status is ${serviceState.install_status}.`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "ai_booking_agent",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        validation,
        reason,
        code: "runtime_not_ready",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "runtime_not_ready",
      details: {
        order_id: order.id,
        service_key: "ai_booking_agent",
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const hydratedOrder = {
    ...order,
    items: snapshot.normalizedItems,
    install_configuration: snapshot.installConfiguration,
  };
  const confirmationMessage = buildBookingConfirmationMessage({
    order: hydratedOrder,
    serviceConfig,
    runtimeData,
  });
  const reminderMessage = serviceConfig.reminder_enabled
    ? buildBookingReminderMessage({
        order: hydratedOrder,
        serviceConfig,
        runtimeData,
      })
    : "";
  const createdEvents = [];

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildRuntimeStartedEvent({
        order: hydratedOrder,
        serviceKey: "ai_booking_agent",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        now,
      })
    )
  );

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildBookingCreatedEvent({
        order: hydratedOrder,
        sharedConfig,
        runtimeData,
        bookingLink: serviceConfig.booking_link,
        bookingMode: serviceConfig.booking_mode,
        confirmationMessage,
        now,
      })
    )
  );

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildProviderSendAttemptedEvent({
        order: hydratedOrder,
        serviceKey: "ai_booking_agent",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody: confirmationMessage,
        channel: "internal",
        provider: "internal",
        now,
      })
    )
  );

  const confirmationEvent = await createCommunicationEvent(
    base44,
    buildProviderSendSucceededEvent({
      order: hydratedOrder,
      serviceKey: "ai_booking_agent",
      runtimeType,
      recipientPhone: normalizedRecipientPhone,
      sharedConfig,
      runtimeData,
      messageBody: confirmationMessage,
      providerMessageId: `booking-test:${order.id}:${Date.parse(now)}`,
      channel: "internal",
      provider: "internal",
      status: "processed",
      now,
    })
  );
  createdEvents.push(confirmationEvent);

  let reminderEvent = null;
  if (serviceConfig.reminder_enabled) {
    createdEvents.push(
      await createCommunicationEvent(
        base44,
        buildProviderSendAttemptedEvent({
          order: hydratedOrder,
          serviceKey: "ai_booking_agent",
          runtimeType,
          recipientPhone: normalizedRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody: reminderMessage,
          channel: "internal",
          provider: "internal",
          now,
        })
      )
    );

    reminderEvent = await createCommunicationEvent(
      base44,
      buildProviderSendSucceededEvent({
        order: hydratedOrder,
        serviceKey: "ai_booking_agent",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody: reminderMessage,
        providerMessageId: `booking-reminder:${order.id}:${Date.parse(now)}`,
        channel: "internal",
        provider: "internal",
        status: "processed",
        now,
      })
    );
    createdEvents.push(reminderEvent);
  }

  await touchOrderLastInstallEvent(base44, order.id, now);

  return {
    success: true,
    order_id: order.id,
    service_key: "ai_booking_agent",
    runtime_type: runtimeType,
    install_status: serviceState.install_status,
    configuration_complete: validation.valid,
    booking_simulation_created: true,
    booking_link: serviceConfig.booking_link,
    booking_mode: serviceConfig.booking_mode,
    business_hours: serviceConfig.business_hours,
    reminder_enabled: Boolean(serviceConfig.reminder_enabled),
    intake_fields: serviceConfig.intake_fields || [],
    lead_name: runtimeData.lead_name,
    lead_email: runtimeData.lead_email,
    lead_phone: normalizedRecipientPhone,
    scheduled_at: runtimeData.scheduled_at,
    confirmation_message: confirmationMessage,
    reminder_message: reminderMessage || null,
    confirmation_event_id: confirmationEvent.id,
    reminder_event_id: reminderEvent?.id || null,
    created_event_ids: createdEvents.map((event) => event.id),
  };
}

export async function executeOrderServiceRuntime({
  base44,
  order,
  serviceKey,
  runtimeType,
  recipientPhone,
  leadId = null,
  runtimeData = {},
  businessIsOpen = true,
  consentGranted = true,
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
}) {
  const { snapshot, serviceState, sharedConfig, serviceConfig } = getRuntimeContextForService({
    order,
    serviceKey,
  });
  const normalizedRecipientPhone = normalizePhone(recipientPhone);
  const validation = validateServiceConfiguration({
    orderLike: {
      ...order,
      items: snapshot.normalizedItems,
      install_configuration: snapshot.installConfiguration,
    },
    serviceKey,
  });

  const runtimeAccess = shouldAllowRuntime({
    installStatus: serviceState.install_status,
    validation,
    recipientPhone: normalizedRecipientPhone,
    businessIsOpen,
    consentGranted,
    sharedConfig,
    serviceKey,
  });

  if (!runtimeAccess.allowed) {
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey,
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        validation,
        reason: runtimeAccess.reason,
        code: runtimeAccess.code,
        leadId,
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(runtimeAccess.reason, {
      status: 409,
      code: runtimeAccess.code,
      details: {
        order_id: order.id,
        service_key: serviceKey,
        install_status: serviceState.install_status,
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const hydratedOrder = {
    ...order,
    items: snapshot.normalizedItems,
    install_configuration: snapshot.installConfiguration,
  };
  const messageBody = buildRuntimeMessage({
    order: hydratedOrder,
    serviceKey,
    sharedConfig,
    serviceConfig,
    runtimeData: {
      ...runtimeData,
      recipient_phone: normalizedRecipientPhone,
    },
  });

  const createdEvents = [];

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildRuntimeStartedEvent({
        order: hydratedOrder,
        serviceKey,
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        leadId,
      })
    )
  );

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildProviderSendAttemptedEvent({
        order: hydratedOrder,
        serviceKey,
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody,
        leadId,
      })
    )
  );

  try {
    const sendResult = await sendSms({
      to: normalizedRecipientPhone,
      from: sharedConfig.twilio_business_phone,
      body: messageBody,
      serviceKey,
      orderId: order.id,
      runtimeType,
    });

    createdEvents.push(
      await createCommunicationEvent(
        base44,
        buildProviderSendSucceededEvent({
          order: hydratedOrder,
          serviceKey,
          runtimeType,
          recipientPhone: normalizedRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody,
          providerMessageId: sendResult.provider_message_id,
          leadId,
        })
      )
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    return {
      success: true,
      order_id: order.id,
      service_key: serviceKey,
      runtime_type: runtimeType,
      install_status: serviceState.install_status,
      configuration_complete: validation.valid,
      recipient_phone: normalizedRecipientPhone,
      from_phone: sharedConfig.twilio_business_phone,
      message_body: messageBody,
      provider_message_id: sendResult.provider_message_id,
      provider_status: sendResult.provider_status,
      created_event_ids: createdEvents.map((event) => event.id),
    };
  } catch (error) {
    const runtimeError = error instanceof RuntimeExecutionError
      ? error
      : new RuntimeExecutionError(error instanceof Error ? error.message : "Runtime send failed", {
          status: 502,
          code: "provider_send_failed",
        });

    const failedEvent = await createCommunicationEvent(
      base44,
      buildProviderSendFailedEvent({
        order: hydratedOrder,
        serviceKey,
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody,
        errorMessage: runtimeError.message,
        leadId,
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(runtimeError.message, {
      status: runtimeError.status || 502,
      code: runtimeError.code || "provider_send_failed",
      details: {
        ...(runtimeError.details || {}),
        order_id: order.id,
        service_key: serviceKey,
        failed_event_id: failedEvent.id,
      },
    });
  }
}

export async function executeNurtureSequenceTest({
  base44,
  order,
  recipientPhone,
  recipientEmail,
  stepIndex = 0,
  runtimeType = "run_nurture_sequence_test",
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
  sendEmail = sendEmailMessage,
}) {
  const { snapshot, serviceState, sharedConfig, serviceConfig } = getRuntimeContextForService({
    order,
    serviceKey: "nurture_sequence_14d",
  });
  const validation = validateServiceConfiguration({
    orderLike: {
      ...order,
      items: snapshot.normalizedItems,
      install_configuration: snapshot.installConfiguration,
    },
    serviceKey: "nurture_sequence_14d",
  });
  const step = Array.isArray(serviceConfig.steps) ? serviceConfig.steps[stepIndex] : null;

  if (!validation.valid || !step) {
    const reason = !step
      ? "Nurture sequence test is blocked because no valid first step is configured."
      : `Required configuration is incomplete: ${validation.missing_labels.join(", ")}`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "nurture_sequence_14d",
        runtimeType,
        recipientPhone: normalizePhone(recipientPhone),
        sharedConfig,
        runtimeData: {
          recipient_email: cleanString(recipientEmail),
          step_index: stepIndex,
          step,
        },
        validation,
        reason,
        code: "missing_runtime_configuration",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "missing_runtime_configuration",
      details: {
        order_id: order.id,
        service_key: "nurture_sequence_14d",
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  if (!ALLOWED_RUNTIME_INSTALL_STATUSES.includes(serviceState.install_status)) {
    const reason = `${serviceState.display_name || "14-Day Nurture Sequence"} is not runtime-ready while status is ${serviceState.install_status}.`;
    const blockedEvent = await createCommunicationEvent(
      base44,
      buildRuntimeBlockedEvent({
        order: {
          ...order,
          items: snapshot.normalizedItems,
          install_configuration: snapshot.installConfiguration,
        },
        serviceKey: "nurture_sequence_14d",
        runtimeType,
        recipientPhone: normalizePhone(recipientPhone),
        sharedConfig,
        runtimeData: {
          recipient_email: cleanString(recipientEmail),
          step_index: stepIndex,
          step,
        },
        validation,
        reason,
        code: "runtime_not_ready",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(reason, {
      status: 409,
      code: "runtime_not_ready",
      details: {
        order_id: order.id,
        service_key: "nurture_sequence_14d",
        validation,
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const normalizedRecipientPhone = normalizePhone(recipientPhone);
  const normalizedRecipientEmail = cleanString(recipientEmail);
  const messageBody = interpolateTemplate(step.message_template, {
    first_name: getFirstName(order.customer_name),
    customer_name: cleanString(order.customer_name),
    business_name: cleanString(order.business_name),
    business_phone: cleanString(sharedConfig.twilio_business_phone),
    twilio_business_phone: cleanString(sharedConfig.twilio_business_phone),
    business_hours: cleanString(sharedConfig.business_hours),
    opt_out_message: cleanString(sharedConfig.opt_out_message),
    recipient_phone: normalizedRecipientPhone,
    recipient_email: normalizedRecipientEmail,
    day: step.day,
    channel: step.channel,
  });

  const runtimeData = {
    sequence_step_index: stepIndex,
    sequence_step_day: step.day,
    sequence_step_channel: step.channel,
    recipient_email: normalizedRecipientEmail,
  };
  const hydratedOrder = {
    ...order,
    items: snapshot.normalizedItems,
    install_configuration: snapshot.installConfiguration,
  };
  const createdEvents = [];

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildRuntimeStartedEvent({
        order: hydratedOrder,
        serviceKey: "nurture_sequence_14d",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
      })
    )
  );

  if (step.channel === "sms") {
    if (!serviceConfig.sms_enabled) {
      await throwBlockedRuntimeExecution({
        base44,
        order: hydratedOrder,
        serviceKey: "nurture_sequence_14d",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        validation: {
          ...validation,
          valid: false,
          missing_fields: [...validation.missing_fields, "services.nurture_sequence_14d.sms_enabled"],
          missing_labels: [...validation.missing_labels, "Enable SMS"],
        },
        reason: "Nurture sequence SMS is not enabled.",
        code: "nurture_sms_disabled",
        now,
      });
    }
    if (!normalizedRecipientPhone) {
      await throwBlockedRuntimeExecution({
        base44,
        order: hydratedOrder,
        serviceKey: "nurture_sequence_14d",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        validation: {
          ...validation,
          valid: false,
          missing_fields: [...validation.missing_fields, "runtime.recipient_phone"],
          missing_labels: [...validation.missing_labels, "Provide test phone"],
        },
        reason: "Recipient phone number is required for nurture sequence SMS tests.",
        code: "missing_recipient_phone",
        now,
      });
    }

    createdEvents.push(
      await createCommunicationEvent(
        base44,
        buildProviderSendAttemptedEvent({
          order: hydratedOrder,
          serviceKey: "nurture_sequence_14d",
          runtimeType,
          recipientPhone: normalizedRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody,
          channel: "sms",
          provider: "twilio",
        })
      )
    );

    try {
      const sendResult = await sendSms({
        to: normalizedRecipientPhone,
        from: sharedConfig.twilio_business_phone,
        body: messageBody,
      });

      createdEvents.push(
        await createCommunicationEvent(
          base44,
          buildProviderSendSucceededEvent({
            order: hydratedOrder,
            serviceKey: "nurture_sequence_14d",
            runtimeType,
            recipientPhone: normalizedRecipientPhone,
            sharedConfig,
            runtimeData,
            messageBody,
            providerMessageId: sendResult.provider_message_id,
            channel: "sms",
            provider: "twilio",
            status: sendResult.provider_status || "sent",
          })
        )
      );

      await touchOrderLastInstallEvent(base44, order.id, now);

      return {
        success: true,
        order_id: order.id,
        service_key: "nurture_sequence_14d",
        runtime_type: runtimeType,
        channel: "sms",
        step_index: stepIndex,
        step_day: step.day,
        step_channel: step.channel,
        message_body: messageBody,
        recipient_phone: normalizedRecipientPhone,
        provider_message_id: sendResult.provider_message_id,
        provider_status: sendResult.provider_status,
        schedule_preview: buildNurtureSequenceSchedulePreview(serviceConfig),
        created_event_ids: createdEvents.map((event) => event.id),
      };
    } catch (error) {
      const runtimeError = error instanceof RuntimeExecutionError
        ? error
        : new RuntimeExecutionError(error instanceof Error ? error.message : "Nurture SMS send failed", {
            status: 502,
            code: "provider_send_failed",
          });

      const failedEvent = await createCommunicationEvent(
        base44,
        buildProviderSendFailedEvent({
          order: hydratedOrder,
          serviceKey: "nurture_sequence_14d",
          runtimeType,
          recipientPhone: normalizedRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody,
          errorMessage: runtimeError.message,
          channel: "sms",
          provider: "twilio",
        })
      );

      await touchOrderLastInstallEvent(base44, order.id, now);

      throw new RuntimeExecutionError(runtimeError.message, {
        status: runtimeError.status || 502,
        code: runtimeError.code || "provider_send_failed",
        details: {
          ...(runtimeError.details || {}),
          order_id: order.id,
          service_key: "nurture_sequence_14d",
          failed_event_id: failedEvent.id,
        },
      });
    }
  }

  if (!serviceConfig.email_enabled) {
    await throwBlockedRuntimeExecution({
      base44,
      order: hydratedOrder,
      serviceKey: "nurture_sequence_14d",
      runtimeType,
      recipientPhone: normalizedRecipientPhone,
      sharedConfig,
      runtimeData,
      validation: {
        ...validation,
        valid: false,
        missing_fields: [...validation.missing_fields, "services.nurture_sequence_14d.email_enabled"],
        missing_labels: [...validation.missing_labels, "Enable Email"],
      },
      reason: "Nurture sequence email is not enabled.",
      code: "nurture_email_disabled",
      now,
    });
  }
  if (!normalizedRecipientEmail) {
    await throwBlockedRuntimeExecution({
      base44,
      order: hydratedOrder,
      serviceKey: "nurture_sequence_14d",
      runtimeType,
      recipientPhone: normalizedRecipientPhone,
      sharedConfig,
      runtimeData,
      validation: {
        ...validation,
        valid: false,
        missing_fields: [...validation.missing_fields, "runtime.recipient_email"],
        missing_labels: [...validation.missing_labels, "Provide test email"],
      },
      reason: "Recipient email is required for nurture sequence email tests.",
      code: "missing_recipient_email",
      now,
    });
  }

  createdEvents.push(
    await createCommunicationEvent(
      base44,
      buildProviderSendAttemptedEvent({
        order: hydratedOrder,
        serviceKey: "nurture_sequence_14d",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody,
        channel: "email",
        provider: "resend",
      })
    )
  );

  try {
    const sendResult = await sendEmail({
      base44,
      to: normalizedRecipientEmail,
      subject: `${order.business_name} nurture sequence test`,
      body: messageBody,
    });

    createdEvents.push(
      await createCommunicationEvent(
        base44,
        buildProviderSendSucceededEvent({
          order: hydratedOrder,
          serviceKey: "nurture_sequence_14d",
          runtimeType,
          recipientPhone: normalizedRecipientPhone,
          sharedConfig,
          runtimeData,
          messageBody,
          providerMessageId: sendResult.provider_message_id,
          channel: "email",
          provider: "resend",
          status: sendResult.provider_status || "processed",
        })
      )
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    return {
      success: true,
      order_id: order.id,
      service_key: "nurture_sequence_14d",
      runtime_type: runtimeType,
      channel: "email",
      step_index: stepIndex,
      step_day: step.day,
      step_channel: step.channel,
      message_body: messageBody,
      recipient_email: normalizedRecipientEmail,
      provider_message_id: sendResult.provider_message_id,
      provider_status: sendResult.provider_status,
      schedule_preview: buildNurtureSequenceSchedulePreview(serviceConfig),
      created_event_ids: createdEvents.map((event) => event.id),
    };
  } catch (error) {
    const runtimeError = error instanceof RuntimeExecutionError
      ? error
      : new RuntimeExecutionError(error instanceof Error ? error.message : "Nurture email send failed", {
          status: 502,
          code: "provider_send_failed",
        });

    const failedEvent = await createCommunicationEvent(
      base44,
      buildProviderSendFailedEvent({
        order: hydratedOrder,
        serviceKey: "nurture_sequence_14d",
        runtimeType,
        recipientPhone: normalizedRecipientPhone,
        sharedConfig,
        runtimeData,
        messageBody,
        errorMessage: runtimeError.message,
        channel: "email",
        provider: "resend",
      })
    );

    await touchOrderLastInstallEvent(base44, order.id, now);

    throw new RuntimeExecutionError(runtimeError.message, {
      status: runtimeError.status || 502,
      code: runtimeError.code || "provider_send_failed",
      details: {
        ...(runtimeError.details || {}),
        order_id: order.id,
        service_key: "nurture_sequence_14d",
        failed_event_id: failedEvent.id,
      },
    });
  }
}

import {
  buildCommunicationEvent,
  validateServiceConfiguration,
} from "./installPipeline.js";
import {
  getRuntimeContextForService,
  listLeadReactivationTargets,
  RuntimeExecutionError,
  sendEmailMessage,
  sendTwilioSms,
} from "./installRuntime.js";

const LEAD_REACTIVATION_COOLDOWN_DAYS = 30;
const REVIEW_REQUEST_COOLDOWN_HOURS = 24;

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

function parseJson(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function addDays(isoValue, days) {
  const date = new Date(isoValue);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString();
}

function addHours(isoValue, hours) {
  const date = new Date(isoValue);
  date.setUTCHours(date.getUTCHours() + Number(hours || 0));
  return date.toISOString();
}

function isRecentEnough(isoValue, hours) {
  if (!isoValue) {
    return false;
  }

  const timestamp = new Date(isoValue).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return false;
  }

  return Date.now() - timestamp <= hours * 60 * 60 * 1000;
}

function getFirstName(name) {
  const normalized = cleanString(name);
  if (!normalized) {
    return "there";
  }

  return normalized.split(/\s+/)[0];
}

function interpolateTemplate(template, variables) {
  return cleanString(template).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = variables[key];
    return value == null ? "" : String(value);
  }).replace(/\s+/g, " ").trim();
}

function buildRuntimeMetadata({
  order,
  serviceKey,
  runtimeType,
  triggerSource,
  recipientPhone = "",
  recipientEmail = "",
  lead = null,
  extra = {},
}) {
  return {
    order_id: order.id,
    service_key: serviceKey,
    runtime_type: runtimeType,
    trigger_source: triggerSource,
    production_runtime: true,
    recipient_phone: normalizePhone(recipientPhone),
    recipient_email: cleanString(recipientEmail).toLowerCase(),
    lead_id: lead?.id || null,
    lead_name: cleanString(lead?.full_name),
    lead_phone: normalizePhone(lead?.phone || lead?.phone_number),
    lead_email: cleanString(lead?.email).toLowerCase(),
    ...extra,
  };
}

async function createOrderScopedEvent(base44, {
  order,
  leadId = "",
  serviceKey,
  eventType,
  runtimeType,
  triggerSource,
  channel = "internal",
  direction = "system",
  provider = "internal",
  status = "processed",
  subject,
  messageBody,
  providerMessageId,
  errorMessage,
  recipientPhone = "",
  recipientEmail = "",
  lead = null,
  metadata = {},
}) {
  const payload = buildCommunicationEvent({
    order,
    service_key: serviceKey,
    event_type: eventType,
    channel,
    direction,
    provider,
    status,
    subject,
    message_body: messageBody,
    provider_message_id: providerMessageId,
    error_message: errorMessage,
    metadata: buildRuntimeMetadata({
      order,
      serviceKey,
      runtimeType,
      triggerSource,
      recipientPhone,
      recipientEmail,
      lead,
      extra: metadata,
    }),
  });

  if (leadId) {
    payload.lead_id = leadId;
  }

  return base44.asServiceRole.entities.CommunicationEvent.create(payload);
}

async function touchOrder(base44, orderId, now) {
  await base44.asServiceRole.entities.Order.update(orderId, {
    last_install_event_at: now,
  });
}

export function getServiceExecutionProfile(serviceKey) {
  if (serviceKey === "instant_lead_response") {
    return {
      mode: "production_real",
      label: "Production Real",
      trigger_label: "Signed customer lead-capture webhook",
      trigger_detail: "Runs only for a Live order with active subscription access.",
      scheduler_label: null,
    };
  }

  if (serviceKey === "missed_call_text_back") {
    return {
      mode: "production_real",
      label: "Production Real",
      trigger_label: "Signed Twilio status webhook",
      trigger_detail: "Twilio call-status events resolve the Live order from the configured business phone.",
      scheduler_label: null,
    };
  }

  if (serviceKey === "nurture_sequence_14d") {
    return {
      mode: "manual_runner",
      label: "Manual / Cron Runner",
      trigger_label: "Lead enrollment on signed customer lead capture",
      trigger_detail: "Due steps run through the canonical nurture runner and stay idempotent.",
      scheduler_label: "Due-step runner required",
    };
  }

  if (serviceKey === "lead_reactivation") {
    return {
      mode: "manual_triggered",
      label: "Manual Triggered",
      trigger_label: "Admin-approved batch only",
      trigger_detail: "No unattended blast path exists. Each batch is operator-approved and cooldown-guarded.",
      scheduler_label: null,
    };
  }

  if (serviceKey === "review_request") {
    return {
      mode: "manual_triggered",
      label: "Manual Triggered",
      trigger_label: "Admin manual trigger only",
      trigger_detail: "No automatic post-appointment trigger is claimed until a real source exists.",
      scheduler_label: null,
    };
  }

  return {
    mode: "placeholder",
    label: "Placeholder / Handoff",
    trigger_label: "Manual placeholder only",
    trigger_detail: "Production automation is not implemented for this service yet.",
    scheduler_label: null,
  };
}

export function readLeadAutomationContext(lead = {}) {
  const parsed = parseJson(lead.automation_context_json, {});
  return typeof parsed === "object" && parsed ? parsed : {};
}

function buildLeadAutomationPatch(lead, context, extraPatch = {}) {
  return {
    ...extraPatch,
    automation_context_json: JSON.stringify(context),
    last_activity_at: extraPatch.last_activity_at || extraPatch.last_contacted_at || lead.last_activity_at || undefined,
  };
}

function getLeadRecipientPhone(lead) {
  return normalizePhone(lead?.phone || lead?.phone_number);
}

function getLeadRecipientEmail(lead) {
  return cleanString(lead?.email).toLowerCase();
}

function getServiceAccessState(order, serviceState) {
  const subscriptionStatus = cleanString(order.subscription_status).toLowerCase();
  const serviceAccessStatus = cleanString(serviceState.service_access_status).toLowerCase() || "active";

  if (cleanString(order.payment_status).toLowerCase() !== "paid") {
    return {
      ready: false,
      code: "payment_not_confirmed",
      reason: "Stripe payment is not confirmed for this order.",
    };
  }

  if (subscriptionStatus !== "active") {
    return {
      ready: false,
      code: "subscription_not_active",
      reason: `Subscription must be active before ${serviceState.display_name || serviceState.service_key} can run.`,
    };
  }

  if (serviceAccessStatus !== "active") {
    return {
      ready: false,
      code: "service_access_inactive",
      reason: `${serviceState.display_name || serviceState.service_key} is not active in the current subscription plan.`,
    };
  }

  if (serviceState.install_status !== "Live") {
    return {
      ready: false,
      code: "service_not_live",
      reason: `${serviceState.display_name || serviceState.service_key} must be Live before production automation can run.`,
    };
  }

  return {
    ready: true,
  };
}

export function evaluateProductionServiceReadiness({
  order,
  serviceKey,
  recipientPhone = "",
  recipientEmail = "",
  requirePhone = false,
  requireEmail = false,
}) {
  const { snapshot, serviceState, sharedConfig, serviceConfig } = getRuntimeContextForService({
    order,
    serviceKey,
  });
  const validation = validateServiceConfiguration({
    orderLike: {
      ...order,
      items: snapshot.normalizedItems,
      install_configuration: snapshot.installConfiguration,
    },
    serviceKey,
  });
  const access = getServiceAccessState(order, serviceState);

  if (!access.ready) {
    return {
      ready: false,
      code: access.code,
      reason: access.reason,
      validation,
      snapshot,
      serviceState,
      sharedConfig,
      serviceConfig,
    };
  }

  if (!validation.valid) {
    return {
      ready: false,
      code: "missing_runtime_configuration",
      reason: `Required configuration is incomplete: ${validation.missing_labels.join(", ")}`,
      validation,
      snapshot,
      serviceState,
      sharedConfig,
      serviceConfig,
    };
  }

  const normalizedRecipientPhone = normalizePhone(recipientPhone);
  const normalizedRecipientEmail = cleanString(recipientEmail).toLowerCase();

  if (requirePhone && !normalizedRecipientPhone) {
    return {
      ready: false,
      code: "missing_recipient_phone",
      reason: "Recipient phone number is required.",
      validation,
      snapshot,
      serviceState,
      sharedConfig,
      serviceConfig,
    };
  }

  if (requireEmail && !normalizedRecipientEmail) {
    return {
      ready: false,
      code: "missing_recipient_email",
      reason: "Recipient email is required.",
      validation,
      snapshot,
      serviceState,
      sharedConfig,
      serviceConfig,
    };
  }

  return {
    ready: true,
    validation,
    snapshot,
    serviceState,
    sharedConfig,
    serviceConfig,
    recipientPhone: normalizedRecipientPhone,
    recipientEmail: normalizedRecipientEmail,
  };
}

export async function assertProductionServiceReady({
  base44,
  order,
  serviceKey,
  runtimeType,
  triggerSource,
  recipientPhone = "",
  recipientEmail = "",
  lead = null,
  requirePhone = false,
  requireEmail = false,
  now = new Date().toISOString(),
  extraMetadata = {},
}) {
  const evaluation = evaluateProductionServiceReadiness({
    order,
    serviceKey,
    recipientPhone,
    recipientEmail,
    requirePhone,
    requireEmail,
  });

  if (evaluation.ready) {
    return evaluation;
  }

  const blockedEvent = await createOrderScopedEvent(base44, {
    order,
    leadId: lead?.id || "",
    serviceKey,
    eventType: "runtime_attempt_blocked",
    runtimeType,
    triggerSource,
    status: "failed",
    subject: `${evaluation.serviceState.display_name || serviceKey} runtime blocked`,
    messageBody: evaluation.reason,
    recipientPhone,
    recipientEmail,
    lead,
    metadata: {
      code: evaluation.code,
      validation: evaluation.validation,
      ...extraMetadata,
    },
  });

  await touchOrder(base44, order.id, now);

  throw new RuntimeExecutionError(evaluation.reason, {
    status: 409,
    code: evaluation.code,
    details: {
      order_id: order.id,
      service_key: serviceKey,
      validation: evaluation.validation,
      blocked_event_id: blockedEvent.id,
    },
  });
}

async function findLatestSuccessEvent(base44, { orderId, leadId, serviceKey, matcher = () => true }) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      order_id: orderId,
      service_key: serviceKey,
      event_type: "provider_send_succeeded",
    },
    "-created_date",
    100
  ).catch(() => []);

  return (events || []).find((event) => {
    if (leadId && event.lead_id !== leadId) {
      return false;
    }
    return matcher(parseJson(event.metadata_json, {}), event);
  }) || null;
}

function buildLeadVariables(order, lead, sharedConfig, extra = {}) {
  return {
    first_name: getFirstName(lead.full_name || order.customer_name),
    lead_name: cleanString(lead.full_name) || getFirstName(order.customer_name),
    customer_name: cleanString(order.customer_name),
    business_name: cleanString(order.business_name),
    business_phone: cleanString(sharedConfig.twilio_business_phone),
    twilio_business_phone: cleanString(sharedConfig.twilio_business_phone),
    business_hours: cleanString(sharedConfig.business_hours),
    opt_out_message: cleanString(sharedConfig.opt_out_message),
    lead_email: getLeadRecipientEmail(lead),
    lead_phone: getLeadRecipientPhone(lead),
    customer_email: cleanString(order.customer_email),
    customer_phone: cleanString(order.customer_phone),
    ...extra,
  };
}

function getNurtureContext(lead) {
  const root = readLeadAutomationContext(lead);
  const nurture = root.nurture_sequence_14d || {};

  return {
    root,
    nurture,
  };
}

function stepKeyForIndex(step, index) {
  return `nurture_step_${index + 1}_day_${step.day}_${step.channel}`;
}

export async function enrollLeadInNurtureSequence({
  base44,
  order,
  lead,
  now = new Date().toISOString(),
}) {
  const evaluation = evaluateProductionServiceReadiness({
    order,
    serviceKey: "nurture_sequence_14d",
  });

  if (!evaluation.ready) {
    return {
      enrolled: false,
      reason: evaluation.reason,
      code: evaluation.code,
    };
  }

  const steps = Array.isArray(evaluation.serviceConfig.steps)
    ? [...evaluation.serviceConfig.steps].sort((left, right) => Number(left.day || 0) - Number(right.day || 0))
    : [];
  const firstStep = steps[0];
  if (!firstStep) {
    return {
      enrolled: false,
      reason: "No nurture steps configured.",
      code: "missing_nurture_steps",
    };
  }

  const { root, nurture } = getNurtureContext(lead);
  if (nurture.active && nurture.order_id === order.id) {
    return {
      enrolled: true,
      already_enrolled: true,
      due_at: nurture.next_step_due_at || null,
    };
  }

  const dueAt = addDays(now, firstStep.day || 0);
  const nextContext = {
    ...root,
    order_id: order.id,
    nurture_sequence_14d: {
      order_id: order.id,
      active: true,
      enrolled_at: now,
      next_step_index: 0,
      next_step_due_at: dueAt,
      completed_at: null,
      stopped_at: null,
      stop_reason: "",
      last_step_key: "",
      last_step_sent_at: "",
    },
  };

  await base44.asServiceRole.entities.Leads.update(lead.id, buildLeadAutomationPatch(lead, nextContext, {
    next_follow_up_at: dueAt,
    last_activity_at: now,
  }));

  return {
    enrolled: true,
    due_at: dueAt,
    step_index: 0,
  };
}

export async function executeProductionInstantLeadResponse({
  base44,
  order,
  lead,
  runtimeType = "customer_lead_capture_runtime",
  triggerSource = "customer_lead_capture_webhook",
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
}) {
  const leadPhone = getLeadRecipientPhone(lead);
  const evaluation = await assertProductionServiceReady({
    base44,
    order,
    serviceKey: "instant_lead_response",
    runtimeType,
    triggerSource,
    recipientPhone: leadPhone,
    lead,
    requirePhone: true,
    now,
    extraMetadata: {
      automation_key: "instant_initial_response",
    },
  });

  const duplicate = await findLatestSuccessEvent(base44, {
    orderId: order.id,
    leadId: lead.id,
    serviceKey: "instant_lead_response",
    matcher: (metadata) => metadata.automation_key === "instant_initial_response",
  });

  if (duplicate) {
    const blockedEvent = await createOrderScopedEvent(base44, {
      order,
      leadId: lead.id,
      serviceKey: "instant_lead_response",
      eventType: "runtime_attempt_blocked",
      runtimeType,
      triggerSource,
      status: "failed",
      subject: "Instant lead response duplicate prevented",
      messageBody: "An initial response was already sent for this lead.",
      recipientPhone: leadPhone,
      lead,
      metadata: {
        code: "duplicate_prevented",
        automation_key: "instant_initial_response",
        duplicate_event_id: duplicate.id,
      },
    });
    await touchOrder(base44, order.id, now);
    throw new RuntimeExecutionError("Initial response already sent for this lead.", {
      status: 409,
      code: "duplicate_prevented",
      details: {
        order_id: order.id,
        service_key: "instant_lead_response",
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const variables = buildLeadVariables(order, lead, evaluation.sharedConfig);
  const messageBody = interpolateTemplate(
    evaluation.serviceConfig.sms_template,
    variables
  );

  const createdEvents = [];
  createdEvents.push(await createOrderScopedEvent(base44, {
    order,
    leadId: lead.id,
    serviceKey: "instant_lead_response",
    eventType: "runtime_attempt_started",
    runtimeType,
    triggerSource,
    subject: "Instant lead response started",
    messageBody: "Production instant lead response started.",
    recipientPhone: leadPhone,
    lead,
    metadata: {
      automation_key: "instant_initial_response",
    },
  }));
  createdEvents.push(await createOrderScopedEvent(base44, {
    order,
    leadId: lead.id,
    serviceKey: "instant_lead_response",
    eventType: "provider_send_attempted",
    runtimeType,
    triggerSource,
    channel: "sms",
    direction: "outbound",
    provider: "twilio",
    status: "pending",
    subject: "Instant lead response send attempted",
    messageBody,
    recipientPhone: leadPhone,
    lead,
    metadata: {
      automation_key: "instant_initial_response",
    },
  }));

  try {
    const sendResult = await sendSms({
      to: leadPhone,
      from: evaluation.sharedConfig.twilio_business_phone,
      body: messageBody,
      serviceKey: "instant_lead_response",
      orderId: order.id,
      runtimeType,
    });

    const successEvent = await createOrderScopedEvent(base44, {
      order,
      leadId: lead.id,
      serviceKey: "instant_lead_response",
      eventType: "provider_send_succeeded",
      runtimeType,
      triggerSource,
      channel: "sms",
      direction: "outbound",
      provider: "twilio",
      status: sendResult.provider_status || "sent",
      subject: "Instant lead response sent",
      messageBody,
      providerMessageId: sendResult.provider_message_id,
      recipientPhone: leadPhone,
      lead,
      metadata: {
        automation_key: "instant_initial_response",
      },
    });
    createdEvents.push(successEvent);

    const currentContext = readLeadAutomationContext(lead);
    const updatedLead = await base44.asServiceRole.entities.Leads.update(lead.id, buildLeadAutomationPatch(lead, {
      ...currentContext,
      order_id: order.id,
      instant_lead_response: {
        order_id: order.id,
        sent_at: now,
        provider_message_id: sendResult.provider_message_id,
      },
    }, {
      status: lead.status === "New" ? "Contacted" : lead.status,
      last_contacted_at: now,
      last_activity_at: now,
    }));

    const nurtureEnrollment = await enrollLeadInNurtureSequence({
      base44,
      order,
      lead: updatedLead,
      now,
    });

    await touchOrder(base44, order.id, now);

    return {
      success: true,
      order_id: order.id,
      lead_id: lead.id,
      service_key: "instant_lead_response",
      runtime_type: runtimeType,
      recipient_phone: leadPhone,
      provider_message_id: sendResult.provider_message_id,
      provider_status: sendResult.provider_status || "sent",
      nurture_enrollment: nurtureEnrollment,
      created_event_ids: createdEvents.map((event) => event.id),
    };
  } catch (error) {
    const runtimeError = error instanceof RuntimeExecutionError
      ? error
      : new RuntimeExecutionError(error instanceof Error ? error.message : "Instant lead response failed", {
          status: 502,
          code: "provider_send_failed",
        });

    const failedEvent = await createOrderScopedEvent(base44, {
      order,
      leadId: lead.id,
      serviceKey: "instant_lead_response",
      eventType: "provider_send_failed",
      runtimeType,
      triggerSource,
      channel: "sms",
      direction: "outbound",
      provider: "twilio",
      status: "failed",
      subject: "Instant lead response failed",
      messageBody,
      errorMessage: runtimeError.message,
      recipientPhone: leadPhone,
      lead,
      metadata: {
        automation_key: "instant_initial_response",
      },
    });
    await touchOrder(base44, order.id, now);

    throw new RuntimeExecutionError(runtimeError.message, {
      status: runtimeError.status || 502,
      code: runtimeError.code || "provider_send_failed",
      details: {
        ...(runtimeError.details || {}),
        failed_event_id: failedEvent.id,
      },
    });
  }
}

export async function processDueNurtureSequenceSteps({
  base44,
  orderId = "",
  limit = 100,
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
  sendEmail = sendEmailMessage,
}) {
  const leads = await base44.asServiceRole.entities.Leads.list("-created_date", 1000);
  const dueLeads = (leads || []).filter((lead) => {
    const { nurture } = getNurtureContext(lead);
    if (!nurture?.active || (orderId && nurture.order_id !== orderId)) {
      return false;
    }

    const dueAt = new Date(nurture.next_step_due_at || 0).getTime();
    return Number.isFinite(dueAt) && dueAt > 0 && dueAt <= new Date(now).getTime();
  }).slice(0, limit);

  const results = [];
  const orderCache = new Map();

  for (const lead of dueLeads) {
    const { root, nurture } = getNurtureContext(lead);
    const cachedOrder = orderCache.get(nurture.order_id);
    const order = cachedOrder || await base44.asServiceRole.entities.Order.get(nurture.order_id).catch(() => null);
    if (order && !cachedOrder) {
      orderCache.set(nurture.order_id, order);
    }

    if (!order) {
      const nextContext = {
        ...root,
        nurture_sequence_14d: {
          ...nurture,
          active: false,
          stopped_at: now,
          stop_reason: "missing_order",
        },
      };
      await base44.asServiceRole.entities.Leads.update(lead.id, buildLeadAutomationPatch(lead, nextContext, {
        next_follow_up_at: null,
      }));
      results.push({ lead_id: lead.id, blocked: true, reason: "missing_order" });
      continue;
    }

    const evaluation = await assertProductionServiceReady({
      base44,
      order,
      serviceKey: "nurture_sequence_14d",
      runtimeType: "process_due_nurture_step",
      triggerSource: "nurture_due_step_runner",
      recipientPhone: getLeadRecipientPhone(lead),
      recipientEmail: getLeadRecipientEmail(lead),
      lead,
      requirePhone: false,
      requireEmail: false,
      now,
      extraMetadata: {
        step_index: nurture.next_step_index,
      },
    }).catch(async (error) => {
      const nextContext = {
        ...root,
        nurture_sequence_14d: {
          ...nurture,
          active: false,
          stopped_at: now,
          stop_reason: error.code || "runtime_blocked",
        },
      };
      await base44.asServiceRole.entities.Leads.update(lead.id, buildLeadAutomationPatch(lead, nextContext, {
        next_follow_up_at: null,
      }));
      results.push({ lead_id: lead.id, blocked: true, reason: error.code || "runtime_blocked" });
      return null;
    });

    if (!evaluation) {
      continue;
    }

    const steps = Array.isArray(evaluation.serviceConfig.steps)
      ? [...evaluation.serviceConfig.steps].sort((left, right) => Number(left.day || 0) - Number(right.day || 0))
      : [];
    const stepIndex = Number(nurture.next_step_index || 0);
    const step = steps[stepIndex];

    if (!step) {
      const completedContext = {
        ...root,
        nurture_sequence_14d: {
          ...nurture,
          active: false,
          completed_at: now,
          stop_reason: "sequence_complete",
          next_step_due_at: null,
        },
      };
      await base44.asServiceRole.entities.Leads.update(lead.id, buildLeadAutomationPatch(lead, completedContext, {
        next_follow_up_at: null,
      }));
      results.push({ lead_id: lead.id, completed: true });
      continue;
    }

    const currentStepKey = stepKeyForIndex(step, stepIndex);
    const duplicate = await findLatestSuccessEvent(base44, {
      orderId: order.id,
      leadId: lead.id,
      serviceKey: "nurture_sequence_14d",
      matcher: (metadata) => metadata.step_key === currentStepKey,
    });

    if (duplicate) {
      const nextStep = steps[stepIndex + 1] || null;
      const nextContext = {
        ...root,
        nurture_sequence_14d: {
          ...nurture,
          next_step_index: stepIndex + 1,
          next_step_due_at: nextStep ? addDays(nurture.enrolled_at || now, nextStep.day || 0) : null,
          last_step_key: currentStepKey,
          last_step_sent_at: duplicate.created_date,
          active: Boolean(nextStep),
          completed_at: nextStep ? null : now,
          stop_reason: nextStep ? "" : "sequence_complete",
        },
      };
      await base44.asServiceRole.entities.Leads.update(lead.id, buildLeadAutomationPatch(lead, nextContext, {
        next_follow_up_at: nextContext.nurture_sequence_14d.next_step_due_at || null,
      }));
      await createOrderScopedEvent(base44, {
        order,
        leadId: lead.id,
        serviceKey: "nurture_sequence_14d",
        eventType: "runtime_attempt_blocked",
        runtimeType: "process_due_nurture_step",
        triggerSource: "nurture_due_step_runner",
        status: "failed",
        subject: "Nurture duplicate prevented",
        messageBody: `Duplicate prevention skipped ${currentStepKey}.`,
        recipientPhone: getLeadRecipientPhone(lead),
        recipientEmail: getLeadRecipientEmail(lead),
        lead,
        metadata: {
          code: "duplicate_prevented",
          step_key: currentStepKey,
          duplicate_event_id: duplicate.id,
        },
      });
      results.push({ lead_id: lead.id, skipped: true, reason: "duplicate_prevented", step_key: currentStepKey });
      continue;
    }

    const variables = buildLeadVariables(order, lead, evaluation.sharedConfig, {
      day: step.day,
      channel: step.channel,
    });
    const messageBody = interpolateTemplate(step.message_template, variables);
    const recipientPhone = getLeadRecipientPhone(lead);
    const recipientEmail = getLeadRecipientEmail(lead);

    await createOrderScopedEvent(base44, {
      order,
      leadId: lead.id,
      serviceKey: "nurture_sequence_14d",
      eventType: "runtime_attempt_started",
      runtimeType: "process_due_nurture_step",
      triggerSource: "nurture_due_step_runner",
      subject: `Nurture step ${stepIndex + 1} started`,
      messageBody: `Processing due nurture step ${stepIndex + 1}.`,
      recipientPhone,
      recipientEmail,
      lead,
      metadata: {
        step_key: currentStepKey,
        step_index: stepIndex,
        step_day: step.day,
        step_channel: step.channel,
      },
    });

    await createOrderScopedEvent(base44, {
      order,
      leadId: lead.id,
      serviceKey: "nurture_sequence_14d",
      eventType: "provider_send_attempted",
      runtimeType: "process_due_nurture_step",
      triggerSource: "nurture_due_step_runner",
      channel: step.channel,
      direction: "outbound",
      provider: step.channel === "sms" ? "twilio" : "resend",
      status: "pending",
      subject: `Nurture step ${stepIndex + 1} send attempted`,
      messageBody,
      recipientPhone,
      recipientEmail,
      lead,
      metadata: {
        step_key: currentStepKey,
        step_index: stepIndex,
        step_day: step.day,
        step_channel: step.channel,
      },
    });

    try {
      let sendResult;
      if (step.channel === "sms") {
        if (!recipientPhone) {
          throw new RuntimeExecutionError("Recipient phone number is required.", {
            status: 409,
            code: "missing_recipient_phone",
          });
        }
        sendResult = await sendSms({
          to: recipientPhone,
          from: evaluation.sharedConfig.twilio_business_phone,
          body: messageBody,
          serviceKey: "nurture_sequence_14d",
          orderId: order.id,
          runtimeType: "process_due_nurture_step",
        });
      } else {
        if (!recipientEmail) {
          throw new RuntimeExecutionError("Recipient email is required.", {
            status: 409,
            code: "missing_recipient_email",
          });
        }
        sendResult = await sendEmail({
          base44,
          to: recipientEmail,
          subject: `${order.business_name} follow-up`,
          body: messageBody,
        });
      }

      const nextStep = steps[stepIndex + 1] || null;
      const nextContext = {
        ...root,
        nurture_sequence_14d: {
          ...nurture,
          next_step_index: stepIndex + 1,
          next_step_due_at: nextStep ? addDays(nurture.enrolled_at || now, nextStep.day || 0) : null,
          last_step_key: currentStepKey,
          last_step_sent_at: now,
          active: Boolean(nextStep),
          completed_at: nextStep ? null : now,
          stop_reason: nextStep ? "" : "sequence_complete",
        },
      };
      await base44.asServiceRole.entities.Leads.update(lead.id, buildLeadAutomationPatch(lead, nextContext, {
        status: lead.status === "New" ? "Contacted" : lead.status,
        last_contacted_at: now,
        next_follow_up_at: nextContext.nurture_sequence_14d.next_step_due_at || null,
        last_activity_at: now,
      }));

      await createOrderScopedEvent(base44, {
        order,
        leadId: lead.id,
        serviceKey: "nurture_sequence_14d",
        eventType: "provider_send_succeeded",
        runtimeType: "process_due_nurture_step",
        triggerSource: "nurture_due_step_runner",
        channel: step.channel,
        direction: "outbound",
        provider: step.channel === "sms" ? "twilio" : "resend",
        status: sendResult.provider_status || (step.channel === "sms" ? "sent" : "processed"),
        subject: `Nurture step ${stepIndex + 1} sent`,
        messageBody,
        providerMessageId: sendResult.provider_message_id,
        recipientPhone,
        recipientEmail,
        lead,
        metadata: {
          step_key: currentStepKey,
          step_index: stepIndex,
          step_day: step.day,
          step_channel: step.channel,
        },
      });

      await touchOrder(base44, order.id, now);
      results.push({ lead_id: lead.id, sent: true, step_key: currentStepKey, channel: step.channel });
    } catch (error) {
      const runtimeError = error instanceof RuntimeExecutionError
        ? error
        : new RuntimeExecutionError(error instanceof Error ? error.message : "Nurture step failed", {
            status: 502,
            code: "provider_send_failed",
          });
      await createOrderScopedEvent(base44, {
        order,
        leadId: lead.id,
        serviceKey: "nurture_sequence_14d",
        eventType: "provider_send_failed",
        runtimeType: "process_due_nurture_step",
        triggerSource: "nurture_due_step_runner",
        channel: step.channel,
        direction: "outbound",
        provider: step.channel === "sms" ? "twilio" : "resend",
        status: "failed",
        subject: `Nurture step ${stepIndex + 1} failed`,
        messageBody,
        errorMessage: runtimeError.message,
        recipientPhone,
        recipientEmail,
        lead,
        metadata: {
          step_key: currentStepKey,
          step_index: stepIndex,
          step_day: step.day,
          step_channel: step.channel,
        },
      });
      await touchOrder(base44, order.id, now);
      results.push({ lead_id: lead.id, failed: true, step_key: currentStepKey, error: runtimeError.message });
    }
  }

  return {
    success: true,
    processed: results.length,
    results,
  };
}

export async function executeLeadReactivationBatch({
  base44,
  order,
  approved = false,
  approvedBy = "",
  runtimeType = "run_reactivation_batch",
  triggerSource = "admin_manual_batch",
  now = new Date().toISOString(),
  cooldownDays = LEAD_REACTIVATION_COOLDOWN_DAYS,
  sendSms = sendTwilioSms,
}) {
  if (!approved) {
    throw new RuntimeExecutionError("Admin approval is required before sending a reactivation batch.", {
      status: 400,
      code: "approval_required",
    });
  }

  const evaluation = await assertProductionServiceReady({
    base44,
    order,
    serviceKey: "lead_reactivation",
    runtimeType,
    triggerSource,
    now,
    extraMetadata: {
      approved_by: approvedBy || null,
    },
  });

  const maxBatchSize = Number(evaluation.serviceConfig.max_batch_size || 25);
  const selectedLeads = await listLeadReactivationTargets({
    base44,
    order,
    targetSegment: evaluation.serviceConfig.target_segment,
    maxBatchSize,
    now,
  });

  const createdEventIds = [];
  const results = [];
  const messageTemplate = evaluation.serviceConfig.message_template;

  for (const lead of selectedLeads) {
    const leadPhone = getLeadRecipientPhone(lead);
    const duplicate = await findLatestSuccessEvent(base44, {
      orderId: order.id,
      leadId: lead.id,
      serviceKey: "lead_reactivation",
      matcher: (metadata, event) =>
        metadata.batch_mode === "manual_approved" &&
        isRecentEnough(event.created_date, cooldownDays * 24),
    });

    if (duplicate) {
      const blockedEvent = await createOrderScopedEvent(base44, {
        order,
        leadId: lead.id,
        serviceKey: "lead_reactivation",
        eventType: "runtime_attempt_blocked",
        runtimeType,
        triggerSource,
        status: "failed",
        subject: "Lead reactivation cooldown prevented duplicate send",
        messageBody: "A recent approved reactivation message was already sent to this lead.",
        recipientPhone: leadPhone,
        lead,
        metadata: {
          code: "cooldown_active",
          duplicate_event_id: duplicate.id,
          batch_mode: "manual_approved",
        },
      });
      createdEventIds.push(blockedEvent.id);
      results.push({ lead_id: lead.id, skipped: true, reason: "cooldown_active" });
      continue;
    }

    if (!leadPhone) {
      const blockedEvent = await createOrderScopedEvent(base44, {
        order,
        leadId: lead.id,
        serviceKey: "lead_reactivation",
        eventType: "runtime_attempt_blocked",
        runtimeType,
        triggerSource,
        status: "failed",
        subject: "Lead reactivation blocked",
        messageBody: "Lead is missing a phone number.",
        lead,
        metadata: {
          code: "missing_recipient_phone",
          batch_mode: "manual_approved",
        },
      });
      createdEventIds.push(blockedEvent.id);
      results.push({ lead_id: lead.id, skipped: true, reason: "missing_recipient_phone" });
      continue;
    }

    const messageBody = interpolateTemplate(messageTemplate, buildLeadVariables(order, lead, evaluation.sharedConfig, {
      target_segment: evaluation.serviceConfig.target_segment,
    }));

    createdEventIds.push((await createOrderScopedEvent(base44, {
      order,
      leadId: lead.id,
      serviceKey: "lead_reactivation",
      eventType: "runtime_attempt_started",
      runtimeType,
      triggerSource,
      subject: "Lead reactivation runtime started",
      messageBody: "Approved reactivation batch is processing this lead.",
      recipientPhone: leadPhone,
      lead,
      metadata: {
        batch_mode: "manual_approved",
        approved_by: approvedBy || null,
      },
    })).id);
    createdEventIds.push((await createOrderScopedEvent(base44, {
      order,
      leadId: lead.id,
      serviceKey: "lead_reactivation",
      eventType: "provider_send_attempted",
      runtimeType,
      triggerSource,
      channel: "sms",
      direction: "outbound",
      provider: "twilio",
      status: "pending",
      subject: "Lead reactivation send attempted",
      messageBody,
      recipientPhone: leadPhone,
      lead,
      metadata: {
        batch_mode: "manual_approved",
        approved_by: approvedBy || null,
      },
    })).id);

    try {
      const sendResult = await sendSms({
        to: leadPhone,
        from: evaluation.sharedConfig.twilio_business_phone,
        body: messageBody,
        serviceKey: "lead_reactivation",
        orderId: order.id,
        runtimeType,
      });

      createdEventIds.push((await createOrderScopedEvent(base44, {
        order,
        leadId: lead.id,
        serviceKey: "lead_reactivation",
        eventType: "provider_send_succeeded",
        runtimeType,
        triggerSource,
        channel: "sms",
        direction: "outbound",
        provider: "twilio",
        status: sendResult.provider_status || "sent",
        subject: "Lead reactivation sent",
        messageBody,
        providerMessageId: sendResult.provider_message_id,
        recipientPhone: leadPhone,
        lead,
        metadata: {
          batch_mode: "manual_approved",
          approved_by: approvedBy || null,
        },
      })).id);

      await base44.asServiceRole.entities.Leads.update(lead.id, {
        status: lead.status === "New" ? "Contacted" : lead.status,
        last_contacted_at: now,
        next_follow_up_at: addDays(now, 3),
        last_activity_at: now,
      });

      results.push({ lead_id: lead.id, sent: true, provider_message_id: sendResult.provider_message_id });
    } catch (error) {
      const runtimeError = error instanceof RuntimeExecutionError
        ? error
        : new RuntimeExecutionError(error instanceof Error ? error.message : "Lead reactivation send failed", {
            status: 502,
            code: "provider_send_failed",
          });
      createdEventIds.push((await createOrderScopedEvent(base44, {
        order,
        leadId: lead.id,
        serviceKey: "lead_reactivation",
        eventType: "provider_send_failed",
        runtimeType,
        triggerSource,
        channel: "sms",
        direction: "outbound",
        provider: "twilio",
        status: "failed",
        subject: "Lead reactivation failed",
        messageBody,
        errorMessage: runtimeError.message,
        recipientPhone: leadPhone,
        lead,
        metadata: {
          batch_mode: "manual_approved",
          approved_by: approvedBy || null,
        },
      })).id);
      results.push({ lead_id: lead.id, failed: true, error: runtimeError.message });
    }
  }

  const summaryEvent = await createOrderScopedEvent(base44, {
    order,
    serviceKey: "lead_reactivation",
    eventType: "lead_reactivation_batch_completed",
    runtimeType,
    triggerSource,
    subject: "Lead reactivation batch completed",
    messageBody: `Approved reactivation batch processed ${selectedLeads.length} eligible lead(s).`,
    metadata: {
      approved_by: approvedBy || null,
      batch_mode: "manual_approved",
      selected_lead_count: selectedLeads.length,
      sent_count: results.filter((item) => item.sent).length,
      skipped_count: results.filter((item) => item.skipped).length,
      failed_count: results.filter((item) => item.failed).length,
      target_segment: evaluation.serviceConfig.target_segment,
      max_batch_size: maxBatchSize,
    },
  });
  createdEventIds.push(summaryEvent.id);

  await touchOrder(base44, order.id, now);

  return {
    success: true,
    order_id: order.id,
    service_key: "lead_reactivation",
    selected_lead_count: selectedLeads.length,
    sent_count: results.filter((item) => item.sent).length,
    skipped_count: results.filter((item) => item.skipped).length,
    failed_count: results.filter((item) => item.failed).length,
    results,
    summary_event_id: summaryEvent.id,
    created_event_ids: createdEventIds,
  };
}

export async function executeManualReviewRequest({
  base44,
  order,
  recipientPhone = "",
  recipientEmail = "",
  customerName = "",
  runtimeType = "manual_review_request",
  triggerSource = "admin_manual_trigger",
  now = new Date().toISOString(),
  sendSms = sendTwilioSms,
  sendEmail = sendEmailMessage,
}) {
  const provisionalContext = getRuntimeContextForService({
    order,
    serviceKey: "review_request",
  });
  const channel = cleanString(provisionalContext.serviceConfig.channel);
  const requirePhone = channel === "sms";
  const requireEmail = channel === "email";

  const evaluation = await assertProductionServiceReady({
    base44,
    order,
    serviceKey: "review_request",
    runtimeType,
    triggerSource,
    recipientPhone,
    recipientEmail,
    requirePhone,
    requireEmail,
    now,
    extraMetadata: {
      trigger_event: "manual_trigger",
    },
  });

  const resolvedPhone = evaluation.recipientPhone || normalizePhone(recipientPhone);
  const resolvedEmail = evaluation.recipientEmail || cleanString(recipientEmail).toLowerCase();
  const customerKey = channel === "sms" ? resolvedPhone : resolvedEmail;
  const duplicate = await findLatestSuccessEvent(base44, {
    orderId: order.id,
    serviceKey: "review_request",
    matcher: (metadata, event) =>
      metadata.customer_key === customerKey &&
      isRecentEnough(event.created_date, REVIEW_REQUEST_COOLDOWN_HOURS),
  });

  if (duplicate) {
    const blockedEvent = await createOrderScopedEvent(base44, {
      order,
      serviceKey: "review_request",
      eventType: "runtime_attempt_blocked",
      runtimeType,
      triggerSource,
      status: "failed",
      subject: "Review request duplicate prevented",
      messageBody: "A recent review request already went to this recipient.",
      recipientPhone: resolvedPhone,
      recipientEmail: resolvedEmail,
      metadata: {
        code: "duplicate_prevented",
        customer_key: customerKey,
        duplicate_event_id: duplicate.id,
      },
    });
    await touchOrder(base44, order.id, now);
    throw new RuntimeExecutionError("A recent review request already went to this recipient.", {
      status: 409,
      code: "duplicate_prevented",
      details: {
        blocked_event_id: blockedEvent.id,
      },
    });
  }

  const messageBody = interpolateTemplate(
    evaluation.serviceConfig.message_template,
    buildLeadVariables(order, { full_name: customerName, email: resolvedEmail, phone: resolvedPhone }, evaluation.sharedConfig, {
      review_link: cleanString(evaluation.serviceConfig.review_link),
      trigger_event: "manual_trigger",
    })
  );

  const createdEventIds = [];
  createdEventIds.push((await createOrderScopedEvent(base44, {
    order,
    serviceKey: "review_request",
    eventType: "runtime_attempt_started",
    runtimeType,
    triggerSource,
    subject: "Manual review request started",
    messageBody: "Manual review-request runtime started.",
    recipientPhone: resolvedPhone,
    recipientEmail: resolvedEmail,
    metadata: {
      trigger_event: "manual_trigger",
      customer_key: customerKey,
    },
  })).id);
  createdEventIds.push((await createOrderScopedEvent(base44, {
    order,
    serviceKey: "review_request",
    eventType: "provider_send_attempted",
    runtimeType,
    triggerSource,
    channel: channel === "email" ? "email" : "sms",
    direction: "outbound",
    provider: channel === "email" ? "resend" : "twilio",
    status: "pending",
    subject: "Manual review request send attempted",
    messageBody,
    recipientPhone: resolvedPhone,
    recipientEmail: resolvedEmail,
    metadata: {
      trigger_event: "manual_trigger",
      customer_key: customerKey,
    },
  })).id);

  try {
    const sendResult = channel === "email"
      ? await sendEmail({
          base44,
          to: resolvedEmail,
          subject: `${order.business_name} would value your feedback`,
          body: messageBody,
        })
      : await sendSms({
          to: resolvedPhone,
          from: evaluation.sharedConfig.twilio_business_phone,
          body: messageBody,
          serviceKey: "review_request",
          orderId: order.id,
          runtimeType,
        });

    createdEventIds.push((await createOrderScopedEvent(base44, {
      order,
      serviceKey: "review_request",
      eventType: "provider_send_succeeded",
      runtimeType,
      triggerSource,
      channel: channel === "email" ? "email" : "sms",
      direction: "outbound",
      provider: channel === "email" ? "resend" : "twilio",
      status: sendResult.provider_status || (channel === "email" ? "processed" : "sent"),
      subject: "Manual review request sent",
      messageBody,
      providerMessageId: sendResult.provider_message_id,
      recipientPhone: resolvedPhone,
      recipientEmail: resolvedEmail,
      metadata: {
        trigger_event: "manual_trigger",
        customer_key: customerKey,
      },
    })).id);

    await touchOrder(base44, order.id, now);

    return {
      success: true,
      order_id: order.id,
      service_key: "review_request",
      channel,
      provider_message_id: sendResult.provider_message_id,
      recipient_phone: resolvedPhone || null,
      recipient_email: resolvedEmail || null,
      created_event_ids: createdEventIds,
    };
  } catch (error) {
    const runtimeError = error instanceof RuntimeExecutionError
      ? error
      : new RuntimeExecutionError(error instanceof Error ? error.message : "Manual review request failed", {
          status: 502,
          code: "provider_send_failed",
        });
    createdEventIds.push((await createOrderScopedEvent(base44, {
      order,
      serviceKey: "review_request",
      eventType: "provider_send_failed",
      runtimeType,
      triggerSource,
      channel: channel === "email" ? "email" : "sms",
      direction: "outbound",
      provider: channel === "email" ? "resend" : "twilio",
      status: "failed",
      subject: "Manual review request failed",
      messageBody,
      errorMessage: runtimeError.message,
      recipientPhone: resolvedPhone,
      recipientEmail: resolvedEmail,
      metadata: {
        trigger_event: "manual_trigger",
        customer_key: customerKey,
      },
    })).id);
    await touchOrder(base44, order.id, now);

    throw new RuntimeExecutionError(runtimeError.message, {
      status: runtimeError.status || 502,
      code: runtimeError.code || "provider_send_failed",
      details: {
        created_event_ids: createdEventIds,
      },
    });
  }
}

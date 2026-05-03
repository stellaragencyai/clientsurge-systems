import { buildCommunicationEvent, buildInstallSnapshot, REVIEW_REQUEST_TRIGGER_EVENTS } from "./installPipeline.js";
import { executeLiveReviewRequestTrigger, RuntimeExecutionError } from "./installRuntime.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function createCommunicationEvent(base44, event) {
  return base44.asServiceRole.entities.CommunicationEvent.create(event);
}

function hasTrackedReviewRequest(order) {
  const snapshot = buildInstallSnapshot(order);
  return snapshot.normalizedItems.some(
    (item) => item?.service_key === "review_request" && item?.tracking_enabled !== false
  );
}

function getCompletionId(payload = {}) {
  return cleanString(
    payload.completion_id ||
    payload.trigger_id ||
    payload.source_event_id ||
    payload.appointment_id ||
    payload.order_event_id
  );
}

function buildTriggerContextId({ orderId, triggerEvent, completionId }) {
  return `${orderId}:review_completion:${triggerEvent}:${completionId}`;
}

function buildReviewCompletionReceiptEvent({
  order,
  triggerEvent,
  completionId,
  triggerSource,
  occurredAt,
  payload,
  now,
}) {
  return buildCommunicationEvent({
    order,
    created_date: now,
    channel: "webhook",
    direction: "system",
    event_type: "status_update",
    provider: "internal",
    status: "processed",
    subject: "Review completion webhook accepted",
    message_body: `Accepted ${triggerEvent} review-completion trigger for ${order.business_name || order.id}.`,
    service_key: "review_request",
    context_type: "review_completion_trigger",
    context_id: buildTriggerContextId({
      orderId: order.id,
      triggerEvent,
      completionId,
    }),
    metadata: {
      trigger_event: triggerEvent,
      completion_id: completionId,
      trigger_source: triggerSource,
      occurred_at: occurredAt || now,
      source: cleanString(payload?.source) || null,
      appointment_id: cleanString(payload?.appointment_id) || null,
      source_event_id: cleanString(payload?.source_event_id) || null,
      order_event_id: cleanString(payload?.order_event_id) || null,
    },
  });
}

async function resolveReviewRequestOrder({ base44, orderId, clientProjectId }) {
  if (cleanString(orderId)) {
    return base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
  }

  if (!cleanString(clientProjectId)) {
    return null;
  }

  const matches = await base44.asServiceRole.entities.Order.filter({
    client_project_id: clientProjectId,
    payment_status: "paid",
  });

  return [...matches]
    .filter((order) => hasTrackedReviewRequest(order))
    .sort((left, right) => new Date(right.created_date || 0).getTime() - new Date(left.created_date || 0).getTime())[0] || null;
}

export class ReviewCompletionTriggerError extends Error {
  constructor(message, { status = 400, code = "review_completion_trigger_failed", details = {} } = {}) {
    super(message);
    this.name = "ReviewCompletionTriggerError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function processReviewCompletionTrigger({
  base44,
  payload = {},
  now = new Date().toISOString(),
  sendSms,
  sendEmail,
}) {
  const triggerEvent = cleanString(payload.trigger_event || payload.completion_type);
  if (!REVIEW_REQUEST_TRIGGER_EVENTS.includes(triggerEvent)) {
    throw new ReviewCompletionTriggerError("trigger_event must be appointment_completed or order_completed", {
      status: 400,
      code: "review_completion_trigger_event_invalid",
    });
  }

  const completionId = getCompletionId(payload);
  if (!completionId) {
    throw new ReviewCompletionTriggerError("completion_id, trigger_id, appointment_id, or source_event_id is required", {
      status: 400,
      code: "review_completion_trigger_id_required",
    });
  }

  const order = await resolveReviewRequestOrder({
    base44,
    orderId: cleanString(payload.order_id),
    clientProjectId: cleanString(payload.client_project_id),
  });

  if (!order) {
    throw new ReviewCompletionTriggerError("No paid order with Review Request Automation matched this completion trigger", {
      status: 404,
      code: "review_completion_order_not_found",
    });
  }

  if (order.payment_status !== "paid") {
    throw new ReviewCompletionTriggerError("Review completion triggers are only allowed for paid orders", {
      status: 409,
      code: "review_completion_order_not_paid",
    });
  }

  if (!hasTrackedReviewRequest(order)) {
    throw new ReviewCompletionTriggerError("Review Request Automation is not included on this paid order", {
      status: 409,
      code: "review_completion_review_request_not_purchased",
    });
  }

  const snapshot = buildInstallSnapshot(order);
  const reviewConfig = snapshot.installConfiguration?.services?.review_request || {};
  const configuredTriggerEvent = cleanString(reviewConfig.trigger_event);
  if (configuredTriggerEvent !== triggerEvent) {
    throw new ReviewCompletionTriggerError(
      `Configured review trigger is ${configuredTriggerEvent || "not set"}, but received ${triggerEvent}.`,
      {
        status: 409,
        code: "review_completion_trigger_event_mismatch",
        details: {
          configured_trigger_event: configuredTriggerEvent || null,
          received_trigger_event: triggerEvent,
        },
      }
    );
  }

  const contextId = buildTriggerContextId({
    orderId: order.id,
    triggerEvent,
    completionId,
  });
  const existingReceipts = await base44.asServiceRole.entities.CommunicationEvent.filter({
    order_id: order.id,
    context_type: "review_completion_trigger",
    context_id: contextId,
  });
  if (existingReceipts.length > 0) {
    return {
      success: true,
      duplicate_suppressed: true,
      order_id: order.id,
      completion_id: completionId,
      trigger_event: triggerEvent,
      receipt_event_id: existingReceipts[0].id,
    };
  }

  const occurredAt = cleanString(payload.occurred_at) || now;
  const triggerSource = cleanString(payload.trigger_source || payload.source || "automation_webhook");
  const receiptEvent = await createCommunicationEvent(
    base44,
    buildReviewCompletionReceiptEvent({
      order,
      triggerEvent,
      completionId,
      triggerSource,
      occurredAt,
      payload,
      now,
    })
  );

  const result = await executeLiveReviewRequestTrigger({
    base44,
    order,
    recipientPhone: cleanString(payload.target_phone || payload.customer_phone),
    recipientEmail: cleanString(payload.target_email || payload.customer_email),
    customerName: cleanString(payload.customer_name),
    triggerEvent,
    completionId,
    occurredAt,
    triggerSource,
    leadId: cleanString(payload.lead_id) || null,
    runtimeType: `review_request_live_${triggerEvent}`,
    now,
    sendSms,
    sendEmail,
  });

  return {
    success: true,
    order_id: order.id,
    trigger_event: triggerEvent,
    completion_id: completionId,
    receipt_event_id: receiptEvent.id,
    runtime_result: result,
  };
}

export { RuntimeExecutionError };

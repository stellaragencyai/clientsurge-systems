import { buildCommunicationEvent, buildInstallSnapshot } from "./installPipeline.js";
import { executeOrderServiceRuntime, RuntimeExecutionError, sendEmailMessage } from "./installRuntime.js";
import { loadAdminSettings } from "./adminSettings.js";

export const PROVIDER_PROOF_MODE = {
  LIVE: "LIVE_PROVIDER_PROOF",
  TEST_WIRED: "TEST_WIRED",
  SIMULATION: "SIMULATION_OR_LOCAL_TEST",
};

export const PROVIDER_DEPLOYMENT_STATUS = {
  NOT_CONFIGURED: "not_configured",
  CONFIGURED: "configured",
  TEST_WIRED: "test_wired",
  LIVE_PROVIDER_PROOFED: "live_provider_proofed",
  FAILED: "failed",
  UNAVAILABLE: "unavailable",
};

export const PROVIDER_PROOF_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const LIVE_SMS_PROOF_TYPE = "live_sms_instant_lead_response";
const LIVE_EMAIL_PROOF_TYPE = "live_email";
const LEAD_INGESTION_WEBHOOK_PROOF_TYPE = "lead_ingestion_webhook";
const DEFAULT_EMAIL_SUBJECT = "ClientSurge provider proof email";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJson(value) {
  if (!value || typeof value !== "string") {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortByCreatedDate(events = []) {
  return [...events].sort((a, b) => toTimestamp(b.created_date) - toTimestamp(a.created_date));
}

function isRecent(value, now = new Date().toISOString(), windowMs = PROVIDER_PROOF_WINDOW_MS) {
  const timestamp = toTimestamp(value);
  const nowTimestamp = toTimestamp(now);
  if (!timestamp || !nowTimestamp) {
    return false;
  }
  return nowTimestamp - timestamp <= windowMs;
}

function getLatestMatchingEvent(events, predicate) {
  return sortByCreatedDate(events).find(predicate) || null;
}

function buildFunctionUrl(requestUrl, functionName) {
  const url = new URL(requestUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    segments[segments.length - 1] = functionName;
    url.pathname = `/${segments.join("/")}`;
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

function getEventMetadata(event) {
  return parseJson(event?.metadata_json);
}

function eventHasProofMode(event, mode) {
  const metadata = getEventMetadata(event);
  return metadata.proof_mode === mode;
}

function eventRuntimeType(event) {
  return cleanString(getEventMetadata(event)?.runtime_type);
}

function isTwilioOutboundEvent(event) {
  return (
    event?.provider === "twilio" &&
    ["provider_send_attempted", "provider_send_succeeded", "provider_send_failed"].includes(event?.event_type)
  );
}

function isEmailOutboundEvent(event) {
  return (
    ["resend", "gmail"].includes(event?.provider) &&
    ["provider_send_attempted", "provider_send_succeeded", "provider_send_failed", "email_sent", "email_failed"].includes(event?.event_type)
  );
}

function isLiveSmsProofEvent(event) {
  return (
    isTwilioOutboundEvent(event) &&
    (eventHasProofMode(event, PROVIDER_PROOF_MODE.LIVE) ||
      eventRuntimeType(event).startsWith("live_provider_proof"))
  );
}

function isSimulationSmsEvent(event) {
  const runtimeType = eventRuntimeType(event);
  return (
    isTwilioOutboundEvent(event) &&
    (eventHasProofMode(event, PROVIDER_PROOF_MODE.SIMULATION) ||
      ["test_lead", "simulate_missed_call", "run_nurture_sequence_test", "run_review_request_test"].includes(runtimeType))
  );
}

function isLiveEmailProofEvent(event) {
  return (
    isEmailOutboundEvent(event) &&
    eventHasProofMode(event, PROVIDER_PROOF_MODE.LIVE)
  );
}

function isProviderTestEvent(event, integrationId) {
  const metadata = getEventMetadata(event);
  return metadata.context_type === "provider_test" && metadata.integration_id === integrationId;
}

function isCallbackEvent(event, provider) {
  const metadata = getEventMetadata(event);
  return metadata.context_type === "provider_callback" && metadata.callback_provider === provider;
}

function isProofEvent(event, proofKind) {
  const metadata = getEventMetadata(event);
  return metadata.context_type === "provider_proof" && metadata.proof_kind === proofKind;
}

function humanizeStatus(status) {
  switch (status) {
    case PROVIDER_DEPLOYMENT_STATUS.NOT_CONFIGURED:
      return "Not Configured";
    case PROVIDER_DEPLOYMENT_STATUS.CONFIGURED:
      return "Configured";
    case PROVIDER_DEPLOYMENT_STATUS.TEST_WIRED:
      return "Test Wired";
    case PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED:
      return "Live Provider Proofed";
    case PROVIDER_DEPLOYMENT_STATUS.FAILED:
      return "Failed";
    default:
      return "Unavailable";
  }
}

function buildStatusSummary({
  configured,
  latestFailure,
  latestTest,
  latestLiveProof,
  now,
}) {
  if (!configured) {
    return {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.NOT_CONFIGURED,
      status_label: humanizeStatus(PROVIDER_DEPLOYMENT_STATUS.NOT_CONFIGURED),
      status_reason: "Configuration is incomplete or disabled.",
    };
  }

  if (latestFailure && (!latestLiveProof || toTimestamp(latestFailure.created_date) >= toTimestamp(latestLiveProof.created_date))) {
    return {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.FAILED,
      status_label: humanizeStatus(PROVIDER_DEPLOYMENT_STATUS.FAILED),
      status_reason: latestFailure.error_message || latestFailure.message_body || "Most recent provider proof attempt failed.",
    };
  }

  if (latestLiveProof && isRecent(latestLiveProof.created_date, now)) {
    return {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED,
      status_label: humanizeStatus(PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED),
      status_reason: "A recent real provider proof event was recorded for this path.",
    };
  }

  if (latestTest) {
    return {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.TEST_WIRED,
      status_label: humanizeStatus(PROVIDER_DEPLOYMENT_STATUS.TEST_WIRED),
      status_reason: latestTest.message_body || latestTest.error_message || "A non-live wiring or local test exists, but recent live provider proof does not.",
    };
  }

  return {
    derived_status: PROVIDER_DEPLOYMENT_STATUS.CONFIGURED,
    status_label: humanizeStatus(PROVIDER_DEPLOYMENT_STATUS.CONFIGURED),
    status_reason: "Configured, but no recent proof event has been recorded.",
  };
}

function toEventSummary(event) {
  if (!event) {
    return null;
  }

  return {
    id: event.id,
    created_date: event.created_date || null,
    event_type: event.event_type || null,
    status: event.status || null,
    provider: event.provider || null,
    subject: event.subject || null,
    message_body: event.message_body || null,
    error_message: event.error_message || null,
    service_key: event.service_key || null,
    provider_message_id: event.provider_message_id || null,
    metadata: getEventMetadata(event),
  };
}

function buildProofUrls(requestUrl) {
  return {
    webhook_lead_capture_url: requestUrl ? buildFunctionUrl(requestUrl, "webhookLeadCapture") : "",
    twilio_status_webhook_url: requestUrl ? buildFunctionUrl(requestUrl, "receiveTwilioStatusWebhook") : "",
    resend_webhook_url: requestUrl ? buildFunctionUrl(requestUrl, "receiveResendWebhook") : "",
  };
}

function buildLeadIngestionInstructions({ order, urls }) {
  return [
    `Point the client website form or CRM webhook to ${urls.webhook_lead_capture_url}.`,
    "Prefer the x-clientsurge-api-key header. If that is not possible, send order_id or client_project_id plus x-clientsurge-webhook-secret.",
    "Always send a unique x-idempotency-key so duplicate posts stay safe.",
    `These credentials belong only to paid order ${order.id}; do not send platform WebsiteLead traffic here.`,
  ];
}

function buildTwilioInstructions({ order, urls }) {
  const businessPhone = cleanString(buildInstallSnapshot(order).installConfiguration?.shared?.twilio_business_phone);
  return [
    `In Twilio, point the voice status callback / missed-call webhook for ${businessPhone || "the configured Twilio number"} to ${urls.twilio_status_webhook_url}.`,
    "A real missed call must produce a CommunicationEvent callback entry and then the canonical missed_call_text_back runtime trail.",
    "Delivery proof requires a Twilio status callback on the same provider_message_id that was returned from the live send event.",
  ];
}

function buildResendInstructions({ urls }) {
  return [
    `In Resend, point the webhook to ${urls.resend_webhook_url}.`,
    "Verify delivery/open/bounce by matching the Resend email_id to the outbound provider_message_id in CommunicationEvent.",
    "Local UI checks cannot prove Resend webhook delivery without an actual callback from Resend.",
  ];
}

function buildUnprovableNotes() {
  return [
    "A local simulation can prove runtime wiring, but it cannot prove external provider callback delivery.",
    "Missed-call live proof requires a real Twilio webhook request to the canonical receiveTwilioStatusWebhook endpoint.",
    "Resend callback proof requires an actual Resend webhook event, not just a successful outbound send.",
  ];
}

function getOrderLikeFromEvent(event) {
  return {
    id: event.order_id,
    client_id: event.client_id,
    client_project_id: event.client_project_id,
    onboarding_client_id: event.onboarding_client_id,
  };
}

async function createProofEvent({
  base44,
  order,
  provider = "internal",
  channel = "internal",
  status = "processed",
  subject,
  messageBody,
  proofKind,
  proofMode,
  now,
  metadata = {},
  providerMessageId,
  errorMessage,
  serviceKey,
  leadId = null,
}) {
  return base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order,
      lead_id: leadId,
      channel,
      direction: "system",
      event_type: "status_update",
      provider,
      status,
      subject,
      message_body: messageBody,
      provider_message_id: providerMessageId,
      error_message: errorMessage,
      service_key: serviceKey,
      context_type: "provider_proof",
      context_id: `${order.id}:${proofKind}:${now}`,
      metadata: {
        proof_kind: proofKind,
        proof_mode: proofMode,
        ...metadata,
      },
    })
  );
}

function buildProofPayload(order, now) {
  const safeToken = order.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "order";
  return {
    full_name: "Live Provider Proof Lead",
    business_name: order.business_name || "Client Business",
    email: `provider-proof+${safeToken}@example.com`,
    phone: order.customer_phone || "+16025550012",
    business_type: "Provider Proof",
    problem: "Canonical webhook lead proof",
    source: "provider_proof",
    intake_type: "provider_proof",
    idempotency_key: `provider-proof-${safeToken}-${new Date(now).getTime()}`,
    metadata: {
      provider_proof: true,
      order_id: order.id,
    },
  };
}

async function loadPaidLinkedOrder(base44, orderId) {
  if (!cleanString(orderId)) {
    throw new ProviderProofError("order_id is required", {
      status: 400,
      code: "provider_proof_order_id_required",
    });
  }

  let order = null;
  try {
    order = await base44.asServiceRole.entities.Order.get(orderId);
  } catch (_) {
    order = null;
  }

  if (!order) {
    throw new ProviderProofError("Order not found", {
      status: 404,
      code: "provider_proof_order_not_found",
    });
  }

  if (order.payment_status !== "paid") {
    throw new ProviderProofError("Provider proof is only available for paid orders", {
      status: 409,
      code: "provider_proof_order_not_paid",
    });
  }

  if (!cleanString(order.client_project_id)) {
    throw new ProviderProofError("Paid order must be linked to a ClientProject before provider proof can run", {
      status: 409,
      code: "provider_proof_client_project_required",
    });
  }

  return order;
}

function buildMissingProofItems({ webhook, twilio, resend }) {
  const missing = [];

  if (webhook.derived_status !== PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED) {
    missing.push("Lead ingestion webhook has not been live-proven with issued credentials.");
  }
  if (twilio.derived_status !== PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED) {
    missing.push("Twilio outbound SMS has not been live-proven for this order.");
  }
  if (!twilio.last_delivery_callback) {
    missing.push("Twilio delivery callback has not yet been observed for this order.");
  }
  if (!twilio.last_missed_call_live_webhook) {
    missing.push("Twilio missed-call webhook has not yet been observed on the canonical runtime path.");
  }
  if (resend.configured && resend.derived_status !== PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED) {
    missing.push("Resend/Gmail outbound email has not been live-proven for this order.");
  }
  if (resend.configured && !resend.last_callback) {
    missing.push("Resend delivery/open/bounce callback has not yet been observed for this order.");
  }

  return missing;
}

export class ProviderProofError extends Error {
  constructor(message, { status = 400, code = "provider_proof_failed", details = {} } = {}) {
    super(message);
    this.name = "ProviderProofError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function deriveOrderProviderProof({
  order,
  orderEvents = [],
  providerReadiness = {},
  requestUrl = "",
  now = new Date().toISOString(),
}) {
  const events = sortByCreatedDate(orderEvents.filter((event) => event.order_id === order.id));
  const urls = buildProofUrls(requestUrl);

  const latestLeadIngestionProof = getLatestMatchingEvent(events, (event) => isProofEvent(event, LEAD_INGESTION_WEBHOOK_PROOF_TYPE));
  const latestLeadIngestionTest = getLatestMatchingEvent(
    events,
    (event) =>
      event.context_type === "lead_ingestion_admin" ||
      getEventMetadata(event).action === "tested" ||
      cleanString(event.subject).toLowerCase().includes("lead ingestion admin test")
  );
  const leadWebhookConfigured =
    Boolean(cleanString(order.lead_ingestion_api_key)) &&
    Boolean(cleanString(order.lead_ingestion_webhook_secret)) &&
    !cleanString(order.lead_ingestion_credentials_revoked_at);
  const webhookStatus = buildStatusSummary({
    configured: leadWebhookConfigured,
    latestFailure: latestLeadIngestionProof?.status === "failed" ? latestLeadIngestionProof : null,
    latestTest: latestLeadIngestionTest,
    latestLiveProof: latestLeadIngestionProof?.status !== "failed" ? latestLeadIngestionProof : null,
    now,
  });

  const latestTwilioSendAttempt = getLatestMatchingEvent(events, isTwilioOutboundEvent);
  const latestTwilioLiveProof = getLatestMatchingEvent(
    events,
    (event) => isLiveSmsProofEvent(event) && event.event_type === "provider_send_succeeded"
  );
  const latestTwilioFailure = getLatestMatchingEvent(
    events,
    (event) =>
      (isLiveSmsProofEvent(event) || isTwilioOutboundEvent(event)) &&
      (event.event_type === "provider_send_failed" || event.status === "failed")
  );
  const latestTwilioSimulation = getLatestMatchingEvent(events, isSimulationSmsEvent);
  const latestTwilioCallback = getLatestMatchingEvent(events, (event) => isCallbackEvent(event, "twilio"));
  const latestMissedCallLiveWebhook = getLatestMatchingEvent(events, (event) => {
    const metadata = getEventMetadata(event);
    return isCallbackEvent(event, "twilio") && metadata.proof_kind === "twilio_missed_call_webhook";
  });
  const latestMissedCallSimulation = getLatestMatchingEvent(
    events,
    (event) => event.service_key === "missed_call_text_back" && eventRuntimeType(event) === "simulate_missed_call"
  );
  const twilioConfigured = Boolean(providerReadiness?.twilio?.configured) && Boolean(providerReadiness?.twilio?.order_business_phone_present);
  const twilioStatus = buildStatusSummary({
    configured: twilioConfigured,
    latestFailure: latestTwilioFailure,
    latestTest: latestTwilioSimulation || latestTwilioSendAttempt,
    latestLiveProof: latestTwilioLiveProof,
    now,
  });

  const latestEmailSendAttempt = getLatestMatchingEvent(events, isEmailOutboundEvent);
  const latestEmailLiveProof = getLatestMatchingEvent(
    events,
    (event) => isLiveEmailProofEvent(event) && event.event_type === "provider_send_succeeded"
  );
  const latestEmailFailure = getLatestMatchingEvent(
    events,
    (event) =>
      (isLiveEmailProofEvent(event) || isEmailOutboundEvent(event)) &&
      (event.event_type === "provider_send_failed" || event.status === "failed")
  );
  const latestEmailCallback = getLatestMatchingEvent(events, (event) => isCallbackEvent(event, "resend"));
  const latestEmailDelivered = getLatestMatchingEvent(
    events,
    (event) => isCallbackEvent(event, "resend") && event.status === "delivered"
  );
  const latestEmailOpened = getLatestMatchingEvent(
    events,
    (event) => isCallbackEvent(event, "resend") && event.status === "opened"
  );
  const latestEmailBounced = getLatestMatchingEvent(
    events,
    (event) => isCallbackEvent(event, "resend") && event.status === "failed"
  );
  const latestEmailTestWired = getLatestMatchingEvent(events, (event) => isProviderTestEvent(event, "email"));
  const resendConfigured = Boolean(providerReadiness?.resend?.configured);
  const resendStatus = buildStatusSummary({
    configured: resendConfigured,
    latestFailure: latestEmailFailure,
    latestTest: latestEmailTestWired || latestEmailSendAttempt,
    latestLiveProof: latestEmailLiveProof,
    now,
  });

  const webhook = {
    ...webhookStatus,
    configured: leadWebhookConfigured,
    url: urls.webhook_lead_capture_url,
    credentials_active: leadWebhookConfigured,
    credentials_last_used_at: order.lead_ingestion_last_used_at || null,
    last_live_proof: toEventSummary(latestLeadIngestionProof),
    last_test: toEventSummary(latestLeadIngestionTest || latestLeadIngestionProof),
    last_ingestion_event: toEventSummary(
      getLatestMatchingEvent(events, (event) => event.context_type === "customer_lead_ingestion")
    ),
  };

  const twilio = {
    ...twilioStatus,
    configured: twilioConfigured,
    callback_url: urls.twilio_status_webhook_url,
    order_business_phone: providerReadiness?.twilio?.order_business_phone || "",
    last_real_provider_send_attempt: toEventSummary(latestTwilioSendAttempt),
    last_live_sms_proof: toEventSummary(latestTwilioLiveProof),
    last_delivery_callback: toEventSummary(latestTwilioCallback),
    last_missed_call_live_webhook: toEventSummary(latestMissedCallLiveWebhook),
    last_missed_call_simulation: toEventSummary(latestMissedCallSimulation),
  };

  const resend = {
    ...resendStatus,
    configured: resendConfigured,
    callback_url: urls.resend_webhook_url,
    last_real_provider_send_attempt: toEventSummary(latestEmailSendAttempt),
    last_live_email_proof: toEventSummary(latestEmailLiveProof),
    last_callback: toEventSummary(latestEmailCallback),
    last_delivered_callback: toEventSummary(latestEmailDelivered),
    last_opened_callback: toEventSummary(latestEmailOpened),
    last_bounced_callback: toEventSummary(latestEmailBounced),
  };

  return {
    webhook,
    twilio,
    resend,
    instructions: {
      webhook_lead_capture: buildLeadIngestionInstructions({ order, urls }),
      twilio_missed_call: buildTwilioInstructions({ order, urls }),
      resend_webhook: buildResendInstructions({ urls }),
      cannot_be_proven_locally: buildUnprovableNotes(),
    },
    missing_live_proof_items: buildMissingProofItems({
      webhook,
      twilio,
      resend,
    }),
  };
}

export async function runOrderProviderProof({
  base44,
  actor = null,
  orderId,
  proofType,
  payload = {},
  requestUrl,
  now = new Date().toISOString(),
  fetchImpl = fetch,
  sendEmail = sendEmailMessage,
  sendSms,
}) {
  const order = await loadPaidLinkedOrder(base44, orderId);
  const { settings } = await loadAdminSettings(base44);

  if (proofType === LEAD_INGESTION_WEBHOOK_PROOF_TYPE) {
    if (!cleanString(order.lead_ingestion_api_key) || !cleanString(order.lead_ingestion_webhook_secret)) {
      throw new ProviderProofError("Issue active lead ingestion credentials before running webhook proof", {
        status: 409,
        code: "provider_proof_lead_credentials_required",
      });
    }

    const webhookUrl = buildFunctionUrl(requestUrl, "webhookLeadCapture");
    const proofPayload = buildProofPayload(order, now);
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-clientsurge-api-key": order.lead_ingestion_api_key,
        "x-idempotency-key": proofPayload.idempotency_key,
      },
      body: JSON.stringify(proofPayload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      await createProofEvent({
        base44,
        order,
        provider: "internal",
        channel: "webhook",
        status: "failed",
        subject: "Lead ingestion webhook proof failed",
        messageBody: "Canonical webhookLeadCapture proof request failed.",
        proofKind: LEAD_INGESTION_WEBHOOK_PROOF_TYPE,
        proofMode: PROVIDER_PROOF_MODE.LIVE,
        now,
        errorMessage: cleanString(data?.error) || `HTTP ${response.status}`,
        metadata: {
          actor_email: actor?.email || null,
          webhook_url: webhookUrl,
          http_status: response.status,
          response: data,
        },
      });

      throw new ProviderProofError(cleanString(data?.error) || "Lead ingestion webhook proof failed", {
        status: response.status || 502,
        code: data?.code || "provider_proof_webhook_failed",
        details: data?.details || {},
      });
    }

    const proofEvent = await createProofEvent({
      base44,
      order,
      provider: "internal",
      channel: "webhook",
      status: "processed",
      subject: "Lead ingestion webhook proof succeeded",
      messageBody: "Canonical webhookLeadCapture accepted the order-scoped proof request.",
      proofKind: LEAD_INGESTION_WEBHOOK_PROOF_TYPE,
      proofMode: PROVIDER_PROOF_MODE.LIVE,
      now,
      metadata: {
        actor_email: actor?.email || null,
        webhook_url: webhookUrl,
        lead_id: data?.lead_id || null,
        idempotency_key: proofPayload.idempotency_key,
      },
      leadId: data?.lead_id || null,
    });

    return {
      proof_type: proofType,
      mode: PROVIDER_PROOF_MODE.LIVE,
      proof_event_id: proofEvent.id,
      result: data,
    };
  }

  if (proofType === LIVE_SMS_PROOF_TYPE) {
    const targetPhone = cleanString(payload.target_phone || order.customer_phone);
    if (!targetPhone) {
      throw new ProviderProofError("A target phone is required for live SMS proof", {
        status: 409,
        code: "provider_proof_target_phone_required",
      });
    }

    const result = await executeOrderServiceRuntime({
      base44,
      order,
      serviceKey: "instant_lead_response",
      runtimeType: "live_provider_proof_instant_lead_response",
      recipientPhone: targetPhone,
      runtimeData: {
        lead_name: cleanString(payload.lead_name) || "Live Provider Proof Lead",
        lead_phone: targetPhone,
        proof_mode: PROVIDER_PROOF_MODE.LIVE,
      },
      businessIsOpen: true,
      consentGranted: true,
      now,
      ...(sendSms ? { sendSms } : {}),
    });

    await createProofEvent({
      base44,
      order,
      provider: "twilio",
      channel: "sms",
      status: "processed",
      subject: "Twilio live SMS proof succeeded",
      messageBody: `A real order-scoped SMS proof was sent to ${targetPhone}.`,
      proofKind: LIVE_SMS_PROOF_TYPE,
      proofMode: PROVIDER_PROOF_MODE.LIVE,
      now,
      providerMessageId: result.provider_message_id,
      serviceKey: "instant_lead_response",
      metadata: {
        actor_email: actor?.email || null,
        target_phone: targetPhone,
        runtime_type: result.runtime_type,
      },
    });

    return {
      proof_type: proofType,
      mode: PROVIDER_PROOF_MODE.LIVE,
      result,
    };
  }

  if (proofType === LIVE_EMAIL_PROOF_TYPE) {
    const emailConfigured = Boolean(
      (settings?.resend_enabled && settings?.resend_from_email) ||
      (settings?.gmail_enabled && settings?.gmail_from_email)
    );
    if (!emailConfigured) {
      throw new ProviderProofError("Resend or Gmail must be configured before running live email proof", {
        status: 409,
        code: "provider_proof_email_not_configured",
      });
    }

    const targetEmail = cleanString(payload.target_email || order.customer_email);
    if (!targetEmail) {
      throw new ProviderProofError("A target email is required for live email proof", {
        status: 409,
        code: "provider_proof_target_email_required",
      });
    }

    const provider = settings?.resend_enabled && settings?.resend_from_email ? "resend" : "gmail";
    const proofContextId = `${order.id}:${LIVE_EMAIL_PROOF_TYPE}:${now}`;
    const attemptedEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
      buildCommunicationEvent({
        order,
        channel: "email",
        direction: "outbound",
        event_type: "provider_send_attempted",
        provider,
        status: "pending",
        subject: "Email live provider proof attempted",
        message_body: `Attempting a real provider proof email to ${targetEmail}.`,
        context_type: "provider_proof",
        context_id: proofContextId,
        metadata: {
          proof_kind: LIVE_EMAIL_PROOF_TYPE,
          proof_mode: PROVIDER_PROOF_MODE.LIVE,
          actor_email: actor?.email || null,
          recipient_email: targetEmail,
        },
      })
    );

    try {
      const sendResult = await sendEmail({
        base44,
        to: targetEmail,
        subject: payload.subject || DEFAULT_EMAIL_SUBJECT,
        body:
          payload.body ||
          `This is a live provider proof email for paid order ${order.id} (${order.business_name}).`,
      });

      const successEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
        buildCommunicationEvent({
          order,
          channel: "email",
          direction: "outbound",
          event_type: "provider_send_succeeded",
          provider,
          status: sendResult.provider_status || "processed",
          subject: "Email live provider proof succeeded",
          message_body: `A real provider proof email was sent to ${targetEmail}.`,
          provider_message_id: sendResult.provider_message_id,
          context_type: "provider_proof",
          context_id: proofContextId,
          metadata: {
            proof_kind: LIVE_EMAIL_PROOF_TYPE,
            proof_mode: PROVIDER_PROOF_MODE.LIVE,
            actor_email: actor?.email || null,
            recipient_email: targetEmail,
          },
        })
      );

      return {
        proof_type: proofType,
        mode: PROVIDER_PROOF_MODE.LIVE,
        result: {
          provider: provider,
          target_email: targetEmail,
          provider_message_id: sendResult.provider_message_id,
          provider_status: sendResult.provider_status,
          attempted_event_id: attemptedEvent.id,
          success_event_id: successEvent.id,
        },
      };
    } catch (error) {
      const runtimeError = error instanceof RuntimeExecutionError
        ? error
        : new ProviderProofError(error instanceof Error ? error.message : "Live email proof failed", {
            status: 502,
            code: "provider_proof_email_send_failed",
          });

      const failedEvent = await base44.asServiceRole.entities.CommunicationEvent.create(
        buildCommunicationEvent({
          order,
          channel: "email",
          direction: "outbound",
          event_type: "provider_send_failed",
          provider,
          status: "failed",
          subject: "Email live provider proof failed",
          message_body: `Email provider proof failed for ${targetEmail}.`,
          error_message: runtimeError.message,
          context_type: "provider_proof",
          context_id: proofContextId,
          metadata: {
            proof_kind: LIVE_EMAIL_PROOF_TYPE,
            proof_mode: PROVIDER_PROOF_MODE.LIVE,
            actor_email: actor?.email || null,
            recipient_email: targetEmail,
          },
        })
      );

      throw new ProviderProofError(runtimeError.message, {
        status: runtimeError.status || 502,
        code: runtimeError.code || "provider_proof_email_send_failed",
        details: {
          failed_event_id: failedEvent.id,
          attempted_event_id: attemptedEvent.id,
        },
      });
    }
  }

  throw new ProviderProofError("Unsupported provider proof type", {
    status: 400,
    code: "provider_proof_type_invalid",
    details: { proof_type: proofType },
  });
}

export function buildProviderProofWorkspaceData({
  order,
  orderEvents = [],
  providerReadiness = {},
  requestUrl = "",
  now = new Date().toISOString(),
}) {
  return deriveOrderProviderProof({
    order,
    orderEvents,
    providerReadiness,
    requestUrl,
    now,
  });
}

export function buildProviderCallbackEvent({
  sourceEvent,
  status,
  provider,
  callbackType,
  subject,
  messageBody,
  now = new Date().toISOString(),
  metadata = {},
}) {
  return buildCommunicationEvent({
    order: getOrderLikeFromEvent(sourceEvent),
    lead_id: sourceEvent.lead_id || null,
    channel: sourceEvent.channel || "internal",
    direction: "system",
    event_type: "status_update",
    provider,
    status,
    subject,
    message_body: messageBody,
    provider_message_id: sourceEvent.provider_message_id || null,
    service_key: sourceEvent.service_key || null,
    context_type: "provider_callback",
    context_id: `${sourceEvent.order_id || "unknown"}:${provider}:${callbackType}:${sourceEvent.provider_message_id || now}`,
    metadata: {
      callback_provider: provider,
      callback_type: callbackType,
      proof_mode: PROVIDER_PROOF_MODE.LIVE,
      original_event_id: sourceEvent.id,
      ...metadata,
    },
  });
}

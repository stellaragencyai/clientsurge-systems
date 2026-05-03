import { buildCommunicationEvent, buildInstallSnapshot } from "./installPipeline.js";
import { executeOrderServiceRuntime, RuntimeExecutionError } from "./installRuntime.js";
import { enrollLeadInDripCampaign } from "./dripCampaign.js";

const LEAD_RESPONSE_COOLDOWN_MS = 15 * 60 * 1000;
const DEDUPE_COOLDOWN_MS = 15 * 60 * 1000;
const IDENTITY_HEADER_ORDER_ID = "x-clientsurge-order-id";
const IDENTITY_HEADER_PROJECT_ID = "x-clientsurge-project-id";
const IDENTITY_HEADER_API_KEY = "x-clientsurge-api-key";
const IDENTITY_HEADER_WEBHOOK_SECRET = "x-clientsurge-webhook-secret";
const IDEMPOTENCY_HEADER = "x-idempotency-key";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function lowerString(value) {
  return cleanString(value).toLowerCase();
}

function normalizePhone(value) {
  const raw = cleanString(value);
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return raw.startsWith("+") ? raw : `+${digits}`;
}

function headerGetter(headersLike) {
  if (!headersLike) {
    return () => "";
  }
  if (typeof headersLike.get === "function") {
    return (name) => headersLike.get(name) || headersLike.get(name.toLowerCase()) || "";
  }
  return (name) => headersLike[name] || headersLike[name.toLowerCase()] || "";
}

function parseAuthorizationApiKey(headersLike) {
  const getHeader = headerGetter(headersLike);
  const authorization = cleanString(getHeader("authorization"));
  if (!authorization) {
    return "";
  }
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  return bearerMatch ? cleanString(bearerMatch[1]) : "";
}

function normalizePayload(payload = {}, headersLike = null) {
  const getHeader = headerGetter(headersLike);
  const fullName =
    cleanString(payload.full_name) ||
    cleanString(payload.name) ||
    [cleanString(payload.first_name), cleanString(payload.last_name)].filter(Boolean).join(" ").trim();
  const source = cleanString(payload.source || payload.source_system || payload.origin || "api_webhook") || "api_webhook";
  const intakeType = cleanString(payload.intake_type || payload.channel || payload.capture_type || "client_webhook") || "client_webhook";
  const businessType = cleanString(payload.business_type || payload.industry || payload.vertical || "Unknown") || "Unknown";
  const normalizedEmail = lowerString(payload.email);
  const normalizedPhone = normalizePhone(payload.phone || payload.mobile || payload.lead_phone || payload.contact_phone);
  const problem =
    cleanString(payload.problem) ||
    cleanString(payload.message) ||
    cleanString(payload.notes) ||
    cleanString(payload.inquiry) ||
    `Lead captured via ${source}`;

  return {
    order_id: cleanString(payload.order_id || getHeader(IDENTITY_HEADER_ORDER_ID)),
    client_project_id: cleanString(payload.client_project_id || payload.project_id || getHeader(IDENTITY_HEADER_PROJECT_ID)),
    api_key: cleanString(payload.api_key || getHeader(IDENTITY_HEADER_API_KEY) || parseAuthorizationApiKey(headersLike)),
    webhook_secret: cleanString(payload.webhook_secret || getHeader(IDENTITY_HEADER_WEBHOOK_SECRET)),
    idempotency_key: cleanString(payload.idempotency_key || getHeader(IDEMPOTENCY_HEADER)),
    external_lead_id: cleanString(payload.external_lead_id || payload.source_record_id || payload.external_id),
    full_name: fullName,
    business_name: cleanString(payload.business_name || payload.company || payload.account_name),
    email: normalizedEmail,
    phone: normalizedPhone,
    business_type: businessType,
    problem,
    source,
    intake_type: intakeType,
    website: cleanString(payload.website || payload.website_url),
    consent_granted: payload.consent_granted !== false,
    business_is_open: payload.business_is_open !== false,
    metadata: payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
      ? payload.metadata
      : {},
  };
}

function assertValidPayload(normalizedPayload) {
  if (!normalizedPayload.api_key && !normalizedPayload.order_id && !normalizedPayload.client_project_id) {
    throw new CustomerLeadIngestionError("Client identity is required", {
      status: 400,
      code: "customer_lead_identity_required",
    });
  }

  if (!normalizedPayload.api_key && !normalizedPayload.webhook_secret) {
    throw new CustomerLeadIngestionError("webhook_secret is required when using order_id or client_project_id", {
      status: 401,
      code: "customer_lead_webhook_secret_required",
    });
  }

  if (!normalizedPayload.full_name) {
    throw new CustomerLeadIngestionError("full_name is required", {
      status: 400,
      code: "customer_lead_full_name_required",
    });
  }

  if (!normalizedPayload.business_name) {
    throw new CustomerLeadIngestionError("business_name is required", {
      status: 400,
      code: "customer_lead_business_name_required",
    });
  }

  if (!normalizedPayload.email && !normalizedPayload.phone) {
    throw new CustomerLeadIngestionError("At least one contact method is required", {
      status: 400,
      code: "customer_lead_contact_required",
    });
  }
}

function buildLeadRecordPayload({ normalizedPayload, order, now }) {
  const normalizedBusinessName = lowerString(normalizedPayload.business_name);
  const dedupeKey = normalizedPayload.email
    ? `order:${order.id}:email:${normalizedPayload.email}`
    : normalizedPayload.phone
      ? `order:${order.id}:phone:${normalizedPayload.phone.replace(/\D/g, "")}`
      : `order:${order.id}:name:${normalizedBusinessName}`;

  return {
    full_name: normalizedPayload.full_name,
    business_name: normalizedPayload.business_name,
    email: normalizedPayload.email,
    phone: normalizedPayload.phone,
    order_id: order.id,
    client_id: order.client_id || "",
    client_project_id: order.client_project_id || "",
    onboarding_client_id: order.onboarding_client_id || "",
    business_type: normalizedPayload.business_type,
    problem: normalizedPayload.problem,
    source: normalizedPayload.source,
    intake_type: normalizedPayload.intake_type,
    status: "New",
    website: normalizedPayload.website,
    normalized_email: normalizedPayload.email,
    normalized_phone: normalizedPayload.phone.replace(/\D/g, ""),
    normalized_business_name: normalizedBusinessName,
    dedupe_key: dedupeKey,
    import_source: normalizedPayload.source,
    last_activity_at: now,
    automation_context_json: JSON.stringify({
      source: normalizedPayload.source,
      intake_type: normalizedPayload.intake_type,
      external_lead_id: normalizedPayload.external_lead_id || null,
      idempotency_key: normalizedPayload.idempotency_key || null,
      captured_at: now,
      metadata: normalizedPayload.metadata,
    }),
  };
}

function isRecent(isoDate, now, thresholdMs) {
  if (!isoDate) {
    return false;
  }
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  return new Date(now).getTime() - timestamp < thresholdMs;
}

function leadMatchesIdentity(lead, normalizedPayload, orderId) {
  if (lead.order_id !== orderId) {
    return false;
  }
  if (normalizedPayload.email && lowerString(lead.normalized_email || lead.email) === normalizedPayload.email) {
    return true;
  }
  if (normalizedPayload.phone) {
    const candidatePhone = cleanString(lead.normalized_phone || lead.phone).replace(/\D/g, "");
    return candidatePhone === normalizedPayload.phone.replace(/\D/g, "");
  }
  return false;
}

function buildSafeExistingLeadPatch(existingLead, normalizedPayload, now) {
  const patch = {
    last_activity_at: now,
  };

  if (!cleanString(existingLead.business_type) && normalizedPayload.business_type) {
    patch.business_type = normalizedPayload.business_type;
  }
  if (!cleanString(existingLead.problem) && normalizedPayload.problem) {
    patch.problem = normalizedPayload.problem;
  }
  if (!cleanString(existingLead.website) && normalizedPayload.website) {
    patch.website = normalizedPayload.website;
  }
  if (!cleanString(existingLead.source) && normalizedPayload.source) {
    patch.source = normalizedPayload.source;
  }
  if (!cleanString(existingLead.intake_type) && normalizedPayload.intake_type) {
    patch.intake_type = normalizedPayload.intake_type;
  }
  if (!cleanString(existingLead.email) && normalizedPayload.email) {
    patch.email = normalizedPayload.email;
    patch.normalized_email = normalizedPayload.email;
  }
  if (!cleanString(existingLead.phone) && normalizedPayload.phone) {
    patch.phone = normalizedPayload.phone;
    patch.normalized_phone = normalizedPayload.phone.replace(/\D/g, "");
  }

  return patch;
}

async function resolveClientProject(base44, clientProjectId) {
  try {
    return await base44.asServiceRole.entities.ClientProject.get(clientProjectId);
  } catch (_) {
    return null;
  }
}

async function resolveCustomerContext({ base44, normalizedPayload, now }) {
  const orders = await base44.asServiceRole.entities.Order.list("-created_date", 500);
  let matches = (orders || []).filter((order) => order.payment_status === "paid");

  if (normalizedPayload.api_key) {
    matches = matches.filter((order) => cleanString(order.lead_ingestion_api_key) === normalizedPayload.api_key);
  }
  if (normalizedPayload.order_id) {
    matches = matches.filter((order) => order.id === normalizedPayload.order_id);
  }
  if (normalizedPayload.client_project_id) {
    matches = matches.filter((order) => order.client_project_id === normalizedPayload.client_project_id);
  }

  if (matches.length === 0) {
    throw new CustomerLeadIngestionError("No paid customer order matched the provided identity", {
      status: 404,
      code: "customer_lead_order_not_found",
    });
  }

  if (matches.length > 1) {
    throw new CustomerLeadIngestionError("Lead ingestion identity matched multiple paid orders", {
      status: 409,
      code: "customer_lead_identity_ambiguous",
      details: {
        matched_order_ids: matches.map((order) => order.id),
      },
    });
  }

  const order = matches[0];
  const expectedSecret = cleanString(order.lead_ingestion_webhook_secret);
  if (!normalizedPayload.api_key) {
    if (!expectedSecret || normalizedPayload.webhook_secret !== expectedSecret) {
      throw new CustomerLeadIngestionError("Webhook secret did not match the configured paid customer order", {
        status: 403,
        code: "customer_lead_webhook_secret_invalid",
      });
    }
  } else if (
    normalizedPayload.webhook_secret &&
    expectedSecret &&
    normalizedPayload.webhook_secret !== expectedSecret
  ) {
    throw new CustomerLeadIngestionError("Webhook secret did not match the configured paid customer order", {
      status: 403,
      code: "customer_lead_webhook_secret_invalid",
    });
  }

  if (!order.client_project_id) {
    throw new CustomerLeadIngestionError("Paid customer order is missing client_project_id linkage", {
      status: 409,
      code: "customer_lead_client_project_missing",
      details: { order_id: order.id },
    });
  }

  const clientProject = await resolveClientProject(base44, order.client_project_id);
  if (!clientProject) {
    throw new CustomerLeadIngestionError("ClientProject not found for paid customer order", {
      status: 409,
      code: "customer_lead_client_project_not_found",
      details: { order_id: order.id, client_project_id: order.client_project_id },
    });
  }

  await base44.asServiceRole.entities.Order.update(order.id, {
    lead_ingestion_last_used_at: now,
  });

  return {
    order: {
      ...order,
      client_project_id: clientProject.id,
    },
    clientProject,
    snapshot: buildInstallSnapshot(order),
    identity_method: normalizedPayload.api_key
      ? "api_key"
      : normalizedPayload.order_id
        ? "order_id_plus_secret"
        : "client_project_id_plus_secret",
  };
}

async function findExistingLeadByIdempotency({ base44, orderId, idempotencyKey }) {
  if (!idempotencyKey) {
    return null;
  }

  const contextId = `${orderId}:${idempotencyKey}`;
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
    {
      order_id: orderId,
      context_type: "customer_lead_ingestion",
      context_id: contextId,
    },
    "-created_date",
    5
  );

  const event = (events || [])[0];
  if (!event?.lead_id) {
    return null;
  }

  const lead = await base44.asServiceRole.entities.Leads.get(event.lead_id).catch(() => null);
  if (!lead) {
    return null;
  }

  return {
    lead,
    event,
  };
}

async function listOrderLeads(base44, orderId) {
  const leads = await base44.asServiceRole.entities.Leads.filter({ order_id: orderId }, "-created_date", 500);
  return leads || [];
}

async function findExistingLeadByIdentity({ base44, normalizedPayload, orderId }) {
  const leads = await listOrderLeads(base44, orderId);
  return leads.find((lead) => leadMatchesIdentity(lead, normalizedPayload, orderId)) || null;
}

async function logIngestionEvent({
  base44,
  order,
  lead,
  normalizedPayload,
  identityMethod,
  now,
  action,
}) {
  const contextId = normalizedPayload.idempotency_key
    ? `${order.id}:${normalizedPayload.idempotency_key}`
    : `${order.id}:${lead.id}:${action}`;

  const eventType = action === "created" ? "lead_created" : "status_update";
  const subject = action === "created" ? "Customer lead ingested" : "Customer lead ingestion deduped";
  const messageBody =
    action === "created"
      ? `Customer lead captured for ${order.business_name}.`
      : `Inbound lead matched the existing canonical customer lead ${lead.id}.`;

  return base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order,
      lead_id: lead.id,
      channel: "webhook",
      direction: "inbound",
      event_type: eventType,
      provider: "internal",
      status: "processed",
      subject,
      message_body: messageBody,
      context_type: "customer_lead_ingestion",
      context_id: contextId,
      metadata: {
        action,
        identity_method: identityMethod,
        source: normalizedPayload.source,
        intake_type: normalizedPayload.intake_type,
        external_lead_id: normalizedPayload.external_lead_id || null,
        idempotency_key: normalizedPayload.idempotency_key || null,
        metadata: normalizedPayload.metadata,
        ingested_at: now,
      },
    })
  );
}

async function hadRecentInitialResponse({ base44, leadId, now }) {
  const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ lead_id: leadId }, "-created_date", 50);
  return (events || []).some((event) => {
    if (event.service_key !== "instant_lead_response") {
      return false;
    }
    if (!["provider_send_attempted", "provider_send_succeeded", "sms_sent"].includes(event.event_type)) {
      return false;
    }
    return isRecent(event.created_date, now, LEAD_RESPONSE_COOLDOWN_MS);
  });
}

function getLiveServiceState(snapshot, serviceKey) {
  return snapshot.serviceStates.find((service) => service.service_key === serviceKey) || null;
}

async function triggerLeadCreatedAutomations({
  base44,
  order,
  lead,
  normalizedPayload,
  snapshot,
  now,
  dependencies = {},
}) {
  const executeInstantResponse = dependencies.executeInstantResponse || executeOrderServiceRuntime;
  const enrollNurture = dependencies.enrollNurture || enrollLeadInDripCampaign;
  const automationResults = [];

  const instantResponseState = getLiveServiceState(snapshot, "instant_lead_response");
  if (instantResponseState?.install_status === "Live" && instantResponseState.configuration_complete) {
    if (!lead.phone) {
      automationResults.push({
        service_key: "instant_lead_response",
        status: "skipped",
        reason: "Lead phone number missing",
      });
    } else if (
      isRecent(lead.last_contacted_at, now, LEAD_RESPONSE_COOLDOWN_MS) ||
      await hadRecentInitialResponse({ base44, leadId: lead.id, now })
    ) {
      automationResults.push({
        service_key: "instant_lead_response",
        status: "skipped",
        reason: "Initial response cooldown active",
      });
    } else {
      try {
        const runtimeResult = await executeInstantResponse({
          base44,
          order,
          serviceKey: "instant_lead_response",
          runtimeType: "customer_lead_ingestion",
          recipientPhone: lead.phone,
          leadId: lead.id,
          runtimeData: {
            lead_id: lead.id,
            lead_name: lead.full_name,
            lead_phone: lead.phone,
            lead_email: lead.email,
            source: normalizedPayload.source,
            intake_type: normalizedPayload.intake_type,
            external_lead_id: normalizedPayload.external_lead_id || null,
          },
          businessIsOpen: normalizedPayload.business_is_open,
          consentGranted: normalizedPayload.consent_granted,
          now,
        });

        await base44.asServiceRole.entities.Leads.update(lead.id, {
          status: lead.status === "New" ? "Contacted" : lead.status,
          last_contacted_at: now,
          last_activity_at: now,
        });

        automationResults.push({
          service_key: "instant_lead_response",
          status: "triggered",
          runtime: runtimeResult,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Instant lead response failed";
        automationResults.push({
          service_key: "instant_lead_response",
          status: "failed",
          error: message,
          code: error instanceof RuntimeExecutionError ? error.code : "runtime_execution_failed",
        });
      }
    }
  } else {
    automationResults.push({
      service_key: "instant_lead_response",
      status: "skipped",
      reason: instantResponseState
        ? instantResponseState.install_status !== "Live"
          ? `Service install status is ${instantResponseState.install_status}`
          : "Configuration incomplete"
        : "Service not included on paid order",
    });
  }

  const nurtureState = getLiveServiceState(snapshot, "nurture_sequence_14d");
  if (nurtureState?.install_status === "Live" && nurtureState.configuration_complete) {
    const enrollmentResult = await enrollNurture({
      base44,
      lead,
      order,
      now,
      enrollmentSource: "webhookLeadCapture",
    });

    automationResults.push({
      service_key: "nurture_sequence_14d",
      status: enrollmentResult.skipped ? "skipped" : "triggered",
      reason: enrollmentResult.reason || null,
      campaign_id: enrollmentResult.campaign_id || null,
    });
  } else {
    automationResults.push({
      service_key: "nurture_sequence_14d",
      status: "skipped",
      reason: nurtureState
        ? nurtureState.install_status !== "Live"
          ? `Service install status is ${nurtureState.install_status}`
          : "Configuration incomplete"
        : "Service not included on paid order",
    });
  }

  const liveServices = snapshot.serviceStates
    .filter((serviceState) => serviceState.install_status === "Live")
    .map((serviceState) => ({
      service_key: serviceState.service_key,
      configuration_complete: serviceState.configuration_complete,
    }));
  const evaluatedServiceKeys = new Set(["instant_lead_response", "nurture_sequence_14d"]);
  const nonApplicableLiveServices = liveServices
    .filter((serviceState) => !evaluatedServiceKeys.has(serviceState.service_key))
    .map((serviceState) => serviceState.service_key);

  await base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order,
      lead_id: lead.id,
      channel: "internal",
      direction: "system",
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: "Customer lead automations evaluated",
      message_body: `Evaluated ${liveServices.length} live service(s) for customer lead ${lead.id}.`,
      context_type: "customer_lead_automation",
      context_id: `${lead.id}:lead_created`,
      metadata: {
        lead_id: lead.id,
        source: normalizedPayload.source,
        intake_type: normalizedPayload.intake_type,
        live_services: liveServices,
        non_applicable_live_services: nonApplicableLiveServices,
        automation_results: automationResults,
      },
    })
  );

  return automationResults;
}

function buildResponse({
  order,
  clientProject,
  lead,
  created,
  deduped,
  duplicateSuppressed,
  identityMethod,
  idempotentReplay = false,
  automationResults = [],
}) {
  return {
    success: true,
    lead_id: lead.id,
    created,
    deduped,
    duplicate_suppressed: duplicateSuppressed,
    idempotent_replay: idempotentReplay,
    order_id: order.id,
    client_project_id: clientProject.id,
    identity_method: identityMethod,
    automation_results: automationResults,
  };
}

export class CustomerLeadIngestionError extends Error {
  constructor(message, { status = 400, code = "customer_lead_ingestion_failed", details = {} } = {}) {
    super(message);
    this.name = "CustomerLeadIngestionError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function ingestCustomerLead({
  base44,
  payload = {},
  headers = null,
  now = new Date().toISOString(),
  dependencies = {},
}) {
  const normalizedPayload = normalizePayload(payload, headers);
  assertValidPayload(normalizedPayload);

  const context = await resolveCustomerContext({
    base44,
    normalizedPayload,
    now,
  });

  const idempotentReplay = await findExistingLeadByIdempotency({
    base44,
    orderId: context.order.id,
    idempotencyKey: normalizedPayload.idempotency_key,
  });
  if (idempotentReplay) {
    return buildResponse({
      order: context.order,
      clientProject: context.clientProject,
      lead: idempotentReplay.lead,
      created: false,
      deduped: true,
      duplicateSuppressed: true,
      identityMethod: context.identity_method,
      idempotentReplay: true,
      automationResults: [],
    });
  }

  const existingLead = await findExistingLeadByIdentity({
    base44,
    normalizedPayload,
    orderId: context.order.id,
  });

  let lead = existingLead;
  let created = false;
  let duplicateSuppressed = false;

  if (existingLead) {
    const patch = buildSafeExistingLeadPatch(existingLead, normalizedPayload, now);
    lead = await base44.asServiceRole.entities.Leads.update(existingLead.id, patch);
    duplicateSuppressed =
      isRecent(existingLead.created_date, now, DEDUPE_COOLDOWN_MS) ||
      isRecent(existingLead.last_activity_at, now, DEDUPE_COOLDOWN_MS);

    await logIngestionEvent({
      base44,
      order: context.order,
      lead,
      normalizedPayload,
      identityMethod: context.identity_method,
      now,
      action: "deduped",
    });
  } else {
    lead = await base44.asServiceRole.entities.Leads.create(
      buildLeadRecordPayload({
        normalizedPayload,
        order: context.order,
        now,
      })
    );
    created = true;

    await logIngestionEvent({
      base44,
      order: context.order,
      lead,
      normalizedPayload,
      identityMethod: context.identity_method,
      now,
      action: "created",
    });
  }

  let automationResults = [];
  if (duplicateSuppressed) {
    automationResults = [
      {
        service_key: "instant_lead_response",
        status: "skipped",
        reason: "Duplicate lead cooldown active",
      },
      {
        service_key: "nurture_sequence_14d",
        status: "skipped",
        reason: "Duplicate lead cooldown active",
      },
    ];

    await base44.asServiceRole.entities.CommunicationEvent.create(
      buildCommunicationEvent({
        order: context.order,
        lead_id: lead.id,
        channel: "internal",
        direction: "system",
        event_type: "workflow_triggered",
        provider: "internal",
        status: "processed",
        subject: "Customer lead automations skipped",
        message_body: `Customer lead ${lead.id} matched a recent canonical lead and skipped immediate automations.`,
        context_type: "customer_lead_automation",
        context_id: `${lead.id}:duplicate_cooldown`,
        metadata: {
          lead_id: lead.id,
          duplicate_suppressed: true,
          source: normalizedPayload.source,
          intake_type: normalizedPayload.intake_type,
          automation_results: automationResults,
        },
      })
    );
  } else {
    automationResults = await triggerLeadCreatedAutomations({
      base44,
      order: context.order,
      lead,
      normalizedPayload,
      snapshot: context.snapshot,
      now,
      dependencies,
    });
  }

  return buildResponse({
    order: context.order,
    clientProject: context.clientProject,
    lead,
    created,
    deduped: Boolean(existingLead),
    duplicateSuppressed,
    identityMethod: context.identity_method,
    automationResults,
  });
}

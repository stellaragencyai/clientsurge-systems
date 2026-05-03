import { buildCommunicationEvent, buildInstallSnapshot } from "./installPipeline.js";
import { ingestCustomerLead } from "./customerLeadIngestion.js";
import { executeOrderServiceRuntime } from "./installRuntime.js";

const ORDER_IDENTITY_HEADER = "x-clientsurge-order-id";
const PROJECT_IDENTITY_HEADER = "x-clientsurge-project-id";
const API_KEY_HEADER = "x-clientsurge-api-key";
const WEBHOOK_SECRET_HEADER = "x-clientsurge-webhook-secret";
const IDEMPOTENCY_HEADER = "x-idempotency-key";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function generateToken(prefix) {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${suffix}`;
}

function maskCredential(value) {
  const cleaned = cleanString(value);
  if (!cleaned) {
    return "";
  }
  if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}${"*".repeat(Math.max(0, cleaned.length - 4))}${cleaned.slice(-2)}`;
  }
  return `${cleaned.slice(0, 4)}${"*".repeat(Math.max(4, cleaned.length - 8))}${cleaned.slice(-4)}`;
}

function buildWebhookUrl(requestUrl) {
  const url = new URL(requestUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    segments[segments.length - 1] = "webhookLeadCapture";
    url.pathname = `/${segments.join("/")}`;
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

function buildAutomationReadiness(snapshot) {
  const watchedServices = [
    {
      service_key: "instant_lead_response",
      label: "Instant Lead Response",
      when_ready: "Fires immediately on lead_created when the paid order service is Live, configured, and the lead is outside cooldown.",
    },
    {
      service_key: "nurture_sequence_14d",
      label: "14-Day Nurture Sequence",
      when_ready: "Enrolls on lead_created when the paid order service is Live and configured.",
    },
  ];

  return watchedServices.map((service) => {
    const state = snapshot.serviceStates.find((entry) => entry.service_key === service.service_key) || null;
    const included = Boolean(state);
    const live = state?.install_status === "Live";
    const configurationComplete = Boolean(state?.configuration_complete);

    return {
      ...service,
      included,
      install_status: state?.install_status || "Not purchased",
      configuration_complete: configurationComplete,
      ready: included && live && configurationComplete,
      detail: included
        ? live
          ? configurationComplete
            ? service.when_ready
            : "Service is included but configuration is incomplete."
          : `Service is included but install_status is ${state?.install_status || "Unknown"}.`
        : "Service is not included on this paid order.",
    };
  });
}

function buildExamplePayload({ order, idempotencyKey = "evt_example_001" }) {
  return {
    full_name: "Alex Lead",
    business_name: order.business_name || "Client Business",
    email: "alex.lead@example.com",
    phone: "+16025550001",
    business_type: "Med Spa",
    problem: "Interested in pricing and availability",
    source: "external_crm",
    intake_type: "client_web_form",
    idempotency_key: idempotencyKey,
    metadata: {
      note: "Client-owned lead routed into canonical Leads",
    },
  };
}

function buildIdentityModes({ order }) {
  return [
    {
      key: "api_key_header",
      label: "API Key Header",
      recommended: true,
      description: "Preferred for client websites, CRMs, and server-to-server webhooks.",
      headers: {
        [API_KEY_HEADER]: "<lead_ingestion_api_key>",
        [IDEMPOTENCY_HEADER]: "<unique-event-id>",
      },
      body_fields: [],
    },
    {
      key: "order_id_plus_secret",
      label: "Order ID + Webhook Secret",
      recommended: false,
      description: "Use when the external system can send an order identifier and a shared webhook secret.",
      headers: {
        [WEBHOOK_SECRET_HEADER]: "<lead_ingestion_webhook_secret>",
        [IDEMPOTENCY_HEADER]: "<unique-event-id>",
      },
      body_fields: ["order_id"],
      order_id: order.id,
    },
    {
      key: "client_project_id_plus_secret",
      label: "Project ID + Webhook Secret",
      recommended: false,
      description: "Use when the external system tracks the client project identifier instead of the order id.",
      headers: {
        [WEBHOOK_SECRET_HEADER]: "<lead_ingestion_webhook_secret>",
        [IDEMPOTENCY_HEADER]: "<unique-event-id>",
      },
      body_fields: ["client_project_id"],
      client_project_id: order.client_project_id,
    },
  ];
}

function buildCurlExample({
  webhookUrl,
  payload,
  identityMode = "api_key_header",
  credentialValue = null,
  order,
}) {
  const body = clone(payload);
  const lines = [
    `curl -X POST "${webhookUrl}"`,
    `  -H "Content-Type: application/json"`,
    `  -H "${IDEMPOTENCY_HEADER}: ${body.idempotency_key}"`,
  ];

  if (identityMode === "api_key_header") {
    lines.push(`  -H "${API_KEY_HEADER}: ${credentialValue || "<lead_ingestion_api_key>"}"`);
  } else if (identityMode === "order_id_plus_secret") {
    lines.push(`  -H "${WEBHOOK_SECRET_HEADER}: ${credentialValue || "<lead_ingestion_webhook_secret>"}"`);
    body.order_id = order.id;
  } else {
    lines.push(`  -H "${WEBHOOK_SECRET_HEADER}: ${credentialValue || "<lead_ingestion_webhook_secret>"}"`);
    body.client_project_id = order.client_project_id;
  }

  lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
  return lines.join(" \\\n");
}

function getCredentialStatus(order) {
  const hasApiKey = Boolean(cleanString(order.lead_ingestion_api_key));
  const hasWebhookSecret = Boolean(cleanString(order.lead_ingestion_webhook_secret));
  const revokedAt = cleanString(order.lead_ingestion_credentials_revoked_at);

  if (revokedAt) {
    return hasApiKey || hasWebhookSecret ? "partially_revoked" : "revoked";
  }
  if (hasApiKey && hasWebhookSecret) {
    return "active";
  }
  if (hasApiKey || hasWebhookSecret) {
    return "partial";
  }
  return "not_issued";
}

function buildSetupInstructions(order) {
  return [
    `Post client-owned leads to the canonical webhookLeadCapture endpoint for paid order ${order.id}.`,
    "Use the API key header when possible. It avoids ambiguous linking and is the recommended server-to-server identity mode.",
    "If an external system cannot store the API key header, send order_id or client_project_id plus the webhook secret instead.",
    "Always send a unique idempotency key per inbound event so duplicate submissions do not trigger duplicate automation.",
  ];
}

function buildLocationHints(order) {
  return [
    "Client website form action or form webhook connector",
    "External CRM outbound webhook / automation rule",
    "Middleware like Zapier, Make, or a custom integration service",
    `Always keep ClientSurge's own WebsiteLead funnel separate from paid customer order ${order.id}.`,
  ];
}

function buildSetupState({ order, webhookUrl, includeFullCredentials = false, credentials = null }) {
  const snapshot = buildInstallSnapshot(order);
  const credentialStatus = getCredentialStatus(order);
  const examplePayload = buildExamplePayload({ order });
  const identityModes = buildIdentityModes({ order });
  const response = {
    order_id: order.id,
    client_project_id: order.client_project_id,
    webhook_url: webhookUrl,
    credential_status: credentialStatus,
    credentials: {
      has_api_key: Boolean(cleanString(order.lead_ingestion_api_key)),
      has_webhook_secret: Boolean(cleanString(order.lead_ingestion_webhook_secret)),
      masked_api_key: maskCredential(order.lead_ingestion_api_key),
      masked_webhook_secret: maskCredential(order.lead_ingestion_webhook_secret),
      issued_at: order.lead_ingestion_credentials_issued_at || null,
      rotated_at: order.lead_ingestion_credentials_rotated_at || null,
      revoked_at: order.lead_ingestion_credentials_revoked_at || null,
      last_used_at: order.lead_ingestion_last_used_at || null,
    },
    identity_modes: identityModes,
    automation_readiness: buildAutomationReadiness(snapshot),
    setup_instructions: buildSetupInstructions(order),
    setup_locations: buildLocationHints(order),
    warning:
      "Platform Website Leads stay on WebsiteLead. Paid customer lead ingestion must use this order-backed endpoint and will create canonical Leads only.",
    idempotency_guidance:
      "Use a unique x-idempotency-key or idempotency_key for every external event. Replays with the same key are treated as safe duplicates.",
    example_payload: examplePayload,
    example_curl: buildCurlExample({
      webhookUrl,
      payload: examplePayload,
      identityMode: "api_key_header",
      order,
    }),
    alternate_examples: {
      order_id_plus_secret: buildCurlExample({
        webhookUrl,
        payload: examplePayload,
        identityMode: "order_id_plus_secret",
        order,
      }),
      client_project_id_plus_secret: buildCurlExample({
        webhookUrl,
        payload: examplePayload,
        identityMode: "client_project_id_plus_secret",
        order,
      }),
    },
    actions: {
      can_issue: credentialStatus === "not_issued" || credentialStatus === "revoked",
      can_rotate: credentialStatus === "active",
      can_revoke: credentialStatus === "active",
      can_test: credentialStatus === "active",
    },
  };

  if (includeFullCredentials && credentials) {
    response.reveal_once_credentials = {
      api_key: credentials.api_key,
      webhook_secret: credentials.webhook_secret,
      webhook_url: webhookUrl,
      example_curl: buildCurlExample({
        webhookUrl,
        payload: examplePayload,
        identityMode: "api_key_header",
        credentialValue: credentials.api_key,
        order,
      }),
      alternate_examples: {
        order_id_plus_secret: buildCurlExample({
          webhookUrl,
          payload: examplePayload,
          identityMode: "order_id_plus_secret",
          credentialValue: credentials.webhook_secret,
          order,
        }),
        client_project_id_plus_secret: buildCurlExample({
          webhookUrl,
          payload: examplePayload,
          identityMode: "client_project_id_plus_secret",
          credentialValue: credentials.webhook_secret,
          order,
        }),
      },
    };
  }

  return response;
}

async function getOrderById(base44, orderId) {
  try {
    return await base44.asServiceRole.entities.Order.get(orderId);
  } catch (_) {
    return null;
  }
}

async function loadPaidLinkedOrder(base44, orderId, options = {}) {
  const { requireActiveCredentials = false } = options;

  if (!cleanString(orderId)) {
    throw new LeadIngestionAdminError("order_id is required", {
      status: 400,
      code: "lead_ingestion_order_id_required",
    });
  }

  const order = await getOrderById(base44, orderId);
  if (!order) {
    throw new LeadIngestionAdminError("Order not found", {
      status: 404,
      code: "lead_ingestion_order_not_found",
    });
  }

  if (order.payment_status !== "paid") {
    throw new LeadIngestionAdminError("Lead ingestion credentials are only available for paid orders", {
      status: 409,
      code: "lead_ingestion_order_not_paid",
      details: { order_id: order.id, payment_status: order.payment_status || null },
    });
  }

  if (!cleanString(order.client_project_id)) {
    throw new LeadIngestionAdminError("Paid order must be linked to a ClientProject before lead ingestion can be configured", {
      status: 409,
      code: "lead_ingestion_client_project_required",
      details: { order_id: order.id },
    });
  }

  if (requireActiveCredentials && getCredentialStatus(order) !== "active") {
    throw new LeadIngestionAdminError("Issue active lead ingestion credentials before running this action", {
      status: 409,
      code: "lead_ingestion_credentials_required",
      details: { order_id: order.id },
    });
  }

  return order;
}

async function logCredentialEvent({
  base44,
  order,
  actor,
  action,
  now,
  metadata = {},
  subject,
  message,
}) {
  return base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject,
      message_body: message,
      context_type: "lead_ingestion_admin",
      context_id: `${order.id}:${action}:${now}`,
      metadata: {
        action,
        actor_id: actor?.id || null,
        actor_email: actor?.email || null,
        ...metadata,
      },
    })
  );
}

async function saveOrderCredentials(base44, orderId, patch) {
  return base44.asServiceRole.entities.Order.update(orderId, patch);
}

function buildRevealedCredentials() {
  return {
    api_key: generateToken("cli_lead"),
    webhook_secret: generateToken("whsec"),
  };
}

export class LeadIngestionAdminError extends Error {
  constructor(message, { status = 400, code = "lead_ingestion_admin_failed", details = {} } = {}) {
    super(message);
    this.name = "LeadIngestionAdminError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function getLeadIngestionSetupData({ base44, orderId, requestUrl }) {
  const order = await loadPaidLinkedOrder(base44, orderId);
  return buildSetupState({
    order,
    webhookUrl: buildWebhookUrl(requestUrl),
  });
}

export async function issueOrderLeadIngestionCredentials({
  base44,
  orderId,
  actor = null,
  requestUrl,
  now = new Date().toISOString(),
}) {
  const order = await loadPaidLinkedOrder(base44, orderId);
  const currentStatus = getCredentialStatus(order);
  if (currentStatus === "active") {
    throw new LeadIngestionAdminError("Lead ingestion credentials already exist for this order. Rotate them instead.", {
      status: 409,
      code: "lead_ingestion_credentials_already_active",
      details: { order_id: order.id },
    });
  }

  const credentials = buildRevealedCredentials();
  const updatedOrder = await saveOrderCredentials(base44, order.id, {
    lead_ingestion_api_key: credentials.api_key,
    lead_ingestion_webhook_secret: credentials.webhook_secret,
    lead_ingestion_credentials_issued_at: now,
    lead_ingestion_credentials_rotated_at: null,
    lead_ingestion_credentials_revoked_at: null,
  });

  await logCredentialEvent({
    base44,
    order: updatedOrder,
    actor,
    action: "issued",
    now,
    subject: "Lead ingestion credentials issued",
    message: `Admin issued order-backed lead ingestion credentials for paid order ${order.id}.`,
    metadata: {
      order_id: order.id,
      client_project_id: order.client_project_id,
      webhook_url: buildWebhookUrl(requestUrl),
    },
  });

  return {
    setup: buildSetupState({
      order: updatedOrder,
      webhookUrl: buildWebhookUrl(requestUrl),
      includeFullCredentials: true,
      credentials,
    }),
    credentials,
  };
}

export async function rotateOrderLeadIngestionCredentials({
  base44,
  orderId,
  actor = null,
  requestUrl,
  now = new Date().toISOString(),
}) {
  const order = await loadPaidLinkedOrder(base44, orderId, { requireActiveCredentials: true });
  const previousApiKeyMasked = maskCredential(order.lead_ingestion_api_key);
  const previousWebhookSecretMasked = maskCredential(order.lead_ingestion_webhook_secret);
  const credentials = buildRevealedCredentials();

  const updatedOrder = await saveOrderCredentials(base44, order.id, {
    lead_ingestion_api_key: credentials.api_key,
    lead_ingestion_webhook_secret: credentials.webhook_secret,
    lead_ingestion_credentials_issued_at: order.lead_ingestion_credentials_issued_at || now,
    lead_ingestion_credentials_rotated_at: now,
    lead_ingestion_credentials_revoked_at: null,
  });

  await logCredentialEvent({
    base44,
    order: updatedOrder,
    actor,
    action: "rotated",
    now,
    subject: "Lead ingestion credentials rotated",
    message: `Admin rotated order-backed lead ingestion credentials for paid order ${order.id}. Previous credentials are now invalid.`,
    metadata: {
      order_id: order.id,
      client_project_id: order.client_project_id,
      previous_api_key_masked: previousApiKeyMasked,
      previous_webhook_secret_masked: previousWebhookSecretMasked,
      webhook_url: buildWebhookUrl(requestUrl),
    },
  });

  return {
    setup: buildSetupState({
      order: updatedOrder,
      webhookUrl: buildWebhookUrl(requestUrl),
      includeFullCredentials: true,
      credentials,
    }),
    credentials,
  };
}

export async function revokeOrderLeadIngestionCredentials({
  base44,
  orderId,
  actor = null,
  requestUrl,
  now = new Date().toISOString(),
}) {
  const order = await loadPaidLinkedOrder(base44, orderId);
  const currentStatus = getCredentialStatus(order);
  if (currentStatus !== "active" && currentStatus !== "partial") {
    throw new LeadIngestionAdminError("No active lead ingestion credentials exist for this order", {
      status: 409,
      code: "lead_ingestion_credentials_not_active",
      details: { order_id: order.id },
    });
  }

  const updatedOrder = await saveOrderCredentials(base44, order.id, {
    lead_ingestion_api_key: "",
    lead_ingestion_webhook_secret: "",
    lead_ingestion_credentials_revoked_at: now,
  });

  await logCredentialEvent({
    base44,
    order: updatedOrder,
    actor,
    action: "revoked",
    now,
    subject: "Lead ingestion credentials revoked",
    message: `Admin revoked order-backed lead ingestion credentials for paid order ${order.id}. Existing credentials are no longer valid.`,
    metadata: {
      order_id: order.id,
      client_project_id: order.client_project_id,
      webhook_url: buildWebhookUrl(requestUrl),
    },
  });

  return {
    setup: buildSetupState({
      order: updatedOrder,
      webhookUrl: buildWebhookUrl(requestUrl),
    }),
  };
}

function buildAdminTestPayload(order, now) {
  const safeToken = order.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "order";
  return {
    api_key: order.lead_ingestion_api_key,
    full_name: "Admin Test Lead",
    business_name: order.business_name || "Client Business",
    email: `lead-ingestion-test+${safeToken}@example.com`,
    phone: "+16025550010",
    business_type: "Test",
    problem: "Admin lead ingestion verification",
    source: "admin_ingestion_test",
    intake_type: "admin_test",
    idempotency_key: `admin-test-${safeToken}-${new Date(now).getTime()}`,
    metadata: {
      admin_test: true,
      order_id: order.id,
    },
  };
}

export async function runLeadIngestionAdminTest({
  base44,
  orderId,
  actor = null,
  requestUrl,
  now = new Date().toISOString(),
}) {
  const order = await loadPaidLinkedOrder(base44, orderId, { requireActiveCredentials: true });
  const payload = buildAdminTestPayload(order, now);

  const result = await ingestCustomerLead({
    base44,
    payload,
    now,
    dependencies: {
      executeInstantResponse: async (args) =>
        executeOrderServiceRuntime({
          ...args,
          sendSms: async () => ({
            provider_message_id: `SIM_LEAD_INGEST_${order.id}`,
            provider_status: "simulated",
          }),
        }),
    },
  });

  const refreshedOrder = await getOrderById(base44, order.id);
  const lead = await base44.asServiceRole.entities.Leads.get(result.lead_id).catch(() => null);

  await logCredentialEvent({
    base44,
    order: refreshedOrder || order,
    actor,
    action: "tested",
    now,
    subject: "Lead ingestion admin test executed",
    message: `Admin executed a safe lead ingestion test for paid order ${order.id}.`,
    metadata: {
      order_id: order.id,
      client_project_id: order.client_project_id,
      lead_id: result.lead_id,
      created: result.created,
      deduped: result.deduped,
      duplicate_suppressed: result.duplicate_suppressed,
      identity_method: result.identity_method,
      automation_results: result.automation_results,
      webhook_url: buildWebhookUrl(requestUrl),
    },
  });

  return {
    setup: buildSetupState({
      order: refreshedOrder || order,
      webhookUrl: buildWebhookUrl(requestUrl),
    }),
    test_result: {
      ...result,
      payload_preview: {
        ...payload,
        api_key: undefined,
      },
      lead: lead
        ? {
            id: lead.id,
            full_name: lead.full_name,
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
          }
        : null,
    },
  };
}

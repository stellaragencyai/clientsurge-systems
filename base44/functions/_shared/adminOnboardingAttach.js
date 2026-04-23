import {
  initializePaidOrderInstallPipeline,
  InstallLinkingError,
} from "./installPipeline.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function splitCommaSeparated(value) {
  return cleanString(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function safeGet(collection, id) {
  if (!id) {
    return null;
  }

  try {
    return await collection.get(id);
  } catch {
    return null;
  }
}

function buildAdminAttachEvent({ order, detail }) {
  return {
    channel: "internal",
    direction: "system",
    event_type: "workflow_triggered",
    provider: "internal",
    status: "processed",
    subject: "Admin onboarding attached",
    message_body: detail,
    order_id: order.id,
    client_id: order.client_id,
    client_project_id: order.client_project_id,
    onboarding_client_id: order.onboarding_client_id,
    context_type: "admin_onboarding_attach",
    context_id: `${order.id}:admin_onboarding_attach`,
    metadata_json: JSON.stringify({
      order_id: order.id,
      client_id: order.client_id,
      client_project_id: order.client_project_id,
      onboarding_client_id: order.onboarding_client_id,
    }),
  };
}

export class AdminOnboardingAttachError extends Error {
  constructor(message, { status = 400, code = "admin_onboarding_attach_invalid" } = {}) {
    super(message);
    this.name = "AdminOnboardingAttachError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeAdminOnboardingAttachPayload(payload = {}) {
  return {
    order_id: cleanString(payload.order_id),
    website: cleanString(payload.website),
    instagram: cleanString(payload.instagram),
    industry: cleanString(payload.industry),
    services: cleanString(payload.services),
    tone_of_voice: cleanString(payload.tone_of_voice),
    booking_platform: cleanString(payload.booking_platform),
    booking_link: cleanString(payload.booking_link),
    lead_sources: cleanString(payload.lead_sources),
    start_date: cleanString(payload.start_date),
  };
}

export async function attachAdminOnboardingToOrder({
  base44,
  payload,
}) {
  const normalizedPayload = normalizeAdminOnboardingAttachPayload(payload);

  if (!normalizedPayload.order_id) {
    throw new AdminOnboardingAttachError("order_id is required", {
      status: 400,
      code: "admin_onboarding_attach_missing_order_id",
    });
  }

  const order = await base44.asServiceRole.entities.Order.get(normalizedPayload.order_id);
  if (!order) {
    throw new AdminOnboardingAttachError("Order not found", {
      status: 404,
      code: "admin_onboarding_attach_order_not_found",
    });
  }

  if (order.payment_status !== "paid") {
    throw new AdminOnboardingAttachError("Only paid orders can be attached to admin onboarding.", {
      status: 409,
      code: "admin_onboarding_attach_requires_paid_order",
    });
  }

  let initializedOrder;
  try {
    const initialized = await initializePaidOrderInstallPipeline({
      base44,
      order,
    });
    initializedOrder = initialized.order;
  } catch (error) {
    if (error instanceof InstallLinkingError) {
      throw new AdminOnboardingAttachError(
        "This paid order still has ambiguous record links. Manual repair is required before onboarding can be attached.",
        {
          status: error.status || 409,
          code: error.code || "admin_onboarding_attach_linking_ambiguous",
        }
      );
    }

    throw error;
  }

  const [client, clientProject, onboardingClient] = await Promise.all([
    safeGet(base44.asServiceRole.entities.Client, initializedOrder.client_id),
    safeGet(base44.asServiceRole.entities.ClientProject, initializedOrder.client_project_id),
    safeGet(base44.asServiceRole.entities.OnboardingClient, initializedOrder.onboarding_client_id),
  ]);

  if (!client || !clientProject || !onboardingClient) {
    throw new AdminOnboardingAttachError(
      "Canonical order links are incomplete. Please repair the order linkage before continuing.",
      {
        status: 409,
        code: "admin_onboarding_attach_links_incomplete",
      }
    );
  }

  const clientPatch = {
    website: normalizedPayload.website || client.website || undefined,
    social_media: normalizedPayload.instagram || client.social_media || undefined,
    services: normalizedPayload.services ? splitCommaSeparated(normalizedPayload.services) : client.services,
    lead_sources: normalizedPayload.lead_sources ? splitCommaSeparated(normalizedPayload.lead_sources) : client.lead_sources,
    booking_link: normalizedPayload.booking_link || client.booking_link || undefined,
    calendar_system: normalizedPayload.booking_platform || client.calendar_system || undefined,
    brand_voice: normalizedPayload.tone_of_voice || client.brand_voice || undefined,
  };

  const onboardingPatch = {
    business_name: onboardingClient.business_name || initializedOrder.business_name,
    owner_name: onboardingClient.owner_name || initializedOrder.customer_name,
    email: onboardingClient.email || initializedOrder.customer_email,
    phone: onboardingClient.phone || initializedOrder.customer_phone || "",
    website: normalizedPayload.website || onboardingClient.website || undefined,
    instagram: normalizedPayload.instagram || onboardingClient.instagram || undefined,
    industry: normalizedPayload.industry || onboardingClient.industry || undefined,
    services: normalizedPayload.services || onboardingClient.services || undefined,
    tone_of_voice: normalizedPayload.tone_of_voice || onboardingClient.tone_of_voice || undefined,
    booking_platform: normalizedPayload.booking_platform || onboardingClient.booking_platform || undefined,
    booking_link: normalizedPayload.booking_link || onboardingClient.booking_link || undefined,
    lead_sources: normalizedPayload.lead_sources || onboardingClient.lead_sources || undefined,
    start_date: normalizedPayload.start_date || onboardingClient.start_date || undefined,
    monthly_rate: initializedOrder.total_monthly || onboardingClient.monthly_rate || 0,
    setup_fee: initializedOrder.total_setup || onboardingClient.setup_fee || 0,
    client_id: client.id,
    client_project_id: clientProject.id,
    order_id: initializedOrder.id,
  };

  await Promise.all([
    base44.asServiceRole.entities.Client.update(client.id, clientPatch),
    base44.asServiceRole.entities.OnboardingClient.update(onboardingClient.id, onboardingPatch),
  ]);

  await base44.asServiceRole.entities.CommunicationEvent.create(
    buildAdminAttachEvent({
      order: initializedOrder,
      detail: `Admin onboarding attached to canonical paid order ${initializedOrder.id}.`,
    })
  );

  return {
    success: true,
    order_id: initializedOrder.id,
    client_id: client.id,
    client_project_id: clientProject.id,
    onboarding_client_id: onboardingClient.id,
  };
}

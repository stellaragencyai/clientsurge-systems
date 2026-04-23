import {
  initializePaidOrderInstallPipeline,
  InstallLinkingError,
} from "./installPipeline.js";

function getEnv(name) {
  if (typeof Deno !== "undefined" && Deno.env?.get) {
    return Deno.env.get(name);
  }

  if (typeof process !== "undefined") {
    return process.env?.[name];
  }

  return undefined;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizeNameList(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => cleanString(entry))
      .filter(Boolean)
      .join(", ");
  }

  return cleanString(value);
}

function sortByCreatedDateDesc(a, b) {
  return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
}

function shouldIgnoreInviteError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("registered") ||
    message.includes("invited")
  );
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

function buildWorkflowEvent({ order, flow, phase, detail }) {
  return {
    channel: "internal",
    direction: "system",
    event_type: "workflow_triggered",
    provider: "internal",
    status: "processed",
    subject: `Client ${flow} ${phase}`,
    message_body: detail,
    order_id: order.id,
    client_id: order.client_id,
    client_project_id: order.client_project_id,
    onboarding_client_id: order.onboarding_client_id,
    context_type: "client_account_setup",
    context_id: `${order.id}:${flow}:${phase}`,
    metadata_json: JSON.stringify({
      flow,
      phase,
      order_id: order.id,
      client_id: order.client_id,
      client_project_id: order.client_project_id,
      onboarding_client_id: order.onboarding_client_id,
    }),
  };
}

export class ClientOnboardingAccessError extends Error {
  constructor(message, { status = 400, code = "client_onboarding_invalid" } = {}) {
    super(message);
    this.name = "ClientOnboardingAccessError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeClientOnboardingPayload(payload = {}) {
  return {
    flow: payload.flow === "signup" ? "signup" : "onboarding",
    full_name: cleanString(payload.full_name),
    business_name: cleanString(payload.business_name),
    email: normalizeEmail(payload.email),
    phone: cleanString(payload.phone),
    website: cleanString(payload.website),
    social_media: cleanString(payload.social_media),
    services: Array.isArray(payload.services) ? payload.services : [],
    lead_sources: Array.isArray(payload.lead_sources) ? payload.lead_sources : [],
    current_process: cleanString(payload.current_process),
    response_speed: cleanString(payload.response_speed),
    booking_link: cleanString(payload.booking_link),
    calendar_system: cleanString(payload.calendar_system),
    requires_consultation: cleanString(payload.requires_consultation),
    brand_voice: cleanString(payload.brand_voice),
    customer_questions: cleanString(payload.customer_questions),
    business_hours: cleanString(payload.business_hours),
    has_old_leads: cleanString(payload.has_old_leads),
    access_info: cleanString(payload.access_info),
    goals: cleanString(payload.goals),
    business_type: cleanString(payload.business_type),
  };
}

export function validateClientOnboardingPayload(payload) {
  const errors = [];

  if (!payload.full_name) errors.push("Full name is required.");
  if (!payload.business_name) errors.push("Business name is required.");
  if (!payload.email) errors.push("Email is required.");
  if (!payload.phone) errors.push("Phone number is required.");

  return errors;
}

export async function resolveCanonicalPaidOrderForClientAccess({
  base44,
  email,
  businessName,
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return {
      status: "not_found",
      code: "canonical_paid_order_not_found",
    };
  }

  const orders = await base44.asServiceRole.entities.Order.filter(
    { customer_email: normalizedEmail },
    "-created_date",
    50
  );

  const paidOrders = (orders || [])
    .filter((order) => normalizeEmail(order.customer_email) === normalizedEmail)
    .filter((order) => order.payment_status === "paid")
    .sort(sortByCreatedDateDesc);

  if (paidOrders.length === 0) {
    return {
      status: "not_found",
      code: "canonical_paid_order_not_found",
    };
  }

  const normalizedBusinessName = cleanString(businessName).toLowerCase();
  const scopedOrders = normalizedBusinessName
    ? paidOrders.filter(
        (order) => cleanString(order.business_name).toLowerCase() === normalizedBusinessName
      )
    : paidOrders;

  const candidates = scopedOrders.length > 0 ? scopedOrders : paidOrders;
  const distinctOrderIds = [...new Set(candidates.map((order) => order.id))];

  if (distinctOrderIds.length > 1) {
    return {
      status: "ambiguous",
      code: "canonical_paid_order_ambiguous",
    };
  }

  return {
    status: "resolved",
    order: candidates[0],
  };
}

async function ensureCanonicalOrderLinks(base44, order) {
  if (
    order.install_initialized_at &&
    order.client_id &&
    order.client_project_id &&
    order.onboarding_client_id
  ) {
    return order;
  }

  let initialized;
  try {
    initialized = await initializePaidOrderInstallPipeline({
      base44,
      order,
    });
  } catch (error) {
    if (error instanceof InstallLinkingError) {
      throw new ClientOnboardingAccessError(
        "We found multiple existing records that could belong to this paid account. Please contact support so we can repair the linkage before continuing.",
        {
          status: error.status || 409,
          code: error.code || "canonical_links_ambiguous",
        }
      );
    }

    throw error;
  }

  return initialized.order;
}

function buildClientPatch(payload, existingClient) {
  return {
    full_name: payload.full_name,
    business_name: existingClient?.business_name || payload.business_name,
    email: payload.email,
    phone: payload.phone,
    website: payload.website || existingClient?.website || undefined,
    social_media: payload.social_media || existingClient?.social_media || undefined,
    services: payload.services.length > 0 ? payload.services : existingClient?.services,
    lead_sources: payload.lead_sources.length > 0 ? payload.lead_sources : existingClient?.lead_sources,
    current_process: payload.current_process || existingClient?.current_process || undefined,
    response_speed: payload.response_speed || existingClient?.response_speed || undefined,
    booking_link: payload.booking_link || existingClient?.booking_link || undefined,
    calendar_system: payload.calendar_system || existingClient?.calendar_system || undefined,
    requires_consultation: payload.requires_consultation || existingClient?.requires_consultation || undefined,
    brand_voice: payload.brand_voice || existingClient?.brand_voice || undefined,
    customer_questions: payload.customer_questions || existingClient?.customer_questions || undefined,
    business_hours: payload.business_hours || existingClient?.business_hours || undefined,
    has_old_leads: payload.has_old_leads || existingClient?.has_old_leads || undefined,
    access_info: payload.access_info || existingClient?.access_info || undefined,
    goals: payload.goals || existingClient?.goals || undefined,
    status: existingClient?.status || "Onboarding",
  };
}

function buildClientProjectPatch(payload, existingProject) {
  return {
    client_email: payload.email,
    client_name: payload.full_name,
    business_name: existingProject?.business_name || payload.business_name,
    step_onboarding:
      payload.flow === "onboarding"
        ? "complete"
        : existingProject?.step_onboarding || "pending",
  };
}

function buildOnboardingClientPatch(payload, existingOnboarding) {
  return {
    business_name: existingOnboarding?.business_name || payload.business_name,
    owner_name: payload.full_name,
    phone: payload.phone,
    email: payload.email,
    website: payload.website || existingOnboarding?.website || undefined,
    instagram: payload.social_media || existingOnboarding?.instagram || undefined,
    industry: payload.business_type || existingOnboarding?.industry || undefined,
    services:
      payload.services.length > 0
        ? normalizeNameList(payload.services)
        : existingOnboarding?.services || undefined,
    tone_of_voice: payload.brand_voice || existingOnboarding?.tone_of_voice || undefined,
    booking_platform: payload.calendar_system || existingOnboarding?.booking_platform || undefined,
    booking_link: payload.booking_link || existingOnboarding?.booking_link || undefined,
    lead_sources:
      payload.lead_sources.length > 0
        ? normalizeNameList(payload.lead_sources)
        : existingOnboarding?.lead_sources || undefined,
  };
}

export async function submitClientOnboardingAccess({
  base44,
  payload,
  now = new Date().toISOString(),
}) {
  const normalizedPayload = normalizeClientOnboardingPayload(payload);
  const errors = validateClientOnboardingPayload(normalizedPayload);
  if (errors.length > 0) {
    throw new ClientOnboardingAccessError(errors.join(" "), {
      status: 400,
      code: "client_onboarding_invalid",
    });
  }

  const resolution = await resolveCanonicalPaidOrderForClientAccess({
    base44,
    email: normalizedPayload.email,
    businessName: normalizedPayload.business_name,
  });

  if (resolution.status === "not_found") {
    throw new ClientOnboardingAccessError(
      "We could not find a paid order linked to this email yet. Complete checkout first or contact support.",
      {
        status: 404,
        code: resolution.code,
      }
    );
  }

  if (resolution.status === "ambiguous") {
    throw new ClientOnboardingAccessError(
      "We found more than one paid account for this email. Please contact support so we can link the correct business.",
      {
        status: 409,
        code: resolution.code,
      }
    );
  }

  const canonicalOrder = await ensureCanonicalOrderLinks(base44, resolution.order);
  const [client, clientProject, onboardingClient] = await Promise.all([
    safeGet(base44.asServiceRole.entities.Client, canonicalOrder.client_id),
    safeGet(base44.asServiceRole.entities.ClientProject, canonicalOrder.client_project_id),
    safeGet(base44.asServiceRole.entities.OnboardingClient, canonicalOrder.onboarding_client_id),
  ]);

  if (!client || !clientProject || !onboardingClient) {
    throw new ClientOnboardingAccessError(
      "Your paid account is not fully linked yet. Please contact support.",
      {
        status: 409,
        code: "canonical_links_incomplete",
      }
    );
  }

  const updatedClient = await base44.asServiceRole.entities.Client.update(
    client.id,
    buildClientPatch(normalizedPayload, client)
  );
  const updatedClientProject = await base44.asServiceRole.entities.ClientProject.update(
    clientProject.id,
    {
      client_id: client.id,
      ...buildClientProjectPatch(normalizedPayload, clientProject),
    }
  );
  const updatedOnboardingClient = await base44.asServiceRole.entities.OnboardingClient.update(
    onboardingClient.id,
    {
      client_id: client.id,
      client_project_id: clientProject.id,
      order_id: canonicalOrder.id,
      ...buildOnboardingClientPatch(normalizedPayload, onboardingClient),
    }
  );

  let inviteSent = false;
  if (base44.users?.inviteUser) {
    try {
      await base44.users.inviteUser(normalizedPayload.email, "user");
      inviteSent = true;
    } catch (error) {
      if (!shouldIgnoreInviteError(error)) {
        throw new ClientOnboardingAccessError(
          error instanceof Error ? error.message : "Failed to invite user",
          {
            status: 502,
            code: "client_invite_failed",
          }
        );
      }
    }
  }

  await base44.asServiceRole.entities.CommunicationEvent.create(
    buildWorkflowEvent({
      order: canonicalOrder,
      flow: normalizedPayload.flow,
      phase: "linked",
      detail: `Client ${normalizedPayload.flow} attached to canonical paid order ${canonicalOrder.id}.`,
    })
  );

  const webhookUrl = getEnv("N8N_WEBHOOK_URL");
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "client_onboarding_submitted",
          timestamp: now,
          data: {
            flow: normalizedPayload.flow,
            order_id: canonicalOrder.id,
            client_id: updatedClient.id,
            client_project_id: updatedClientProject.id,
            onboarding_client_id: updatedOnboardingClient.id,
            email: normalizedPayload.email,
            business_name: normalizedPayload.business_name,
          },
        }),
      });
    } catch (webhookError) {
      console.log("Webhook send failed (non-blocking):", webhookError.message);
    }
  }

  return {
    success: true,
    flow: normalizedPayload.flow,
    invite_sent: inviteSent,
    order_id: canonicalOrder.id,
    client_id: updatedClient.id,
    client_project_id: updatedClientProject.id,
    onboarding_client_id: updatedOnboardingClient.id,
  };
}

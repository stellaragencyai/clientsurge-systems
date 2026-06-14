import { secureJson } from "../_shared/response.ts";
/**
 * manageWebhookRegistration
 * CRUD + secret generation for signed project-scoped webhook registrations.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "whsec_";
  for (let i = 0; i < 32; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function normalizeRegistrationPayload(data = {}) {
  return {
    ...data,
    source_name: cleanString(data.source_name),
    service_key: cleanString(data.service_key),
    client_project_id: cleanString(data.client_project_id),
    webhook_url: cleanString(data.webhook_url),
    signature_algorithm: "hmac_sha256",
  };
}

function sanitizeRegistration(registration, { revealSecret = false } = {}) {
  if (!registration) {
    return registration;
  }

  const { secret_key, ...rest } = registration;
  return {
    ...rest,
    has_secret: Boolean(secret_key),
    ...(revealSecret && secret_key ? { secret_key } : {}),
  };
}

async function syncProjectWebhookMetadata(base44, registration) {
  const clientProjectId = cleanString(registration?.client_project_id);
  if (!clientProjectId) {
    return;
  }

  const project = await base44.asServiceRole.entities.ClientProject.get(clientProjectId).catch(
    () => null
  );
  if (!project) {
    return;
  }

  const installConfiguration = project.install_configuration || {};
  const integrations = installConfiguration.integrations || {};

  await base44.asServiceRole.entities.ClientProject.update(project.id, {
    install_configuration: {
      ...installConfiguration,
      integrations: {
        ...integrations,
        lead_capture_webhook: {
          registration_id: registration.id,
          source_name: registration.source_name || "",
          service_key: registration.service_key || "",
          webhook_url: registration.webhook_url || "",
          status: registration.status || "active",
          signature_algorithm: registration.signature_algorithm || "hmac_sha256",
          last_triggered_at: registration.last_triggered_at || null,
        },
      },
    },
  });
}

async function clearProjectWebhookMetadata(base44, registration) {
  const clientProjectId = cleanString(registration?.client_project_id);
  if (!clientProjectId) {
    return;
  }

  const project = await base44.asServiceRole.entities.ClientProject.get(clientProjectId).catch(
    () => null
  );
  if (!project) {
    return;
  }

  const installConfiguration = project.install_configuration || {};
  const integrations = installConfiguration.integrations || {};

  if (
    integrations.lead_capture_webhook?.registration_id &&
    integrations.lead_capture_webhook.registration_id !== registration.id
  ) {
    return;
  }

  await base44.asServiceRole.entities.ClientProject.update(project.id, {
    install_configuration: {
      ...installConfiguration,
      integrations: {
        ...integrations,
        lead_capture_webhook: null,
      },
    },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, id, data } = body;

    if (action === "list") {
      const registrations = await base44.asServiceRole.entities.WebhookRegistration.list(
        "-created_date",
        50
      );
      return secureJson({
        success: true,
        registrations: registrations.map((registration) => sanitizeRegistration(registration)),
      });
    }

    if (action === "create") {
      const payload = normalizeRegistrationPayload(data);
      const record = await base44.asServiceRole.entities.WebhookRegistration.create({
        ...payload,
        secret_key: generateSecret(),
        status: "active",
        signature_algorithm: "hmac_sha256",
        failure_count: 0,
        created_at: new Date().toISOString(),
      });
      await syncProjectWebhookMetadata(base44, record);
      return secureJson({
        success: true,
        registration: sanitizeRegistration(record, { revealSecret: true }),
      });
    }

    if (action === "update") {
      const payload = normalizeRegistrationPayload(data);
      const record = await base44.asServiceRole.entities.WebhookRegistration.update(id, payload);
      await syncProjectWebhookMetadata(base44, record);
      return secureJson({ success: true, registration: sanitizeRegistration(record) });
    }

    if (action === "delete") {
      const existing = await base44.asServiceRole.entities.WebhookRegistration.get(id);
      await base44.asServiceRole.entities.WebhookRegistration.delete(id);
      await clearProjectWebhookMetadata(base44, existing);
      return secureJson({ success: true });
    }

    if (action === "regenerate_secret") {
      const record = await base44.asServiceRole.entities.WebhookRegistration.update(id, {
        secret_key: generateSecret(),
        signature_algorithm: "hmac_sha256",
      });
      await syncProjectWebhookMetadata(base44, record);
      return secureJson({
        success: true,
        registration: sanitizeRegistration(record, { revealSecret: true }),
      });
    }

    return secureJson({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[WebhookRegistration] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});

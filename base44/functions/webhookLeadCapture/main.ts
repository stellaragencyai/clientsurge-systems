import { secureJson } from "../_shared/response.ts";
import { validateWebhookSignature, normalizePhoneNumber } from "../_shared/webhookHandlerCore.js";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

/**
 * CANONICAL LEAD INGESTION FUNCTION
 *
 * Architecture: Worker → CommunicationEvent → Leads
 * PRIMARY ENTITIES: Leads (CRM), CommunicationEvent (audit log), WebhookRegistration
 */

const SIGNATURE_WINDOW_SECONDS = 300;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function lower(value) {
  return cleanString(value).toLowerCase();
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizeRequestedChannels(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => cleanString(entry)).filter(Boolean))];
}

function parseCapturePayload(payload) {
  return {
    full_name:
      cleanString(payload.full_name) ||
      cleanString(payload.name) ||
      cleanString(payload.contact_name),
    email:
      normalizeEmail(payload.email) || normalizeEmail(payload.contact_email),
    phone:
      normalizePhoneNumber(payload.phone || payload.contact_phone),
    business_name:
      cleanString(payload.business_name) || cleanString(payload.company),
    business_type:
      cleanString(payload.business_type) || cleanString(payload.industry),
    problem:
      cleanString(payload.problem) ||
      cleanString(payload.message) ||
      cleanString(payload.inquiry),
    source:
      cleanString(payload.source) ||
      cleanString(payload.utm_source) ||
      "client_webhook",
    requested_channels: normalizeRequestedChannels(payload.requested_channels),
  };
}

function classifyIntake({ payload, lead, registration, req }) {
  const joined = [
    lead.full_name,
    lead.email,
    lead.phone,
    lead.business_name,
    lead.business_type,
    lead.problem,
    lead.source,
    payload.consent_source,
    payload.source_page,
    payload.page_url,
    registration?.source_name,
    registration?.service_key,
    req.headers.get("user-agent") || "",
  ].map(lower).join(" ");
  const phoneDigits = String(lead.phone || "").replace(/\D/g, "");
  const markers = [];

  if (joined.includes("clientsurge.test") || joined.includes("clientsurge-install.internal") || joined.includes("@clientsurge.test") || joined.includes(".internal")) markers.push("internal_email_domain");
  if (joined.includes("backfill-test") || joined.includes("post_patch_verification") || joined.includes("runaibraininstallerbackfill")) markers.push("internal_backfill_run");
  if (joined.includes("crm_live_smoke_test") || joined.includes("smoke") || joined.includes("install_test") || joined.includes("admin_test_lead")) markers.push("internal_validation_run");
  if (joined.includes("sarah smoke") || joined.includes("client surge smoke") || joined.includes("clientsurge smoke") || joined.includes("test owner")) markers.push("internal_validation_name");
  if (phoneDigits.length >= 7 && phoneDigits.includes("555")) markers.push("reserved_phone_pattern");

  return {
    nonProduction: markers.length > 0,
    markers: [...new Set(markers)],
  };
}

function getHeader(headers, key) {
  return cleanString(headers.get(key) || headers.get(key.toUpperCase()) || "");
}

function validateTimestamp(timestamp) {
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.abs(nowSeconds - timestampNumber) <= SIGNATURE_WINDOW_SECONDS;
}

async function logRejectedAttempt(base44, {
  registration = null,
  reason,
  metadata = {},
}) {
  await base44.asServiceRole.entities.CommunicationEvent.create({
    client_project_id: registration?.client_project_id || undefined,
    channel: "webhook",
    direction: "inbound",
    event_type: "status_update",
    provider: "internal",
    status: "failed",
    subject: "Lead webhook rejected",
    message_body: reason,
    context_type: "lead_webhook_security",
    context_id: registration?.id || metadata.registration_id || "unmatched",
    metadata_json: JSON.stringify(metadata),
  }).catch(() => null);

  if (registration?.id) {
    await base44.asServiceRole.entities.WebhookRegistration.update(registration.id, {
      failure_count: Number(registration.failure_count || 0) + 1,
      last_error: reason,
    }).catch(() => null);
  }
}

async function verifySignedRegistration({ base44, headers, rawBody }) {
  const registrationId = getHeader(headers, "x-webhook-id");
  const timestamp = getHeader(headers, "x-webhook-timestamp");
  const signature = getHeader(headers, "x-webhook-signature");

  if (!registrationId || !timestamp || !signature) {
    return {
      ok: false,
      code: "lead_webhook_signature_missing",
      status: 401,
      reason: "Missing signed webhook headers.",
      metadata: { registration_id: registrationId || null },
    };
  }

  const registration = await base44.asServiceRole.entities.WebhookRegistration.get(
    registrationId
  ).catch(() => null);

  if (!registration) {
    return {
      ok: false,
      code: "lead_webhook_registration_not_found",
      status: 401,
      reason: "Webhook registration not found.",
      metadata: { registration_id: registrationId },
    };
  }

  if (registration.status !== "active") {
    return {
      ok: false,
      code: "lead_webhook_registration_inactive",
      status: 403,
      reason: "Webhook registration is inactive.",
      registration,
      metadata: {
        registration_id: registration.id,
        client_project_id: registration.client_project_id || null,
      },
    };
  }

  if (!cleanString(registration.client_project_id)) {
    return {
      ok: false,
      code: "lead_webhook_registration_unlinked",
      status: 409,
      reason: "Webhook registration is missing client_project_id.",
      registration,
      metadata: { registration_id: registration.id },
    };
  }

  if (!validateTimestamp(timestamp)) {
    return {
      ok: false,
      code: "lead_webhook_timestamp_invalid",
      status: 401,
      reason: "Webhook timestamp is outside the allowed verification window.",
      registration,
      metadata: { registration_id: registration.id, timestamp },
    };
  }

  try {
    const isValid = await validateWebhookSignature(rawBody, signature, registration.secret_key || "");
    if (!isValid) {
      return {
        ok: false,
        code: "lead_webhook_signature_invalid",
        status: 401,
        reason: "Webhook signature verification failed.",
        registration,
        metadata: {
          registration_id: registration.id,
          client_project_id: registration.client_project_id || null,
        },
      };
    }
  } catch (error) {
    return {
      ok: false,
      code: "lead_webhook_signature_error",
      status: 500,
      reason: "Webhook signature validation error.",
      registration,
      metadata: { registration_id: registration.id },
    };
  }

  return { ok: true, registration };
}

async function createCrmLead(base44, lead, project, intakeQuality) {
  // Check for duplicate using normalized email+phone before creating
  const existing = await base44.asServiceRole.entities.Leads.filter({
    normalized_email: lead.email?.toLowerCase() || "",
    normalized_phone: lead.phone || "",
  }).catch(() => []);
  
  if (existing && existing.length > 0) {
    return existing[0];
  }

  return base44.asServiceRole.entities.Leads.create({
    full_name: lead.full_name || "Unknown",
    business_name: lead.business_name || project.business_name || "Not provided",
    email: lead.email || "",
    phone: lead.phone || "",
    business_type: lead.business_type || "Not specified",
    problem: lead.problem || "Webhook submission",
    source: lead.source || "client_webhook",
    status: "New",
    lead_score: intakeQuality.nonProduction ? 0 : 50,
    activation_priority: intakeQuality.nonProduction ? "Low" : "Medium",
    intake_type: "webhook",
    assigned_to: project.contact_email || project.client_email || "",
    assigned_at: new Date().toISOString(),
    normalized_email: lead.email?.toLowerCase() || "",
    normalized_phone: lead.phone || "",
    quality_review_status: intakeQuality.nonProduction ? "quarantine_candidate" : undefined,
    quality_reason: intakeQuality.nonProduction ? `Non-production intake marker(s): ${intakeQuality.markers.join(", ")}` : undefined,
    quality_reason_codes: intakeQuality.nonProduction ? intakeQuality.markers : undefined,
    audited_at: intakeQuality.nonProduction ? new Date().toISOString() : undefined,
  });
}

async function invokeAutomationOrchestrator(base44, { leadId, projectId, triggerEvent }) {
  try {
    const result = await base44.asServiceRole.functions.invoke("automationOrchestrator", {
      lead_id: leadId,
      project_id: projectId,
      trigger_event: triggerEvent,
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      client_project_id: projectId,
      channel: "internal",
      direction: "internal",
      event_type: "workflow_triggered",
      provider: "automationOrchestrator",
      status: result?.success === false ? "failed" : "completed",
      subject: "AI workflow triggered from signed lead webhook",
      message_body: triggerEvent,
      metadata_json: JSON.stringify({
        trigger_event: triggerEvent,
        summary: result?.data?.summary || result?.summary || null,
      }),
    }).catch(() => null);

    return result;
  } catch (error) {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      client_project_id: projectId,
      channel: "internal",
      direction: "internal",
      event_type: "workflow_triggered",
      provider: "automationOrchestrator",
      status: "failed",
      subject: "AI workflow trigger failed",
      message_body: error.message,
      error_message: error.message,
      metadata_json: JSON.stringify({ trigger_event: triggerEvent }),
    }).catch(() => null);

    return null;
  }
}

function getBase44Client(req, base44Override) {
  if (base44Override) {
    return base44Override;
  }
  return createClientFromRequest(req);
}

export async function handleLeadCaptureWebhook(req, base44Override = null) {
  if (req.method !== "POST") {
    return secureJson({ error: "Method not allowed" }, { status: 405 });
  }

  const base44 = getBase44Client(req, base44Override);
  const rawBody = await req.text();

  let payload;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return secureJson({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const verification = await verifySignedRegistration({ base44, headers: req.headers, rawBody });

  if (!verification.ok) {
    await logRejectedAttempt(base44, {
      registration: verification.registration || null,
      reason: verification.reason,
      metadata: {
        ...verification.metadata,
        source_ip:
          getHeader(req.headers, "x-forwarded-for") ||
          getHeader(req.headers, "cf-connecting-ip") ||
          getHeader(req.headers, "x-real-ip") ||
          null,
      },
    });

    return secureJson(
      { success: false, code: verification.code, error: verification.reason },
      { status: verification.status }
    );
  }

  const registration = verification.registration;
  const lead = parseCapturePayload(payload);
  const intakeQuality = classifyIntake({ payload, lead, registration, req });

  if (!lead.email && !lead.phone) {
    return secureJson({ error: "Email or phone required" }, { status: 400 });
  }

  const project = await base44.asServiceRole.entities.ClientProject.get(
    registration.client_project_id
  ).catch(() => null);

  if (!project) {
    await logRejectedAttempt(base44, {
      registration,
      reason: "Webhook registration points to a missing client project.",
      metadata: {
        registration_id: registration.id,
        client_project_id: registration.client_project_id,
      },
    });

    return secureJson(
      {
        success: false,
        code: "lead_webhook_project_not_found",
        error: "Webhook registration points to a missing client project.",
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const websiteLead = await base44.asServiceRole.entities.WebsiteLead.create({
    full_name: lead.full_name,
    first_name: cleanString(lead.full_name.split(" ")[0] || ""),
    business_name: lead.business_name || project.business_name || "",
    business_type: lead.business_type,
    email: lead.email,
    phone_number: lead.phone,
    message: lead.problem,
    problem: lead.problem,
    source: lead.source,
    client_project_id: project.id,
    routing_key: registration.id,
    requested_channels: lead.requested_channels,
    consent_given: payload.consent_given === true,
    consent_given_at: payload.consent_given ? now : null,
    consent_source: cleanString(payload.consent_source || registration.source_name || "client_webhook"),
    consent_text_version: cleanString(payload.consent_text_version || "client_webhook_v1"),
    source_page: cleanString(payload.source_page || payload.page_url || ""),
    user_agent: cleanString(req.headers.get("user-agent") || ""),
    ip_address: cleanString(
      req.headers.get("x-forwarded-for") ||
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        ""
    ),
    lead_status: intakeQuality.nonProduction ? "ignored" : "new",
    automation_enabled: !intakeQuality.nonProduction,
    cadence_paused: intakeQuality.nonProduction,
    cadence_paused_at: intakeQuality.nonProduction ? now : null,
    archived: intakeQuality.nonProduction,
    archived_at: intakeQuality.nonProduction ? now : null,
    quality_notes: intakeQuality.nonProduction ? `non_production:${intakeQuality.markers.join(",")}` : "",
  });

  const crmLead = await createCrmLead(base44, lead, project, intakeQuality);
  await base44.asServiceRole.entities.WebsiteLead.update(websiteLead.id, {
    crm_lead_id: crmLead.id,
  }).catch(() => {});

  await base44.asServiceRole.entities.WebhookRegistration.update(registration.id, {
    last_triggered_at: now,
    last_error: "",
  }).catch(() => {});

  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: crmLead.id,
    client_project_id: project.id,
    service_key: cleanString(registration.service_key || "instant_lead_response"),
    channel: "webhook",
    direction: "inbound",
    event_type: "lead_created",
    provider: "internal",
    status: intakeQuality.nonProduction ? "skipped" : "received",
    subject: intakeQuality.nonProduction ? "Signed lead webhook stored as non-production" : "Signed lead webhook accepted",
    message_body: lead.problem || "Lead webhook received",
    context_type: "lead_webhook",
    context_id: registration.id,
    metadata_json: JSON.stringify({
      registration_id: registration.id,
      source_name: registration.source_name || "",
      website_lead_id: websiteLead.id,
      non_production: intakeQuality.nonProduction,
      markers: intakeQuality.markers,
      payload_summary: {
        email_present: Boolean(lead.email),
        phone_present: Boolean(lead.phone),
      },
    }),
  });

  if (!intakeQuality.nonProduction) {
    await invokeAutomationOrchestrator(base44, {
      leadId: crmLead.id,
      projectId: project.id,
      triggerEvent: "new_client_webhook_lead",
    });
  } else {
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: crmLead.id,
      client_project_id: project.id,
      channel: "internal",
      direction: "internal",
      event_type: "workflow_triggered",
      provider: "automationOrchestrator",
      status: "skipped",
      subject: "Automation skipped for non-production lead intake",
      message_body: intakeQuality.markers.join(", "),
      metadata_json: JSON.stringify({ markers: intakeQuality.markers }),
    }).catch(() => null);
  }

  return secureJson({
    success: true,
    website_lead_id: websiteLead.id,
    lead_id: crmLead.id,
    client_project_id: project.id,
    non_production: intakeQuality.nonProduction,
    markers: intakeQuality.markers,
    message: intakeQuality.nonProduction
      ? "Lead captured as non-production and excluded from automation."
      : "Lead captured and linked to canonical project routing.",
  });
}

if (import.meta.main) {
  Deno.serve((req) => handleLeadCaptureWebhook(req));
}

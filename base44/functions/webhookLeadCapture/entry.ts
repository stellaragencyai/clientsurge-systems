import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { loadAdminSettings } from "../_shared/adminSettings.js";
import { buildCommunicationEvent, buildInstallSnapshot } from "../_shared/installPipeline.js";
import { RuntimeExecutionError } from "../_shared/installRuntime.js";
import {
  enrollLeadInNurtureSequence,
  executeProductionInstantLeadResponse,
} from "../_shared/canonicalAutomationRuntime.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizePhone(value) {
  const digits = cleanString(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return value.startsWith("+") ? value : `+${digits}`;
}

function normalizeBusinessName(value) {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseCapturePayload(payload = {}) {
  const lead = payload?.lead && typeof payload.lead === "object" ? payload.lead : payload;
  return {
    name:
      cleanString(lead.full_name) ||
      cleanString(lead.name) ||
      cleanString(lead.contact_name) ||
      "Unknown Lead",
    email:
      normalizeEmail(lead.email) ||
      normalizeEmail(lead.contact_email),
    phone:
      normalizePhone(lead.phone) ||
      normalizePhone(lead.contact_phone),
    business_name:
      cleanString(lead.business_name) ||
      cleanString(lead.company) ||
      cleanString(payload.business_name),
    business_type:
      cleanString(lead.business_type) ||
      cleanString(lead.industry) ||
      "Not specified",
    problem:
      cleanString(lead.problem) ||
      cleanString(lead.message) ||
      cleanString(lead.inquiry) ||
      "Customer lead capture webhook",
    source:
      cleanString(lead.source) ||
      cleanString(lead.utm_source) ||
      cleanString(payload.event) ||
      "customer_webhook",
    intake_type:
      cleanString(lead.intake_type) ||
      "customer_webhook",
  };
}

function readPresentedSecret(req, payload) {
  const headerSecret =
    cleanString(req.headers.get("x-webhook-secret")) ||
    cleanString(req.headers.get("x-webhook-secret-token")) ||
    cleanString(req.headers.get("authorization")).replace(/^Bearer\s+/i, "");
  const bodySecret = cleanString(payload?.webhook_secret_token);
  return headerSecret || bodySecret;
}

function findServiceState(order, serviceKey) {
  return buildInstallSnapshot(order).serviceStates.find((service) => service.service_key === serviceKey) || null;
}

function orderSupportsCustomerLeadCapture(order) {
  return Boolean(
    findServiceState(order, "instant_lead_response") ||
    findServiceState(order, "nurture_sequence_14d")
  );
}

async function resolveOrderByProject(base44, projectId) {
  const orders = await base44.asServiceRole.entities.Order.filter(
    {
      client_project_id: projectId,
      payment_status: "paid",
    },
    "-created_date",
    20
  ).catch(() => []);

  const supported = (orders || []).filter((order) => orderSupportsCustomerLeadCapture(order));
  if (supported.length === 1) {
    return supported[0];
  }

  if (supported.length > 1) {
    throw new RuntimeExecutionError("Multiple paid customer lead-capture orders are linked to this project.", {
      status: 409,
      code: "ambiguous_customer_lead_capture_order",
    });
  }

  return null;
}

async function resolveOrderFromPayload(base44, payload) {
  const explicitOrderId =
    cleanString(payload?.order_id) ||
    cleanString(payload?.lead?.order_id) ||
    cleanString(payload?.order?.id);

  if (explicitOrderId) {
    const order = await base44.asServiceRole.entities.Order.get(explicitOrderId).catch(() => null);
    if (!order) {
      throw new RuntimeExecutionError("The provided order_id does not match an Order record.", {
        status: 404,
        code: "order_not_found",
      });
    }

    if (!orderSupportsCustomerLeadCapture(order)) {
      throw new RuntimeExecutionError("This order does not include a canonical customer lead-capture automation service.", {
        status: 409,
        code: "service_not_purchased",
      });
    }

    return order;
  }

  const projectId =
    cleanString(payload?.client_project_id) ||
    cleanString(payload?.project_id) ||
    cleanString(payload?.lead?.client_project_id) ||
    cleanString(payload?.lead?.project_id);

  if (projectId) {
    const projectOrder = await resolveOrderByProject(base44, projectId);
    if (projectOrder) {
      return projectOrder;
    }
  }

  throw new RuntimeExecutionError("A canonical customer lead-capture webhook must include order_id or a unique client_project_id.", {
    status: 400,
    code: "order_resolution_required",
  });
}

async function findExistingLeadForOrder(base44, {
  orderId,
  businessName,
  normalizedEmail,
  normalizedPhone,
}) {
  const leads = await base44.asServiceRole.entities.Leads.list("-created_date", 500).catch(() => []);
  const normalizedBusiness = normalizeBusinessName(businessName);

  return (leads || []).find((lead) => {
    const context = safeJsonParse(lead.automation_context_json, {});
    const sameOrder = context.order_id === orderId;
    const sameBusiness = normalizeBusinessName(lead.business_name) === normalizedBusiness;
    const emailMatch = normalizedEmail && normalizeEmail(lead.normalized_email || lead.email) === normalizedEmail;
    const phoneMatch = normalizedPhone && normalizePhone(lead.normalized_phone || lead.phone) === normalizedPhone;
    return (sameOrder || sameBusiness) && (emailMatch || phoneMatch);
  }) || null;
}

function buildLeadAutomationContext({ existingLead, order, payload, now }) {
  const existingContext = safeJsonParse(existingLead?.automation_context_json, {});
  return {
    ...existingContext,
    order_id: order.id,
    client_project_id: order.client_project_id || existingContext.client_project_id || null,
    customer_lead_capture: {
      received_at: now,
      latest_payload_at: now,
      latest_payload_source: cleanString(payload?.event) || "customer_webhook",
    },
  };
}

async function upsertOrderScopedLead(base44, { order, parsedLead, payload, now }) {
  const normalizedEmail = normalizeEmail(parsedLead.email);
  const normalizedPhone = normalizePhone(parsedLead.phone);
  const businessName =
    parsedLead.business_name ||
    cleanString(order.business_name) ||
    cleanString(order.customer_name) ||
    "Unknown Business";

  const existingLead = await findExistingLeadForOrder(base44, {
    orderId: order.id,
    businessName,
    normalizedEmail,
    normalizedPhone,
  });

  const patch = {
    full_name: parsedLead.name,
    business_name: businessName,
    email: normalizedEmail,
    phone: normalizedPhone,
    business_type: parsedLead.business_type,
    problem: parsedLead.problem,
    source: parsedLead.source,
    intake_type: parsedLead.intake_type,
    status: existingLead?.status || "New",
    lead_score: existingLead?.lead_score ?? 50,
    activation_priority: existingLead?.activation_priority || "Medium",
    normalized_email: normalizedEmail,
    normalized_phone: normalizedPhone,
    normalized_business_name: normalizeBusinessName(businessName),
    dedupe_key:
      normalizedEmail
        ? `email:${normalizedEmail}`
        : normalizedPhone
        ? `phone:${normalizedPhone}`
        : "",
    automation_context_json: JSON.stringify(
      buildLeadAutomationContext({
        existingLead,
        order,
        payload,
        now,
      })
    ),
    last_activity_at: now,
  };

  if (existingLead) {
    const updatedLead = await base44.asServiceRole.entities.Leads.update(existingLead.id, patch);
    return { lead: updatedLead, created: false };
  }

  const createdLead = await base44.asServiceRole.entities.Leads.create({
    ...patch,
    assigned_to: cleanString(order.customer_email) || undefined,
    assigned_at: cleanString(order.customer_email) ? now : undefined,
  });

  return { lead: createdLead, created: true };
}

async function logInboundLeadCapture(base44, { order, lead, payload, now }) {
  const serviceKey = findServiceState(order, "instant_lead_response")
    ? "instant_lead_response"
    : "nurture_sequence_14d";
  return base44.asServiceRole.entities.CommunicationEvent.create({
    ...buildCommunicationEvent({
      order,
      service_key: serviceKey,
      channel: "webhook",
      direction: "inbound",
      event_type: "lead_created",
      provider: "internal",
      status: "received",
      subject: "Customer lead captured",
      message_body: lead.problem || "Customer lead capture webhook received.",
      metadata: {
        production_runtime: true,
        runtime_type: "customer_lead_capture_webhook",
        trigger_source: "customer_lead_capture_webhook",
        lead_id: lead.id,
        payload_keys: Object.keys(payload || {}),
        received_at: now,
      },
    }),
    lead_id: lead.id,
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { settings } = await loadAdminSettings(base44);
    const expectedSecret =
      cleanString(settings.webhook_secret_token) ||
      cleanString(Deno.env.get("LEAD_CAPTURE_WEBHOOK_SECRET"));
    const presentedSecret = readPresentedSecret(req, payload);

    if (!expectedSecret) {
      return Response.json(
        {
          error: "Customer lead-capture webhook secret is not configured.",
          code: "webhook_secret_not_configured",
        },
        { status: 503 }
      );
    }

    if (!presentedSecret || presentedSecret !== expectedSecret) {
      return Response.json(
        {
          error: "Webhook signature verification failed.",
          code: "webhook_signature_invalid",
        },
        { status: 401 }
      );
    }

    const parsedLead = parseCapturePayload(payload);
    if (!parsedLead.email && !parsedLead.phone) {
      return Response.json(
        {
          error: "Email or phone is required.",
          code: "lead_identity_required",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const order = await resolveOrderFromPayload(base44, payload);
    const { lead, created } = await upsertOrderScopedLead(base44, {
      order,
      parsedLead,
      payload,
      now,
    });

    await logInboundLeadCapture(base44, {
      base44,
      order,
      lead,
      payload,
      now,
    });

    let instantResult = null;
    try {
      instantResult = await executeProductionInstantLeadResponse({
        base44,
        order,
        lead,
        runtimeType: "customer_lead_capture_runtime",
        triggerSource: "customer_lead_capture_webhook",
        now,
      });
    } catch (error) {
      if (!(error instanceof RuntimeExecutionError) || error.code !== "duplicate_prevented") {
        throw error;
      }

      instantResult = {
        success: true,
        duplicate_prevented: true,
        code: error.code,
      };
    }

    const nurtureEnrollment = await enrollLeadInNurtureSequence({
      base44,
      order,
      lead,
      now,
    });

    return Response.json({
      success: true,
      order_id: order.id,
      lead_id: lead.id,
      lead_created: created,
      runtime: {
        instant_lead_response: instantResult,
        nurture_sequence_14d: nurtureEnrollment,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process customer lead capture webhook";
    const status = error instanceof RuntimeExecutionError ? error.status || 409 : 500;
    const code = error instanceof RuntimeExecutionError ? error.code : "lead_capture_runtime_failed";
    return Response.json(
      {
        error: message,
        code,
        details: error instanceof RuntimeExecutionError ? error.details : undefined,
      },
      { status }
    );
  }
});

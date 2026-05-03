/**
 * Webhook: /webhooks/lead-capture
 * Handles incoming lead data from forms, API integrations, and call tracking
 * Triggers instant SMS response and lead creation automation
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // #86: Webhook secret validation — must pass X-Webhook-Secret header
  const webhookSecret = req.headers.get("x-webhook-secret") || req.headers.get("X-Webhook-Secret");
  const configuredSecret = Deno.env.get("WEBHOOK_SECRET");
  if (configuredSecret && webhookSecret !== configuredSecret) {
    return Response.json({ error: "Unauthorized — invalid webhook secret" }, { status: 401 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log("[LeadCapture] Received webhook:", JSON.stringify(payload, null, 2));

    // Parse incoming data (supports multiple formats)
    const lead = parseCapturePayload(payload);

    if (!lead.email && !lead.phone) {
      return Response.json(
        { error: "Email or phone required" },
        { status: 400 }
      );
    }

    // 1. Get client project from webhook context or find by domain/identifier
    const project = await findClientProject(base44, payload, lead);
    if (!project) {
      console.warn("[LeadCapture] No matching project found, skipping");
      return Response.json({
        success: false,
        message: "No matching project configuration found",
      });
    }

    // 2. Create or update lead record
    const createdLead = await base44.asServiceRole.entities.Leads.create({
      full_name: lead.name || "Unknown",
      business_name: lead.business || "Not provided",
      email: lead.email || "",
      phone: lead.phone || "",
      business_type: lead.business_type || "Not specified",
      problem: lead.problem || payload.message || "Form submission",
      source: lead.source || "form_submission",
      status: "New",
      lead_score: 50, // Default score
      activation_priority: "Medium",
      intake_type: "form",
      assigned_to: project.owner_email,
      created_date: new Date().toISOString(),
    });

    console.log("[LeadCapture] Created lead:", createdLead.id);

    // 3. Log communication event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: createdLead.id,
      client_project_id: project.id,
      service_key: "instant_lead_response",
      channel: "form",
      direction: "inbound",
      event_type: "lead_created",
      provider: "internal",
      status: "received",
      message_body: lead.problem || payload.message,
      metadata_json: JSON.stringify(payload),
    });

    // 4. Trigger instant SMS response if configured
    const serviceConfig = project.install_configuration?.services?.instant_lead_response;
    if (serviceConfig?.enabled && lead.phone) {
      await triggerInstantResponse(base44, createdLead, project, serviceConfig);
    }

    // 5. Trigger lead assignment workflow
    await triggerLeadAssignment(base44, createdLead, project);

    return Response.json({
      success: true,
      lead_id: createdLead.id,
      message: "Lead captured and instant response triggered",
    });
  } catch (error) {
    console.error("[LeadCapture] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

function parseCapturePayload(payload) {
  // Support multiple webhook formats
  return {
    name: payload.full_name || payload.name || payload.contact_name || "",
    email: payload.email || payload.contact_email || "",
    phone: payload.phone || payload.contact_phone || "",
    business: payload.business_name || payload.company || "",
    business_type: payload.business_type || payload.industry || "",
    problem: payload.problem || payload.message || payload.inquiry || "",
    source: payload.source || payload.utm_source || "unknown",
  };
}

async function findClientProject(base44, payload, lead) {
  // Try to match by project_id in payload first
  if (payload.project_id) {
    try {
      return await base44.asServiceRole.entities.ClientProject.get(payload.project_id);
    } catch {
      console.warn("[LeadCapture] Project ID not found:", payload.project_id);
    }
  }

  // Try to match by webhook registration
  if (payload.webhook_key) {
    const webhook = await base44.asServiceRole.entities.WebhookRegistration.filter(
      { webhook_registered: true, service_key: "instant_lead_response" },
      "-created_at",
      1
    );

    if (webhook?.length > 0) {
      const order = await base44.asServiceRole.entities.Order.filter(
        { id: webhook[0].order_id },
        "-created_date",
        1
      );

      if (order?.length > 0 && order[0].client_id) {
        return await base44.asServiceRole.entities.ClientProject.get(order[0].client_id);
      }
    }
  }

  // Default: return first active project (for testing)
  const projects = await base44.asServiceRole.entities.ClientProject.filter(
    { status: "Active" },
    "-created_date",
    1
  );

  return projects?.[0] || null;
}

async function triggerInstantResponse(base44, lead, project, serviceConfig) {
  console.log("[LeadCapture] Triggering instant SMS response");

  // Get template
  const template = await base44.asServiceRole.entities.MessageTemplate.get(
    serviceConfig.sms_template_id
  ).catch(() => null);

  if (!template) {
    console.warn("[LeadCapture] SMS template not found, skipping");
    return;
  }

  // Fill template variables
  const messageBody = fillTemplate(template.body, {
    name: lead.full_name,
    business: project.business_name,
    response_time: "within 1 hour",
  });

  // Queue SMS send job
  await base44.asServiceRole.entities.AutomationJob.create({
    lead_id: lead.id,
    job_type: "instant_sms",
    trigger_event: "lead_created",
    status: "queued",
    scheduled_for: new Date().toISOString(),
    result_metadata: JSON.stringify({
      template_id: serviceConfig.sms_template_id,
      recipient_phone: lead.phone,
      message_body: messageBody,
    }),
  });

  // Log communication
  await base44.asServiceRole.entities.CommunicationEvent.create({
    lead_id: lead.id,
    client_project_id: project.id,
    service_key: "instant_lead_response",
    channel: "sms",
    direction: "outbound",
    event_type: "sms_sent",
    provider: "twilio",
    status: "pending",
    message_body: messageBody,
  });

  console.log("[LeadCapture] SMS queued for:", lead.phone);
}

async function triggerLeadAssignment(base44, lead, project) {
  console.log("[LeadCapture] Triggering lead assignment workflow");

  // Create assignment task
  await base44.asServiceRole.entities.AutomationJob.create({
    lead_id: lead.id,
    job_type: "lead_assignment",
    trigger_event: "lead_created",
    status: "queued",
    scheduled_for: new Date().toISOString(),
    result_metadata: JSON.stringify({
      assigned_to: project.owner_email,
      priority: "High",
    }),
  });

  // Update lead with assignment
  await base44.asServiceRole.entities.Leads.update(lead.id, {
    assigned_to: project.owner_email,
    assigned_at: new Date().toISOString(),
  });
}

function fillTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  return result;
}
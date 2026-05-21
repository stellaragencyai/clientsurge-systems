/**
 * Canonical website lead intake.
 * Stores top-of-funnel submissions in WebsiteLead only.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildDedupKey,
  cleanString,
  createLeadCaptureRateLimiter,
  findDuplicateWebsiteLead,
  isDisposableEmail,
  isValidEmail,
  MAX_LEAD_CAPTURE_BYTES,
  MAX_PROBLEM_LENGTH,
  maskIpAddress,
  normalizeEmail,
  normalizePhone,
  normalizeRequestedChannels,
  normalizeSourcePage,
} from "./leadCapture.shared.js";

const rateLimiter = createLeadCaptureRateLimiter();

function normalizeUtmParams(body: Record<string, unknown>) {
  return {
    utm_source: cleanString(body.utm_source),
    utm_medium: cleanString(body.utm_medium),
    utm_campaign: cleanString(body.utm_campaign),
    utm_content: cleanString(body.utm_content),
    utm_term: cleanString(body.utm_term),
  };
}

async function createCrmLeadFromWebsiteLead(base44: any, lead: any) {
  return base44.asServiceRole.entities.Leads.create({
    full_name: lead.full_name || lead.first_name || "Unknown",
    business_name: lead.business_name || "Not provided",
    email: lead.email || "",
    phone: lead.phone_number || "",
    business_type: lead.business_type || "Not specified",
    problem: lead.problem || lead.message || "Website submission",
    source: lead.source || "website_form",
    utm_source: lead.utm_source || "",
    utm_medium: lead.utm_medium || "",
    utm_campaign: lead.utm_campaign || "",
    utm_content: lead.utm_content || "",
    utm_term: lead.utm_term || "",
    status: "New",
    lead_score: 50,
    activation_priority: "Medium",
    intake_type: "lead_capture",
    website_lead_id: lead.id,
    assigned_at: new Date().toISOString(),
  });
}

async function invokeAutomationOrchestrator(
  base44: any,
  { leadId, projectId = null, triggerEvent }: { leadId: string; projectId?: string | null; triggerEvent: string }
) {
  try {
    const result = await base44.asServiceRole.functions.invoke("automationOrchestrator", {
      lead_id: leadId,
      project_id: projectId,
      trigger_event: triggerEvent,
    });

    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      client_project_id: projectId || undefined,
      channel: "internal",
      direction: "internal",
      event_type: "workflow_triggered",
      provider: "automationOrchestrator",
      status: result?.success === false ? "failed" : "completed",
      subject: "AI workflow triggered from website lead capture",
      message_body: triggerEvent,
      metadata_json: JSON.stringify({
        trigger_event: triggerEvent,
        summary: result?.data?.summary || result?.summary || null,
      }),
    }).catch(() => null);

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await base44.asServiceRole.entities.CommunicationEvent.create({
      lead_id: leadId,
      client_project_id: projectId || undefined,
      channel: "internal",
      direction: "internal",
      event_type: "workflow_triggered",
      provider: "automationOrchestrator",
      status: "failed",
      subject: "AI workflow trigger failed",
      message_body: errorMsg,
      error_message: errorMsg,
      metadata_json: JSON.stringify({ trigger_event: triggerEvent }),
    }).catch(() => null);

    return null;
  }
}

function getClientIp(req: Request) {
  return cleanString(
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown"
  );
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > MAX_LEAD_CAPTURE_BYTES) {
      return Response.json({ error: "Submission is too large" }, { status: 413 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().includes("application/json")) {
      return Response.json({ error: "JSON body required" }, { status: 415 });
    }

    const base44 = createClientFromRequest(req);
    const ip = getClientIp(req);
    if (rateLimiter.isRateLimited(ip)) {
      return Response.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (cleanString(body.website_url)) {
      return Response.json({
        success: true,
        deduplicated: true,
        reason: "bot_detected",
      });
    }

    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone || body.phone_number);
    if (!email && !phone) {
      return Response.json(
        { error: "phone or email required" },
        { status: 400 }
      );
    }

    if (email && !isValidEmail(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 422 });
    }

    if (email && isDisposableEmail(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 422 });
    }

    const recentWebsiteLeads = await base44.asServiceRole.entities.WebsiteLead.list(
      "-created_date",
      100
    ).catch(() => []);
    const duplicate = findDuplicateWebsiteLead({
      leads: recentWebsiteLeads,
      email,
      phone,
    });

    if (duplicate) {
      return Response.json({
        success: true,
        deduplicated: true,
        reason: "duplicate_60min",
        lead_id: duplicate.id,
      });
    }

    const now = new Date().toISOString();
    const consentGiven = body.consent_given === true;
    const utmParams = normalizeUtmParams(body);
    const lead = await base44.asServiceRole.entities.WebsiteLead.create({
      full_name: cleanString(body.full_name),
      first_name: cleanString(body.first_name || body.full_name?.split?.(" ")?.[0]),
      business_name: cleanString(body.business_name),
      business_type: cleanString(body.business_type || body.niche),
      email,
      phone_number: phone,
      service_interest: cleanString(body.service_interest || "demo_request"),
      message: cleanString(body.message || body.problem || "", MAX_PROBLEM_LENGTH),
      problem: cleanString(body.problem || body.message || "", MAX_PROBLEM_LENGTH),
      source: cleanString(body.source || "website_form"),
      ...utmParams,
      lead_status: "new",
      dedup_key: buildDedupKey({ email, phone }),
      requested_channels: normalizeRequestedChannels(body.requested_channels),
      consent_given: consentGiven,
      consent_given_at: consentGiven ? now : null,
      consent_source: cleanString(body.consent_source || "website_form"),
      consent_text_version: cleanString(body.consent_text_version || "lead_capture_v1"),
      source_page: normalizeSourcePage(body.source_page),
      user_agent: cleanString(req.headers.get("user-agent") || ""),
      ip_address: maskIpAddress(
        req.headers.get("x-forwarded-for") ||
          req.headers.get("cf-connecting-ip") ||
          req.headers.get("x-real-ip") ||
          ""
      ),
    });

    const crmLead = await createCrmLeadFromWebsiteLead(base44, lead);
    await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
      crm_lead_id: crmLead.id,
    }).catch(() => {});
    await invokeAutomationOrchestrator(base44, {
      leadId: crmLead.id,
      triggerEvent: "new_website_lead",
    });

    return Response.json({
      success: true,
      lead_id: lead.id,
      crm_lead_id: crmLead.id,
      deduplicated: false,
    });
  } catch (error) {
    console.error("[submitLeadCapture] submission failed", error);
    return Response.json({ error: "Lead submission failed" }, { status: 500 });
  }
});

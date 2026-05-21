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
  normalizeEmail,
  normalizePhone,
} from "./leadCapture.shared.js";

const rateLimiter = createLeadCaptureRateLimiter();

function normalizeRequestedChannels(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => cleanString(entry).toLowerCase()).filter(Boolean))];
}

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
    const base44 = createClientFromRequest(req);
    const ip = getClientIp(req);
    if (rateLimiter.isRateLimited(ip)) {
      return Response.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }
    const body = await req.json();

    if (cleanString(body.website_url)) {
      return Response.json({
        success: true,
        deduplicated: true,
        reason: "bot_detected",
      });
    }

    const email = normalizeEmail(body.email);
    const rawPhone = cleanString(body.phone || body.phone_number);
    const phone = normalizePhone(rawPhone);
    if (rawPhone && !phone) {
      return Response.json({ error: "Invalid phone number" }, { status: 422 });
    }
    if (!email && !phone) {
      return Response.json(
        { error: "phone or email required" },
        { status: 400 }
      );
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
      message: cleanString(body.message || body.problem || ""),
      problem: cleanString(body.problem || body.message || ""),
      source: body.source || "website_form",
      ...utmParams,
      lead_status: "new",
      dedup_key: buildDedupKey({ email, phone }),
      requested_channels: normalizeRequestedChannels(body.requested_channels),
      consent_given: consentGiven,
      consent_given_at: consentGiven ? now : null,
      consent_source: cleanString(body.consent_source || "website_form"),
      consent_text_version: cleanString(body.consent_text_version || "lead_capture_v1"),
      source_page: cleanString(body.source_page || req.headers.get("origin") || ""),
      user_agent: cleanString(req.headers.get("user-agent") || ""),
      ip_address: cleanString(
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
    const errorMsg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: errorMsg }, { status: 500 });
  }
});

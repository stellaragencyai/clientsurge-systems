import { secureJson } from "../_shared/response.ts";
/**
 * Canonical website lead intake.
 * Stores top-of-funnel submissions in WebsiteLead only.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { validatePublicFormOrigin } from "../_shared/publicFormOriginGuard.js";
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

function normalizeIndustrySlug(value: unknown) {
  return cleanString(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function inferIndustrySlug(body: Record<string, unknown>) {
  const explicit = normalizeIndustrySlug(body.industry_slug);
  if (explicit) return explicit;

  const businessType = normalizeIndustrySlug(body.business_type || body.niche);
  if (businessType.includes("roof")) return "roofing";
  if (businessType.includes("hvac")) return "hvac";
  if (businessType.includes("dental")) return "dental";
  if (businessType.includes("med_spa") || businessType.includes("aesthetic")) return "med_spa";
  if (businessType.includes("plumb")) return "plumbing";
  if (businessType.includes("chiropractic")) return "chiropractic";
  if (businessType.includes("contractor")) return "contractors";
  return businessType;
}

function normalizeIndustryTags(value: unknown, industrySlug = "") {
  const rawTags = Array.isArray(value) ? value : [];
  const tags = rawTags.map((entry) => normalizeIndustrySlug(entry)).filter(Boolean);
  if (industrySlug) tags.push(industrySlug);
  if (industrySlug === "roofing") {
    tags.push("roofing_landing_page", "roofing_lead", "free_roofing_automation_audit");
  }
  if (industrySlug === "hvac") {
    tags.push("hvac_landing_page", "hvac_lead", "free_hvac_automation_audit");
  }
  if (industrySlug === "dental") {
    tags.push("dental_landing_page", "dental_lead", "free_dental_automation_audit");
  }
  if (industrySlug === "med_spa") {
    tags.push("med_spa_landing_page", "med_spa_lead", "free_med_spa_automation_audit");
  }
  if (industrySlug === "plumbing") {
    tags.push("plumbing_landing_page", "plumbing_lead", "free_plumbing_automation_audit");
  }
  return [...new Set(tags)];
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

function leadScoreForIndustry(industrySlug: string) {
  if (industrySlug === "roofing") return 75;
  if (industrySlug === "hvac") return 72;
  if (industrySlug === "dental") return 70;
  if (industrySlug === "med_spa") return 70;
  if (industrySlug === "plumbing") return 72;
  return 50;
}

function crmTagForIndustry(industrySlug: string) {
  if (industrySlug === "roofing") return "roofing_lead";
  if (industrySlug === "hvac") return "hvac_lead";
  if (industrySlug === "dental") return "dental_lead";
  if (industrySlug === "med_spa") return "med_spa_lead";
  if (industrySlug === "plumbing") return "plumbing_lead";
  return industrySlug || "";
}

function mergeSourceHistory(existing: unknown, nextSource: string, pageSubmittedFrom = "") {
  const values = Array.isArray(existing) ? existing : [];
  return [
    ...new Set(
      [
        ...values,
        nextSource,
        pageSubmittedFrom ? `page:${pageSubmittedFrom}` : "",
      ].map((entry) => cleanString(entry)).filter(Boolean)
    ),
  ];
}

async function findExistingCrmLead(base44: any, { email, phone }: { email: string; phone: string }) {
  if (email) {
    const matches = await base44.asServiceRole.entities.Leads.filter({ email }, "-created_date", 5).catch(() => []);
    if (matches?.length === 1) return matches[0];
  }

  if (phone) {
    const matches = await base44.asServiceRole.entities.Leads.filter({ phone }, "-created_date", 5).catch(() => []);
    if (matches?.length === 1) return matches[0];
  }

  return null;
}

async function createCrmLeadFromWebsiteLead(base44: any, lead: any) {
  const industrySlug = normalizeIndustrySlug(lead.industry_slug || lead.business_type);
  const now = new Date().toISOString();
  const existing = await findExistingCrmLead(base44, {
    email: normalizeEmail(lead.email),
    phone: normalizePhone(lead.phone_number),
  });
  const score = leadScoreForIndustry(industrySlug);
  const industryTags = normalizeIndustryTags(lead.industry_tags, industrySlug);
  const payload = {
    full_name: lead.full_name || lead.first_name || "Unknown",
    owner_contact_name: lead.full_name || lead.first_name || "Unknown",
    business_name: lead.business_name || "Not provided",
    email: lead.email || "",
    phone: lead.phone_number || "",
    business_type: lead.business_type || "Not specified",
    industry: industrySlug || lead.business_type || "Not specified",
    website: lead.business_website_url || "",
    website_url: lead.business_website_url || "",
    problem: lead.problem || lead.message || "Website submission",
    source: existing?.source || lead.source || "website_form",
    source_page: lead.source_page || "",
    source_history: mergeSourceHistory(existing?.source_history, lead.source || "website_form", lead.source_page || ""),
    utm_source: lead.utm_source || "",
    utm_medium: lead.utm_medium || "",
    utm_campaign: lead.utm_campaign || "",
    utm_content: lead.utm_content || "",
    utm_term: lead.utm_term || "",
    requested_channels: lead.requested_channels || [],
    consent_given: Boolean(lead.consent_given),
    consent_given_at: lead.consent_given_at || null,
    consent_ip: lead.consent_ip || lead.ip_address || "",
    consent_source: lead.consent_source || "",
    consent_text_version: lead.consent_text_version || "",
    status: existing?.status || "New",
    crm_stage: existing?.crm_stage || "Not Contacted",
    lead_score: Math.max(Number(existing?.lead_score) || 0, score),
    activation_priority: score >= 70 ? "High" : "Medium",
    lead_category: score >= 70 ? "High-Value" : "Standard",
    intake_type: "lead_capture",
    website_lead_id: lead.id,
    industry_tags: [...new Set([...(Array.isArray(existing?.industry_tags) ? existing.industry_tags : []), ...industryTags])],
    assigned_agent_name: industrySlug ? `sales_rep_${industrySlug}` : undefined,
    assigned_at: existing?.assigned_at || now,
    page_submitted_from: lead.source_page || "",
    package_interest: lead.service_interest || "",
    crm_tag: lead.crm_tag || crmTagForIndustry(industrySlug),
    notes: [existing?.notes, lead.message || lead.problem].filter(Boolean).join("\n\n").trim(),
    normalized_email: normalizeEmail(lead.email),
    normalized_phone: normalizePhone(lead.phone_number),
    last_activity_at: now,
  };

  if (existing?.id) {
    return base44.asServiceRole.entities.Leads.update(existing.id, payload);
  }

  return base44.asServiceRole.entities.Leads.create(payload);
}

async function invokeInitialWebsiteLeadResponse(base44: any, leadId: string, consentGiven: boolean) {
  if (!consentGiven) {
    return { attempted: false, skipped: true, reason: "consent_not_given" };
  }

  try {
    const result = await base44.asServiceRole.functions.invoke("sendWebsiteLeadResponse", {
      lead_id: leadId,
      source: "submitLeadCapture",
    });
    return { attempted: true, success: result?.success !== false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_id: leadId,
      context_type: "website_lead",
      channel: "internal",
      direction: "internal",
      event_type: "workflow_triggered",
      provider: "sendWebsiteLeadResponse",
      status: "failed",
      subject: "Initial website lead response failed",
      message_body: message,
      error_message: message,
      metadata_json: JSON.stringify({ source: "submitLeadCapture" }),
    }).catch(() => null);
    return { attempted: true, success: false, error: message };
  }
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
    const originGuard = validatePublicFormOrigin(req);
    if (!originGuard.ok) {
      return secureJson({ error: originGuard.error }, { status: originGuard.status });
    }

    const base44 = createClientFromRequest(req);
    const ip = getClientIp(req);
    if (rateLimiter.isRateLimited(ip)) {
      return secureJson(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }
    const body = await req.json();

    if (cleanString(body.website_url)) {
      return secureJson({
        success: true,
        deduplicated: true,
        reason: "bot_detected",
      });
    }

    const email = normalizeEmail(body.email);
    const rawPhone = cleanString(body.phone || body.phone_number);
    const phone = normalizePhone(rawPhone);
    if (rawPhone && !phone) {
      return secureJson({ error: "Invalid phone number" }, { status: 422 });
    }
    if (!email && !phone) {
      return secureJson(
        { error: "phone or email required" },
        { status: 400 }
      );
    }

    if (email && isDisposableEmail(email)) {
      return secureJson({ error: "Invalid email address" }, { status: 422 });
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
      return secureJson({
        success: true,
        deduplicated: true,
        reason: "duplicate_60min",
        lead_id: duplicate.id,
      });
    }

    const now = new Date().toISOString();
    const consentGiven = body.consent_given === true;
    const utmParams = normalizeUtmParams(body);
    const industrySlug = inferIndustrySlug(body);
    const industryTags = normalizeIndustryTags(body.industry_tags, industrySlug);
    const lead = await base44.asServiceRole.entities.WebsiteLead.create({
      full_name: cleanString(body.full_name),
      first_name: cleanString(body.first_name || body.full_name?.split?.(" ")?.[0]),
      business_name: cleanString(body.business_name),
      business_type: cleanString(body.business_type || body.niche),
      business_website_url: cleanString(body.business_website_url || body.website),
      industry_slug: industrySlug,
      industry_tags: industryTags,
      email,
      phone_number: phone,
      service_interest: cleanString(body.service_interest || (industrySlug ? `${industrySlug}_automation_audit` : "demo_request")),
      message: cleanString(body.message || body.problem || ""),
      problem: cleanString(body.problem || body.message || ""),
      source: cleanString(body.source || "website_form"),
      ...utmParams,
      lead_status: "new",
      dedup_key: buildDedupKey({ email, phone }),
      requested_channels: normalizeRequestedChannels(body.requested_channels),
      consent_given: consentGiven,
      consent_given_at: consentGiven ? now : null,
      consent_ip: ip,
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
    const initialResponse = await invokeInitialWebsiteLeadResponse(base44, lead.id, consentGiven);
    await invokeAutomationOrchestrator(base44, {
      leadId: crmLead.id,
      triggerEvent: "new_website_lead",
    });

    return secureJson({
      success: true,
      lead_id: lead.id,
      crm_lead_id: crmLead.id,
      industry_slug: industrySlug,
      industry_tags: industryTags,
      initial_response: initialResponse,
      deduplicated: false,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return secureJson({ error: errorMsg }, { status: 500 });
  }
});

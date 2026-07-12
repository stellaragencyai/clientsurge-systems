import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { validatePublicFormOrigin } from "../_shared/publicFormOriginGuard.js";

const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1500;
const MAX_NOTES_LENGTH = 4000;
const DUPLICATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CONTACT_SOURCE = "contact_page";
const CONTACT_SOURCE_PAGE = "/contact";

function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
    },
  });
}

function clean(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  return String(value || "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value: unknown) {
  return clean(value, 320).toLowerCase();
}

function normalizePhone(value: unknown) {
  const digits = clean(value, 80).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : "";
}

function normalizeBusinessName(value: unknown) {
  return clean(value, 240)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeWebsite(value: unknown) {
  const raw = clean(value, 500);
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function normalizeIndustrySlug(value: unknown) {
  const slug = clean(value, 160)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (slug.includes("roof")) return "roofing";
  if (slug.includes("hvac")) return "hvac";
  if (slug.includes("plumb")) return "plumbing";
  if (slug.includes("dental") || slug.includes("orthodont")) return "dental";
  if (slug.includes("med_spa") || slug.includes("aesthetic")) return "med_spa";
  if (slug.includes("chiropr") || slug.includes("physical_therapy")) return "chiropractic";
  if (slug.includes("contract")) return "contractors";
  return slug || "general";
}

function canonicalIndustryLabel(slug: string, fallback: string) {
  return {
    roofing: "Roofing & Restoration",
    hvac: "HVAC",
    plumbing: "Plumbing",
    dental: "Dental & Orthodontics",
    med_spa: "Med Spa & Aesthetics",
    chiropractic: "Chiropractic & Rehabilitation",
    contractors: "Contractors & Trades",
  }[slug] || fallback || "Professional Services";
}

function normalizedDomain(website: string, email: string) {
  try {
    if (website) return new URL(website).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    // Fall through to the email domain.
  }
  return email.includes("@") ? email.split("@").pop() || "" : "";
}

function normalizedPayload(raw: Record<string, unknown>) {
  const fullName = clean(raw.full_name, 200);
  const businessType = clean(raw.business_type || raw.industry, 160);
  const industrySlug = normalizeIndustrySlug(businessType);
  const email = normalizeEmail(raw.email);
  const phone = normalizePhone(raw.phone || raw.phone_number);
  const website = normalizeWebsite(
    raw.business_website_url || raw.business_website || raw.website || raw.url,
  );
  return {
    full_name: fullName,
    first_name: clean(raw.first_name, 100) || fullName.split(/\s+/)[0] || "",
    business_name: clean(raw.business_name, 240),
    normalized_business_name: normalizeBusinessName(raw.business_name),
    email,
    phone,
    business_type: businessType,
    industry_slug: industrySlug,
    industry: canonicalIndustryLabel(industrySlug, businessType),
    message: clean(raw.message || raw.problem, MAX_MESSAGE_LENGTH),
    website,
    honeypot: clean(
      raw.website_url || raw.website_hp || raw.website_honeypot || raw.company_website_hp,
      300,
    ),
    source_page: clean(raw.source_page, 240) || CONTACT_SOURCE_PAGE,
    utm_source: clean(raw.utm_source, 200),
    utm_medium: clean(raw.utm_medium, 200),
    utm_campaign: clean(raw.utm_campaign, 200),
    utm_content: clean(raw.utm_content, 200),
    utm_term: clean(raw.utm_term, 200),
    referrer: clean(raw.referrer, 1000),
    consent_given: raw.consent_given === true || raw.consent_given === "true",
    consent_source: clean(raw.consent_source, 160) || "contact_page_form",
    consent_text_version: clean(raw.consent_text_version, 160) || "contact_form_explicit_consent_v1",
  };
}

function validate(payload: ReturnType<typeof normalizedPayload>) {
  const errors: string[] = [];
  if (!payload.full_name) errors.push("Full name is required");
  if (!payload.business_name) errors.push("Business name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push("A valid email is required");
  if (!payload.phone) errors.push("A valid phone number is required");
  if (!payload.business_type) errors.push("Business type is required");
  if (!payload.message) errors.push("Message is required");
  if (!payload.consent_given) errors.push("Consent is required so we can respond to your inquiry");
  return errors;
}

function getRequestIp(req: Request) {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
}

function getUserAgent(req: Request) {
  return clean(req.headers.get("user-agent"), 500);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appendNotes(existing: unknown, line: string) {
  const previous = clean(existing, MAX_NOTES_LENGTH);
  return [previous, line].filter(Boolean).join("\n").slice(-MAX_NOTES_LENGTH);
}

function mergeSourceHistory(existing: Record<string, unknown> | null, payload: ReturnType<typeof normalizedPayload>) {
  const previous = Array.isArray(existing?.source_history)
    ? existing.source_history.map(String)
    : existing?.source_history
      ? [String(existing.source_history)]
      : [];
  const current = [
    CONTACT_SOURCE,
    payload.source_page ? `page:${payload.source_page}` : "",
    payload.utm_source ? `utm_source:${payload.utm_source}` : "",
    payload.utm_campaign ? `utm_campaign:${payload.utm_campaign}` : "",
    payload.referrer ? `referrer:${payload.referrer}` : "",
  ].filter(Boolean);
  return [...new Set([...previous, ...current])].slice(-25);
}

function isAdvancedLead(existing: Record<string, unknown> | null) {
  return Boolean(
    existing && (
      ["Booked", "Closed"].includes(String(existing.status || "")) ||
      ["Audit Booked", "Audit Completed", "Proposal Sent", "Won Pending Payment", "Won"].includes(String(existing.crm_stage || "")) ||
      ["BOOKED", "WON"].includes(String(existing.lead_state || ""))
    )
  );
}

async function canonicalLeadId(email: string, phone: string, businessName: string) {
  const bytes = new TextEncoder().encode(`${email}|${phone}|${businessName}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `lead_${hex.slice(0, 24)}`;
}

async function safeFilter(
  entity: unknown,
  filter: Record<string, unknown>,
  sort = "-created_date",
  limit = 25,
) {
  try {
    const api = entity as {
      filter?: (
        query: Record<string, unknown>,
        sort?: string,
        limit?: number,
      ) => Promise<Record<string, unknown>[]>;
    };
    return api?.filter ? await api.filter(filter, sort, limit) : [];
  } catch (error) {
    console.warn(
      "[submitContactInquiry] optional filter failed",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

async function findRecentWebsiteLead(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: ReturnType<typeof normalizedPayload>,
) {
  const candidates = [
    ...await safeFilter(
      base44.asServiceRole.entities.WebsiteLead,
      { email: payload.email },
      "-created_date",
      10,
    ),
    ...await safeFilter(
      base44.asServiceRole.entities.WebsiteLead,
      { phone_number: payload.phone },
      "-created_date",
      10,
    ),
  ];
  return candidates.find((row) => {
    const createdAt = typeof row.created_date === "string"
      ? new Date(row.created_date).getTime()
      : 0;
    return normalizeBusinessName(row.business_name) === payload.normalized_business_name &&
      createdAt > 0 &&
      Date.now() - createdAt < DUPLICATE_WINDOW_MS;
  }) || null;
}

async function isRateLimited(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: ReturnType<typeof normalizedPayload>,
) {
  const candidates = await safeFilter(
    base44.asServiceRole.entities.WebsiteLead,
    { email: payload.email },
    "-created_date",
    5,
  );
  return candidates.some((row) => {
    const activityAt = typeof row.updated_date === "string"
      ? new Date(row.updated_date).getTime()
      : typeof row.created_date === "string"
        ? new Date(row.created_date).getTime()
        : 0;
    return activityAt > 0 && Date.now() - activityAt < RATE_LIMIT_WINDOW_MS;
  });
}

async function findExistingCanonicalLead(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: ReturnType<typeof normalizedPayload>,
  websiteLeadId: string,
) {
  if (websiteLeadId) {
    const linked = await safeFilter(
      base44.asServiceRole.entities.Leads,
      { website_lead_id: websiteLeadId },
      "-created_date",
      5,
    );
    if (linked[0]) return linked[0];
  }

  const emailMatches = await safeFilter(
    base44.asServiceRole.entities.Leads,
    { email: payload.email },
    "-created_date",
    25,
  );
  const byEmail = emailMatches.find((row) =>
    normalizeBusinessName(row.business_name) === payload.normalized_business_name
  );
  if (byEmail) return byEmail;

  const phoneMatches = await safeFilter(
    base44.asServiceRole.entities.Leads,
    { phone: payload.phone },
    "-created_date",
    25,
  );
  return phoneMatches.find((row) =>
    normalizeBusinessName(row.business_name) === payload.normalized_business_name
  ) || null;
}

function buildWebsiteLeadData(
  payload: ReturnType<typeof normalizedPayload>,
  requestId: string,
  ip: string,
  userAgent: string,
  existing: Record<string, unknown> | null,
) {
  const now = new Date().toISOString();
  return {
    description: `Contact request ${requestId}${payload.referrer ? `; referrer ${payload.referrer}` : ""}`.slice(0, 1000),
    full_name: payload.full_name,
    first_name: payload.first_name,
    business_name: payload.business_name,
    email: payload.email,
    phone_number: payload.phone,
    business_type: payload.business_type,
    business_website_url: payload.website,
    website_url: payload.website,
    message: payload.message,
    problem: `Contact form inquiry: ${payload.message}`.slice(0, MAX_MESSAGE_LENGTH),
    source: CONTACT_SOURCE,
    source_page: payload.source_page,
    utm_source: payload.utm_source || null,
    utm_medium: payload.utm_medium || null,
    utm_campaign: payload.utm_campaign || null,
    utm_content: payload.utm_content || null,
    utm_term: payload.utm_term || null,
    current_lead_source: CONTACT_SOURCE,
    requested_channels: ["email", "phone", "sms"],
    lead_status: existing?.lead_status || "new",
    reply_status: existing?.reply_status || "none",
    booking_status: existing?.booking_status || "none",
    follow_up_step: Number(existing?.follow_up_step || 0),
    automation_enabled: existing?.automation_enabled !== false,
    cadence_mode: existing?.cadence_mode || "auto",
    cadence_paused: existing?.cadence_paused === true,
    last_engagement_type: existing?.last_engagement_type || "none",
    archived: false,
    consent_given: true,
    consent_given_at: now,
    consent_ip: ip,
    consent_source: payload.consent_source,
    consent_text_version: payload.consent_text_version,
    ip_address: ip,
    user_agent: userAgent,
    dedup_key: `${payload.email}|${payload.phone}|contact_page`,
  };
}

async function upsertCanonicalLead(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: ReturnType<typeof normalizedPayload>,
  websiteLeadId: string,
  requestId: string,
  ip: string,
) {
  const existing = await findExistingCanonicalLead(base44, payload, websiteLeadId);
  const now = new Date().toISOString();
  const domain = normalizedDomain(payload.website, payload.email);
  const canonicalId = existing?.canonical_lead_id || await canonicalLeadId(
    payload.email,
    payload.phone,
    payload.normalized_business_name,
  );
  const advanced = isAdvancedLead(existing);
  const note = `[${now}] Contact inquiry received. Request ID: ${requestId}. Message: ${payload.message}`;

  const data: Record<string, unknown> = {
    full_name: payload.full_name,
    owner_contact_name: payload.full_name,
    business_name: payload.business_name,
    email: payload.email,
    phone: payload.phone,
    business_type: payload.business_type,
    industry: payload.industry,
    problem: `Contact form inquiry: ${payload.message}`.slice(0, MAX_MESSAGE_LENGTH),
    source: "website",
    source_page: payload.source_page,
    source_history: mergeSourceHistory(existing, payload),
    intake_type: "contact_inquiry",
    website_lead_id: websiteLeadId,
    website: payload.website,
    website_url: payload.website,
    canonical_lead_id: canonicalId,
    normalized_email: payload.email,
    normalized_phone: payload.phone.replace(/\D/g, ""),
    normalized_business_name: payload.normalized_business_name,
    normalized_domain: domain,
    canonical_email: payload.email,
    canonical_phone: payload.phone,
    canonical_business_name: payload.normalized_business_name,
    canonical_website_url: payload.website,
    dedupe_key: `${payload.email}|${payload.phone}|${payload.normalized_business_name}`,
    dedupe_status: existing ? (existing.dedupe_status || "keeper") : "unique",
    consent_given: true,
    consent_given_at: now,
    consent_ip: ip,
    consent_source: payload.consent_source,
    consent_text_version: payload.consent_text_version,
    requested_channels: ["email", "phone", "sms"],
    utm_source: payload.utm_source || null,
    utm_medium: payload.utm_medium || null,
    utm_campaign: payload.utm_campaign || null,
    utm_content: payload.utm_content || null,
    utm_term: payload.utm_term || null,
    page_submitted_from: payload.source_page,
    last_activity_at: now,
    next_follow_up_at: now,
    lead_score: Math.max(Number(existing?.lead_score || 0), 70),
    intent_score: Math.max(Number(existing?.intent_score || 0), 75),
    activation_priority: existing?.activation_priority === "Hot" ? "Hot" : "High",
    ai_intent: existing?.ai_intent === "booking_ready" ? "booking_ready" : "question",
    notes: appendNotes(existing?.notes, note),
  };

  if (!existing) {
    Object.assign(data, {
      status: "New",
      crm_stage: "Not Contacted",
      lead_state: "NEW",
      outreach_status: "not_contacted",
      lead_category: "High-Value",
    });
  } else if (!advanced) {
    Object.assign(data, {
      status: "Replied",
      crm_stage: "Replied",
      lead_state: "ENGAGED",
      outreach_status: existing.do_not_contact ? "do_not_contact" : "replied",
    });
  }

  const lead = existing
    ? await base44.asServiceRole.entities.Leads.update(existing.id, data)
    : await base44.asServiceRole.entities.Leads.create(data);
  return { lead, action: existing ? "updated" : "created" };
}

async function safeLog(
  base44: ReturnType<typeof createClientFromRequest>,
  payload: Record<string, unknown>,
) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create(payload);
  } catch (error) {
    console.warn(
      "[submitContactInquiry] communication log skipped",
      error instanceof Error ? error.message : error,
    );
  }
}

async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { sent: false, reason: "missing_resend_api_key" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "ClientSurge Systems <system@clientsurgesystems.com>",
      to: [to],
      reply_to: replyTo || "nolan@clientsurgesystems.com",
      subject,
      html,
    }),
  });
  if (!response.ok) {
    return { sent: false, reason: (await response.text()) || "email_failed" };
  }
  return { sent: true, reason: "" };
}

async function sendAdminSms(payload: ReturnType<typeof normalizedPayload>) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromRaw = Deno.env.get("TWILIO_FROM_NUMBER") ||
    Deno.env.get("TWILIO_PHONE_NUMBER") ||
    "";
  const from = normalizePhone(fromRaw);
  if (!accountSid || !authToken || !from) {
    return { sent: false, reason: "twilio_not_configured" };
  }

  const params = new URLSearchParams({
    To: "+16025874608",
    From: from,
    Body: `New ClientSurge contact inquiry\n${payload.full_name} — ${payload.business_name}\n${payload.phone}\n${payload.email}\n${payload.message.slice(0, 180)}`,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  if (!response.ok) {
    return { sent: false, reason: (await response.text()) || "sms_failed" };
  }
  return { sent: true, reason: "" };
}

Deno.serve(async (req) => {
  const requestId = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed", request_id: requestId }, { status: 405 });
    }

    const originGuard = validatePublicFormOrigin(req);
    if (!originGuard.ok) {
      return secureJson(
        { error: originGuard.error, code: "invalid_origin", request_id: requestId },
        { status: originGuard.status },
      );
    }

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== "object") {
      return secureJson({ error: "Invalid JSON body", request_id: requestId }, { status: 400 });
    }

    const payload = normalizedPayload(raw as Record<string, unknown>);
    if (payload.honeypot) {
      return secureJson({ success: true, ignored: true, request_id: requestId });
    }

    const errors = validate(payload);
    if (errors.length) {
      return secureJson({ error: errors[0], errors, request_id: requestId }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    if (await isRateLimited(base44, payload)) {
      return secureJson(
        {
          error: "Please wait a moment before submitting again.",
          code: "rate_limited",
          request_id: requestId,
        },
        { status: 429 },
      );
    }

    const ip = getRequestIp(req);
    const existingWebsiteLead = await findRecentWebsiteLead(base44, payload);
    const websiteLeadData = buildWebsiteLeadData(
      payload,
      requestId,
      ip,
      getUserAgent(req),
      existingWebsiteLead,
    );
    const websiteLead = existingWebsiteLead
      ? await base44.asServiceRole.entities.WebsiteLead.update(
          existingWebsiteLead.id,
          websiteLeadData,
        )
      : await base44.asServiceRole.entities.WebsiteLead.create(websiteLeadData);

    const { lead, action } = await upsertCanonicalLead(
      base44,
      payload,
      websiteLead.id,
      requestId,
      ip,
    );

    if (websiteLead.crm_lead_id !== lead.id) {
      await base44.asServiceRole.entities.WebsiteLead.update(websiteLead.id, {
        crm_lead_id: lead.id,
      });
    }

    await safeLog(base44, {
      lead_id: lead.id,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: action === "created"
        ? "Contact inquiry created canonical lead"
        : "Contact inquiry updated canonical lead",
      message_body: payload.message,
      metadata_json: JSON.stringify({
        request_id: requestId,
        action,
        source: CONTACT_SOURCE,
        source_page: payload.source_page,
        website_lead_id: websiteLead.id,
        canonical_lead_id: lead.id,
      }),
    });

    const userEmail = await sendEmail({
      to: payload.email,
      subject: "Message received — ClientSurge Systems",
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a"><h2>Thanks for reaching out, ${escapeHtml(payload.first_name || payload.full_name)}.</h2><p>We received your message and will follow up with a clear next step within one business day.</p><p><strong>Your message:</strong> ${escapeHtml(payload.message)}</p><p>Reference: ${escapeHtml(requestId)}</p><p>Reply to this email if you need to add anything.</p><hr><p style="font-size:12px;color:#64748b">ClientSurge Systems · Phoenix, Arizona</p></div>`,
    }).catch((error) => ({
      sent: false,
      reason: error instanceof Error ? error.message : String(error),
    }));

    const adminEmail = await sendEmail({
      to: "nolan@clientsurgesystems.com",
      replyTo: payload.email,
      subject: `New Contact: ${payload.full_name} — ${payload.business_type}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:24px;color:#0f172a"><h2>New ClientSurge contact inquiry</h2><p><strong>Name:</strong> ${escapeHtml(payload.full_name)}<br><strong>Business:</strong> ${escapeHtml(payload.business_name)}<br><strong>Industry:</strong> ${escapeHtml(payload.industry)}<br><strong>Email:</strong> ${escapeHtml(payload.email)}<br><strong>Phone:</strong> ${escapeHtml(payload.phone)}<br><strong>Website:</strong> ${escapeHtml(payload.website || "Not provided")}</p><p><strong>Message:</strong> ${escapeHtml(payload.message)}</p><p>CRM action: ${escapeHtml(action)}. Lead ID: ${escapeHtml(lead.id)}. WebsiteLead ID: ${escapeHtml(websiteLead.id)}. Request ID: ${escapeHtml(requestId)}.</p></div>`,
    }).catch((error) => ({
      sent: false,
      reason: error instanceof Error ? error.message : String(error),
    }));

    const adminSms = await sendAdminSms(payload).catch((error) => ({
      sent: false,
      reason: error instanceof Error ? error.message : String(error),
    }));

    for (const [target, result] of [
      ["user_receipt", userEmail],
      ["admin_notification", adminEmail],
    ] as const) {
      await safeLog(base44, {
        lead_id: lead.id,
        channel: "email",
        direction: "outbound",
        event_type: result.sent ? "email_sent" : "email_failed",
        provider: "resend",
        status: result.sent ? "sent" : "failed",
        subject: target === "user_receipt"
          ? "Message received — ClientSurge Systems"
          : `New Contact: ${payload.full_name}`,
        message_body: payload.message,
        error_message: result.sent ? undefined : result.reason,
        metadata_json: JSON.stringify({ target, request_id: requestId }),
      });
    }

    return secureJson({
      success: true,
      lead_id: lead.id,
      canonical_lead_id: lead.id,
      website_lead_id: websiteLead.id,
      action,
      request_id: requestId,
      notification_sent: adminEmail.sent,
      thank_you_sent: userEmail.sent,
      admin_sms_sent: adminSms.sent,
      warnings: [
        !adminEmail.sent ? `admin_email:${adminEmail.reason}` : "",
        !userEmail.sent ? `user_email:${userEmail.reason}` : "",
        !adminSms.sent ? `admin_sms:${adminSms.reason}` : "",
      ].filter(Boolean),
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Contact form submission failed";
    console.error("[submitContactInquiry]", requestId, message);
    return secureJson(
      {
        error: "Contact form submission failed. Please email support@clientsurgesystems.com directly.",
        detail: message,
        request_id: requestId,
      },
      { status: 500 },
    );
  }
});

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { validatePublicFormOrigin } from "../_shared/publicFormOriginGuard.js";

const MAX_FIELD_LENGTH = 500;
const MAX_NOTES_LENGTH = 4000;
const MAX_REQUESTS_PER_DAY = 8;
const ACTIVE_REQUEST_STATUSES = ["requested", "scheduled"];
const TIME_ZONE = "America/Phoenix";
const TIME_ZONE_LABEL = "Arizona time (MST)";
const ALLOWED_TIMES = new Set([
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
]);

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

function normalizedDomain(website: string, email: string) {
  try {
    if (website) return new URL(website).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    // Fall back to the email domain.
  }
  return email.includes("@") ? email.split("@").pop() || "" : "";
}

function normalizeIndustrySlug(value: unknown) {
  const slug = clean(value, 120)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (slug.includes("roof")) return "roofing";
  if (slug.includes("hvac")) return "hvac";
  if (slug.includes("plumb")) return "plumbing";
  if (slug.includes("dental") || slug.includes("dentist") || slug.includes("orthodont")) return "dental";
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

function industryTags(slug: string, incoming: unknown) {
  const tags = Array.isArray(incoming) ? incoming.map((item) => clean(item, 80)).filter(Boolean) : [];
  const mapped = {
    roofing: ["roofing", "roofing_lead", "free_roofing_automation_audit"],
    hvac: ["hvac", "hvac_lead", "free_hvac_automation_audit"],
    plumbing: ["plumbing", "plumbing_lead", "free_plumbing_automation_audit"],
    dental: ["dental", "dental_lead", "free_dental_automation_audit"],
    med_spa: ["med_spa", "med_spa_lead", "free_med_spa_automation_audit"],
    chiropractic: ["chiropractic", "chiropractic_lead"],
    contractors: ["contractors", "contractor_lead"],
  }[slug] || [slug, "automation_audit_lead"];
  return [...new Set([...tags, ...mapped, `${slug}_landing_page`].filter(Boolean))].slice(0, 12);
}

function crmTag(slug: string, fallback: unknown) {
  return {
    roofing: "roofing_lead",
    hvac: "hvac_lead",
    plumbing: "plumbing_lead",
    dental: "dental_lead",
    med_spa: "med_spa_lead",
    chiropractic: "chiropractic_lead",
    contractors: "contractor_lead",
  }[slug] || clean(fallback, 100) || "automation_audit_lead";
}

function getArizonaDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatRequestedTime(date: string, time: string) {
  const [hourValue, minute] = time.split(":");
  const hour = Number(hourValue);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${date} at ${displayHour}:${minute} ${suffix} ${TIME_ZONE_LABEL}`;
}

function mergeSourceHistory(existing: Record<string, unknown> | null, payload: Record<string, string>) {
  const previous = Array.isArray(existing?.source_history)
    ? existing.source_history.map(String)
    : existing?.source_history
      ? [String(existing.source_history)]
      : [];
  const current = [
    payload.source,
    payload.source_page ? `page:${payload.source_page}` : "",
    payload.utm_source ? `utm_source:${payload.utm_source}` : "",
    payload.utm_campaign ? `utm_campaign:${payload.utm_campaign}` : "",
    payload.referrer ? `referrer:${payload.referrer}` : "",
  ].filter(Boolean);
  return [...new Set([...previous, ...current])].slice(-25);
}

function appendNotes(existing: unknown, line: string) {
  const previous = clean(existing, MAX_NOTES_LENGTH);
  return [previous, line].filter(Boolean).join("\n").slice(-MAX_NOTES_LENGTH);
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
  const hex = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `lead_${hex.slice(0, 24)}`;
}

function normalizedPayload(raw: Record<string, unknown>) {
  const businessType = clean(raw.business_type || raw.industry, 160);
  const slug = normalizeIndustrySlug(raw.industry_slug || businessType);
  const email = normalizeEmail(raw.email);
  const phone = normalizePhone(raw.phone);
  const website = normalizeWebsite(raw.business_website_url || raw.website);
  return {
    full_name: clean(raw.full_name, 200),
    business_name: clean(raw.business_name, 240),
    normalized_business_name: normalizeBusinessName(raw.business_name),
    email,
    phone,
    business_type: businessType,
    industry_slug: slug,
    industry: canonicalIndustryLabel(slug, businessType),
    website,
    biggest_issue: clean(raw.biggest_issue || raw.message, 1500),
    scheduled_date: clean(raw.scheduled_date, 20),
    scheduled_time: clean(raw.scheduled_time, 10),
    source: clean(raw.source, 120) || "landing_page",
    source_page: clean(raw.source_page, 240) || "/book",
    service_interest: clean(raw.service_interest, 120) || "automation_audit",
    crm_tag: crmTag(slug, raw.crm_tag),
    industry_tags: industryTags(slug, raw.industry_tags),
    utm_source: clean(raw.utm_source, 200),
    utm_medium: clean(raw.utm_medium, 200),
    utm_campaign: clean(raw.utm_campaign, 200),
    utm_content: clean(raw.utm_content, 200),
    referrer: clean(raw.referrer, 1000),
    honeypot: clean(raw.website_url, 300),
    consent_given: raw.consent_given === true,
    consent_source: clean(raw.consent_source, 160) || "audit_time_request",
    consent_text_version: clean(raw.consent_text_version, 160) || "audit_time_request_explicit_v1",
  };
}

function validate(payload: ReturnType<typeof normalizedPayload>) {
  const errors: string[] = [];
  if (!payload.full_name) errors.push("Full name is required");
  if (!payload.business_name) errors.push("Business name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push("A valid email is required");
  if (!payload.phone) errors.push("A valid phone number is required");
  if (!payload.business_type) errors.push("Industry is required");
  if (!payload.biggest_issue) errors.push("What should we review is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.scheduled_date)) errors.push("Preferred date is required");
  else if (payload.scheduled_date < getArizonaDate()) errors.push("Preferred date cannot be in the past");
  if (!ALLOWED_TIMES.has(payload.scheduled_time)) errors.push("Choose an available preferred time");
  if (!payload.consent_given) errors.push("Consent is required");
  return errors;
}

async function findExistingLead(base44: ReturnType<typeof createClientFromRequest>, payload: ReturnType<typeof normalizedPayload>) {
  const matchesByEmail = await base44.asServiceRole.entities.Leads.filter({ email: payload.email }, "-created_date", 25).catch(() => []);
  const byEmail = matchesByEmail.find((lead: Record<string, unknown>) =>
    normalizeBusinessName(lead.business_name) === payload.normalized_business_name
  );
  if (byEmail) return byEmail;

  const matchesByPhone = await base44.asServiceRole.entities.Leads.filter({ phone: payload.phone }, "-created_date", 25).catch(() => []);
  return matchesByPhone.find((lead: Record<string, unknown>) =>
    normalizeBusinessName(lead.business_name) === payload.normalized_business_name
  ) || null;
}

async function reserveRequestedSlot(base44: ReturnType<typeof createClientFromRequest>, leadId: string, payload: ReturnType<typeof normalizedPayload>) {
  const dayRequests = await base44.asServiceRole.entities.DemoRequest.filter(
    { scheduled_date: payload.scheduled_date, status: { $in: ACTIVE_REQUEST_STATUSES } },
    "-created_date",
    50,
  );

  const sameSlot = (dayRequests || []).find((request: Record<string, unknown>) =>
    request.scheduled_time === payload.scheduled_time
  );
  if (sameSlot && sameSlot.lead_id !== leadId) {
    throw Object.assign(new Error("That preferred time is no longer available. Please choose another time."), { status: 409 });
  }

  const existingForLead = (dayRequests || []).find((request: Record<string, unknown>) =>
    request.lead_id === leadId && request.scheduled_time === payload.scheduled_time
  );
  if (existingForLead) return existingForLead;

  if ((dayRequests || []).length >= MAX_REQUESTS_PER_DAY) {
    throw Object.assign(new Error("No more audit requests are available on that date. Please choose another date."), { status: 409 });
  }

  return base44.asServiceRole.entities.DemoRequest.create({
    lead_id: leadId,
    scheduled_date: payload.scheduled_date,
    scheduled_time: payload.scheduled_time,
    status: "requested",
    tenant_scope_status: "system_internal",
    notes: `Preferred audit time requested (${TIME_ZONE_LABEL}). Pending manual confirmation. ${payload.biggest_issue}`.slice(0, 1000),
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
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
  if (!response.ok) return { sent: false, reason: (await response.text()) || "email_failed" };
  return { sent: true, reason: "" };
}

async function safeLog(base44: ReturnType<typeof createClientFromRequest>, payload: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CommunicationEvent.create(payload);
  } catch (error) {
    console.warn("[scheduleDemoBooking] communication log skipped", error instanceof Error ? error.message : error);
  }
}

Deno.serve(async (req) => {
  const requestId = `audit_request_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    if (req.method !== "POST") return secureJson({ error: "Method not allowed", request_id: requestId }, { status: 405 });

    const originGuard = validatePublicFormOrigin(req);
    if (!originGuard.ok) {
      return secureJson({ error: originGuard.error, code: "invalid_origin", request_id: requestId }, { status: originGuard.status });
    }

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== "object") return secureJson({ error: "Invalid JSON body", request_id: requestId }, { status: 400 });

    const payload = normalizedPayload(raw as Record<string, unknown>);
    if (payload.honeypot) return secureJson({ success: true, ignored: true, request_id: requestId });

    const errors = validate(payload);
    if (errors.length) return secureJson({ error: errors[0], errors, request_id: requestId }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();
    const requestedTime = formatRequestedTime(payload.scheduled_date, payload.scheduled_time);
    const existing = await findExistingLead(base44, payload);
    const advanced = isAdvancedLead(existing);
    const domain = normalizedDomain(payload.website, payload.email);
    const canonicalId = existing?.canonical_lead_id || await canonicalLeadId(payload.email, payload.phone, payload.normalized_business_name);
    const requestNote = `[${now}] Preferred automation-audit time requested: ${requestedTime}. Pending confirmation. Request ID: ${requestId}.`;

    const leadData: Record<string, unknown> = {
      full_name: payload.full_name,
      owner_contact_name: payload.full_name,
      business_name: payload.business_name,
      email: payload.email,
      phone: payload.phone,
      business_type: payload.business_type,
      industry: payload.industry,
      problem: payload.biggest_issue,
      source: payload.source,
      source_page: payload.source_page,
      source_history: mergeSourceHistory(existing, payload),
      intake_type: "audit_time_request",
      website: payload.website,
      website_url: payload.website,
      package_interest: payload.service_interest,
      service_interest: payload.service_interest,
      crm_tag: payload.crm_tag,
      industry_tags: payload.industry_tags,
      canonical_lead_id: canonicalId,
      normalized_email: payload.email,
      normalized_phone: payload.phone.replace(/\D/g, ""),
      normalized_business_name: payload.normalized_business_name,
      normalized_domain: domain,
      dedupe_key: `${payload.email}|${payload.phone}|${payload.normalized_business_name}`,
      dedupe_status: existing ? (existing.dedupe_status || "keeper") : "unique",
      consent_given: true,
      consent_given_at: now,
      consent_source: payload.consent_source,
      consent_text_version: payload.consent_text_version,
      requested_channels: ["email", "phone", "sms"],
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      utm_content: payload.utm_content || null,
      referrer: payload.referrer || null,
      page_submitted_from: payload.source_page,
      last_activity_at: now,
      next_follow_up_at: now,
      lead_score: Math.max(Number(existing?.lead_score || 0), 80),
      intent_score: Math.max(Number(existing?.intent_score || 0), 90),
      activation_priority: "Hot",
      lead_category: "High-Value",
      ai_intent: "booking_ready",
      reply_sentiment: "Positive",
      notes: appendNotes(existing?.notes, requestNote),
    };

    if (!advanced) {
      leadData.status = "Replied";
      leadData.crm_stage = "Replied";
      leadData.lead_state = "HOT";
      leadData.outreach_status = existing?.do_not_contact ? "do_not_contact" : "replied";
    }

    const lead = existing
      ? await base44.asServiceRole.entities.Leads.update(existing.id, leadData)
      : await base44.asServiceRole.entities.Leads.create(leadData);

    const demoRequest = await reserveRequestedSlot(base44, lead.id, payload);

    await safeLog(base44, {
      lead_id: lead.id,
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: "Automation audit time requested",
      message_body: `${payload.full_name} requested ${requestedTime}. Pending confirmation.`,
      metadata_json: JSON.stringify({
        request_id: requestId,
        demo_request_id: demoRequest.id,
        request_status: "requested",
        calendar_created: false,
        time_zone: TIME_ZONE,
        source_page: payload.source_page,
      }),
    });

    const customerEmail = await sendEmail({
      to: payload.email,
      subject: `Audit time request received — ${requestedTime}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a"><h2>We received your preferred audit time.</h2><p>Hi ${escapeHtml(payload.full_name)},</p><p>Your requested time is <strong>${escapeHtml(requestedTime)}</strong>.</p><p>This is a pending request, not a confirmed calendar appointment yet. Nolan will confirm the time or send the closest available option within one business day.</p><p><strong>Business:</strong> ${escapeHtml(payload.business_name)}<br><strong>What to review:</strong> ${escapeHtml(payload.biggest_issue)}</p><p>Reference: ${escapeHtml(requestId)}</p><p>Reply to this email if anything changes.</p><hr><p style="font-size:12px;color:#64748b">ClientSurge Systems · Phoenix, Arizona</p></div>`,
    }).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }));

    const adminEmail = await sendEmail({
      to: "nolan@clientsurgesystems.com",
      replyTo: payload.email,
      subject: `ACTION REQUIRED: Confirm audit request — ${payload.business_name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:24px;color:#0f172a"><h2>New audit time request</h2><p><strong>Preferred time:</strong> ${escapeHtml(requestedTime)}</p><p><strong>Name:</strong> ${escapeHtml(payload.full_name)}<br><strong>Business:</strong> ${escapeHtml(payload.business_name)}<br><strong>Industry:</strong> ${escapeHtml(payload.industry)}<br><strong>Email:</strong> ${escapeHtml(payload.email)}<br><strong>Phone:</strong> ${escapeHtml(payload.phone)}<br><strong>Website:</strong> ${escapeHtml(payload.website || "Not provided")}</p><p><strong>Review request:</strong> ${escapeHtml(payload.biggest_issue)}</p><p>Confirm this request manually before changing the lead to Booked. Lead ID: ${escapeHtml(lead.id)}. DemoRequest ID: ${escapeHtml(demoRequest.id)}. Request ID: ${escapeHtml(requestId)}.</p></div>`,
    }).catch((error) => ({ sent: false, reason: error instanceof Error ? error.message : String(error) }));

    for (const [target, result] of [["customer_receipt", customerEmail], ["admin_notification", adminEmail]] as const) {
      await safeLog(base44, {
        lead_id: lead.id,
        channel: "email",
        direction: "outbound",
        event_type: result.sent ? "email_sent" : "email_failed",
        provider: "resend",
        status: result.sent ? "sent" : "failed",
        subject: target === "customer_receipt" ? "Audit time request received" : "Audit request admin notification",
        message_body: requestedTime,
        error_message: result.sent ? undefined : result.reason,
        metadata_json: JSON.stringify({ target, request_id: requestId, request_status: "requested" }),
      });
    }

    const warnings = [
      !customerEmail.sent ? `customer_receipt:${customerEmail.reason}` : "",
      !adminEmail.sent ? `admin_notification:${adminEmail.reason}` : "",
      "calendar_event:pending_manual_confirmation",
    ].filter(Boolean);

    return secureJson({
      success: true,
      lead_id: lead.id,
      demo_request_id: demoRequest.id,
      action: existing ? "updated" : "created",
      request_status: "requested",
      calendar_created: false,
      requested_date: payload.scheduled_date,
      requested_time: payload.scheduled_time,
      time_zone: TIME_ZONE,
      time_zone_label: TIME_ZONE_LABEL,
      message: "Preferred audit time received. ClientSurge will confirm it within one business day.",
      request_id: requestId,
      warnings,
    });
  } catch (error) {
    const status = Number((error as { status?: number })?.status || 500);
    const message = error instanceof Error ? error.message : "Failed to record audit time request";
    console.error("[scheduleDemoBooking]", requestId, message);
    return secureJson({ error: message, request_id: requestId }, { status });
  }
});

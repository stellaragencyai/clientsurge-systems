/**
 * Canonical website lead intake.
 * Stores top-of-funnel submissions in WebsiteLead only.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "temp-mail.org",
  "throwaway.email",
  "fakeinbox.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "guerrillamail.info",
  "spam4.me",
  "tempmail.com",
  "tmpmail.net",
  "tmpmail.org",
  "tmp-mail.org",
  "throwam.com",
]);

const SIXTY_MINUTES = 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizePhone(value) {
  return cleanString(value).replace(/[^\d+]/g, "");
}

function normalizeRequestedChannels(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => cleanString(entry).toLowerCase()).filter(Boolean))];
}

function isDisposableEmail(email) {
  const domain = normalizeEmail(email).split("@")[1] || "";
  return DISPOSABLE_DOMAINS.has(domain);
}

function buildDedupKey({ email, phone }) {
  return email || phone || crypto.randomUUID();
}

function getClientIp(req) {
  return cleanString(
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown"
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count += 1;
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
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
    const phone = normalizePhone(body.phone || body.phone_number);
    if (!email && !phone) {
      return Response.json(
        { error: "phone or email required" },
        { status: 400 }
      );
    }

    if (email && isDisposableEmail(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 422 });
    }

    const since = new Date(Date.now() - SIXTY_MINUTES).toISOString();
    const recentWebsiteLeads = await base44.asServiceRole.entities.WebsiteLead.list(
      "-created_date",
      100
    ).catch(() => []);
    const duplicate = (recentWebsiteLeads || []).find((lead) => {
      const matchesEmail =
        email && normalizeEmail(lead.email) === email;
      const matchesPhone =
        phone && normalizePhone(lead.phone_number) === phone;
      return (matchesEmail || matchesPhone) && lead.created_date >= since;
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

    return Response.json({
      success: true,
      lead_id: lead.id,
      deduplicated: false,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

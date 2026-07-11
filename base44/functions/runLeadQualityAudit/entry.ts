import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  buildIndustryDataQualityFlags,
  classifyLeadIndustry,
} from "../_shared/industryClassifier.ts";

function canonicalEmail(email) {
  if (!email) return "";
  return String(email).toLowerCase().trim().replace(/\s+/g, "");
}

function canonicalPhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "").replace(/^1/, "");
}

function canonicalBusinessName(name) {
  if (!name) return "";
  return String(name).toLowerCase().trim()
    .replace(/\b(llc|inc|corp|co|ltd)\b\.?/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDomain(url) {
  if (!url) return "";
  return String(url).toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

function canonicalWebsiteUrl(website, websiteUrl) {
  const raw = website || websiteUrl || "";
  if (!raw) return "";
  const domain = extractDomain(raw);
  if (!domain) return "";
  return `https://${domain}`;
}

function normalizedIndustryTags(existingTags, canonicalLabel) {
  const values = [canonicalLabel, ...(Array.isArray(existingTags) ? existingTags : [])]
    .filter(Boolean)
    .map(String);
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }
  return output.slice(0, 8);
}

const INTERNAL_TEST_KEYWORDS_BUSINESS = [
  "test", "smoke", "runtime", "proof", "qa", "clientsurge sarah test", "clientsurge live test", "crm smoke",
];
const INTERNAL_TEST_KEYWORDS_NAME = [
  "test", "smoke", "runtime", "proof", "qa", "clientsurge live launch", "leadflow ai assistant", "leadflow rescue",
];
const INTERNAL_TEST_SOURCES = ["crm_live_smoke_test", "twilio_missed_call_test"];
const INTERNAL_TEST_EMAIL_DOMAINS = ["clientsurge.test", "example.com"];
const INTERNAL_TEST_WEBSITE_KEYWORDS = ["example.com", "crm-smoke", "testhvac", "testsmsjohn", ".test"];
const GENERIC_INQUIRY_NAMES = [
  "general inquiry inquiry", "other inquiry", "hvac inquiry", "roofing inquiry", "med spas & aesthetic clinics inquiry",
];
const RAW_IMPORT_SOURCE = "lead_dashboard_5378_2026_05_29";
const GENERIC_BUSINESS_NAMES = [
  "garden center", "storage", "self storage", "gym", "nail salon", "general store", "contractor", "nursery road", "recreational storage",
];
const CHAIN_FRANCHISE_NAMES = [
  "walmart garden center", "home depot garden center", "public storage", "extra space storage", "u-haul", "cubesmart", "lowe's garden center", "anytime fitness",
];

function detectInternalTest(lead) {
  const codes = [];
  const reasons = [];
  const businessName = String(lead.business_name || "").toLowerCase().trim();
  const fullName = String(lead.full_name || "").toLowerCase().trim();
  const email = String(lead.email || "").toLowerCase();
  const website = `${lead.website || ""} ${lead.website_url || ""}`.toLowerCase();
  const phone = String(lead.phone || "");
  const source = String(lead.source || "").toLowerCase();

  if (INTERNAL_TEST_KEYWORDS_BUSINESS.some((keyword) => businessName.includes(keyword))) {
    codes.push("internal_test_business_name");
    reasons.push(`Business name matches internal/test pattern: "${businessName}"`);
  }
  if (INTERNAL_TEST_KEYWORDS_NAME.some((keyword) => fullName.includes(keyword))) {
    codes.push("internal_test_full_name");
    reasons.push(`Full name matches internal/test pattern: "${fullName}"`);
  }
  if (INTERNAL_TEST_SOURCES.includes(source)) {
    codes.push("internal_test_source");
    reasons.push(`Source is internal test: "${source}"`);
  }
  if (INTERNAL_TEST_EMAIL_DOMAINS.some((domain) => email.includes(domain))) {
    codes.push("example_email");
    reasons.push(`Email uses test/example domain: "${email}"`);
  }
  if (INTERNAL_TEST_WEBSITE_KEYWORDS.some((keyword) => website.includes(keyword))) {
    codes.push("test_website");
    reasons.push(`Website contains test/example keyword: "${website.trim()}"`);
  }
  if (phone.replace(/\D/g, "").match(/5550\d{3,}/)) {
    codes.push("test_phone_555");
    reasons.push(`Phone matches 555 test pattern: "${phone}"`);
  }
  if (GENERIC_INQUIRY_NAMES.includes(businessName)) {
    codes.push("generic_inquiry_name");
    reasons.push(`Business name is a generic inquiry: "${businessName}"`);
  }

  return codes.length > 0
    ? { codes, reason: reasons.join("; "), confidence: 100 }
    : null;
}

function detectRawImport(lead) {
  const codes = [];
  const reasons = [];
  const businessName = String(lead.business_name || "").toLowerCase().trim();
  const email = lead.email || "";
  const phone = lead.phone || "";
  const website = lead.website || "";
  const websiteUrl = lead.website_url || "";
  const source = String(lead.source || "").toLowerCase();
  const city = lead.city || "";
  const state = lead.state || "";

  if (source === RAW_IMPORT_SOURCE && !email && !phone && !website && !websiteUrl) {
    codes.push("raw_import_no_contact");
    reasons.push("Raw import with no email, phone, or website");
  }
  if (GENERIC_BUSINESS_NAMES.some((generic) => businessName === generic)) {
    codes.push("generic_business_name");
    reasons.push(`Generic business name: "${businessName}"`);
  }
  if (CHAIN_FRANCHISE_NAMES.some((chain) => businessName === chain)) {
    codes.push("chain_franchise");
    reasons.push(`Chain/franchise or non-target account: "${businessName}"`);
  }
  if (!city && !state && !email && !phone && !website && !websiteUrl) {
    codes.push("missing_city_state_no_contact");
    reasons.push("Missing city, state, and all contact data");
  }

  return codes.length > 0
    ? { codes, reason: reasons.join("; "), confidence: 85 }
    : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "super_admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const fetchLimit = Math.min(Math.max(Number(body.limit) || 1000, 1), 1000);
    const offset = Math.max(Number(body.offset) || 0, 0);
    const now = new Date().toISOString();
    const allLeads = await base44.asServiceRole.entities.Leads.filter({}, "-created_date", fetchLimit, offset) || [];

    const updates = [];
    const businessNameCounts = {};
    let industryChanged = 0;
    let industryClassified = 0;
    let industryReviewRequired = 0;
    let industryExcludedTest = 0;
    const industryCategoryCounts = {};

    for (const lead of allLeads) {
      const canonical = {
        email: canonicalEmail(lead.email),
        phone: canonicalPhone(lead.phone),
        businessName: canonicalBusinessName(lead.business_name),
        websiteUrl: canonicalWebsiteUrl(lead.website, lead.website_url),
        city: String(lead.city || "").toLowerCase().trim(),
        state: String(lead.state || "").toLowerCase().trim(),
      };
      canonical.domain = extractDomain(canonical.websiteUrl);

      if (canonical.businessName && !lead.email && !lead.phone && !lead.website && !lead.website_url && !lead.city && !lead.state) {
        businessNameCounts[canonical.businessName] = (businessNameCounts[canonical.businessName] || 0) + 1;
      }

      let qualityStatus = lead.quality_review_status || "active";
      let qualityReason = lead.quality_reason || "";
      let qualityCodes = Array.isArray(lead.quality_reason_codes) ? [...lead.quality_reason_codes] : [];
      let qualityConfidence = Number(lead.quality_confidence || 0);

      const internalTest = detectInternalTest(lead);
      if (internalTest) {
        qualityStatus = qualityStatus === "quarantined" ? "quarantined" : "quarantine_candidate";
        qualityReason = internalTest.reason;
        qualityCodes = internalTest.codes;
        qualityConfidence = internalTest.confidence;
      } else {
        const rawImport = detectRawImport(lead);
        if (rawImport) {
          qualityStatus = qualityStatus === "quarantined" ? "quarantined" : "quarantine_candidate";
          qualityReason = rawImport.reason;
          qualityCodes = rawImport.codes;
          qualityConfidence = rawImport.confidence;
        }
      }

      let enrichmentStatus = lead.enrichment_status || "not_started";
      if (enrichmentStatus === "not_started" && !canonical.websiteUrl && qualityStatus === "active") {
        enrichmentStatus = "needs_lookup";
      }

      const classification = classifyLeadIndustry(lead);
      const industry = classification.status === "classified"
        ? classification.industry_label
        : classification.status === "excluded_test"
          ? "Internal Test / Excluded"
          : "Needs Manual Review";
      const assignedAgent = classification.status === "review_required"
        ? (lead.assigned_agent_name || "sales_rep_general")
        : classification.routing.agent_name;
      const dataQualityFlags = buildIndustryDataQualityFlags(lead.data_quality_flags, classification);

      if (lead.industry !== industry) industryChanged += 1;
      if (classification.status === "classified") industryClassified += 1;
      if (classification.status === "review_required") industryReviewRequired += 1;
      if (classification.status === "excluded_test") industryExcludedTest += 1;
      industryCategoryCounts[classification.industry_label] = (industryCategoryCounts[classification.industry_label] || 0) + 1;

      updates.push({
        id: lead.id,
        update: {
          canonical_email: canonical.email,
          canonical_phone: canonical.phone,
          canonical_business_name: canonical.businessName,
          canonical_website_url: canonical.websiteUrl,
          canonical_city: canonical.city,
          canonical_state: canonical.state,
          normalized_domain: canonical.domain || lead.normalized_domain || "",
          quality_review_status: qualityStatus,
          quality_reason: qualityReason,
          quality_reason_codes: qualityCodes,
          quality_confidence: qualityConfidence,
          audited_at: now,
          enrichment_status: enrichmentStatus,
          industry,
          industry_tags: normalizedIndustryTags(lead.industry_tags, industry),
          assigned_agent_name: assignedAgent,
          data_quality_flags: dataQualityFlags,
          data_quality_checked_at: now,
        },
      });
    }

    for (const item of updates) {
      const canonicalName = item.update.canonical_business_name;
      if (canonicalName && businessNameCounts[canonicalName] > 1 && item.update.quality_review_status === "active") {
        item.update.quality_review_status = "quarantine_candidate";
        item.update.quality_reason = `Business name "${canonicalName}" appears ${businessNameCounts[canonicalName]} times with no contact data`;
        item.update.quality_reason_codes = [...(item.update.quality_reason_codes || []), "duplicate_no_contact"];
        item.update.quality_confidence = 80;
      }
    }

    const groups = {};
    for (const item of updates) {
      const lead = allLeads.find((candidate) => candidate.id === item.id);
      const update = item.update;
      if (["quarantine_candidate", "quarantined"].includes(update.quality_review_status)) continue;

      const groupKeys = [];
      if (update.canonical_phone && update.canonical_phone.length >= 10) {
        groupKeys.push(`phone:${update.canonical_phone}`);
      }
      if (update.canonical_website_url) {
        groupKeys.push(`domain:${extractDomain(update.canonical_website_url)}`);
      }
      if (update.canonical_business_name && (update.canonical_city || update.canonical_state)) {
        groupKeys.push(`biz:${update.canonical_business_name}|${update.canonical_city}|${update.canonical_state}`);
      }

      for (const key of groupKeys) {
        if (!groups[key]) groups[key] = [];
        groups[key].push({ id: item.id, lead, update });
      }
    }

    for (const [key, members] of Object.entries(groups)) {
      if (members.length < 2) continue;
      members.sort((left, right) => {
        const leftScore = (left.update.canonical_email ? 3 : 0) + (left.update.canonical_phone ? 3 : 0) + (left.update.canonical_website_url ? 2 : 0) + (left.update.canonical_city ? 1 : 0);
        const rightScore = (right.update.canonical_email ? 3 : 0) + (right.update.canonical_phone ? 3 : 0) + (right.update.canonical_website_url ? 2 : 0) + (right.update.canonical_city ? 1 : 0);
        return rightScore - leftScore;
      });

      for (let index = 1; index < members.length; index += 1) {
        const member = members[index];
        const item = updates.find((candidate) => candidate.id === member.id);
        if (item.update.quality_review_status === "active") {
          item.update.quality_review_status = "duplicate_candidate";
          item.update.quality_reason = `Potential duplicate of lead ${members[0].id} (group: ${key})`;
          item.update.quality_reason_codes = [...(item.update.quality_reason_codes || []), "duplicate_candidate"];
          item.update.quality_confidence = 75;
        }
      }
    }

    let updated = 0;
    let quarantined = 0;
    let duplicated = 0;
    let enrichmentNeeded = 0;

    for (let index = 0; index < updates.length; index += 500) {
      const batch = updates.slice(index, index + 500);
      try {
        await base44.asServiceRole.entities.Leads.bulkUpdate(
          batch.map((item) => ({ id: item.id, ...item.update })),
        );
        updated += batch.length;
        quarantined += batch.filter((item) => ["quarantine_candidate", "quarantined"].includes(item.update.quality_review_status)).length;
        duplicated += batch.filter((item) => item.update.quality_review_status === "duplicate_candidate").length;
        enrichmentNeeded += batch.filter((item) => item.update.enrichment_status === "needs_lookup").length;
      } catch (error) {
        console.error("Bulk update error:", error instanceof Error ? error.message : error);
      }
    }

    const probe = allLeads.length === fetchLimit
      ? await base44.asServiceRole.entities.Leads.filter({}, "-created_date", 1, offset + allLeads.length)
      : [];

    return Response.json({
      success: true,
      summary: {
        total_audited: allLeads.length,
        offset_processed: offset,
        has_more: Array.isArray(probe) && probe.length > 0,
        updated,
        quarantine_candidates: quarantined,
        duplicate_candidates: duplicated,
        enrichment_needed: enrichmentNeeded,
        active: allLeads.length - quarantined - duplicated,
        industry_changed: industryChanged,
        industry_classified: industryClassified,
        industry_review_required: industryReviewRequired,
        industry_excluded_test: industryExcludedTest,
        industry_category_counts: industryCategoryCounts,
        audited_at: now,
      },
    });
  } catch (error) {
    console.error("Lead Quality Audit Error:", error);
    const message = error instanceof Error ? error.message : "Lead quality audit failed";
    return Response.json({ error: message }, { status: 500 });
  }
});

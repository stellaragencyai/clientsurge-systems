/**
 * Lead Deduplication Guard
 * Fixes FLAW #26: No automatic deduplication for incoming leads.
 * Fixes FLAW #28: Inconsistent phone number formats.
 *
 * Provides utilities to normalize and deduplicate lead records before insertion.
 * Used by webhookLeadCapture, submitLeadCapture, and handleNewLead.
 */

/**
 * Normalize a phone number to E.164 format (digits only, leading +1 for US).
 * @param {string} raw - Raw phone input
 * @returns {string} Normalized phone or empty string
 */
export function normalizePhone(raw) {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return "";
}

/**
 * Normalize an email address for deduplication.
 * @param {string} raw
 * @returns {string} Lowercase, trimmed email
 */
export function normalizeEmail(raw) {
  if (!raw) return "";
  return String(raw).toLowerCase().trim();
}

/**
 * Normalize a business name for deduplication.
 * Removes LLC, Inc, Corp suffixes, lowercases, trims.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeBusinessName(raw) {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .trim()
    .replace(/\b(llc|inc|incorporated|corp|corporation|co|company|ltd|limited)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Extract domain from email or website URL for deduplication.
 * @param {string} emailOrUrl
 * @returns {string}
 */
export function extractDomain(emailOrUrl) {
  if (!emailOrUrl) return "";
  const lower = String(emailOrUrl).toLowerCase().trim();
  const match = lower.match(/(?:@|https?:\/\/)?([\w.-]+\.\w{2,})/);
  return match ? match[1].replace(/^www\./, "") : "";
}

/**
 * Compute a deduplication key from lead fields.
 * Uses the first available of: normalized email, normalized phone, normalized business name.
 * @param {object} lead - Lead record with email, phone, business_name
 * @returns {string} Dedup key
 */
export function computeDedupeKey(lead) {
  if (!lead) return "";
  const email = normalizeEmail(lead.email);
  if (email) return `email:${email}`;
  const phone = normalizePhone(lead.phone);
  if (phone) return `phone:${phone}`;
  const biz = normalizeBusinessName(lead.business_name);
  if (biz) return `biz:${biz}`;
  return "";
}

/**
 * Check if a lead is a likely duplicate of existing leads.
 * @param {object} newLead - The lead being inserted
 * @param {Array} existingLeads - Array of existing lead records to check against
 * @returns {{ isDuplicate: boolean, matchingLeadId: string|null, reason: string }}
 */
export function checkDuplicate(newLead, existingLeads = []) {
  if (!newLead || !Array.isArray(existingLeads)) {
    return { isDuplicate: false, matchingLeadId: null, reason: "" };
  }

  const newEmail = normalizeEmail(newLead.email);
  const newPhone = normalizePhone(newLead.phone);
  const newBiz = normalizeBusinessName(newLead.business_name);
  const newDomain = extractDomain(newLead.email || newLead.website_url);

  for (const existing of existingLeads) {
    // Email match — strongest signal
    if (newEmail && normalizeEmail(existing.email) === newEmail) {
      return { isDuplicate: true, matchingLeadId: existing.id, reason: "email_match" };
    }
    // Phone match
    if (newPhone && normalizePhone(existing.phone) === newPhone) {
      return { isDuplicate: true, matchingLeadId: existing.id, reason: "phone_match" };
    }
    // Business name + domain match
    if (newBiz && normalizeBusinessName(existing.business_name) === newBiz && newDomain) {
      const existingDomain = extractDomain(existing.email || existing.website_url);
      if (existingDomain === newDomain) {
        return { isDuplicate: true, matchingLeadId: existing.id, reason: "business_name_and_domain_match" };
      }
    }
  }

  return { isDuplicate: false, matchingLeadId: null, reason: "" };
}

/**
 * Merge duplicate lead data into a keeper record.
 * Preserves the earliest created_date, merges source_history, keeps non-empty fields.
 * @param {object} keeper - The lead record to keep
 * @param {object} duplicate - The duplicate being merged away
 * @returns {object} Merged lead data for update
 */
export function mergeLeadData(keeper, duplicate) {
  const merged = { ...keeper };

  // Merge source_history arrays
  const keeperSources = Array.isArray(keeper.source_history) ? keeper.source_history : [];
  const dupSources = Array.isArray(duplicate.source_history) ? duplicate.source_history : [];
  merged.source_history = [...new Set([...keeperSources, ...dupSources])];

  // Fill in missing fields from the duplicate
  const fillFields = ["phone", "business_name", "business_type", "industry", "city", "state", "website", "website_url"];
  for (const field of fillFields) {
    if (!merged[field] && duplicate[field]) {
      merged[field] = duplicate[field];
    }
  }

  // Track merged IDs
  const existingMerged = Array.isArray(merged.dedupe_merged_ids) ? merged.dedupe_merged_ids : [];
  merged.dedupe_merged_ids = [...new Set([...existingMerged, duplicate.id])].filter(id => id !== keeper.id);
  merged.dedupe_status = "keeper";
  merged.dedupe_marked_at = new Date().toISOString();

  return merged;
}
/**
 * Production Trust Filter — shared utility for excluding test/internal/smoke/backfill
 * records from public metrics, dashboards, proof tickers, conversion stats,
 * launch readiness, and social proof.
 *
 * Pure JavaScript — no imports. Safe to use in both frontend and backend contexts.
 */

const TEST_EMAIL_PATTERNS = [
  "clientsurge.test",
  "clientsurge-install.internal",
  "backfill-test",
  "smoke",
  "@test.",
  "@example.",
  "test@",
  "admin_test@",
  "post_patch_verification",
  "ai_brain_backfill",
];

const TEST_SOURCE_PATTERNS = [
  "smoke",
  "test",
  "backfill",
  "admin_test",
  "post_patch_verification",
  "ai_brain_backfill",
];

const TEST_BUSINESS_NAME_PATTERNS = [
  "backfill test",
  "smoke qa",
  "admin test",
  "test business",
  "verification business",
  "clientsurge internal test",
  "clientsurge qa",
  "runtime checkout proof",
  "stripe proof",
  "pricing probe",
  "postfix probe",
  "cart test",
  "funnel check",
];

const NON_PRODUCTION_ENVIRONMENTS = ["demo", "qa", "smoke", "internal", "test", "unknown"];

/**
 * Returns true if a record is internal/test/smoke/backfill and should be
 * excluded from production dashboards, public metrics, and proof counts.
 */
export function isInternalTestRecord(record) {
  if (!record || typeof record !== "object") return true;

  // Explicit exclusion flags
  if (record.dashboard_excluded === true) return true;
  if (record.is_sample === true) return true;

  // dashboard_truth_status blocked/warning means it was already flagged
  if (record.dashboard_truth_status === "blocked") return true;

  // Non-production environment (unless explicitly trusted)
  const env = record.environment;
  if (env && NON_PRODUCTION_ENVIRONMENTS.includes(env) && env !== "production") {
    return true;
  }

  // Email checks — check email, normalized_email, canonical_email, client_email, customer_email
  const emailFields = ["email", "normalized_email", "canonical_email", "client_email", "customer_email", "lead_email"];
  for (const field of emailFields) {
    const val = record[field];
    if (val && typeof val === "string") {
      const lower = val.toLowerCase();
      for (const pattern of TEST_EMAIL_PATTERNS) {
        if (lower.includes(pattern)) return true;
      }
    }
  }

  // Source checks
  const source = record.source;
  if (source && typeof source === "string") {
    const lower = source.toLowerCase();
    for (const pattern of TEST_SOURCE_PATTERNS) {
      if (lower.includes(pattern)) return true;
    }
  }

  // Business name checks
  const bizFields = ["business_name", "normalized_business_name", "canonical_business_name", "client_name"];
  for (const field of bizFields) {
    const val = record[field];
    if (val && typeof val === "string") {
      const lower = val.toLowerCase();
      for (const pattern of TEST_BUSINESS_NAME_PATTERNS) {
        if (lower.includes(pattern)) return true;
      }
    }
  }

  return false;
}

/**
 * Returns true if a record is production-trusted (safe for public dashboards,
 * metrics, and proof).
 */
export function isProductionTrustedRecord(record) {
  if (!record || typeof record !== "object") return false;

  // If explicitly marked as trusted, allow it even if environment is unknown
  if (record.dashboard_truth_status === "trusted") return true;

  // If explicitly excluded, it's not trusted
  if (isInternalTestRecord(record)) return false;

  // If environment is explicitly production, it's trusted
  if (record.environment === "production") return true;

  // If no environment field at all, check if it passed the test filter
  // (records without environment fields are treated as potentially production
  // unless they match test patterns)
  if (!record.environment) {
    // Already passed isInternalTestRecord above, so it's trusted
    return true;
  }

  return false;
}

/**
 * Filters an array of records to only production-trusted ones.
 */
export function getDashboardSafeRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.filter(isProductionTrustedRecord);
}

/**
 * Partitions records into trusted and internal/test buckets.
 */
export function partitionRecordsByTrust(records) {
  if (!Array.isArray(records)) return { trusted: [], internal: [] };
  const trusted = [];
  const internal = [];
  for (const record of records) {
    if (isProductionTrustedRecord(record)) {
      trusted.push(record);
    } else {
      internal.push(record);
    }
  }
  return { trusted, internal };
}
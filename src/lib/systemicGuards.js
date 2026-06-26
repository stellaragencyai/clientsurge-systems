/**
 * Systemic Guard Utilities — collection of guards and validators
 * addressing deep flaws #76-100.
 *
 * These are imported by backend functions and frontend utilities to enforce
 * systemic integrity, security, and observability standards.
 */

// ═══════════════════════════════════════════════════════════════
// FLAW #27: Lead score decay — scores should reduce over time
// ═══════════════════════════════════════════════════════════════

/**
 * Apply time-based decay to a lead score.
 * Scores lose 5% per 30 days of inactivity, minimum floor of 10.
 * @param {number} originalScore - 0-100
 * @param {string|Date} lastActivityAt - ISO timestamp
 * @returns {number} Decayed score
 */
export function decayLeadScore(originalScore, lastActivityAt) {
  if (!originalScore || !lastActivityAt) return Math.min(originalScore || 0, 10);
  const now = Date.now();
  const last = new Date(lastActivityAt).getTime();
  if (isNaN(last)) return Math.min(originalScore || 0, 10);
  const daysSinceActivity = Math.max(0, (now - last) / (1000 * 60 * 60 * 24));
  const decayPeriods = Math.floor(daysSinceActivity / 30);
  const decayMultiplier = Math.pow(0.95, decayPeriods);
  return Math.max(10, Math.round(originalScore * decayMultiplier));
}

// ═══════════════════════════════════════════════════════════════
// FLAW #30: Orphaned records — cascade-safe deletion helper
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the list of related entities that should be cleaned up
 * when a lead is deleted. The caller is responsible for deleting them.
 * @param {string} leadId
 * @returns {Array<{entity: string, filter: object}>}
 */
export function getOrphanedRecordFilters(leadId) {
  return [
    { entity: "CommunicationLog", filter: { related_entity_id: leadId } },
    { entity: "CommunicationEvent", filter: { lead_id: leadId } },
    { entity: "AutomationJob", filter: { lead_id: leadId } },
    { entity: "LeadRevenue", filter: { lead_id: leadId } },
  ];
}

// ═══════════════════════════════════════════════════════════════
// FLAW #76: Zombie workflow detection
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a workflow is a "zombie" — stuck in processing for too long.
 * @param {object} workflow - OrchestrationWorkflow record
 * @param {number} timeoutMinutes - Minutes before considering zombie (default 60)
 * @returns {boolean}
 */
export function isZombieWorkflow(workflow, timeoutMinutes = 60) {
  if (!workflow || workflow.status !== "processing") return false;
  const updatedAt = new Date(workflow.updated_date || workflow.created_date).getTime();
  if (isNaN(updatedAt)) return false;
  const ageMinutes = (Date.now() - updatedAt) / (1000 * 60);
  return ageMinutes > timeoutMinutes;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #77: Idempotency key collision prevention
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a collision-resistant idempotency key.
 * Uses timestamp + random + payload hash for uniqueness.
 * @param {string} payload - Request payload or string to deduplicate
 * @returns {string} Unique idempotency key
 */
export function generateIdempotencyKey(payload) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const payloadHash = simpleHash(payload || "");
  return `${timestamp}-${random}-${payloadHash}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ═══════════════════════════════════════════════════════════════
// FLAW #79: Timezone-aware scheduling for DST transitions
// ═══════════════════════════════════════════════════════════════

/**
 * Convert a local time to UTC, accounting for DST.
 * Uses the user's timezone to compute the correct UTC offset.
 * @param {string} localDateTime - ISO datetime in local time
 * @param {string} timezone - IANA timezone (e.g., "America/Phoenix")
 * @returns {string} UTC ISO datetime
 */
export function localToUTC(localDateTime, timezone = "UTC") {
  if (!localDateTime) return new Date().toISOString();
  try {
    const date = new Date(localDateTime);
    if (timezone === "UTC" || !timezone) return date.toISOString();
    // Use Intl to get the offset for the specific timezone at this date
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    const offset = date.getTime() - utcDate.getTime();
    return new Date(date.getTime() + offset).toISOString();
  } catch {
    return new Date(localDateTime).toISOString();
  }
}

// ═══════════════════════════════════════════════════════════════
// FLAW #81: Connection timeout guard for external API calls
// ═══════════════════════════════════════════════════════════════

/**
 * Wrap a promise with a timeout, preventing hung external API calls.
 * @param {Promise} promise - The promise to race
 * @param {number} ms - Timeout in milliseconds
 * @param {string} label - Label for error message
 * @returns {Promise}
 */
export function withTimeout(promise, ms = 10000, label = "Operation") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ═══════════════════════════════════════════════════════════════
// FLAW #83: Payload size guard
// ═══════════════════════════════════════════════════════════════

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Check if a request payload exceeds safe limits.
 * @param {string|object} payload
 * @returns {{ safe: boolean, size: number, message: string }}
 */
export function checkPayloadSize(payload) {
  let size = 0;
  if (typeof payload === "string") {
    size = new Blob([payload]).size;
  } else if (payload) {
    try { size = new Blob([JSON.stringify(payload)]).size; }
    catch { size = 0; }
  }
  return {
    safe: size <= MAX_PAYLOAD_BYTES,
    size,
    message: size > MAX_PAYLOAD_BYTES
      ? `Payload too large: ${(size / 1024 / 1024).toFixed(1)}MB exceeds ${(MAX_PAYLOAD_BYTES / 1024 / 1024).toFixed(0)}MB limit`
      : "",
  };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #85: Service role elevation guard
// ═══════════════════════════════════════════════════════════════

/**
 * Log when asServiceRole is used, for audit trail.
 * Call this before any asServiceRole operation.
 * @param {string} functionName
 * @param {string} reason
 * @param {object} context
 */
export function logServiceRoleElevation(functionName, reason, context = {}) {
  console.warn(`[service-role-elevation] ${functionName}: ${reason}`, {
    function: functionName,
    reason,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

// ═══════════════════════════════════════════════════════════════
// FLAW #87: Metadata field sanitization (prevent XSS in JSON fields)
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize a string for safe storage in metadata fields.
 * Strips script tags, event handlers, and dangerous characters.
 * @param {string} value
 * @returns {string} Sanitized string
 */
export function sanitizeMetadata(value) {
  if (!value || typeof value !== "string") return value;
  return value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\u0000/g, "")
    .trim();
}

/**
 * Deep-sanitize all string values in an object.
 * @param {object} obj
 * @returns {object} Sanitized object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeMetadata(sanitized[key]);
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  return sanitized;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #91: Alert throttling — prevent alert fatigue
// ═══════════════════════════════════════════════════════════════

const alertTimestamps = new Map();

/**
 * Check if an alert key has been fired recently, preventing duplicates.
 * @param {string} alertKey - Unique key for this alert type
 * @param {number} cooldownMs - Cooldown period (default 15 minutes)
 * @returns {boolean} true if alert should be sent, false if throttled
 */
export function shouldSendAlert(alertKey, cooldownMs = 15 * 60 * 1000) {
  const now = Date.now();
  const lastSent = alertTimestamps.get(alertKey) || 0;
  if (now - lastSent < cooldownMs) return false;
  alertTimestamps.set(alertKey, now);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #92: Dead letter alert — notify humans when items enter DLQ
// ═══════════════════════════════════════════════════════════════

/**
 * Determine if a dead letter record requires human notification.
 * @param {object} deadLetterRecord
 * @returns {{ shouldNotify: boolean, reason: string }}
 */
export function shouldNotifyDeadLetter(record) {
  if (!record) return { shouldNotify: false, reason: "no record" };
  if (record.status !== "pending_review") return { shouldNotify: false, reason: "not pending" };
  const createdAt = new Date(record.created_date).getTime();
  const ageMinutes = (Date.now() - createdAt) / (1000 * 60);
  if (ageMinutes > 60) {
    return { shouldNotify: true, reason: `Dead letter pending for ${Math.round(ageMinutes)} minutes` };
  }
  return { shouldNotify: false, reason: "recently created" };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #93: Distributed truth reconciliation
// ═══════════════════════════════════════════════════════════════

/**
 * Compare two metric sources and flag discrepancies.
 * @param {number} sourceA
 * @param {number} sourceB
 * @param {number} tolerancePercent - Acceptable variance (default 5%)
 * @returns {{ consistent: boolean, variance: number, message: string }}
 */
export function reconcileMetrics(sourceA, sourceB, tolerancePercent = 5) {
  const a = Number(sourceA) || 0;
  const b = Number(sourceB) || 0;
  if (a === 0 && b === 0) return { consistent: true, variance: 0, message: "Both zero" };
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  const variance = max === 0 ? 0 : ((max - min) / max) * 100;
  return {
    consistent: variance <= tolerancePercent,
    variance: Math.round(variance * 100) / 100,
    message: variance <= tolerancePercent
      ? `Consistent (${variance.toFixed(1)}% variance)`
      : `Inconsistent: ${variance.toFixed(1)}% variance between sources`,
  };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #94: Rate limit enforcement for internal accounts
// ═══════════════════════════════════════════════════════════════

const internalAccountCalls = new Map();

/**
 * Check if an internal system account is exceeding rate limits.
 * @param {string} accountId
 * @param {number} maxCallsPerMinute
 * @returns {{ allowed: boolean, remaining: number }}
 */
export function checkInternalRateLimit(accountId, maxCallsPerMinute = 100) {
  const now = Date.now();
  const window = 60 * 1000;
  const key = accountId;
  const calls = (internalAccountCalls.get(key) || []).filter(ts => now - ts < window);
  if (calls.length >= maxCallsPerMinute) {
    return { allowed: false, remaining: 0 };
  }
  calls.push(now);
  internalAccountCalls.set(key, calls);
  return { allowed: true, remaining: maxCallsPerMinute - calls.length };
}
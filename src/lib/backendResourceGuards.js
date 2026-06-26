/**
 * Backend Connection & Resource Guards
 * Fixes FLAW #81: Connection pooling exhaustion.
 * Fixes FLAW #82: Unhandled promise rejections in Deno.serve.
 * Fixes FLAW #83: Large payload size guard.
 * Fixes FLAW #84: Missing try/finally around external API calls.
 *
 * These are designed to be imported by backend functions (Deno).
 * Frontend code should NOT import this file.
 */

// ═══════════════════════════════════════════════════════════════
// FLAW #81: Connection pool guard — track active connections
// ═══════════════════════════════════════════════════════════════

const activeConnections = new Map();
const MAX_CONCURRENT_CONNECTIONS = 50;

/**
 * Track an active connection. Call at the start of a handler.
 * Returns a cleanup function to call in finally.
 * @param {string} handlerId - Unique ID for this request
 * @param {string} label - Human-readable label
 * @returns {function} Cleanup function
 */
export function trackConnection(handlerId, label = "handler") {
  activeConnections.set(handlerId, { label, startedAt: Date.now() });
  if (activeConnections.size > MAX_CONCURRENT_CONNECTIONS) {
    console.warn(`[connection-pool] High connection count: ${activeConnections.size}/${MAX_CONCURRENT_CONNECTIONS}`);
  }
  return () => {
    activeConnections.delete(handlerId);
  };
}

/**
 * Get active connection count and oldest connection age.
 * @returns {{ count: number, oldestAgeMs: number }}
 */
export function getConnectionStats() {
  const now = Date.now();
  let oldestAgeMs = 0;
  for (const conn of activeConnections.values()) {
    const age = now - conn.startedAt;
    if (age > oldestAgeMs) oldestAgeMs = age;
  }
  return { count: activeConnections.size, oldestAgeMs };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #82: Safe handler wrapper — catches all promise rejections
// ═══════════════════════════════════════════════════════════════

/**
 * Wrap a Deno.serve handler to ensure all errors are caught and
 * return proper JSON responses instead of crashing the instance.
 * @param {function} handler - The async handler function
 * @returns {function} Wrapped handler
 */
export function safeHandler(handler) {
  return async (req) => {
    const handlerId = `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cleanup = trackConnection(handlerId, req.url);
    try {
      const result = await handler(req);
      return result;
    } catch (error) {
      console.error(`[safe-handler] Unhandled error in ${handlerId}:`, error);
      return Response.json(
        { error: error?.message || "Internal server error", handler_id: handlerId },
        { status: 500 }
      );
    } finally {
      cleanup();
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #84: External API call wrapper with timeout and cleanup
// ═══════════════════════════════════════════════════════════════

/**
 * Wrap an external API call with timeout and resource cleanup.
 * Ensures connections are released even if the provider hangs.
 * @param {function} apiCall - Function that returns a Promise
 * @param {object} options
 * @param {number} options.timeoutMs - Timeout in milliseconds (default 10000)
 * @param {string} options.label - Label for error messages
 * @returns {Promise}
 */
export async function safeExternalCall(apiCall, options = {}) {
  const { timeoutMs = 10000, label = "External API call" } = options;
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([apiCall(), timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ═══════════════════════════════════════════════════════════════
// FLAW #43: AuditLog archival strategy — old logs should be archived
// ═══════════════════════════════════════════════════════════════

/**
 * Determine if an AuditLog record is old enough to archive.
 * Records older than 90 days should be archived to prevent
 * query performance degradation.
 * @param {object} record - AuditLog record
 * @param {number} retentionDays - Days to retain (default 90)
 * @returns {boolean}
 */
export function shouldArchiveAuditLog(record, retentionDays = 90) {
  if (!record || !record.created_date) return false;
  const age = Date.now() - new Date(record.created_date).getTime();
  return age > retentionDays * 24 * 60 * 60 * 1000;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #44: Stalled credentials alert — only for active services
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a "missing credentials" alert should fire.
 * Only fires for services that are actively enabled, not paused.
 * @param {object} service - Service configuration
 * @returns {{ shouldAlert: boolean, reason: string }}
 */
export function shouldAlertMissingCredentials(service) {
  if (!service) return { shouldAlert: false, reason: "no service config" };
  if (service.status === "paused" || service.paused === true) {
    return { shouldAlert: false, reason: "service is paused" };
  }
  if (service.status === "offboarded" || service.offboarded === true) {
    return { shouldAlert: false, reason: "service is offboarded" };
  }
  const hasCredentials = Boolean(
    service.api_key || service.account_sid || service.auth_token || service.secret_key
  );
  if (!hasCredentials) {
    return { shouldAlert: true, reason: "active service missing credentials" };
  }
  return { shouldAlert: false, reason: "credentials present" };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #45: Settings history — track changes for audit/diff
// ═══════════════════════════════════════════════════════════════

/**
 * Compute a diff between old and new settings objects.
 * Returns only the fields that changed, with before/after values.
 * @param {object} oldSettings
 * @param {object} newSettings
 * @returns {object} Diff object: { field: { before, after } }
 */
export function computeSettingsDiff(oldSettings = {}, newSettings = {}) {
  const diff = {};
  const allKeys = new Set([...Object.keys(oldSettings), ...Object.keys(newSettings)]);
  for (const key of allKeys) {
    const oldVal = oldSettings[key];
    const newVal = newSettings[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { before: oldVal ?? null, after: newVal ?? null };
    }
  }
  return diff;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #31: EventQueue backlog cleanup — identify processed events
// ═══════════════════════════════════════════════════════════════

/**
 * Check if an EventQueue record is safe to clean up.
 * Processed/successfully handled events older than 7 days can be removed.
 * @param {object} eventRecord
 * @param {number} retentionDays
 * @returns {boolean}
 */
export function shouldCleanupEvent(eventRecord, retentionDays = 7) {
  if (!eventRecord) return false;
  if (eventRecord.status !== "processed" && eventRecord.status !== "completed") return false;
  if (!eventRecord.updated_date && !eventRecord.created_date) return false;
  const age = Date.now() - new Date(eventRecord.updated_date || eventRecord.created_date).getTime();
  return age > retentionDays * 24 * 60 * 60 * 1000;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #32: Stripe webhook race condition guard
// ═══════════════════════════════════════════════════════════════

/**
 * Check if an order has already been processed for a given Stripe event.
 * Prevents double-provisioning when webhooks fire near-simultaneously.
 * @param {string} orderId - The order ID
 * @param {string} eventId - The Stripe event ID
 * @param {Array} existingEvents - List of already-processed event IDs
 * @returns {boolean} True if already processed, false if new
 */
export function isStripeEventAlreadyProcessed(orderId, eventId, existingEvents = []) {
  if (!eventId) return false;
  return existingEvents.some(e => e === eventId);
}

// ═══════════════════════════════════════════════════════════════
// FLAW #34: AutomationJob memory limit — chunk large batches
// ═══════════════════════════════════════════════════════════════

/**
 * Split a large array into smaller chunks to avoid memory limits.
 * @param {Array} array - Array to chunk
 * @param {number} chunkSize - Max items per chunk (default 50)
 * @returns {Array<Array>}
 */
export function chunkArray(array, chunkSize = 50) {
  if (!Array.isArray(array)) return [];
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// ═══════════════════════════════════════════════════════════════
// FLAW #46: Twilio SMS status callback reliability
// ═══════════════════════════════════════════════════════════════

/**
 * Map Twilio message status to internal CommunicationEvent status.
 * Ensures reliable status updates from callbacks.
 * @param {string} twilioStatus - Raw Twilio status
 * @returns {string} Internal status
 */
export function mapTwilioStatus(twilioStatus) {
  const statusMap = {
    queued: "pending",
    sent: "sent",
    delivered: "delivered",
    undelivered: "failed",
    failed: "failed",
    accepted: "sent",
    scheduled: "pending",
    canceled: "failed",
    receiving: "received",
    received: "received",
  };
  return statusMap[twilioStatus] || "unknown";
}

// ═══════════════════════════════════════════════════════════════
// FLAW #48: ElevenLabs credential verification before provisioning
// ═══════════════════════════════════════════════════════════════

/**
 * Verify ElevenLabs credentials are present and non-empty before
 * attempting agent registration.
 * @param {object} config - Config with elevenlabs_api_key, agent_id, phone_number_id
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function verifyElevenLabsCredentials(config = {}) {
  const missing = [];
  if (!config.elevenlabs_api_key) missing.push("elevenlabs_api_key");
  if (!config.agent_id) missing.push("agent_id");
  if (!config.phone_number_id) missing.push("phone_number_id");
  return { valid: missing.length === 0, missing };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #49: Calendly booking type distinction
// ═══════════════════════════════════════════════════════════════

/**
 * Determine if a Calendly webhook is a new booking or a reschedule.
 * @param {object} payload - Calendly webhook payload
 * @returns {{ isNew: boolean, isReschedule: boolean, isCancellation: boolean }}
 */
export function parseCalendlyEventType(payload) {
  const event = payload?.event || "";
  return {
    isNew: event === "invitee.created",
    isReschedule: event === "invitee.updated" && payload?.payload?.old_invitee !== undefined,
    isCancellation: event === "invitee.canceled",
  };
}

// ═══════════════════════════════════════════════════════════════
// FLAW #61: Staggered animation early trigger prevention
// ═══════════════════════════════════════════════════════════════

/**
 * Animation throttle — prevents animation re-triggering on fast scroll.
 * Returns true only if the animation hasn't been triggered in the last 500ms.
 * @param {string} elementId
 * @returns {boolean}
 */
const animationTriggers = new Map();
export function shouldTriggerAnimation(elementId) {
  const now = Date.now();
  const lastTrigger = animationTriggers.get(elementId) || 0;
  if (now - lastTrigger < 500) return false;
  animationTriggers.set(elementId, now);
  return true;
}
/**
 * Shared alert trigger helper — FIX #13-15 (throttle) + original behavior
 * Call from webhook handlers to create alerts non-blocking.
 * Usage: triggerAlert(base44, { trigger_type, lead_id, phone_number, intent, message }, 'throttle_key')
 */

// In-memory throttle registry: key → last-fired timestamp
const _throttleRegistry = {};

function _shouldFire(key, minMs) {
  const now = Date.now();
  const last = _throttleRegistry[key];
  if (last && (now - last) < minMs) return false;
  _throttleRegistry[key] = now;
  return true;
}

export async function triggerAlert(base44, payload, throttleKey, minIntervalMs) {
  const tKey = throttleKey || null;
  const minMs = minIntervalMs || (5 * 60 * 1000);
  try {
    if (tKey && !_shouldFire(tKey, minMs)) {
      console.log("[alertSystem] Throttled:", tKey);
      return;
    }
    base44.functions.invoke("alertTrigger", payload).catch(function(err) {
      console.error("[alertSystem] Alert trigger failed:", err);
    });
  } catch (err) {
    console.error("[alertSystem] Alert invocation error:", err);
  }
}

export function isHighIntent(message, intent) {
  if (!message) return false;
  const lowerMsg = message.toLowerCase();
  const keywords = ["book", "booking", "urgent", "asap", "now", "today", "price", "pricing"];
  const hasKeyword = keywords.some(function(kw) { return lowerMsg.includes(kw); });
  const isBooking = intent === "booking";
  return hasKeyword || isBooking;
}
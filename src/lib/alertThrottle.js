// FIX #15: Alert throttle — prevents alert fatigue when providers go down
// Tracks last-fired time per alert key and enforces minimum spacing

const ALERT_REGISTRY = new Map();

/**
 * Check if an alert should fire or is being throttled.
 * @param {string} key - Unique alert identifier (e.g. "twilio_down", "stripe_error")
 * @param {number} minIntervalMs - Minimum ms between same alert (default: 5 minutes)
 * @returns {boolean} true if alert should fire, false if throttled
 */
export function shouldFireAlert(key, minIntervalMs = 5 * 60 * 1000) {
  const now = Date.now();
  const lastFired = ALERT_REGISTRY.get(key);

  if (lastFired && now - lastFired < minIntervalMs) {
    return false; // throttled
  }

  ALERT_REGISTRY.set(key, now);
  return true;
}

/**
 * Clear a throttle key (e.g. when an issue resolves)
 */
export function clearAlertThrottle(key) {
  ALERT_REGISTRY.delete(key);
}

/**
 * Get all currently throttled alert keys and their next-fire time
 */
export function getThrottleStatus() {
  const status = {};
  const now = Date.now();
  for (const [key, lastFired] of ALERT_REGISTRY.entries()) {
    status[key] = {
      lastFired: new Date(lastFired).toISOString(),
      throttledFor: Math.max(0, 5 * 60 * 1000 - (now - lastFired)),
    };
  }
  return status;
}
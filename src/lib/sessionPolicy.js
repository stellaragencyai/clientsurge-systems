/**
 * Task 27 — Session token expiration policy
 * Hard-coded session validity limits
 */

export const SESSION_POLICY = {
  /** Max session age in ms (8 hours) */
  MAX_SESSION_AGE_MS: 8 * 60 * 60 * 1000,
  /** Inactivity timeout in ms (2 hours) */
  INACTIVITY_TIMEOUT_MS: 2 * 60 * 60 * 1000,
  /** Warning before expiry in ms (15 minutes) */
  EXPIRY_WARNING_MS: 15 * 60 * 1000,
};

export function isSessionExpired(loginTimestamp) {
  if (!loginTimestamp) return true;
  return Date.now() - new Date(loginTimestamp).getTime() > SESSION_POLICY.MAX_SESSION_AGE_MS;
}

export function isSessionInactive(lastActivityTimestamp) {
  if (!lastActivityTimestamp) return true;
  return Date.now() - new Date(lastActivityTimestamp).getTime() > SESSION_POLICY.INACTIVITY_TIMEOUT_MS;
}

export function shouldWarnExpiry(loginTimestamp) {
  if (!loginTimestamp) return false;
  const age = Date.now() - new Date(loginTimestamp).getTime();
  const remaining = SESSION_POLICY.MAX_SESSION_AGE_MS - age;
  return remaining > 0 && remaining <= SESSION_POLICY.EXPIRY_WARNING_MS;
}
/**
 * Shared Security Utilities
 * Fix #4: HTML escaping for user input in email templates (XSS prevention)
 * Fix #2: Phone normalization to E.164 format
 * Fix #12: Engagement score clamping
 * Fix #22: Safe numeric field access with defaults
 */

/**
 * Escape HTML special characters to prevent XSS in email templates.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  if (typeof text !== "string") return String(text ?? "");
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX for US).
 * Returns null if the input can't be normalized.
 * @param {string} phone
 * @returns {string|null}
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits[0] === "1") return "+" + digits;
  if (digits.length > 11) return "+" + digits.slice(-10);
  return null; // too short to be valid
}

/**
 * Check if a phone number is valid (10+ digits after stripping non-numeric).
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10;
}

/**
 * Clamp engagement score to [0, 100].
 * @param {number} score
 * @returns {number}
 */
export function clampEngagementScore(score) {
  return Math.max(0, Math.min(100, Number(score) || 0));
}

/**
 * Safely get a numeric field with a default value (avoids undefined math).
 * @param {any} value
 * @param {number} defaultValue
 * @returns {number}
 */
export function safeNum(value, defaultValue = 0) {
  const n = Number(value);
  return isNaN(n) ? defaultValue : n;
}
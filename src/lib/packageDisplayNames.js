/**
 * Package Display Name Normalization
 *
 * Canonical internal keys → customer-facing display names.
 * Legacy "elite_system" is displayed as "Pro System" when read.
 * Old records are never deleted or modified — only the display name is normalized.
 *
 * Usage:
 *   import { getPackageDisplayName, normalizePackageKey } from "@/lib/packageDisplayNames";
 *   const name = getPackageDisplayName(record.selected_package_type);  // "Pro System"
 */

const PACKAGE_DISPLAY_MAP = {
  starter_system: "Starter System",
  growth_system: "Growth System",
  pro_system: "Pro System",
  elite_system: "Pro System", // Legacy alias — displayed as Pro System
  // Short aliases for convenience
  starter: "Starter System",
  growth: "Growth System",
  pro: "Pro System",
  elite: "Pro System",
};

const CANONICAL_KEY_MAP = {
  starter_system: "starter_system",
  growth_system: "growth_system",
  pro_system: "pro_system",
  elite_system: "pro_system", // Legacy elite → canonical pro
  starter: "starter_system",
  growth: "growth_system",
  pro: "pro_system",
  elite: "pro_system",
};

/**
 * Get the customer-facing display name for a package key.
 * @param {string} key - The internal package key (e.g. "elite_system", "starter_system")
 * @returns {string} The display name (e.g. "Pro System", "Starter System")
 */
export function getPackageDisplayName(key) {
  if (!key) return "Unknown Package";
  const normalized = String(key).toLowerCase().trim();
  return PACKAGE_DISPLAY_MAP[normalized] || key;
}

/**
 * Get the canonical internal key for a package.
 * Useful when writing new records or normalizing queries.
 * @param {string} key - The package key (possibly legacy)
 * @returns {string} The canonical key (e.g. "pro_system" for "elite_system")
 */
export function normalizePackageKey(key) {
  if (!key) return null;
  const normalized = String(key).toLowerCase().trim();
  return CANONICAL_KEY_MAP[normalized] || normalized;
}

/**
 * Check if a package key is the legacy elite_system.
 * @param {string} key
 * @returns {boolean}
 */
export function isLegacyElite(key) {
  if (!key) return false;
  return String(key).toLowerCase().trim() === "elite_system";
}

/**
 * All valid package keys (canonical only).
 */
export const PACKAGE_KEYS = ["starter_system", "growth_system", "pro_system"];

/**
 * All package display names in tier order.
 */
export const PACKAGE_NAMES = ["Starter System", "Growth System", "Pro System"];
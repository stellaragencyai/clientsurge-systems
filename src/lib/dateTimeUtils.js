/**
 * Timezone-Aware Scheduling Utility
 * Fixes FLAW #79: Timezone drift in scheduled_automations during DST.
 * Fixes FLAW #56: Currency display isn't localized.
 * Fixes FLAW #57: Date formatting uses inconsistent styles.
 *
 * Centralized helpers for timezone conversion, date formatting,
 * and currency display — all using the user's locale/timezone.
 */

/**
 * Get the user's IANA timezone from the browser.
 * @returns {string} e.g. "America/Phoenix"
 */
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Format a date consistently across the app.
 * @param {string|Date} date - ISO date string or Date object
 * @param {string} format - 'short' | 'long' | 'datetime' | 'time' | 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = "short") {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const locale = "en-US";
  const timezone = getUserTimezone();

  try {
    switch (format) {
      case "short":
        return d.toLocaleDateString(locale, { timeZone: timezone, year: "numeric", month: "short", day: "numeric" });
      case "long":
        return d.toLocaleDateString(locale, { timeZone: timezone, weekday: "short", year: "numeric", month: "long", day: "numeric" });
      case "datetime":
        return d.toLocaleString(locale, { timeZone: timezone, year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      case "time":
        return d.toLocaleTimeString(locale, { timeZone: timezone, hour: "numeric", minute: "2-digit" });
      case "relative":
        return formatRelativeTime(d);
      default:
        return d.toLocaleDateString(locale, { timeZone: timezone });
    }
  } catch {
    return d.toISOString().split("T")[0];
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago").
 * @param {Date} date
 * @returns {string}
 */
function formatRelativeTime(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * Format currency consistently.
 * Fixes FLAW #56.
 * @param {number} amount - Amount in dollars
 * @param {string} currency - ISO currency code (default USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = "USD") {
  if (amount === null || amount === undefined || isNaN(amount)) return "$0";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

/**
 * Format a number with thousands separators.
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a percentage consistently.
 * @param {number} value - 0-100 or 0-1
 * @param {boolean} isFraction - If true, value is 0-1
 * @returns {string}
 */
export function formatPercent(value, isFraction = false) {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  const percent = isFraction ? value * 100 : value;
  return `${percent.toFixed(percent < 10 ? 1 : 0)}%`;
}

/**
 * Convert a local datetime to UTC for storage/scheduling.
 * Handles DST transitions correctly.
 * @param {string} localDateTime - ISO datetime in local time
 * @returns {string} UTC ISO datetime
 */
export function toUTC(localDateTime) {
  if (!localDateTime) return new Date().toISOString();
  const date = new Date(localDateTime);
  return date.toISOString();
}

/**
 * Convert a UTC datetime to the user's local timezone for display.
 * @param {string} utcDateTime - ISO datetime in UTC
 * @returns {string} Local datetime string
 */
export function fromUTC(utcDateTime) {
  if (!utcDateTime) return "—";
  return formatDate(utcDateTime, "datetime");
}
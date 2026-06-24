/**
 * SHARED PHONE NORMALIZATION — E.164
 * 
 * Single source of truth for all backend SMS paths.
 * Every Twilio SMS send must call normalizePhoneToE164() before building
 * the request payload.
 * 
 * Rules:
 *   6025874608        -> +16025874608  (US 10-digit)
 *   (602) 587-4608    -> +16025874608  (formatted US)
 *   602-587-4608      -> +16025874608  (dashed US)
 *   +16025874608      -> +16025874608  (already E.164)
 *   16025874608       -> +16025874608  (US with country code)
 *   4805676592        -> +14805676592  (different area code)
 * 
 * MUST NEVER:
 *   - Replace the caller area code with the Twilio from-number area code
 *   - Return raw digits without + prefix
 *   - Return null for a valid 10-digit US number
 */

/**
 * Normalize any phone input to canonical E.164.
 * Returns null if the number is invalid — callers must skip the send
 * and log sms_failed/sms_skipped with error 'invalid_phone_number'.
 */
export function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== 'string') return null;

  // Strip spaces, dashes, parentheses, dots, and all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) return null;

  // US 10-digit number → prefix +1
  if (cleaned.length === 10) {
    // Reject numbers with 0/1 as first digit of area code (invalid NANP)
    if (cleaned[0] === '0' || cleaned[0] === '1') return null;
    return `+1${cleaned}`;
  }

  // US 11-digit starting with 1 → +1 + 10 digits
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const tenDigits = cleaned.slice(1);
    if (tenDigits[0] === '0' || tenDigits[0] === '1') return null;
    return `+${cleaned}`;
  }

  // International: 11–15 digits → prefix +
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Validate that a string is already in E.164 format.
 */
export function isValidE164Phone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Safe normalize: returns the original if already valid E.164,
 * otherwise tries to normalize. Returns null if both fail.
 */
export function ensureE164(phone) {
  if (isValidE164Phone(phone)) return phone;
  return normalizePhoneToE164(phone);
}
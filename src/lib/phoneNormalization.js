// E.164 phone normalization — centralized utility (frontend + shared)
// Backend functions use functions/_shared/phoneNormalization.js (same logic, inlined)

export function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== "string") return null;

  // Strip spaces, dashes, parentheses, dots, and all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 0) return null;

  // US 10-digit number → prefix +1
  if (cleaned.length === 10) {
    if (cleaned[0] === "0" || cleaned[0] === "1") return null;
    return `+1${cleaned}`;
  }

  // US 11-digit starting with 1 → +1 + 10 digits
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    const tenDigits = cleaned.slice(1);
    if (tenDigits[0] === "0" || tenDigits[0] === "1") return null;
    return `+${cleaned}`;
  }

  // International: 11–15 digits → prefix +
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }

  return null;
}

export function isValidE164Phone(phone) {
  if (!phone || typeof phone !== "string") return false;
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

export function ensureE164(phone) {
  if (isValidE164Phone(phone)) return phone;
  return normalizePhoneToE164(phone);
}
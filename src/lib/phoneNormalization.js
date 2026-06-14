// Task #24: E.164 phone normalization — centralized utility
export function normalizePhoneToE164(phone) {
  if (!phone || typeof phone !== "string") return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) return null;
  return `+${cleaned}`;
}

export function isValidE164Phone(phone) {
  if (!phone || !phone.startsWith("+")) return false;
  return /^\+[1-9]\d{1,14}$/.test(phone);
}
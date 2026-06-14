/**
 * Normalize phone numbers to E.164 format (+1XXXXXXXXXX)
 * Handles: 10 digits, 11 digits, +1, spaces, dashes, parentheses
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Must be 10 or 11 digits
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  if (digits.length > 11) {
    // Assume US if too long, take last 10
    return `+1${digits.slice(-10)}`;
  }
  
  return null; // Invalid
}

/**
 * Check if two phone numbers match after normalization
 */
export function phonesMatch(phone1, phone2) {
  const norm1 = normalizePhone(phone1);
  const norm2 = normalizePhone(phone2);
  return norm1 && norm2 && norm1 === norm2;
}

/**
 * Validate phone is valid E.164 format
 */
export function isValidPhone(phone) {
  return normalizePhone(phone) !== null;
}
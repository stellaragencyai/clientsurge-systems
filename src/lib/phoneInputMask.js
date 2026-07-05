/**
 * Finding #95: Phone number input mask — formats as (XXX) XXX-XXXX as user types.
 * Finding #97: Trust signal helper text for lead capture forms.
 */

export function formatPhoneInput(value) {
  if (!value) return "";
  // Strip all non-digits
  const digits = value.replace(/\D/g, "");
  // Limit to 10 digits (US)
  const limited = digits.slice(0, 10);

  if (limited.length === 0) return "";
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}
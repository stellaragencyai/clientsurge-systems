/**
 * Task 22 — PII scrubber for logs
 * Masks emails and phone numbers before logging to CommunicationEvent
 */

export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[no-email]';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const masked = local.length <= 2 ? '***' : `${local[0]}***${local[local.length - 1]}`;
  return `${masked}@${domain}`;
}

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '[no-phone]';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***-***-${digits.slice(-4)}`;
}

export function scrubPii(obj = {}) {
  const scrubbed = { ...obj };
  if (scrubbed.email) scrubbed.email = maskEmail(scrubbed.email);
  if (scrubbed.phone || scrubbed.phone_number) {
    scrubbed.phone = maskPhone(scrubbed.phone || scrubbed.phone_number);
    delete scrubbed.phone_number;
  }
  if (scrubbed.customer_email) scrubbed.customer_email = maskEmail(scrubbed.customer_email);
  if (scrubbed.customer_phone) scrubbed.customer_phone = maskPhone(scrubbed.customer_phone);
  return scrubbed;
}
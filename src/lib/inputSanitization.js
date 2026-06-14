/**
 * Input sanitization middleware for XSS prevention
 * Strips HTML tags and dangerous patterns from user input
 */

const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onload=, onclick=, etc.
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
];

export function sanitizeString(input) {
  if (typeof input !== "string") return input;

  let sanitized = input;

  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Remove HTML tags but preserve text
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Decode HTML entities to prevent double-encoding
  sanitized = decodeHTMLEntities(sanitized);

  return sanitized.trim();
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === "string" ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function decodeHTMLEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
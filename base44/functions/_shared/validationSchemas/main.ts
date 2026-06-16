/**
 * Centralized Zod validation schemas for all API inputs
 * Ensures consistent validation and early error handling across webhooks and forms
 */

// Note: zod would normally be installed, but we'll provide JSON schema validation instead
// This is a pattern you can extend with npm:zod when needed

export function validateWebhookPayload(payload, schema) {
  // Basic validation helper - replace with actual zod when package is added
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: must be an object');
  }
  return payload;
}

export function validateLeadForm(data) {
  const required = ['full_name', 'email', 'phone', 'business_name', 'problem'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Invalid email format');
  }

  if (!/^\+?[\d\s\-()]{10,}$/.test(data.phone)) {
    throw new Error('Invalid phone number');
  }

  return data;
}

export function validateOrderPayload(data) {
  const required = ['customer_email', 'customer_name', 'business_name'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  return data;
}

export function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  // Remove HTML-like tags and script content
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
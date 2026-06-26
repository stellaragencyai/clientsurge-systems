/**
 * Webhook Payload Validation Schema
 * Fixes FLAW #66: No shared schema for webhook payloads.
 * Fixes FLAW #37: Missing input validation on public forms.
 *
 * Provides validation functions for all incoming webhook and form payloads.
 * Returns { valid: boolean, errors: string[], sanitized: object }.
 */

// ═══════════════════════════════════════════════════════════════
// FLAW #39: Content Security Policy header builder
// ═══════════════════════════════════════════════════════════════

/**
 * Build a Content Security Policy header value.
 * Fixes FLAW #39, #90.
 * @returns {string} CSP header value
 */
export function buildCSPHeader() {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://cdn.worldvectorlogo.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com wss: ws:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://api.stripe.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

/**
 * Build security headers object for HTTP responses.
 * @returns {object} Headers object
 */
export function buildSecurityHeaders() {
  return {
    "Content-Security-Policy": buildCSPHeader(),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}

// ═══════════════════════════════════════════════════════════════
// Payload validators
// ═══════════════════════════════════════════════════════════════

/**
 * Validate a lead capture form submission.
 * @param {object} payload
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateLeadCapturePayload(payload) {
  const errors = [];
  const sanitized = {};

  if (!payload) {
    return { valid: false, errors: ["No payload"], sanitized: {} };
  }

  // Required fields
  const requiredFields = ["full_name", "email", "phone", "business_name"];
  for (const field of requiredFields) {
    if (!payload[field] || !String(payload[field]).trim()) {
      errors.push(`Missing required field: ${field}`);
    } else {
      sanitized[field] = String(payload[field]).trim().slice(0, 500);
    }
  }

  // Email format
  if (payload.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      errors.push("Invalid email format");
    }
  }

  // Phone format (at least 10 digits)
  if (payload.phone) {
    const digits = String(payload.phone).replace(/\D/g, "");
    if (digits.length < 10) {
      errors.push("Phone number must have at least 10 digits");
    }
  }

  // Optional fields
  if (payload.business_type) sanitized.business_type = String(payload.business_type).slice(0, 200);
  if (payload.business_website_url) sanitized.business_website_url = String(payload.business_website_url).slice(0, 2000);
  if (payload.message) sanitized.message = String(payload.message).slice(0, 5000);
  if (payload.source) sanitized.source = String(payload.source).slice(0, 100);
  if (payload.industry_slug) sanitized.industry_slug = String(payload.industry_slug).slice(0, 100);

  // Consent
  sanitized.consent_given = payload.consent_given === true;

  // UTM params (pass through, capped)
  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  for (const field of utmFields) {
    if (payload[field]) sanitized[field] = String(payload[field]).slice(0, 200);
  }

  return { valid: errors.length === 0, errors, sanitized };
}

/**
 * Validate a Stripe webhook event.
 * @param {object} event - Stripe event object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStripeEvent(event) {
  const errors = [];
  if (!event) {
    return { valid: false, errors: ["No event"] };
  }
  if (!event.type) {
    errors.push("Missing event type");
  }
  if (!event.id) {
    errors.push("Missing event ID");
  }
  if (!event.data || !event.data.object) {
    errors.push("Missing event data object");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a Twilio webhook payload.
 * @param {object} payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTwilioPayload(payload) {
  const errors = [];
  if (!payload) {
    return { valid: false, errors: ["No payload"] };
  }
  if (!payload.MessageSid && !payload.CallSid) {
    errors.push("Missing MessageSid or CallSid");
  }
  if (!payload.From && !payload.Caller) {
    errors.push("Missing From/Caller");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a Resend webhook payload.
 * @param {object} payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateResendPayload(payload) {
  const errors = [];
  if (!payload) {
    return { valid: false, errors: ["No payload"] };
  }
  if (!payload.type) {
    errors.push("Missing event type");
  }
  if (payload.data && !payload.data.email_id) {
    errors.push("Missing email_id in data");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate an ElevenLabs post-call webhook payload.
 * @param {object} payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateElevenLabsPayload(payload) {
  const errors = [];
  if (!payload) {
    return { valid: false, errors: ["No payload"] };
  }
  if (!payload.call_id && !payload.conversation_id) {
    errors.push("Missing call_id or conversation_id");
  }
  return { valid: errors.length === 0, errors };
}
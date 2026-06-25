// FIX #7 + #22: Sensitive data + PII scrubber — prevents PII/secrets/contact info in logs
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_PATTERN = /(\+?1\s?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;
const PII_KEYS = ["email", "phone", "full_name", "business_name", "lead_name", "customer_email", "customer_phone", "customer_name", "lead_email", "lead_phone", "lead_name", "to_address", "canonical_to_address"];

export function scrubPII(data) {
  if (!data) return data;
  if (typeof data === "string") {
    return data.replace(EMAIL_PATTERN, "[EMAIL]").replace(PHONE_PATTERN, "[PHONE]");
  }
  if (Array.isArray(data)) return data.map(scrubPII);
  if (typeof data === "object") {
    const out = {};
    for (const [key, val] of Object.entries(data)) {
      out[key] = PII_KEYS.includes(key)
        ? (typeof val === "string" ? "[REDACTED]" : val)
        : scrubPII(val);
    }
    return out;
  }
  return data;
}

export function scrubMetadata(metadata) {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try { return JSON.stringify(scrubPII(JSON.parse(metadata))); } 
    catch (_e) { return metadata.replace(EMAIL_PATTERN, "[EMAIL]").replace(PHONE_PATTERN, "[PHONE]"); }
  }
  return scrubPII(metadata);
}

export function scrubPayloadForLogging(payload) {
  return JSON.stringify(scrubPII(payload));
}

export function scrubSensitiveData(obj) {
  if (!obj || typeof obj !== "object") return obj;
  
  const sensitiveFields = [
    "password", "secret", "token", "apiKey", "api_key",
    "stripe_key", "twilio_key", "auth", "authorization",
    "credit_card", "ssn", "social_security", "cvv",
    "access_token", "refresh_token", "api_secret"
  ];
  
  const scrubbed = JSON.parse(JSON.stringify(obj));
  
  function scrubRecursive(node) {
    if (Array.isArray(node)) {
      node.forEach(scrubRecursive);
    } else if (node && typeof node === "object") {
      Object.keys(node).forEach((key) => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          node[key] = "[REDACTED]";
        } else {
          scrubRecursive(node[key]);
        }
      });
    }
  }
  
  scrubRecursive(scrubbed);
  return scrubbed;
}

export function logSafely(context, data) {
  console.log(context, scrubSensitiveData(data));
}
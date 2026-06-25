/**
 * PII Scrubber Utility — FIX #7
 * Removes sensitive PII from logs, metadata, and communication event records.
 */

var EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
var PHONE_RE = /(\+?1\s?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;
var PII_KEYS = ["email", "phone", "full_name", "business_name", "lead_name", "customer_name", "customer_email", "customer_phone"];

function scrubString(s) {
  return s.replace(EMAIL_RE, "[EMAIL]").replace(PHONE_RE, "[PHONE]");
}

export function scrubPII(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") return scrubString(data);
  if (Array.isArray(data)) return data.map(scrubPII);
  if (typeof data === "object") {
    var out = {};
    for (var key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        out[key] = PII_KEYS.indexOf(key) !== -1
          ? (typeof data[key] === "string" ? "[REDACTED]" : data[key])
          : scrubPII(data[key]);
      }
    }
    return out;
  }
  return data;
}

export function scrubMetadata(metadata) {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try {
      return JSON.stringify(scrubPII(JSON.parse(metadata)));
    } catch (_e) {
      return scrubString(metadata);
    }
  }
  return scrubPII(metadata);
}

export function scrubPayloadForLogging(payload) {
  return JSON.stringify(scrubPII(payload));
}
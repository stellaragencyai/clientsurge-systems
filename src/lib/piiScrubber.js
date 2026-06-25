// FIX #22: Sensitive data scrubber — prevents PII/secrets in logs
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
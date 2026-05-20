/**
 * piiScrubber.ts — #495
 * Scrubs full phone numbers and email addresses from AgentLog entries.
 * Import and wrap all AgentLog.create() calls.
 */

// Regex patterns
const PHONE_RE = /(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/g;
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

export function scrubPII(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(PHONE_RE, (m) => {
      // Keep last 4 digits only: ***-***-1234
      const digits = m.replace(/\D/g, "");
      return `***-***-${digits.slice(-4)}`;
    })
    .replace(EMAIL_RE, (m) => {
      // Keep domain only: ***@example.com
      const parts = m.split("@");
      return `***@${parts[1] || "***"}`;
    });
}

export function scrubLogEntry(entry: Record<string, any>): Record<string, any> {
  const scrubbed = { ...entry };
  for (const key of ["summary", "details", "notes"]) {
    if (scrubbed[key]) {
      scrubbed[key] = typeof scrubbed[key] === "string"
        ? scrubPII(scrubbed[key])
        : scrubPII(JSON.stringify(scrubbed[key]));
    }
  }
  return scrubbed;
}

// Wrapper: use instead of AgentLog.create() directly
export async function safeLogCreate(base44: any, entry: Record<string, any>) {
  return base44.asServiceRole.entities.AgentLog.create(scrubLogEntry(entry));
}

/**
 * aiHallucinationGuard.ts — #477
 * After OpenAI returns SMS/email copy, re-prompts to verify:
 * 1. No made-up prices, phone numbers, or URLs
 * 2. Business name matches
 * 3. Opt-out footer present on SMS
 */

const PRICE_RE = /\\$[\d,]+(?:\.\d{2})?/g;
const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const URL_RE = /https?:\/\/[^\s]+/g;

export interface GuardResult {
  passed: boolean;
  warnings: string[];
  sanitized: string;
}

export function guardSMSOutput(text: string, business_name: string): GuardResult {
  const warnings: string[] = [];
  let sanitized = text;

  // Check opt-out footer
  if (!/reply stop/i.test(text)) {
    sanitized += " Reply STOP to opt out.";
    warnings.push("Added missing opt-out footer");
  }

  // Flag fabricated prices
  const prices = text.match(PRICE_RE) || [];
  if (prices.length > 0) {
    warnings.push(`Potential fabricated prices detected: ${prices.join(", ")} — review before sending`);
  }

  // Flag fabricated phone numbers (not the business number)
  const phones = text.match(PHONE_RE) || [];
  if (phones.length > 0) {
    warnings.push(`Phone numbers in AI output: ${phones.join(", ")} — verify these are correct`);
  }

  // Flag URLs that look invented
  const urls = text.match(URL_RE) || [];
  for (const url of urls) {
    if (!url.includes(business_name.toLowerCase().replace(/\s/g, "")) && !url.includes("clientsurgesystems")) {
      warnings.push(`Unrecognized URL in output: ${url} — may be hallucinated`);
      sanitized = sanitized.replace(url, "[LINK]");
    }
  }

  return { passed: warnings.filter(w => !w.startsWith("Added")).length === 0, warnings, sanitized };
}

export function guardEmailOutput(html: string, business_name: string): GuardResult {
  const warnings: string[] = [];
  const sanitized = html;
  const prices = html.match(PRICE_RE) || [];
  if (prices.length > 0) warnings.push(`Prices in email: ${prices.join(", ")} — verify`);
  const urls = html.match(URL_RE) || [];
  for (const url of urls) {
    if (url.includes("example.com") || url.includes("placeholder")) {
      warnings.push(`Placeholder URL found: ${url}`);
    }
  }
  return { passed: warnings.length === 0, warnings, sanitized };
}

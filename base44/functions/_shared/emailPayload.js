const DEFAULT_FROM_EMAIL = "system@clientsurgesystems.com";
const BRAND_NAME = "ClientSurge Systems";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanString(value));
}

export function formatClientSurgeFrom(value = "", defaultEmail = DEFAULT_FROM_EMAIL) {
  const configured = cleanString(value);
  if (configured.includes("<") && configured.includes(">")) {
    return configured;
  }

  const email = isEmail(configured) ? configured : defaultEmail;
  return `${BRAND_NAME} <${email}>`;
}

export function htmlToPlainText(html = "") {
  return cleanString(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildResendEmailPayload(payload = {}, options = {}) {
  const html = cleanString(payload.html || payload.body || "");
  const text = cleanString(payload.text) || htmlToPlainText(html);
  const fromEmail =
    cleanString(payload.from) ||
    cleanString(options.from) ||
    cleanString(globalThis.Deno?.env?.get?.("RESEND_FROM_EMAIL")) ||
    DEFAULT_FROM_EMAIL;

  return {
    ...payload,
    from: formatClientSurgeFrom(fromEmail, options.defaultFromEmail || DEFAULT_FROM_EMAIL),
    html,
    text,
  };
}

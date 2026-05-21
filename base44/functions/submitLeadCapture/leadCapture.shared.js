export const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "temp-mail.org",
  "throwaway.email",
  "fakeinbox.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "guerrillamail.info",
  "spam4.me",
  "tempmail.com",
  "tmpmail.net",
  "tmpmail.org",
  "tmp-mail.org",
  "throwam.com",
]);

export const SIXTY_MINUTES = 60 * 60 * 1000;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const RATE_LIMIT_MAX = 3;
export const MAX_FIELD_LENGTH = 500;
export const MAX_PROBLEM_LENGTH = 1500;
export const MAX_LEAD_CAPTURE_BYTES = 12 * 1024;
export const ALLOWED_REQUESTED_CHANNELS = new Set(["email", "sms", "call"]);

export function cleanString(value, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

export function normalizePhone(value) {
  const digits = cleanString(value).replace(/\D/g, "");
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return normalized.length >= 10 && normalized.length <= 15 ? normalized : "";
}

export function isDisposableEmail(email) {
  const domain = normalizeEmail(email).split("@")[1] || "";
  return DISPOSABLE_DOMAINS.has(domain);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function normalizeRequestedChannels(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((entry) => cleanString(entry).toLowerCase())
        .filter((entry) => ALLOWED_REQUESTED_CHANNELS.has(entry))
    ),
  ];
}

export function normalizeSourcePage(value) {
  const sourcePage = cleanString(value, 300);
  if (!sourcePage || !sourcePage.startsWith("/")) {
    return "/";
  }

  if (sourcePage.startsWith("//") || sourcePage.includes("://")) {
    return "/";
  }

  return sourcePage;
}

export function maskIpAddress(value) {
  const ip = cleanString(value, 80).split(",")[0].trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return ip.replace(/\.\d{1,3}$/, ".0");
  }

  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":") + "::";
  }

  return "";
}

export function buildDedupKey({ email, phone }) {
  return email || phone || crypto.randomUUID();
}

export function findDuplicateWebsiteLead({ leads, email, phone, nowMs = Date.now(), windowMs = SIXTY_MINUTES }) {
  const since = new Date(nowMs - windowMs).toISOString();

  return (leads || []).find((lead) => {
    const matchesEmail = email && normalizeEmail(lead.email) === email;
    const matchesPhone = phone && normalizePhone(lead.phone_number) === phone;
    return (matchesEmail || matchesPhone) && lead.created_date >= since;
  }) || null;
}

export function createLeadCaptureRateLimiter({
  max = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS,
  now = () => Date.now(),
  store = new Map(),
} = {}) {
  return {
    isRateLimited(ip) {
      const key = cleanString(ip) || "unknown";
      const currentTime = now();
      const entry = store.get(key);

      if (!entry || currentTime - entry.windowStart > windowMs) {
        store.set(key, { count: 1, windowStart: currentTime });
        return false;
      }

      if (entry.count >= max) {
        return true;
      }

      entry.count += 1;
      return false;
    },
    store,
  };
}

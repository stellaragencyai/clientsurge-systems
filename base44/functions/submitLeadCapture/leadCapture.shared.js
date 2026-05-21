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

export function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

export function normalizePhone(value) {
  const digits = cleanString(value).replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function isDisposableEmail(email) {
  const domain = normalizeEmail(email).split("@")[1] || "";
  return DISPOSABLE_DOMAINS.has(domain);
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

export const EMAILS = Object.freeze({
  founder: "nolan@clientsurgesystems.com",
  founderAlias: "founder@clientsurgesystems.com",
  public: "hello@clientsurgesystems.com",
  sales: "sales@clientsurgesystems.com",
  bookings: "bookings@clientsurgesystems.com",
  support: "support@clientsurgesystems.com",
  onboarding: "onboarding@clientsurgesystems.com",
  reviews: "reviews@clientsurgesystems.com",
  billing: "billing@clientsurgesystems.com",
  payments: "payments@clientsurgesystems.com",
  system: "system@clientsurgesystems.com",
  alerts: "alerts@clientsurgesystems.com",
  noreply: "noreply@clientsurgesystems.com",
  legal: "legal@clientsurgesystems.com",
  security: "security@clientsurgesystems.com",
});

function readEnv(name) {
  try {
    return Deno.env.get(name) || "";
  } catch {
    return "";
  }
}

export function getEnvEmail(name, fallback) {
  return readEnv(name).trim() || fallback;
}

export function formatFromAddress(email, displayName = "ClientSurge Systems") {
  const value = String(email || EMAILS.noreply).trim();
  if (value.includes("<") && value.includes(">")) {
    return value;
  }
  return `${displayName} <${value}>`;
}

export function getLeadFromEmail() {
  return getEnvEmail("RESEND_FROM_LEADS", EMAILS.public);
}

export function getNoReplyFromEmail() {
  return getEnvEmail("RESEND_FROM_NOREPLY", EMAILS.noreply);
}

export function getOnboardingFromEmail() {
  return getEnvEmail("RESEND_FROM_ONBOARDING", EMAILS.onboarding);
}

export function getReviewFromEmail() {
  return getEnvEmail("RESEND_FROM_REVIEWS", EMAILS.reviews);
}

export function getBillingFromEmail() {
  return getEnvEmail("RESEND_FROM_BILLING", EMAILS.billing);
}

export function getAlertFromEmail() {
  return getEnvEmail("RESEND_FROM_ALERTS", EMAILS.alerts);
}

export function getLeadReplyTo() {
  return getEnvEmail("RESEND_REPLY_TO_LEADS", EMAILS.public);
}

export function getSupportReplyTo() {
  return getEnvEmail("RESEND_REPLY_TO_SUPPORT", EMAILS.support);
}

export function getBillingReplyTo() {
  return getEnvEmail("RESEND_REPLY_TO_BILLING", EMAILS.billing);
}

export function getSystemReplyTo() {
  return getEnvEmail("RESEND_REPLY_TO_SYSTEM", EMAILS.system);
}

export function getPublicInboxEmail() {
  return getEnvEmail("PUBLIC_INBOX_EMAIL", EMAILS.public);
}

export function getSupportInboxEmail() {
  return getEnvEmail("SUPPORT_EMAIL", EMAILS.support);
}

export function getBillingInboxEmail() {
  return getEnvEmail("BILLING_EMAIL", EMAILS.billing);
}

export function getSystemInboxEmail() {
  return getEnvEmail("SYSTEM_EMAIL", EMAILS.system);
}

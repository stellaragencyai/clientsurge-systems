export const SMS_OPT_OUT_FOOTER = "Reply STOP to unsubscribe.";

export function appendSmsOptOut(message, footer = SMS_OPT_OUT_FOOTER) {
  const body = String(message || "").trim();
  const normalized = body.toLowerCase();

  if (!body) {
    return footer;
  }

  if (
    normalized.includes("reply stop") ||
    normalized.includes("text stop") ||
    normalized.includes("stop to unsubscribe") ||
    normalized.includes("stop to opt out")
  ) {
    return body;
  }

  return `${body}\n\n${footer}`;
}

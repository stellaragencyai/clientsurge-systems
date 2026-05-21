import { resendFetch } from "./resendFetch.js";

export function shouldAlertOnStatus(status) {
  return Number(status) >= 500 && Number(status) <= 599;
}

export function resolveBackendErrorAlertConfig(env = {}) {
  return {
    resendKey: env.RESEND_API_KEY || "",
    fromEmail: env.RESEND_FROM_EMAIL || "system@clientsurgesystems.com",
    toEmail: env.ADMIN_NOTIFICATION_EMAIL || env.ADMIN_EMAIL || "",
  };
}

export function buildBackend5xxAlertEmail({
  functionName,
  status,
  error,
  timestamp = new Date().toISOString(),
}) {
  return {
    subject: `[ClientSurge] 5xx Error: ${functionName}`,
    text: [
      "ClientSurge backend 5xx alert",
      "",
      `Function: ${functionName}`,
      `Status: ${status}`,
      `Error: ${String(error || "Unknown error").slice(0, 1000)}`,
      `Time: ${timestamp}`,
    ].join("\n"),
  };
}

export async function sendBackend5xxAlert({
  functionName,
  status,
  error,
  env = {},
  fetchEmail = null,
  now = new Date(),
} = {}) {
  if (!shouldAlertOnStatus(status)) {
    return { sent: false, reason: "not_5xx" };
  }

  const config = resolveBackendErrorAlertConfig(env);
  if (!config.resendKey || !config.toEmail) {
    return { sent: false, reason: "missing_alert_config" };
  }

  const email = buildBackend5xxAlertEmail({
    functionName,
    status,
    error,
    timestamp: now.toISOString(),
  });

  const request = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `ClientSurge Alerts <${config.fromEmail}>`,
      to: config.toEmail,
      subject: email.subject,
      text: email.text,
    }),
  };

  const response = fetchEmail
    ? await fetchEmail("https://api.resend.com/emails", request)
    : await resendFetch("https://api.resend.com/emails", request);

  return { sent: true, response };
}

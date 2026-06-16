import { secureJson } from "../_shared/response.ts";
import { sendBackend5xxAlert } from "../_shared/backendErrorAlert.js";

/**
 * healthCheck + errorAlerting - #212 #215
 * UptimeRobot/Better Stack compatible endpoint.
 * Returns 200 OK with status JSON.
 * Also exposes alert utility for other functions to import.
 */

export async function alertOn5xx(functionName: string, status: number, error: string) {
  return sendBackend5xxAlert({
    functionName,
    status,
    error,
    env: {
      ADMIN_EMAIL: Deno.env.get("ADMIN_EMAIL") || "",
      ADMIN_NOTIFICATION_EMAIL: Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "",
      RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") || "",
      RESEND_FROM_EMAIL: Deno.env.get("RESEND_FROM_EMAIL") || "",
    },
  }).catch((alertError) => {
    console.warn("[healthCheck] 5xx alert failed:", alertError.message);
    return { sent: false, reason: "send_failed" };
  });
}

// #212: UptimeRobot/Better Stack healthCheck
Deno.serve(async (_req) => {
  return secureJson({
    status: "ok",
    service: "ClientSurge Systems",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  }, { status: 200 });
});

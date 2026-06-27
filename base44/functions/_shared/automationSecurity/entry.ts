/**
 * Automation Security Helpers
 * Provides authorization checks for automated/scheduled function calls.
 */

const AUTOMATION_SECRET = () => Deno.env.get("AUTOMATION_SHARED_SECRET");

/**
 * Checks whether a request is authorized as an internal automation call.
 * Allows calls with the shared automation secret OR from the Base44 service role.
 */
export function allowAnonymousAutomation(req) {
  // Check for shared secret in headers
  const authHeader = req.headers.get("authorization") || "";
  const xSecret = req.headers.get("x-automation-secret") || "";
  const sharedSecret = AUTOMATION_SECRET();

  if (sharedSecret) {
    if (authHeader.includes(`Bearer ${sharedSecret}`)) return true;
    if (xSecret === sharedSecret) return true;
  }

  // Check for internal service call header
  if (req.headers.get("x-internal") === "true") return true;

  // Allow calls from Base44 platform (cron/automations)
  const userAgent = req.headers.get("user-agent") || "";
  if (userAgent.includes("base44") || userAgent.includes("Base44")) return true;

  return false;
}

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));
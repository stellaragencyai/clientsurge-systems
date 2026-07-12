import { secureJson } from "../_shared/response.ts";

/**
 * The legacy 30-day nurture runner is intentionally retired.
 *
 * It previously contained unverified case studies and performance claims and
 * could run without a configured automation secret. ClientSurge outreach now
 * uses reviewed EmailCampaign drafts, verified-outbound recipients, signed
 * unsubscribe links, and explicit admin send confirmation.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return secureJson({ error: "Method not allowed" }, { status: 405 });
  }

  return secureJson({
    success: true,
    disabled: true,
    code: "LEGACY_NURTURE_RETIRED",
    processed: 0,
    sent: 0,
    failed: 0,
    message: "Legacy nurture sending is retired. Use the reviewed EmailCampaign workflow.",
  });
});

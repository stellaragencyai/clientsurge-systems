import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  DEFAULT_GA4_MEASUREMENT_ID,
  GA4_MEASUREMENT_ID_PATTERN,
  isGa4Admin,
  repairGa4Configuration,
} from "./shared/ga4Configuration.ts";

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isGa4Admin(user)) {
      return jsonResponse({ error: "Unauthorized: admin or super_admin required", code: "FORBIDDEN" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    if (Object.prototype.hasOwnProperty.call(body, "api_secret")) {
      return jsonResponse(
        {
          error: "Do not send GA4 API secrets to this function. Store GA4_API_SECRET in Base44 Secrets and use it only from backend code.",
          code: "GA4_SECRET_MUST_USE_SECRET_STORE",
        },
        400,
      );
    }

    const measurementId = String(body.measurement_id || DEFAULT_GA4_MEASUREMENT_ID).trim().toUpperCase();
    if (!GA4_MEASUREMENT_ID_PATTERN.test(measurementId) || measurementId !== DEFAULT_GA4_MEASUREMENT_ID) {
      return jsonResponse(
        {
          error: `Invalid measurement_id. ClientSurge production GA4 must use ${DEFAULT_GA4_MEASUREMENT_ID}.`,
          code: "GA4_MEASUREMENT_ID_INVALID",
        },
        400,
      );
    }

    const result = await repairGa4Configuration(base44, {
      body,
      measurementId,
      notes:
        "Configuration repaired by setupGA4Configuration. Status remains configured until live backend GA4 verification passes.",
    });

    return jsonResponse({
      ...result,
      message: result.legacy_secret_detected
        ? "GA4 configuration repaired, duplicate records removed, and legacy secret-bearing records destroyed. Rotate any previously exposed GA4 API secret before relying on server-side tracking."
        : "GA4 configuration repaired without storing any private credential in the entity.",
    });
  } catch (error) {
    console.error("[setupGA4Configuration]", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown setup error",
        code: (error as any)?.code || "GA4_SETUP_FAILED",
        deletion_results: (error as any)?.deletion_results || undefined,
      },
      500,
    );
  }
});

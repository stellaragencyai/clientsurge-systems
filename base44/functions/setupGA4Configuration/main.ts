import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  GA4_MEASUREMENT_ID,
  isAdmin,
  payloadContainsApiSecret,
  repairCanonicalGa4Configuration,
} from "../_shared/ga4Configuration.js";

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) {
      return jsonResponse({ error: "Unauthorized: admin or super_admin required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    if (payloadContainsApiSecret(body)) {
      return jsonResponse(
        {
          error: "Do not send GA4 API secrets to this function. Store GA4_API_SECRET in Base44 Secrets and use it only from backend code.",
          code: "GA4_SECRET_MUST_USE_SECRET_STORE",
        },
        400,
      );
    }

    const requestedMeasurementId = String(body.measurement_id || GA4_MEASUREMENT_ID).trim().toUpperCase();
    if (!MEASUREMENT_ID_PATTERN.test(requestedMeasurementId)) {
      return jsonResponse({ error: "Invalid measurement_id format. Expected G-XXXXXXXXXX." }, 400);
    }
    if (requestedMeasurementId !== GA4_MEASUREMENT_ID) {
      return jsonResponse(
        {
          error: `ClientSurge GA4 must use the canonical Measurement ID ${GA4_MEASUREMENT_ID}.`,
          code: "GA4_MEASUREMENT_ID_MISMATCH",
        },
        400,
      );
    }

    const result = await repairCanonicalGa4Configuration(base44);

    return jsonResponse({
      ...result,
      secret_required_for_browser_tracking: false,
      secret_store_name: "GA4_API_SECRET",
      message: result.legacy_secret_detected
        ? "GA4 configuration saved and every duplicate or legacy secret-bearing record was deleted. Rotate any previously exposed GA4 API secret before relying on server-side tracking."
        : "GA4 configuration saved as one clean canonical record without storing any private credential in the entity.",
    });
  } catch (error) {
    console.error("[setupGA4Configuration]", error);
    const message = error instanceof Error ? error.message : "Unknown setup error";
    return jsonResponse(
      {
        success: false,
        error: message,
        code: message,
        details: error instanceof Error ? (error as any).details || null : null,
      },
      message === "GA4_LEGACY_SECRET_SCRUB_INCOMPLETE" || message === "GA4_CANONICAL_CONFIGURATION_INCOMPLETE" ? 500 : 500,
    );
  }
});

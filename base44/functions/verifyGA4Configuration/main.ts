import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { isGa4Admin } from "../shared/ga4Configuration.ts";
import { runGa4Verification } from "../shared/ga4Verification.ts";

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

    const result = await runGa4Verification(base44);
    return jsonResponse(result.body, result.status);
  } catch (error) {
    console.error("[verifyGA4Configuration]", error);
    return jsonResponse(
      {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : "Unknown GA4 verification error",
        code: (error as any)?.code || "GA4_VERIFICATION_FAILED",
      },
      500,
    );
  }
});

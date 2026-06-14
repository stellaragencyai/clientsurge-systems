import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { secureJson } from "../_shared/response.ts";
import { getStripeMode, safeStripeError } from "../_shared/stripeInit.js";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    const stripeMode = getStripeMode();

    return secureJson({
      success: true,
      ...stripeMode,
    });
  } catch (error) {
    const safeError = safeStripeError(error, "Unable to determine Stripe mode. Please contact support.");
    console.error("[getStripeMode] error", {
      requestId,
      code: safeError.code,
      message: safeError.internalMessage,
    });
    return secureJson(
      { error: safeError.userMessage, code: safeError.code, request_id: requestId },
      { status: safeError.status }
    );
  }
});

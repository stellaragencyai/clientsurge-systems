import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { secureJson } from "../_shared/response.ts";

function resolveStripeSecret() {
  return (
    Deno.env.get("STRIPE_LIVE_SECRET_KEY") ||
    Deno.env.get("STRIPE_SECRET_KEY") ||
    ""
  ).trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user || user.role !== "admin") {
      return secureJson({ error: "Admin access required" }, { status: 403 });
    }

    const stripeSecret = resolveStripeSecret();
    const livemode = stripeSecret.startsWith("sk_live_");
    const mode = livemode ? "live" : stripeSecret.startsWith("sk_test_") ? "test" : "unknown";

    return secureJson({
      success: true,
      mode,
      livemode,
      configured: Boolean(stripeSecret),
    });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});

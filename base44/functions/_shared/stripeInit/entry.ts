/**
 * Stripe SDK Initialization Helper
 * Provides safe Stripe client creation and error normalization.
 */

let StripeModule = null;

async function loadStripe() {
  if (StripeModule) return StripeModule;
  const mod = await import("npm:stripe@14.21.0");
  StripeModule = mod.default || mod;
  return StripeModule;
}

/**
 * Returns { stripe } — a configured Stripe client.
 * Throws if STRIPE_SECRET_KEY is not set.
 */
export async function getStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_LIVE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("Stripe secret key not configured");
  }
  const Stripe = await loadStripe();
  const stripe = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    appInfo: { name: "ClientSurge Systems" },
  });
  return { stripe };
}

/**
 * Normalize a Stripe-related error into a safe user-facing response object.
 */
export function safeStripeError(error, fallbackMessage = "An unexpected payment error occurred.") {
  const internalMessage = error?.message || String(error || "Unknown error");
  const code = error?.code || error?.type || "stripe_error";

  // Map common Stripe error codes to user-friendly messages
  const userMessages = {
    authentication_required: "This payment requires additional authentication. Please contact support.",
    card_declined: "Your card was declined. Please try a different payment method.",
    expired_card: "Your card has expired. Please update your payment method.",
    incorrect_cvc: "The security code is incorrect. Please verify and try again.",
    insufficient_funds: "Your card has insufficient funds. Please try a different card.",
    processing_error: "An error occurred while processing your payment. Please try again.",
    rate_limit: "Too many requests. Please wait a moment and try again.",
  };

  const userMessage = userMessages[code] || fallbackMessage;
  const status = error?.statusCode || 500;

  return { code, userMessage, internalMessage, status };
}

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));
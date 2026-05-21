/**
 * stripeInit.ts — #150
 * Centralised Stripe key + signature validation init.
 */
import { verifyStripeSignature } from "./stripeWebhookSignatureVerifier.ts";
import { stripeFetch } from "../_shared/providerFetch.js";

export { verifyStripeSignature };

export function getStripeKey(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return key;
}

export async function stripeRequest(path: string, body?: string, method = "POST"): Promise<any> {
  const key = getStripeKey();
  const res = await stripeFetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(body ? { body } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe error: ${data?.error?.message || res.statusText}`);
  return data;
}

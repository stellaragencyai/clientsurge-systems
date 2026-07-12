import { handleCanonicalStripeWebhook } from "../_shared/stripeOrderWebhook.js";
import { sendGa4PurchaseFromCheckoutSession } from "../_shared/ga4MeasurementProtocol.js";

/**
 * Stripe order webhook entrypoint.
 *
 * The canonical handler verifies Stripe's signature, reconciles the Order, and
 * performs idempotency checks. Only after that succeeds do we send a
 * server-verified GA4 purchase through Measurement Protocol.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      {
        status: 405,
        headers: {
          "Cache-Control": "no-store",
          "X-Frame-Options": "DENY",
        },
      },
    );
  }

  const eventRequest = req.clone();
  const response = await handleCanonicalStripeWebhook(req, {
    source: "stripeWebhookOrders",
  });

  if (!response.ok) return response;

  try {
    const [canonicalResult, stripeEvent] = await Promise.all([
      response.clone().json().catch(() => null),
      eventRequest.json().catch(() => null),
    ]);

    const canonicalPurchaseSucceeded =
      canonicalResult?.event_type === "checkout.session.completed" &&
      canonicalResult?.result?.success === true &&
      canonicalResult?.result?.duplicate !== true;

    if (canonicalPurchaseSucceeded && stripeEvent?.data?.object) {
      const ga4Result = await sendGa4PurchaseFromCheckoutSession(
        stripeEvent.data.object,
        { eventId: stripeEvent.id },
      );

      if (!ga4Result.sent && ga4Result.reason !== "not_live_purchase") {
        console.warn("[stripeWebhookOrders] GA4 purchase not delivered", {
          reason: ga4Result.reason,
          event_id: stripeEvent.id || "",
          session_id: stripeEvent.data.object.id || "",
        });
      }
    }
  } catch (error) {
    // Analytics is non-blocking: a GA4 outage must never cause Stripe to retry
    // a payment webhook whose commercial processing already succeeded.
    console.warn("[stripeWebhookOrders] GA4 post-processing failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  return response;
});

import { handleCanonicalStripeWebhook } from "./shared/stripeOrderWebhook.js";
import { sendGa4PurchaseFromCheckoutSession } from "./shared/ga4MeasurementProtocol.js";

function createRequestId(req: Request) {
  const incoming = req.headers.get("x-request-id")?.trim();
  return incoming || `stripe_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function withRequestId(response: Response, requestId: string) {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Stripe order webhook entrypoint.
 *
 * The request ID is embedded in the canonical source string. The shared Stripe
 * handler already carries that source into CommunicationEvent metadata and the
 * paid-order install pipeline eventSource, giving one correlation value from
 * webhook receipt through Order reconciliation and setup handoff.
 */
Deno.serve(async (req) => {
  const requestId = createRequestId(req);
  const startedAt = Date.now();

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed", code: "method_not_allowed", request_id: requestId },
      {
        status: 405,
        headers: {
          "Cache-Control": "no-store",
          "X-Frame-Options": "DENY",
          "X-Request-ID": requestId,
        },
      },
    );
  }

  console.log("[stripeWebhookOrders] Request started", { request_id: requestId });

  const eventRequest = req.clone();
  const canonicalResponse = await handleCanonicalStripeWebhook(req, {
    source: `stripeWebhookOrders:${requestId}`,
  });
  const response = withRequestId(canonicalResponse, requestId);

  if (!response.ok) {
    console.error("[stripeWebhookOrders] Canonical processing failed", {
      request_id: requestId,
      status: response.status,
      duration_ms: Date.now() - startedAt,
    });
    return response;
  }

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

      console.log("[stripeWebhookOrders] GA4 purchase delivery outcome", {
        request_id: requestId,
        sent: ga4Result.sent,
        reason: ga4Result.reason || "sent",
        event_id: stripeEvent.id || "",
        session_id: stripeEvent.data.object.id || "",
      });

      if (!ga4Result.sent && ga4Result.reason !== "not_live_purchase") {
        console.warn("[stripeWebhookOrders] GA4 purchase not delivered", {
          request_id: requestId,
          reason: ga4Result.reason,
          event_id: stripeEvent.id || "",
          session_id: stripeEvent.data.object.id || "",
        });
      }
    }
  } catch (error) {
    // Analytics remains non-blocking. A GA4 failure must not cause Stripe to
    // retry a webhook whose commercial processing already succeeded.
    console.warn("[stripeWebhookOrders] GA4 post-processing failed", {
      request_id: requestId,
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  console.log("[stripeWebhookOrders] Request completed", {
    request_id: requestId,
    status: response.status,
    duration_ms: Date.now() - startedAt,
  });

  return response;
});

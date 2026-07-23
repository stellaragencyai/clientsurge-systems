const DEFAULT_MEASUREMENT_ID = "G-H6QT342ZN9";
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;
const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const REQUEST_TIMEOUT_MS = 4000;

function cleanString(value, maxLength = 100) {
  return String(value || "").trim().slice(0, maxLength);
}

function finiteAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function parseItems(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 25).map((item, index) => ({
      item_id: cleanString(item?.product_id || item?.service_key || `item-${index + 1}`),
      item_name: cleanString(item?.product_name || item?.service_key || `ClientSurge item ${index + 1}`),
      quantity: 1,
    }));
  } catch {
    return [];
  }
}

function resolveClientId(session) {
  const metadataClientId = cleanString(session?.metadata?.ga_client_id, 160);
  if (metadataClientId) return metadataClientId;

  const referenceId = cleanString(session?.client_reference_id, 160);
  if (referenceId) return `server.${referenceId}`;

  return `server.${cleanString(session?.id, 160) || crypto.randomUUID()}`;
}

function isEligibleLivePurchase(session) {
  if (!session?.id) return false;
  if (session?.livemode !== true) return false;
  if (cleanString(session?.payment_status).toLowerCase() !== "paid") return false;
  if (cleanString(session?.metadata?.smoke_test).toLowerCase() === "true") return false;
  return true;
}

export async function sendGa4PurchaseFromCheckoutSession(session, { eventId = "", duplicate = false } = {}) {
  if (duplicate) {
    return { sent: false, reason: "duplicate_transaction" };
  }

  if (cleanString(session?.metadata?.ga4_purchase_sent).toLowerCase() === "true") {
    return { sent: false, reason: "duplicate_transaction" };
  }

  if (!isEligibleLivePurchase(session)) {
    return { sent: false, reason: "not_live_purchase" };
  }

  const measurementId = cleanString(
    Deno.env.get("GA4_MEASUREMENT_ID") || DEFAULT_MEASUREMENT_ID,
    32,
  ).toUpperCase();
  const apiSecret = cleanString(Deno.env.get("GA4_API_SECRET"), 256);

  if (!MEASUREMENT_ID_PATTERN.test(measurementId)) {
    return { sent: false, reason: "invalid_measurement_id" };
  }
  if (!apiSecret) {
    return { sent: false, reason: "missing_api_secret" };
  }

  const items = parseItems(session?.metadata?.items_json);
  const amountTotal = finiteAmount(session?.amount_total) / 100;
  const currency = cleanString(session?.currency || "usd", 8).toUpperCase();
  const transactionId = cleanString(session.id, 160);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const endpoint = new URL(GA4_ENDPOINT);
    endpoint.searchParams.set("measurement_id", measurementId);
    endpoint.searchParams.set("api_secret", apiSecret);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        client_id: resolveClientId(session),
        timestamp_micros: String(Date.now() * 1000),
        non_personalized_ads: true,
        events: [
          {
            name: "purchase",
            params: {
              transaction_id: transactionId,
              currency,
              value: amountTotal,
              items,
              event_id: cleanString(eventId || transactionId, 160),
              engagement_time_msec: 1,
              payment_provider: "stripe",
              server_verified: true,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      return { sent: false, reason: `ga4_http_${response.status}` };
    }

    return {
      sent: true,
      event_name: "purchase",
      transaction_id: transactionId,
    };
  } catch (error) {
    return {
      sent: false,
      reason: error?.name === "AbortError" ? "ga4_timeout" : "ga4_request_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

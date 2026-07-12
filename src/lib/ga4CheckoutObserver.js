import { GA4_EVENTS, trackGa4Event } from "@/lib/ga4";

const CHECKOUT_FUNCTION_FRAGMENT = "/functions/createCheckoutSession";

function requestUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input?.url || "";
}

function requestPayload(input, init) {
  const body = init?.body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (input instanceof Request && typeof input.clone === "function") {
    return input
      .clone()
      .json()
      .catch(() => ({}));
  }

  return {};
}

function emitBeginCheckout(payload = {}) {
  const packageKey = payload?.package_key || "unknown";
  trackGa4Event(GA4_EVENTS.BEGIN_CHECKOUT, {
    currency: "USD",
    checkout_source: payload?.source || "product_signup",
    checkout_session_created: true,
    items: [
      {
        item_id: packageKey,
        item_name: `ClientSurge ${packageKey}`,
        quantity: 1,
      },
    ],
  });
}

export function installGa4CheckoutObserver(win = globalThis.window) {
  if (!win || typeof win.fetch !== "function") return false;
  if (win.__clientsurgeGa4CheckoutObserverInstalled) return true;

  const originalFetch = win.fetch.bind(win);
  win.fetch = async (input, init) => {
    const url = requestUrl(input);
    const shouldObserve = url.includes(CHECKOUT_FUNCTION_FRAGMENT);
    const payloadPromise = shouldObserve ? Promise.resolve(requestPayload(input, init)) : null;

    const response = await originalFetch(input, init);

    if (shouldObserve && response.ok) {
      Promise.all([
        payloadPromise,
        response
          .clone()
          .json()
          .catch(() => ({})),
      ])
        .then(([payload, result]) => {
          const checkoutUrl = result?.url || result?.data?.url;
          if (checkoutUrl) emitBeginCheckout(payload);
        })
        .catch((error) => {
          console.warn("[ga4CheckoutObserver] checkout tracking failed:", error?.message);
        });
    }

    return response;
  };

  win.__clientsurgeGa4CheckoutObserverInstalled = true;
  return true;
}

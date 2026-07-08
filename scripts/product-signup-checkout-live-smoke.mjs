#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://clientsurgesystems.com";
const DEFAULT_APP_ID = "69dc4a79656fdba136d413d3";
const DEFAULT_PACKAGE = "growth_system";
const CHECKOUT_FUNCTION = "createCheckoutSession";

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.CLIENTSURGE_PRODUCT_SIGNUP_SMOKE_BASE_URL || DEFAULT_BASE_URL,
    appId: process.env.CLIENTSURGE_BASE44_APP_ID || DEFAULT_APP_ID,
    packageKey: process.env.CLIENTSURGE_PRODUCT_SIGNUP_SMOKE_PACKAGE || DEFAULT_PACKAGE,
    expectStripeMode: process.env.CLIENTSURGE_EXPECT_STRIPE_MODE || "live",
    timeoutMs: Number(process.env.CLIENTSURGE_CHECKOUT_SMOKE_TIMEOUT_MS || 20000),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base-url") args.baseUrl = argv[++i] || args.baseUrl;
    else if (arg.startsWith("--base-url=")) args.baseUrl = arg.slice("--base-url=".length);
    else if (arg === "--app-id") args.appId = argv[++i] || args.appId;
    else if (arg.startsWith("--app-id=")) args.appId = arg.slice("--app-id=".length);
    else if (arg === "--package") args.packageKey = argv[++i] || args.packageKey;
    else if (arg.startsWith("--package=")) args.packageKey = arg.slice("--package=".length);
    else if (arg === "--expect-stripe-mode") args.expectStripeMode = argv[++i] || args.expectStripeMode;
    else if (arg.startsWith("--expect-stripe-mode=")) args.expectStripeMode = arg.slice("--expect-stripe-mode=".length);
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++i] || args.timeoutMs);
    else if (arg.startsWith("--timeout-ms=")) args.timeoutMs = Number(arg.slice("--timeout-ms=".length));
  }

  return args;
}

function fail(message, extra = {}) {
  const output = {
    ok: false,
    error: message,
    ...extra,
  };
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

function redactCheckoutUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname.split("/").slice(0, 3).join("/")}/[redacted-checkout-session]`;
  } catch {
    return "[invalid-url]";
  }
}

function validateCheckoutResponse({ response, payload, result, checkoutUrl }) {
  const failures = [];
  const sessionId = result?.session_id || result?.data?.session_id || "";
  const requestId = result?.request_id || result?.data?.request_id || "";
  const stripeMode = result?.stripe_mode || result?.data?.stripe_mode || "";

  if (!response.ok) {
    failures.push(`expected HTTP 2xx, received ${response.status}`);
  }

  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    failures.push("missing checkout URL in response");
  } else if (!/^https:\/\/checkout\.stripe\.com\//.test(checkoutUrl)) {
    failures.push("checkout URL is not a Stripe Checkout URL");
  }

  if (!/^cs_(live|test)_/.test(sessionId)) {
    failures.push("missing or invalid Stripe Checkout Session ID");
  }

  if (!requestId) {
    failures.push("missing request_id");
  }

  if (payload.smoke_test !== true) {
    failures.push("smoke_test flag was not sent");
  }

  return { failures, sessionId, requestId, stripeMode };
}

async function postCheckoutSmoke(args) {
  const baseUrl = new URL(args.baseUrl);
  const endpoint = new URL(`/api/apps/${args.appId}/functions/${CHECKOUT_FUNCTION}`, baseUrl);
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  const customerEmail = `checkout-smoke+${stamp}-${random}@clientsurge.test`;

  const payload = {
    package_key: args.packageKey,
    customer_name: "ClientSurge Checkout Smoke",
    customer_email: customerEmail,
    customer_phone: "6025550100",
    business_name: "ClientSurge Checkout Smoke Test",
    industry: "smoke_test",
    success_url: `${baseUrl.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl.origin}/product-signup?package=${encodeURIComponent(args.packageKey)}`,
    smoke_test: true,
    source: "github_live_checkout_smoke",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs);

  let response;
  let text;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "ClientSurge product-signup checkout smoke",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    text = await response.text();
  } catch (error) {
    clearTimeout(timeout);
    fail("checkout smoke request failed", {
      endpoint: endpoint.href,
      package_key: args.packageKey,
      reason: error?.name === "AbortError" ? `timed out after ${args.timeoutMs}ms` : error?.message || String(error),
    });
  }

  clearTimeout(timeout);

  let result = {};
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    fail("checkout smoke response was not JSON", {
      endpoint: endpoint.href,
      http_status: response.status,
      response_preview: text.slice(0, 300),
    });
  }

  const checkoutUrl = result?.url || result?.data?.url || "";
  const validation = validateCheckoutResponse({ response, payload, result, checkoutUrl });

  if (validation.failures.length) {
    fail("checkout smoke failed validation", {
      endpoint: endpoint.href,
      http_status: response.status,
      failures: validation.failures,
      response: {
        error: result?.error || result?.data?.error || null,
        code: result?.code || result?.data?.code || null,
        request_id: validation.requestId || null,
        session_id: validation.sessionId || null,
        stripe_mode: validation.stripeMode || null,
        smoke_test: result?.smoke_test ?? result?.data?.smoke_test ?? null,
      },
    });
  }

  if (args.expectStripeMode && validation.stripeMode && validation.stripeMode !== args.expectStripeMode) {
    fail("checkout smoke returned unexpected Stripe mode", {
      expected: args.expectStripeMode,
      actual: validation.stripeMode,
      request_id: validation.requestId,
      session_id: validation.sessionId,
    });
  }

  console.log(JSON.stringify({
    ok: true,
    checked_at: new Date().toISOString(),
    endpoint: endpoint.href,
    package_key: args.packageKey,
    request_id: validation.requestId,
    session_id: validation.sessionId,
    stripe_mode: validation.stripeMode || "not_returned_by_runtime",
    checkout_url: redactCheckoutUrl(checkoutUrl),
    note: "Created a smoke checkout session only. No payment was submitted. The matching Order should be environment=smoke and dashboard_excluded=true.",
  }, null, 2));
}

await postCheckoutSmoke(parseArgs(process.argv.slice(2)));

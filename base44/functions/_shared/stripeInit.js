import Stripe from "npm:stripe@14.21.0";

export const STRIPE_API_VERSION = "2024-06-20";

export class StripeConfigurationError extends Error {
  constructor(message = "Stripe is not configured.", code = "stripe_not_configured") {
    super(message);
    this.name = "StripeConfigurationError";
    this.code = code;
  }
}

function readEnv(name) {
  try {
    return String(Deno.env.get(name) || "").trim();
  } catch {
    return "";
  }
}

const VALID_STRIPE_MODES = new Set(["test", "live"]);

function readStripeModeEnv() {
  return readEnv("STRIPE_MODE").toLowerCase();
}

function isProductionRuntime() {
  return ["ENVIRONMENT", "NODE_ENV", "BASE44_ENV", "DENO_ENV"].some((name) =>
    ["production", "prod", "live"].includes(readEnv(name).toLowerCase())
  );
}

function resolveStripeMode({ requireLive = false } = {}) {
  const configuredMode = readStripeModeEnv();

  if (configuredMode && !VALID_STRIPE_MODES.has(configuredMode)) {
    throw new StripeConfigurationError(
      "STRIPE_MODE must be either test or live.",
      "stripe_mode_invalid"
    );
  }

  if (requireLive) {
    if (configuredMode && configuredMode !== "live") {
      throw new StripeConfigurationError(
        "Stripe live mode is required for this request.",
        "stripe_live_mode_required"
      );
    }
    return "live";
  }

  if (configuredMode) {
    return configuredMode;
  }

  if (isProductionRuntime()) {
    throw new StripeConfigurationError(
      "STRIPE_MODE is required in production.",
      "stripe_mode_missing"
    );
  }

  return "test";
}

function resolveStripeKey(options = {}) {
  const mode = resolveStripeMode(options);
  const liveKey = readEnv("STRIPE_LIVE_SECRET_KEY");
  const testKey = readEnv("STRIPE_TEST_SECRET_KEY") || readEnv("STRIPE_SECRET_KEY");
  const key = mode === "live" ? liveKey : testKey;

  if (mode === "live" && !key) {
    throw new StripeConfigurationError(
      "Stripe live secret key is not configured.",
      "stripe_live_key_missing"
    );
  }

  if (mode === "test" && !key) {
    throw new StripeConfigurationError(
      "Stripe test secret key is not configured.",
      "stripe_test_key_missing"
    );
  }

  if (mode === "test" && key.startsWith("sk_live_")) {
    throw new StripeConfigurationError(
      "Stripe test mode cannot use a live secret key.",
      "stripe_test_mode_live_key"
    );
  }

  if (mode === "live" && !key.startsWith("sk_live_")) {
    throw new StripeConfigurationError(
      "Stripe live mode requires STRIPE_LIVE_SECRET_KEY.",
      "stripe_live_mode_invalid_key"
    );
  }

  return {
    key,
    mode,
    keySource:
      mode === "live"
        ? "STRIPE_LIVE_SECRET_KEY"
        : readEnv("STRIPE_TEST_SECRET_KEY")
        ? "STRIPE_TEST_SECRET_KEY"
        : "STRIPE_SECRET_KEY",
  };
}

export function getStripeMode(options = {}) {
  const { key, keySource, mode } = resolveStripeKey(options);
  const livemode = key.startsWith("sk_live_");

  return {
    configured: Boolean(key),
    mode,
    livemode,
    keySource,
  };
}

let cachedClient = null;
let cachedKeySource = null;
let cachedMode = null;

export function getStripeClient(options = {}) {
  const { key, keySource, mode } = resolveStripeKey(options);
  const stripeMode = getStripeMode(options);
  if (!cachedClient || cachedKeySource !== keySource || cachedMode !== mode) {
    cachedClient = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
    cachedKeySource = keySource;
    cachedMode = mode;
  }

  return {
    stripe: cachedClient,
    ...stripeMode,
  };
}

export function assertStripeConfigured(options = {}) {
  return getStripeClient(options);
}

export function getStripeSecretKey(options = {}) {
  return resolveStripeKey(options).key;
}

export function safeStripeError(error, fallbackMessage = "Stripe request failed. Please contact support.") {
  if (error instanceof StripeConfigurationError || error?.code === "stripe_not_configured") {
    return {
      status: 500,
      code: error.code || "stripe_not_configured",
      userMessage: "Stripe is not configured. Please contact support.",
      internalMessage: error.message,
    };
  }

  return {
    status: 500,
    code: "stripe_request_failed",
    userMessage: fallbackMessage,
    internalMessage: error instanceof Error ? error.message : String(error),
  };
}

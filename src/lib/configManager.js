/**
 * Centralized Secret Manager
 * Validates required secrets on runtime and prevents invalid configurations
 * Backend-only utility (Deno runtime)
 */
/* globals Deno */

const REQUIRED_SECRETS = {
  STRIPE_SECRET_KEY: { type: "string", pattern: "^sk_" },
  STRIPE_PUBLISHABLE_KEY: { type: "string", pattern: "^pk_" },
  TWILIO_AUTH_TOKEN: { type: "string", minLength: 32 },
  TWILIO_ACCOUNT_SID: { type: "string", pattern: "^AC" },
  BASE44_APP_ID: { type: "string", minLength: 10 },
  RESEND_API_KEY: { type: "string", pattern: "^re_" },
};

export function getValidatedSecret(key, options = {}) {
  const value = Deno.env.get(key);

  if (!value) {
    throw new Error(`CONFIG_MISSING: Required secret '${key}' is not set.`);
  }

  // Optional runtime validation against expected patterns
  if (options.pattern && !new RegExp(options.pattern).test(value)) {
    throw new Error(`CONFIG_INVALID: Secret '${key}' does not match expected format.`);
  }

  if (options.minLength && value.length < options.minLength) {
    throw new Error(
      `CONFIG_INVALID: Secret '${key}' is too short (expected ${options.minLength}+ chars).`
    );
  }

  return value;
}

export function validateCriticalSecrets() {
  const missing = [];
  const invalid = [];

  for (const [key, opts] of Object.entries(REQUIRED_SECRETS)) {
    const value = Deno.env.get(key);

    if (!value) {
      missing.push(key);
      continue;
    }

    if (opts.pattern && !new RegExp(opts.pattern).test(value)) {
      invalid.push(`${key} (invalid format)`);
    }

    if (opts.minLength && value.length < opts.minLength) {
      invalid.push(`${key} (too short)`);
    }
  }

  if (missing.length > 0 || invalid.length > 0) {
    const errors = [...missing, ...invalid];
    console.error("CRITICAL: Invalid configuration detected:", errors);
    throw new Error(`STARTUP_FAILED: Critical secrets are missing or invalid: ${errors.join(", ")}`);
  }

  console.log("✓ All critical secrets validated on startup.");
}
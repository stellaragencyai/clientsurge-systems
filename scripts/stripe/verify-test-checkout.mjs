#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import {
  getPackageOffer,
  normalizePackageKey,
} from "../../src/lib/salesCatalog.js";

const ARTIFACT_PATH = path.resolve("artifacts/stripe/stripe-test-checkout-proof.json");

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function boolEnv(name) {
  return ["1", "true", "yes"].includes(cleanString(process.env[name]).toLowerCase());
}

function redactId(value) {
  const text = cleanString(value);
  if (!text) {
    return "";
  }
  if (text.length <= 12) {
    return `${text.slice(0, 4)}...`;
  }
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
}

function writeArtifact(artifact) {
  fs.mkdirSync(path.dirname(ARTIFACT_PATH), { recursive: true });
  fs.writeFileSync(
    ARTIFACT_PATH,
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      ...artifact,
      no_secrets: true,
    }, null, 2)}\n`
  );
}

function failClosed(code, message, extra = {}) {
  writeArtifact({
    status: "blocked",
    mode: cleanString(process.env.STRIPE_MODE) || "missing",
    package_tested: cleanString(process.env.CLIENTSURGE_STRIPE_TEST_PACKAGE_KEY) || "starter_system",
    metadata_verified: false,
    checkout_session_result: "not_created",
    webhook_verification_status: "not_run",
    order_creation_status: "not_verified",
    onboarding_status: "not_verified",
    warnings: [],
    blockers: [{ code, message }],
    ...extra,
  });
  console.error(`[stripe-test-checkout] ${code}: ${message}`);
  process.exitCode = 1;
}

function requireSafeConfig() {
  const mode = cleanString(process.env.STRIPE_MODE).toLowerCase();
  const secretKey = cleanString(process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY);
  const webhookSecret = cleanString(process.env.STRIPE_TEST_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET);
  const checkoutUrl = cleanString(
    process.env.CLIENTSURGE_STRIPE_TEST_CHECKOUT_URL ||
      process.env.STRIPE_TEST_CHECKOUT_FUNCTION_URL
  );
  const createCheckout = boolEnv("CLIENTSURGE_STRIPE_TEST_CREATE_CHECKOUT");

  if (mode !== "test") {
    failClosed("stripe_mode_not_test", "STRIPE_MODE must be exactly test.");
    return null;
  }

  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    failClosed("stripe_test_key_missing", "A test-prefixed Stripe secret key is required.");
    return null;
  }

  if (!webhookSecret || !webhookSecret.startsWith("whsec_")) {
    failClosed("stripe_test_webhook_secret_missing", "A test webhook signing secret is required.");
    return null;
  }

  if (!checkoutUrl) {
    failClosed("checkout_endpoint_missing", "Set CLIENTSURGE_STRIPE_TEST_CHECKOUT_URL for the test checkout function endpoint.");
    return null;
  }

  if (!createCheckout) {
    failClosed(
      "checkout_create_flag_missing",
      "Set CLIENTSURGE_STRIPE_TEST_CREATE_CHECKOUT=true to explicitly create a Stripe test checkout session.",
      { checkout_endpoint_configured: true }
    );
    return null;
  }

  return { mode, secretKey, webhookSecret, checkoutUrl };
}

function buildCheckoutPayload(packageKey) {
  const normalizedPackageKey = normalizePackageKey(packageKey) || "starter_system";
  const packageOffer = getPackageOffer(normalizedPackageKey);
  if (!packageOffer) {
    throw new Error(`Unsupported package key: ${packageKey}`);
  }

  return {
    packageOffer,
    payload: {
      product_ids: packageOffer.included_services.map((service) => service.product_id),
      customer_name: "ClientSurge Stripe Test",
      customer_email: cleanString(process.env.CLIENTSURGE_STRIPE_TEST_CUSTOMER_EMAIL) || "stripe-test@clientsurgesystems.com",
      customer_phone: cleanString(process.env.CLIENTSURGE_STRIPE_TEST_CUSTOMER_PHONE) || "+16025550123",
      business_name: "ClientSurge Stripe Test Business",
      lead_id: "stripe_test_lead",
      crm_lead_id: "stripe_test_crm_lead",
      website_lead_id: "stripe_test_website_lead",
      success_url: "https://clientsurgesystems.com/order-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://clientsurgesystems.com/store",
    },
  };
}

function verifyMetadata(session, expectedPackageKey) {
  const metadata = session?.metadata || {};
  const requiredFields = [
    "package_type",
    "selected_package_type",
    "package_key",
    "plan_type",
    "crm_lead_id",
  ];
  const missing = requiredFields.filter((field) => !cleanString(metadata[field]));
  const expected = normalizePackageKey(expectedPackageKey);
  const mismatchedPackage =
    normalizePackageKey(metadata.package_key) !== expected ||
    normalizePackageKey(metadata.package_type) !== expected ||
    normalizePackageKey(metadata.selected_package_type) !== expected;

  return {
    ok: missing.length === 0 && !mismatchedPackage,
    missing,
    mismatchedPackage,
    observed_fields: Object.fromEntries(
      requiredFields.map((field) => [field, Boolean(cleanString(metadata[field]))])
    ),
  };
}

async function main() {
  const config = requireSafeConfig();
  if (!config) {
    return;
  }

  const packageKey = cleanString(process.env.CLIENTSURGE_STRIPE_TEST_PACKAGE_KEY) || "starter_system";
  const { packageOffer, payload } = buildCheckoutPayload(packageKey);
  const warnings = [];
  let checkoutResponse;

  try {
    const response = await fetch(config.checkoutUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    checkoutResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Checkout endpoint returned HTTP ${response.status}`);
    }
  } catch (error) {
    failClosed("checkout_endpoint_failed", error instanceof Error ? error.message : String(error), {
      package_tested: packageOffer.package_key,
      checkout_endpoint_configured: true,
    });
    return;
  }

  const sessionId = cleanString(checkoutResponse.session_id);
  if (!sessionId) {
    failClosed("checkout_session_id_missing", "Checkout endpoint did not return a session_id.", {
      package_tested: packageOffer.package_key,
      checkout_session_result: {
        checkout_url_present: Boolean(checkoutResponse.url),
      },
    });
    return;
  }

  const stripe = new Stripe(config.secretKey, { apiVersion: "2024-06-20" });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const metadataCheck = verifyMetadata(session, packageOffer.package_key);

  if (!metadataCheck.ok) {
    failClosed("checkout_metadata_incomplete", "Checkout session metadata did not match the launch standard.", {
      package_tested: packageOffer.package_key,
      checkout_session_result: {
        session_id: redactId(sessionId),
        checkout_url_present: Boolean(checkoutResponse.url || session.url),
        livemode: session.livemode,
      },
      metadata_check: metadataCheck,
    });
    return;
  }

  warnings.push("Webhook/order/onboarding proof still requires the configured Stripe test webhook endpoint to deliver checkout.session.completed.");

  writeArtifact({
    status: "partial",
    mode: "test",
    package_tested: packageOffer.package_key,
    metadata_verified: true,
    checkout_session_result: {
      session_id: redactId(sessionId),
      checkout_url_present: Boolean(checkoutResponse.url || session.url),
      livemode: session.livemode,
      payment_status: session.payment_status,
      status: session.status,
    },
    webhook_verification_status: "pending_provider_delivery",
    order_creation_status: "pending_webhook_verification",
    onboarding_status: "pending_webhook_verification",
    warnings,
    blockers: [
      {
        code: "provider_dashboard_required",
        message: "Confirm the Stripe test webhook endpoint received and delivered checkout.session.completed.",
      },
      {
        code: "base44_record_verification_required",
        message: "Confirm the expected test Order, Client, ClientProject, and OnboardingClient records in the test workspace.",
      },
    ],
  });

  console.log(`[stripe-test-checkout] wrote ${ARTIFACT_PATH}`);
}

main().catch((error) => {
  failClosed("unexpected_harness_error", error instanceof Error ? error.message : String(error));
});

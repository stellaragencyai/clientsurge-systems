#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const WEBHOOK_URL =
  process.env.STRIPE_WEBHOOK_PROOF_URL ||
  "https://clientsurgesystems.com/api/functions/stripeWebhookOrders";

function runBase44Exec(script) {
  const result = spawnSync("base44", ["exec"], {
    cwd: process.cwd(),
    input: script,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`base44 exec failed: ${(result.stderr || result.stdout || "").trim()}`);
  }

  const lines = String(result.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines.slice(index).join("\n"));
    } catch {
      // Keep scanning upward because Base44 may print status lines before JSON.
    }
  }

  throw new Error("base44 exec did not return a JSON object.");
}

function createQaOrder() {
  return runBase44Exec(`
const suffix = Date.now();
const qaEmail = \`stripe-webhook-proof-\${suffix}@clientsurge.test\`;
const order = await base44.entities.Order.create({
  customer_email: qaEmail,
  customer_name: "Stripe Webhook Proof QA",
  customer_phone: "+16025550123",
  business_name: "Stripe Webhook Proof QA",
  payment_status: "pending",
  order_status: "pending_payment",
  selected_package_type: "elite_system",
  package_type: "elite_system",
  plan_type: "Elite System",
  total_setup: 2497,
  total_monthly: 1997,
  pricing_summary: {
    pricing_version: "canonical_sales_catalog_v1",
    package_key: "elite_system",
    package_name: "Elite System",
    total_setup: 2497,
    total_monthly: 1997,
    package_service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request"
    ],
    selected_service_keys: [
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
      "ai_booking_agent",
      "lead_reactivation",
      "review_request"
    ]
  },
  notes: "Stripe signed webhook proof order. Safe to archive.",
  items: [
    { product_id: "prod_UNi5RHiKNSTfQl", product_name: "Instant Lead Response", status: "pending", service_key: "instant_lead_response" },
    { product_id: "prod_UNi5QL0bQl98If", product_name: "Missed Call Text-Back", status: "pending", service_key: "missed_call_text_back" },
    { product_id: "prod_UNi5N0l5MtaV0R", product_name: "14-Day Nurture Sequence", status: "pending", service_key: "nurture_sequence_14d" },
    { product_id: "prod_UNi5fLL2SyJJdP", product_name: "AI Booking Agent", status: "pending", service_key: "ai_booking_agent" },
    { product_id: "prod_UNi5PWv05ECzXI", product_name: "Old Lead Reactivation", status: "pending", service_key: "lead_reactivation" },
    { product_id: "prod_UNi5dvOUm6Fi9i", product_name: "Review Request Automation", status: "pending", service_key: "review_request" }
  ]
});
console.log(JSON.stringify({ order_id: order.id, customer_email: qaEmail }));
`);
}

function inspectProof(orderId, eventId) {
  return runBase44Exec(`
const order = await base44.entities.Order.get(${JSON.stringify(orderId)});
const events = await base44.entities.CommunicationEvent.filter(
  { provider_message_id: ${JSON.stringify(eventId)} },
  "-created_date",
  5
).catch(() => []);
console.log(JSON.stringify({
  order_id: order.id,
  payment_status: order.payment_status || null,
  order_status: order.order_status || null,
  billing_status: order.billing_status || null,
  stripe_event_id: order.stripe_event_id || null,
  stripe_session_id: order.stripe_session_id || null,
  stripe_customer_id: order.stripe_customer_id || null,
  onboarding_client_id: order.onboarding_client_id || null,
  client_project_id: order.client_project_id || null,
  communication_event_found: Boolean(events && events.length),
  communication_event_status: events?.[0]?.status || null,
  communication_event_subject: events?.[0]?.subject || null
}, null, 2));
`);
}

function generateStripeSignatureHeader(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function main() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!webhookSecret.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be set to a Stripe webhook signing secret.");
  }

  const qaOrder = createQaOrder();
  const eventId = `evt_clientsurge_proof_${Date.now()}`;
  const sessionId = `cs_test_clientsurge_proof_${Date.now()}`;
  const payload = JSON.stringify({
    id: eventId,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        mode: "subscription",
        payment_status: "paid",
        status: "complete",
        customer: "cus_test_clientsurge_proof",
        customer_email: qaOrder.customer_email,
        customer_details: {
          email: qaOrder.customer_email,
          name: "Stripe Webhook Proof QA",
        },
        metadata: {
          order_id: qaOrder.order_id,
          package_key: "elite_system",
          business_name: "Stripe Webhook Proof QA",
          proof_type: "signed_test_webhook",
        },
      },
    },
  });

  const signature = generateStripeSignatureHeader(payload, webhookSecret);

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": signature,
    },
    body: payload,
  });
  const responseText = await response.text();
  const inspection = inspectProof(qaOrder.order_id, eventId);

  const checks = [
    ["webhook_http_ok", response.ok],
    ["order_marked_paid", inspection.payment_status === "paid"],
    ["stripe_event_recorded", inspection.stripe_event_id === eventId],
    ["stripe_session_recorded", inspection.stripe_session_id === sessionId],
    ["communication_event_recorded", inspection.communication_event_found],
    ["onboarding_linked", Boolean(inspection.onboarding_client_id || inspection.client_project_id)],
  ];

  const summary = {
    generated_at: new Date().toISOString(),
    webhook_url: WEBHOOK_URL,
    order_id: qaOrder.order_id,
    event_id: eventId,
    session_id: sessionId,
    response_status: response.status,
    response_body: responseText.slice(0, 1000),
    inspection,
    checks: checks.map(([name, passed]) => ({ name, passed })),
    passed: checks.every(([, passed]) => passed),
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(summary.passed ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

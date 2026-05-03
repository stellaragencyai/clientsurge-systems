import test from "node:test";
import assert from "node:assert/strict";

import { buildLaunchReadinessAudit } from "../base44/functions/_shared/launchReadiness.js";
import { PROVIDER_DEPLOYMENT_STATUS } from "../base44/functions/_shared/providerProof.js";

function buildOrder(overrides = {}) {
  return {
    id: "order_1",
    payment_status: "paid",
    stripe_customer_id: "cus_123",
    stripe_session_id: "cs_123",
    stripe_subscription_id: "sub_123",
    billing_status: "active",
    subscription_status: "active",
    total_monthly: 299,
    client_id: "client_1",
    client_project_id: "project_1",
    onboarding_client_id: "onboarding_1",
    items: [
      {
        service_key: "instant_lead_response",
        tracking_enabled: true,
      },
      {
        service_key: "missed_call_text_back",
        tracking_enabled: true,
      },
      {
        service_key: "ai_booking_agent",
        tracking_enabled: true,
      },
      {
        service_key: "review_request",
        tracking_enabled: true,
      },
    ],
    ...overrides,
  };
}

function buildLeadIngestionSetup(overrides = {}) {
  return {
    credential_status: "active",
    credentials: {
      has_api_key: true,
      has_webhook_secret: true,
      revoked_at: null,
      last_used_at: "2026-05-03T10:00:00.000Z",
    },
    automation_readiness: [
      {
        service_key: "instant_lead_response",
        label: "Instant Lead Response",
        included: true,
        ready: true,
      },
      {
        service_key: "missed_call_text_back",
        label: "Missed Call Text-Back",
        included: true,
        ready: true,
      },
    ],
    ...overrides,
  };
}

function buildProviderProof(overrides = {}) {
  return {
    webhook: {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED,
      status_reason: "Webhook proof recorded.",
      last_ingestion_event: {
        id: "lead_evt_1",
      },
    },
    twilio: {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED,
      last_delivery_callback: {
        id: "twilio_cb_1",
      },
      last_missed_call_live_webhook: {
        id: "twilio_missed_1",
      },
    },
    booking: {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED,
    },
    review: {
      derived_status: PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED,
      channel: "email",
    },
    resend: {
      configured: true,
      derived_status: PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED,
    },
    missing_live_proof_items: [],
    ...overrides,
  };
}

function buildStripeWebhookEvent(overrides = {}) {
  return {
    id: "evt_stripe_paid",
    created_date: "2026-05-03T10:05:00.000Z",
    provider: "stripe",
    event_type: "order_paid",
    status: "processed",
    subject: "Order marked paid",
    metadata_json: JSON.stringify({
      event_source: "stripe.checkout.session.completed",
      stripe_event_id: "evt_checkout_1",
      stripe_event_type: "checkout.session.completed",
    }),
    ...overrides,
  };
}

test("buildLaunchReadinessAudit reports a ready order when proof, billing, and ownership are aligned", () => {
  const audit = buildLaunchReadinessAudit({
    order: buildOrder(),
    subscription: { id: "sub_123" },
    leadIngestionSetup: buildLeadIngestionSetup(),
    providerProof: buildProviderProof(),
    workspaceSummary: {
      counts: {
        blockers: 0,
      },
    },
    orderLeads: [
      {
        id: "lead_1",
        order_id: "order_1",
        client_project_id: "project_1",
      },
    ],
    projectLeads: [
      {
        id: "lead_1",
        order_id: "order_1",
        client_project_id: "project_1",
      },
    ],
    orderEvents: [buildStripeWebhookEvent()],
    environment: {
      automation_shared_secret_configured: true,
    },
  });

  assert.equal(audit.counts.blocked, 0);
  assert.equal(audit.launch_blockers.length, 0);
  assert.equal(
    audit.sections.every((section) => section.status === "ready"),
    true
  );
});

test("buildLaunchReadinessAudit surfaces launch blockers for missing proof, secret rollout, and ownership drift", () => {
  const audit = buildLaunchReadinessAudit({
    order: buildOrder({
      stripe_customer_id: "",
      stripe_subscription_id: "",
      billing_status: "past_due",
      client_id: "",
      onboarding_client_id: "",
    }),
    subscription: null,
    leadIngestionSetup: buildLeadIngestionSetup({
      credential_status: "not_issued",
      credentials: {
        has_api_key: false,
        has_webhook_secret: false,
        revoked_at: null,
        last_used_at: null,
      },
      automation_readiness: [
        {
          service_key: "instant_lead_response",
          label: "Instant Lead Response",
          included: true,
          ready: false,
        },
      ],
    }),
    providerProof: buildProviderProof({
      webhook: {
        derived_status: PROVIDER_DEPLOYMENT_STATUS.CONFIGURED,
        status_reason: "No live webhook proof yet.",
        last_ingestion_event: null,
      },
      twilio: {
        derived_status: PROVIDER_DEPLOYMENT_STATUS.CONFIGURED,
        last_delivery_callback: null,
        last_missed_call_live_webhook: null,
      },
      booking: {
        derived_status: PROVIDER_DEPLOYMENT_STATUS.CONFIGURED,
      },
      review: {
        derived_status: PROVIDER_DEPLOYMENT_STATUS.CONFIGURED,
        channel: "email",
      },
      resend: {
        configured: true,
        derived_status: PROVIDER_DEPLOYMENT_STATUS.CONFIGURED,
      },
      missing_live_proof_items: ["Twilio outbound SMS has not been live-proven for this order."],
    }),
    workspaceSummary: {
      counts: {
        blockers: 2,
      },
    },
    orderLeads: [
      {
        id: "lead_1",
        order_id: "order_1",
        client_project_id: "",
      },
    ],
    projectLeads: [
      {
        id: "lead_2",
        order_id: "",
        client_project_id: "project_1",
      },
    ],
    orderEvents: [
      {
        id: "evt_failed",
        created_date: new Date().toISOString(),
        status: "failed",
        event_type: "provider_send_failed",
      },
    ],
    environment: {
      automation_shared_secret_configured: false,
    },
  });

  assert.equal(audit.counts.blocked > 0, true);
  assert.equal(audit.launch_blockers.length > 0, true);
  assert.equal(
    audit.launch_blockers.some((item) => item.section_key === "automation_security"),
    true
  );
  assert.equal(
    audit.launch_blockers.some((item) => item.section_key === "lead_ownership"),
    true
  );
  assert.equal(
    audit.launch_blockers.some((item) => item.section_key === "billing"),
    true
  );
  assert.equal(
    audit.launch_blockers.some((item) => item.section_key === "service_proof"),
    true
  );
});

import test from "node:test";
import assert from "node:assert/strict";

import { deriveAutomationStatuses } from "../base44/functions/_shared/automationStatus.js";

function buildPaidOrder({ pipelineStatus = "Ready for Install", serviceKey, installStatus, id = "order_1" }) {
  return {
    id,
    payment_status: "paid",
    pipeline_status: pipelineStatus,
    install_initialized_at: "2026-04-22T12:00:00.000Z",
    items: [
      {
        product_id:
          serviceKey === "instant_lead_response"
            ? "prod_UNi5RHiKNSTfQl"
            : "prod_UNi5QL0bQl98If",
        product_name:
          serviceKey === "instant_lead_response"
            ? "Instant Lead Response"
            : "Missed Call Text-Back",
        tracking_enabled: true,
        service_key: serviceKey,
        install_status: installStatus,
      },
    ],
    install_configuration: {
      shared: {
        twilio_business_phone: "+16025550111",
        business_hours: "Mon-Fri 8am-5pm",
        after_hours_behavior: "send_after_hours_sms",
        consent_behavior: "include_opt_out_language",
        opt_out_message: "Reply STOP to opt out.",
      },
      services: {
        [serviceKey]: {
          sms_template: "Hello from ClientSurge",
        },
      },
    },
  };
}

test("automation status is deterministic from canonical order states and unsupported flows are explicit", () => {
  const statuses = deriveAutomationStatuses({
    orders: [
      buildPaidOrder({
        id: "order_1",
        serviceKey: "instant_lead_response",
        installStatus: "Ready for Install",
      }),
    ],
    events: [],
  });

  const instant = statuses.find((status) => status.id === "instant_response");
  const missed = statuses.find((status) => status.id === "missed_call");
  const booking = statuses.find((status) => status.id === "booking_link");

  assert.equal(instant.state, "ready_for_install");
  assert.equal(instant.tracked_order_count, 1);
  assert.equal(missed.state, "not_purchased");
  assert.equal(booking.state, "not_canonicalized");
  assert.equal(booking.supported, false);
});

test("automation status tracks install transitions and runtime event outcomes", () => {
  const statuses = deriveAutomationStatuses({
    orders: [
      buildPaidOrder({
        id: "order_1",
        pipelineStatus: "Testing",
        serviceKey: "instant_lead_response",
        installStatus: "Testing",
      }),
      buildPaidOrder({
        id: "order_2",
        pipelineStatus: "Live",
        serviceKey: "instant_lead_response",
        installStatus: "Live",
      }),
    ],
    events: [
      {
        id: "evt_1",
        order_id: "order_1",
        service_key: "instant_lead_response",
        event_type: "runtime_attempt_started",
        status: "processed",
        created_date: "2026-04-22T12:05:00.000Z",
      },
      {
        id: "evt_2",
        order_id: "order_1",
        service_key: "instant_lead_response",
        event_type: "provider_send_succeeded",
        status: "sent",
        created_date: "2026-04-22T12:06:00.000Z",
      },
      {
        id: "evt_3",
        order_id: "order_2",
        service_key: "instant_lead_response",
        event_type: "runtime_attempt_started",
        status: "processed",
        created_date: "2026-04-22T12:07:00.000Z",
      },
      {
        id: "evt_4",
        order_id: "order_2",
        service_key: "instant_lead_response",
        event_type: "runtime_attempt_blocked",
        status: "failed",
        created_date: "2026-04-22T12:08:00.000Z",
      },
    ],
  });

  const instant = statuses.find((status) => status.id === "instant_response");

  assert.equal(instant.state, "testing");
  assert.equal(instant.tracked_install_counts.Testing, 1);
  assert.equal(instant.tracked_install_counts.Live, 1);
  assert.equal(instant.runtime.total_runs, 2);
  assert.equal(instant.runtime.successful_runs, 1);
  assert.equal(instant.runtime.failed_runs, 1);
  assert.equal(instant.runtime.last_signal.event_type, "runtime_attempt_blocked");
});

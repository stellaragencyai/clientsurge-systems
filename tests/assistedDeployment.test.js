import test from "node:test";
import assert from "node:assert/strict";

import {
  AssistedDeploymentError,
  buildPreparedSetupProposal,
  executeAssistedSetupSequence,
} from "../base44/functions/_shared/assistedDeployment.js";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
  }

  applySort(records, sort) {
    if (!sort) {
      return [...records];
    }

    const descending = String(sort).startsWith("-");
    const field = descending ? String(sort).slice(1) : String(sort);
    return [...records].sort((a, b) => {
      const left = a?.[field];
      const right = b?.[field];
      const leftValue = typeof left === "string" ? Date.parse(left) || left : left;
      const rightValue = typeof right === "string" ? Date.parse(right) || right : right;
      if (leftValue === rightValue) return 0;
      if (descending) {
        return leftValue < rightValue ? 1 : -1;
      }
      return leftValue > rightValue ? 1 : -1;
    });
  }

  async list(sort, limit) {
    const records = this.applySort(this.records, sort);
    return typeof limit === "number" ? records.slice(0, limit) : records;
  }

  async filter(query = {}, sort, limit) {
    const filtered = this.records.filter((record) =>
      Object.entries(query).every(([key, value]) => record[key] === value)
    );
    const records = this.applySort(filtered, sort);
    return typeof limit === "number" ? records.slice(0, limit) : records;
  }

  async get(id) {
    const record = this.records.find((entry) => entry.id === id);
    if (!record) {
      throw new Error(`Record ${id} not found`);
    }
    return { ...record };
  }

  async create(data) {
    const record = {
      id: data.id || `rec_${this.sequence++}`,
      created_date: data.created_date || new Date().toISOString(),
      ...data,
    };
    this.records.push(record);
    return { ...record };
  }

  async update(id, patch) {
    const index = this.records.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new Error(`Record ${id} not found`);
    }

    this.records[index] = {
      ...this.records[index],
      ...patch,
      id,
    };

    return { ...this.records[index] };
  }
}

function createFakeBase44({ orders = [], adminSettings = [], events = [], leads = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    AdminSettings: new InMemoryCollection(adminSettings),
    CommunicationEvent: new InMemoryCollection(events),
    ClientProject: new InMemoryCollection([]),
    OnboardingClient: new InMemoryCollection([]),
    Leads: new InMemoryCollection(leads),
  };

  return {
    asServiceRole: {
      entities,
    },
  };
}

function buildInstantOrder(overrides = {}) {
  return {
    id: "order_instant",
    created_date: "2026-04-22T12:00:00.000Z",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    customer_name: "Jamie Owner",
    customer_email: "owner@example.com",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        tracking_enabled: true,
        service_key: "instant_lead_response",
        install_status: "Ready for Install",
        status: "pending",
      },
    ],
    install_configuration: {
      shared: {
        twilio_business_phone: "",
        business_hours: "",
        after_hours_behavior: "",
        consent_behavior: "",
        opt_out_message: "",
      },
      services: {
        instant_lead_response: {
          sms_template: "",
        },
      },
    },
    ...overrides,
  };
}

function buildBookingOrder(overrides = {}) {
  return {
    id: "order_booking",
    created_date: "2026-04-22T12:00:00.000Z",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    customer_name: "Jamie Owner",
    customer_email: "owner@example.com",
    customer_phone: "",
    business_name: "Signal Med Spa",
    items: [
      {
        product_id: "prod_UNi5fLL2SyJJdP",
        product_name: "AI Booking Agent",
        tracking_enabled: true,
        service_key: "ai_booking_agent",
        install_status: "Ready for Install",
        status: "pending",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        ai_booking_agent: {
          booking_link: "https://booking.example.com/demo",
          booking_mode: "internal_placeholder",
          confirmation_template: "Thanks {{lead_name}}, you're booked with {{business_name}}.",
          reminder_enabled: true,
          reminder_template: "Reminder from {{business_name}} for your booking.",
          intake_fields: ["customer_name", "customer_email"],
        },
      },
    },
    ...overrides,
  };
}

test("prepare assisted setup returns a safe proposal without mutating saved config", async () => {
  const order = buildInstantOrder();
  const base44 = createFakeBase44({ orders: [order] });

  const proposal = await buildPreparedSetupProposal({
    base44,
    order,
  });

  assert.equal(order.install_configuration.shared.after_hours_behavior, "");
  assert.equal(order.install_configuration.services.instant_lead_response.sms_template, "");
  assert.equal(proposal.patch.shared.after_hours_behavior, "hold_until_open");
  assert.equal(proposal.patch.shared.consent_behavior, "include_opt_out_language");
  assert.equal(proposal.patch.shared.opt_out_message, "Reply STOP to opt out.");
  assert.match(
    proposal.patch.services.instant_lead_response.sms_template,
    /Signal Med Spa/
  );
  assert.ok(proposal.suggestions_applied.length >= 3);
  assert.equal(proposal.current_overview.can_prepare_setup, true);
});

test("assisted setup sequence refuses to run without operator confirmation", async () => {
  const order = buildBookingOrder();
  const base44 = createFakeBase44({ orders: [order] });

  await assert.rejects(
    () =>
      executeAssistedSetupSequence({
        base44,
        order,
        confirmed: false,
      }),
    (error) => {
      assert.equal(error instanceof AssistedDeploymentError, true);
      assert.equal(error.code, "operator_confirmation_required");
      return true;
    }
  );
});

test("assisted setup sequence respects config blockers and will not bypass validation", async () => {
  const order = buildBookingOrder({
    install_configuration: {
      shared: {},
      services: {
        ai_booking_agent: {
          booking_link: "",
          booking_mode: "",
          confirmation_template: "",
          reminder_enabled: false,
          reminder_template: "",
          intake_fields: [],
        },
      },
    },
  });
  const base44 = createFakeBase44({ orders: [order] });

  await assert.rejects(
    () =>
      executeAssistedSetupSequence({
        base44,
        order,
        confirmed: true,
      }),
    (error) => {
      assert.equal(error instanceof AssistedDeploymentError, true);
      assert.equal(error.code, "no_sequence_ready_services");
      assert.equal(error.details.manual_services.length, 1);
      return true;
    }
  );
});

test("assisted setup sequence completes guarded setup without auto-live and logs workflow events", async () => {
  const order = buildBookingOrder();
  const base44 = createFakeBase44({ orders: [order] });

  const result = await executeAssistedSetupSequence({
    base44,
    order,
    confirmed: true,
    targetEmail: "owner@example.com",
  });

  assert.equal(result.success, true);
  assert.equal(result.service_results.length, 1);
  assert.equal(result.service_results[0].service_key, "ai_booking_agent");
  assert.equal(result.service_results[0].ending_status, "Testing");
  assert.equal(result.service_results[0].successful_test_exists, true);

  const savedOrder = await base44.asServiceRole.entities.Order.get(order.id);
  assert.equal(savedOrder.items[0].install_status, "Testing");

  const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: order.id }, "-created_date", 50);
  assert.ok(events.some((event) => event.subject === "Assisted setup sequence started"));
  assert.ok(events.some((event) => event.subject === "Assisted setup sequence completed"));
  assert.ok(events.some((event) => event.event_type === "booking_simulation_created"));
  assert.equal(events.some((event) => event.event_type === "service_status_changed" && event.message_body?.includes("Live")), false);
});

test("assisted setup sequence stops on partial failure and records failure details", async () => {
  const order = buildBookingOrder({
    id: "order_mixed",
    items: [
      {
        product_id: "prod_UNi5fLL2SyJJdP",
        product_name: "AI Booking Agent",
        tracking_enabled: true,
        service_key: "ai_booking_agent",
        install_status: "Testing",
        status: "setting_up",
      },
      {
        product_id: "prod_UNi5dvOUm6Fi9i",
        product_name: "Review Request Automation",
        tracking_enabled: true,
        service_key: "review_request",
        install_status: "Ready for Install",
        status: "pending",
      },
    ],
    install_configuration: {
      shared: {
        twilio_business_phone: "+16025550999",
        business_hours: "Mon-Fri 8am-5pm",
        after_hours_behavior: "send_after_hours_sms",
        consent_behavior: "include_opt_out_language",
        opt_out_message: "Reply STOP to opt out.",
      },
      services: {
        ai_booking_agent: {
          booking_link: "https://booking.example.com/demo",
          booking_mode: "internal_placeholder",
          confirmation_template: "Thanks {{lead_name}}, you're booked with {{business_name}}.",
          reminder_enabled: false,
          reminder_template: "",
          intake_fields: ["customer_name", "customer_email"],
        },
        review_request: {
          review_link: "https://reviews.example.com/signal-med-spa",
          trigger_event: "manual_trigger",
          message_template: "Thanks for choosing {{business_name}}. Would you leave us a review?",
          channel: "sms",
          send_delay_minutes: 0,
          fallback_internal_feedback_enabled: true,
        },
      },
    },
    customer_phone: "",
  });
  const base44 = createFakeBase44({ orders: [order] });

  try {
    await executeAssistedSetupSequence({
      base44,
      order,
      confirmed: true,
      targetEmail: "owner@example.com",
    });
    assert.fail("Expected assisted setup sequence to stop on runtime failure");
  } catch (error) {
    assert.equal(error instanceof AssistedDeploymentError, true);
    assert.equal(error.code, "missing_runtime_configuration");
    assert.equal(error.details.partial_results.length, 1);
    assert.equal(error.details.partial_results[0].service_key, "ai_booking_agent");
    assert.ok(error.details.start_event_id);
    assert.ok(error.details.failure_event_id);

    const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: order.id }, "-created_date", 100);
    assert.ok(events.some((event) => event.subject === "Assisted setup sequence stopped"));
    assert.ok(events.some((event) => event.event_type === "booking_simulation_created"));
    assert.ok(events.some((event) => event.event_type === "runtime_attempt_blocked" && event.service_key === "review_request"));
  }
});

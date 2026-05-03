import test from "node:test";
import assert from "node:assert/strict";

import { buildRemoteSetupWorkspace } from "../base44/functions/_shared/remoteSetupWorkspace.js";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
  }

  async list() {
    return [...this.records];
  }

  async filter(query = {}) {
    return this.records.filter((record) =>
      Object.entries(query).every(([key, value]) => record[key] === value)
    );
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

function createFakeBase44({ adminSettings = [], events = [] } = {}) {
  const entities = {
    AdminSettings: new InMemoryCollection(adminSettings),
    Leads: new InMemoryCollection([
      {
        id: "lead_1",
        full_name: "Alex Dormant",
        email: "alex@example.com",
        phone: "+16025550111",
        business_name: "Signal Med Spa",
        status: "Qualified",
        created_date: "2026-02-01T12:00:00.000Z",
        last_contacted_at: "2026-02-10T12:00:00.000Z",
      },
      {
        id: "lead_2",
        full_name: "Blair Dormant",
        email: "blair@example.com",
        phone: "+16025550112",
        business_name: "Signal Med Spa",
        status: "Contacted",
        created_date: "2026-01-15T12:00:00.000Z",
        last_contacted_at: "2026-02-05T12:00:00.000Z",
      },
      {
        id: "lead_3",
        full_name: "Casey Fresh",
        email: "casey@example.com",
        phone: "+16025550113",
        business_name: "Signal Med Spa",
        status: "New",
        created_date: "2026-04-20T12:00:00.000Z",
        last_contacted_at: "2026-04-20T12:00:00.000Z",
      },
    ]),
    CommunicationEvent: new InMemoryCollection(events),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
    },
  };
}

function buildOrder({
  installStatus = "Testing",
  withSuccessEvent = false,
  withProviderProofEvent = false,
} = {}) {
  const order = {
    id: "order_1",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: installStatus,
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        tracking_enabled: true,
        service_key: "instant_lead_response",
        install_status: installStatus,
        status: installStatus === "Live" ? "live" : "setting_up",
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
        instant_lead_response: {
          sms_template: "Hi {{lead_name}}, thanks for reaching out to {{business_name}}.",
        },
      },
    },
  };

  const orderEvents = [
    ...(withSuccessEvent
      ? [
        {
          id: "event_success",
          created_date: "2026-04-22T12:15:00.000Z",
          order_id: "order_1",
          service_key: "instant_lead_response",
          event_type: "provider_send_succeeded",
          provider: "twilio",
          status: "sent",
        },
      ]
      : []),
    ...(withProviderProofEvent
      ? [
        {
          id: "event_proof",
          created_date: "2026-04-22T12:16:00.000Z",
          order_id: "order_1",
          service_key: "instant_lead_response",
          event_type: "status_update",
          provider: "twilio",
          status: "processed",
          context_type: "provider_proof",
          metadata_json: JSON.stringify({
            context_type: "provider_proof",
            proof_kind: "live_sms_instant_lead_response",
            proof_mode: "LIVE_PROVIDER_PROOF",
          }),
        },
      ]
      : []),
  ];

  return { order, orderEvents };
}

test("remote setup workspace derives required actions and keeps Live blocked before a successful test", async () => {
  const { order, orderEvents } = buildOrder({ installStatus: "Testing", withSuccessEvent: false });
  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
        resend_enabled: true,
        resend_from_email: "ops@example.com",
        webhook_enabled: true,
        webhook_url: "https://hooks.example.com/inbound",
      },
    ],
    events: [
      {
        id: "provider_test_twilio",
        created_date: "2026-04-22T12:05:00.000Z",
        event_type: "status_update",
        provider: "twilio",
        status: "processed",
        message_body: "Twilio credentials validated successfully.",
        metadata_json: JSON.stringify({
          context_type: "provider_test",
          integration_id: "twilio",
        }),
      },
      ...orderEvents,
    ],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents,
  });

  const service = workspace.services[0];
  assert.equal(service.go_live_readiness.tested, false);
  assert.equal(service.go_live_readiness.can_move_to_live, false);
  assert.ok(
    service.required_actions.some((action) => action.code === "test:successful_runtime_required")
  );
  assert.equal(workspace.provider_readiness.twilio.derived_status, "test_wired");
});

test("remote setup workspace keeps Live blocked until explicit provider proof exists", async () => {
  const { order, orderEvents } = buildOrder({ installStatus: "Testing", withSuccessEvent: true });
  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: [
      {
        id: "provider_test_twilio",
        created_date: "2026-04-22T12:05:00.000Z",
        event_type: "status_update",
        provider: "twilio",
        status: "processed",
        message_body: "Twilio credentials validated successfully.",
        metadata_json: JSON.stringify({
          context_type: "provider_test",
          integration_id: "twilio",
        }),
      },
      ...orderEvents,
    ],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents,
  });

  const service = workspace.services[0];
  assert.equal(service.go_live_readiness.tested, true);
  assert.equal(service.go_live_readiness.provider_verified, false);
  assert.equal(service.go_live_readiness.can_move_to_live, false);
  assert.ok(
    service.required_actions.some((action) => action.code === "proof:provider_verification_required")
  );
});

test("remote setup workspace unlocks Live after a successful runtime event and explicit proof exist", async () => {
  const { order, orderEvents } = buildOrder({
    installStatus: "Testing",
    withSuccessEvent: true,
    withProviderProofEvent: true,
  });
  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: [
      {
        id: "provider_test_twilio",
        created_date: "2026-04-22T12:05:00.000Z",
        event_type: "status_update",
        provider: "twilio",
        status: "processed",
        message_body: "Twilio credentials validated successfully.",
        metadata_json: JSON.stringify({
          context_type: "provider_test",
          integration_id: "twilio",
        }),
      },
      ...orderEvents,
    ],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents,
  });

  const service = workspace.services[0];
  assert.equal(service.go_live_readiness.tested, true);
  assert.equal(service.go_live_readiness.provider_verified, true);
  assert.equal(service.go_live_readiness.can_move_to_live, true);
  assert.ok(
    service.required_actions.some((action) => action.code === "next:move_to_live")
  );
});

test("remote setup workspace derives nurture sequence blockers and scheduler preview", async () => {
  const order = {
    id: "order_2",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    items: [
      {
        product_id: "prod_UNi5N0l5MtaV0R",
        product_name: "14-Day Nurture Sequence",
        tracking_enabled: true,
        service_key: "nurture_sequence_14d",
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
        nurture_sequence_14d: {
          sms_enabled: false,
          email_enabled: false,
          steps: [],
        },
      },
    },
  };

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
        resend_enabled: false,
        resend_from_email: "",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  const service = workspace.services[0];
  assert.ok(service.required_actions.some((action) => action.title === "Enable SMS or Email"));
  assert.ok(service.required_actions.some((action) => action.title === "Add sequence steps"));
  assert.equal(service.scheduler.label, "Scheduler Placeholder");
  assert.equal(service.go_live_readiness.can_move_to_live, false);
});

test("remote setup workspace derives booking agent blockers from canonical config", async () => {
  const order = {
    id: "order_3",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
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
          booking_link: "",
          booking_mode: "",
          business_hours: "Mon-Fri 8am-5pm",
          confirmation_template: "",
          reminder_enabled: false,
          reminder_template: "",
          intake_fields: [],
        },
      },
    },
  };

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  const service = workspace.services[0];
  assert.ok(service.required_actions.some((action) => action.title === "Add booking link"));
  assert.ok(service.required_actions.some((action) => action.title === "Choose booking mode"));
  assert.ok(service.required_actions.some((action) => action.title === "Set confirmation message"));
  assert.ok(service.required_actions.some((action) => action.title === "Configure intake fields"));
  assert.equal(service.go_live_readiness.provider_ready, true);
  assert.equal(service.go_live_readiness.can_move_to_live, false);
});

test("remote setup workspace derives lead reactivation blockers and target size from canonical Leads", async () => {
  const order = {
    id: "order_4",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    items: [
      {
        product_id: "prod_UNi5PWv05ECzXI",
        product_name: "Old Lead Reactivation",
        tracking_enabled: true,
        service_key: "lead_reactivation",
        install_status: "Ready for Install",
        status: "pending",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        lead_reactivation: {
          target_segment: "all_dormant",
          message_template: "",
          max_batch_size: 25,
        },
      },
    },
  };

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  const service = workspace.services[0];
  assert.ok(service.required_actions.some((action) => action.title === "Set message template"));
  assert.equal(service.target_size, 2);
  assert.equal(service.go_live_readiness.provider_ready, true);
  assert.equal(service.go_live_readiness.can_move_to_live, false);
  assert.equal(service.target_lead_preview.length, 2);
});

test("remote setup workspace derives review request blockers from canonical config", async () => {
  const order = {
    id: "order_5",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    items: [
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
      shared: {},
      services: {
        review_request: {
          review_link: "",
          trigger_event: "manual_trigger",
          message_template: "",
          channel: "email",
          send_delay_minutes: 15,
          fallback_internal_feedback_enabled: true,
        },
      },
    },
  };

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        resend_enabled: true,
        resend_from_email: "ops@example.com",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  const service = workspace.services[0];
  assert.ok(service.required_actions.some((action) => action.title === "Add review link"));
  assert.ok(service.required_actions.some((action) => action.title === "Set message template"));
  assert.equal(service.go_live_readiness.can_move_to_live, false);
  assert.equal(service.go_live_readiness.provider_ready, true);
});

test("remote setup workspace keeps review-request Live blocked until explicit live trigger proof exists", async () => {
  const order = {
    id: "order_6",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Testing",
    items: [
      {
        product_id: "prod_UNi5dvOUm6Fi9i",
        product_name: "Review Request Automation",
        tracking_enabled: true,
        service_key: "review_request",
        install_status: "Testing",
        status: "setting_up",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        review_request: {
          review_link: "https://reviews.example.com/signal-med-spa",
          trigger_event: "appointment_completed",
          message_template: "Leave a review here: {{review_link}}",
          channel: "email",
          send_delay_minutes: 15,
          fallback_internal_feedback_enabled: true,
        },
      },
    },
  };

  const successfulEvents = [
    {
      id: "event_review_success",
      created_date: "2026-04-22T12:15:00.000Z",
      order_id: "order_6",
      service_key: "review_request",
      event_type: "provider_send_succeeded",
      provider: "internal",
      status: "processed",
    },
  ];

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        resend_enabled: false,
        resend_from_email: "",
      },
    ],
    events: successfulEvents,
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: successfulEvents,
  });

  const service = workspace.services[0];
  assert.equal(service.go_live_readiness.tested, true);
  assert.equal(service.go_live_readiness.provider_ready, true);
  assert.equal(service.go_live_readiness.can_move_to_live, false);
  assert.equal(service.go_live_readiness.provider_verified, false);
  assert.ok(
    service.required_actions.some((action) => action.code === "proof:provider_verification_required")
  );
});

test("remote setup workspace derives an operator focus summary and shared config blockers from backend state", async () => {
  const order = {
    id: "order_7",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
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
  };

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  assert.equal(workspace.workspace_summary.headline, "Resolve blockers before testing");
  assert.equal(workspace.workspace_summary.shared_configuration.required, true);
  assert.equal(workspace.workspace_summary.shared_configuration.required_count, 5);
  assert.ok(
    workspace.workspace_summary.next_best_actions.some((action) => action.field === "shared.twilio_business_phone")
  );
});

test("remote setup workspace returns backend-derived template suggestions for faster operator setup", async () => {
  const order = {
    id: "order_8",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    items: [
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
      shared: {},
      services: {
        review_request: {
          review_link: "https://reviews.example.com/signal-med-spa",
          trigger_event: "",
          message_template: "",
          channel: "",
          send_delay_minutes: null,
          fallback_internal_feedback_enabled: false,
        },
      },
    },
  };

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        resend_enabled: true,
        resend_from_email: "ops@example.com",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  const service = workspace.services[0];
  assert.match(service.config_suggestions.fields.message_template.value, /Signal Med Spa/);
  assert.match(service.config_suggestions.fields.message_template.value, /https:\/\/reviews\.example\.com\/signal-med-spa/);
  assert.deepEqual(service.config_suggestions.fields.message_template.source_labels, [
    "Order.business_name",
    "Current review link",
  ]);
  assert.equal(service.operator_summary.next_action_title, "Choose trigger event");
});

test("remote setup workspace setup-assist summary keeps suggestions advisory and does not mutate saved config", async () => {
  const order = {
    id: "order_9",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
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
  };

  const originalConfig = JSON.parse(JSON.stringify(order.install_configuration));
  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  assert.equal(workspace.workspace_summary.setup_assist.safe_autofill_count > 0, true);
  assert.equal(workspace.workspace_summary.setup_assist.manual_required_count > 0, true);
  assert.equal(workspace.workspace_summary.shared_suggestions.fields.twilio_business_phone.available, false);
  assert.equal(order.install_configuration.services.instant_lead_response.sms_template, "");
  assert.deepEqual(order.install_configuration, originalConfig);
});

test("remote setup workspace derives reactivation segment suggestions from canonical lead counts", async () => {
  const order = {
    id: "order_10",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Ready for Install",
    items: [
      {
        product_id: "prod_UNi5PWv05ECzXI",
        product_name: "Old Lead Reactivation",
        tracking_enabled: true,
        service_key: "lead_reactivation",
        install_status: "Ready for Install",
        status: "pending",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        lead_reactivation: {
          target_segment: "",
          message_template: "",
          max_batch_size: 25,
        },
      },
    },
  };

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: [],
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: [],
  });

  const service = workspace.services[0];
  assert.equal(service.config_suggestions.fields.target_segment.available, true);
  assert.equal(service.config_suggestions.fields.target_segment.value, "all_dormant");
  assert.equal(service.config_suggestions.insights.segment_options.length, 3);
});

test("remote setup workspace derives command view ordering and service filter counts from backend state", async () => {
  const order = {
    id: "order_11",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: "paid",
    pipeline_status: "Testing",
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        tracking_enabled: true,
        service_key: "instant_lead_response",
        install_status: "Ready for Install",
        status: "pending",
      },
      {
        product_id: "prod_UNi5dvOUm6Fi9i",
        product_name: "Review Request Automation",
        tracking_enabled: true,
        service_key: "review_request",
        install_status: "Configuring",
        status: "setting_up",
      },
      {
        product_id: "prod_UNi5fLL2SyJJdP",
        product_name: "AI Booking Agent",
        tracking_enabled: true,
        service_key: "ai_booking_agent",
        install_status: "Testing",
        status: "setting_up",
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
        instant_lead_response: {
          sms_template: "",
        },
        review_request: {
          review_link: "https://reviews.example.com/signal-med-spa",
          trigger_event: "appointment_completed",
          message_template: "Please leave a review at {{review_link}}",
          channel: "email",
          send_delay_minutes: 0,
          fallback_internal_feedback_enabled: false,
        },
        ai_booking_agent: {
          booking_link: "https://bookings.example.com/demo",
          booking_mode: "external_link",
          confirmation_template: "Your booking request is confirmed.",
          reminder_enabled: false,
          reminder_template: "",
          intake_fields: ["lead_name", "lead_email"],
        },
      },
    },
  };

  const events = [
    {
      id: "booking_success",
      created_date: "2026-04-22T12:15:00.000Z",
      order_id: "order_11",
      service_key: "ai_booking_agent",
      event_type: "provider_send_succeeded",
      provider: "internal",
      status: "processed",
    },
    {
      id: "booking_proof",
      created_date: "2026-04-22T12:16:00.000Z",
      order_id: "order_11",
      service_key: "ai_booking_agent",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      context_type: "provider_proof",
      metadata_json: JSON.stringify({
        context_type: "provider_proof",
        proof_kind: "live_booking_calendar_sync",
        proof_mode: "LIVE_PROVIDER_PROOF",
      }),
    },
  ];

  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
        resend_enabled: true,
        resend_from_email: "ops@example.com",
      },
    ],
    events,
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents: events,
  });

  assert.equal(workspace.workspace_summary.command_view.configure_first?.service_key, "review_request");
  assert.equal(workspace.workspace_summary.command_view.move_to_testing_now?.service_key, "review_request");
  assert.equal(workspace.workspace_summary.command_view.test_now, null);
  assert.equal(workspace.workspace_summary.command_view.go_live_now?.service_key, "ai_booking_agent");
  assert.equal(workspace.workspace_summary.service_filter_counts.all, 3);
  assert.equal(workspace.workspace_summary.service_filter_counts.blocked, 2);
  assert.equal(workspace.workspace_summary.service_filter_counts.testing_ready, 1);
  assert.equal(workspace.workspace_summary.service_filter_counts.live_ready, 1);
  assert.equal(workspace.workspace_summary.service_filter_counts.in_testing, 1);
});

test("remote setup workspace returns consistent per-service operator and timeline sections", async () => {
  const { order, orderEvents } = buildOrder({ installStatus: "Testing", withSuccessEvent: true });
  const { base44 } = createFakeBase44({
    adminSettings: [
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550000",
      },
    ],
    events: orderEvents,
  });

  const workspace = await buildRemoteSetupWorkspace({
    base44,
    order,
    orderEvents,
  });

  const service = workspace.services[0];
  assert.equal(typeof service.operator_summary.next_action_title, "string");
  assert.equal(typeof service.operator_summary.next_action_detail, "string");
  assert.equal(typeof service.timeline_relevance.latest_event_type, "string");
  assert.equal(typeof service.timeline_relevance.latest_event_at, "string");
  assert.equal(service.timeline_relevance.successful_test_exists, true);
});

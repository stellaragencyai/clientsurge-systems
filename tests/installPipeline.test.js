import test from "node:test";
import assert from "node:assert/strict";

import {
  InstallLinkingError,
  InstallTransitionError,
  buildPurchaseOnboardingHandoff,
  derivePipelineStatus,
  initializePaidOrderInstallPipeline,
  listInstallQueueOrders,
  mapPipelineStatusToOrderStatus,
  normalizeInstallConfiguration,
  syncInstallMirrorsFromOrder,
  updateOrderInstallConfiguration,
  updateTrackedServiceInstallStatus,
} from "../base44/functions/_shared/installPipeline.js";
import {
  executeBookingSimulation,
  executeLeadReactivationTest,
  executeOrderServiceRuntime,
  executeReviewRequestTest,
} from "../base44/functions/_shared/installRuntime.js";

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

function getEventMetadata(event) {
  return event.metadata_json ? JSON.parse(event.metadata_json) : {};
}

function buildTrackedItem(productId, productName) {
  return {
    product_id: productId,
    product_name: productName,
    status: "pending",
  };
}

function buildCompleteConfigPatch({
  includeInstant = true,
  includeMissed = true,
} = {}) {
  return {
    shared: {
      twilio_business_phone: "+16025550999",
      business_hours: "Mon-Fri 8am-5pm",
      after_hours_behavior: "send_after_hours_sms",
      consent_behavior: "include_opt_out_language",
      opt_out_message: "Reply STOP to opt out.",
    },
    services: {
      ...(includeInstant
        ? {
            instant_lead_response: {
              sms_template: "Hi {{lead_name}}, thanks for reaching out. Reply here anytime.",
            },
          }
        : {}),
      ...(includeMissed
        ? {
            missed_call_text_back: {
              sms_template: "Sorry we missed your call. Reply here and we will text you back shortly.",
            },
          }
        : {}),
    },
  };
}

function buildTrackedOrder(statuses) {
  return {
    payment_status: "paid",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: statuses.map((installStatus, index) => ({
      product_id: index === 0 ? "prod_UNi5RHiKNSTfQl" : "prod_UNi5QL0bQl98If",
      product_name: index === 0 ? "Instant Lead Response" : "Missed Call Text-Back",
      tracking_enabled: true,
      service_key: index === 0 ? "instant_lead_response" : "missed_call_text_back",
      install_status: installStatus,
      status: installStatus === "Live" ? "live" : "setting_up",
    })),
  };
}

function buildLeadReactivationOrderOverride(installStatus = "Ready for Install") {
  return {
    payment_status: "paid",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: [
      {
        product_id: "prod_UNi5PWv05ECzXI",
        product_name: "Old Lead Reactivation",
        tracking_enabled: true,
        service_key: "lead_reactivation",
        install_status: installStatus,
        status: installStatus === "Live" ? "live" : "setting_up",
      },
    ],
  };
}

function buildReviewRequestOrderOverride(installStatus = "Ready for Install") {
  return {
    payment_status: "paid",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: [
      {
        product_id: "prod_UNi5dvOUm6Fi9i",
        product_name: "Review Request Automation",
        tracking_enabled: true,
        service_key: "review_request",
        install_status: installStatus,
        status: installStatus === "Live" ? "live" : "setting_up",
      },
    ],
  };
}

function createFakeBase44(orderOverrides = {}) {
  const orderCollection = new InMemoryCollection([
    {
      id: "order_1",
      created_date: "2026-04-22T12:00:00.000Z",
      customer_email: "owner@example.com",
      customer_name: "Jamie Owner",
      customer_phone: "+16025550123",
      business_name: "Signal Med Spa",
      items: [
        buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response"),
        buildTrackedItem("prod_UNi5QL0bQl98If", "Missed Call Text-Back"),
      ],
      total_setup: 494,
      total_monthly: 164,
      payment_status: "pending",
      order_status: "pending_payment",
      ...orderOverrides,
    },
  ]);

  const clientCollection = new InMemoryCollection();
  const clientProjectCollection = new InMemoryCollection();
  const onboardingCollection = new InMemoryCollection();
  const leadsCollection = new InMemoryCollection([
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
  ]);
  const eventCollection = new InMemoryCollection();

  const entities = {
    Order: orderCollection,
    Client: clientCollection,
    ClientProject: clientProjectCollection,
    OnboardingClient: onboardingCollection,
    Leads: leadsCollection,
    CommunicationEvent: eventCollection,
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
      auth: {
        async me() {
          return { id: "admin_1", role: "admin" };
        },
      },
    },
  };
}

function createFakeBase44WithState({
  orderOverrides = {},
  clients = [],
  clientProjects = [],
  onboardingClients = [],
  communicationEvents = [],
} = {}) {
  const { entities, base44 } = createFakeBase44(orderOverrides);

  entities.Client.records = [...clients];
  entities.Client.sequence = clients.length + 1;
  entities.ClientProject.records = [...clientProjects];
  entities.ClientProject.sequence = clientProjects.length + 1;
  entities.OnboardingClient.records = [...onboardingClients];
  entities.OnboardingClient.sequence = onboardingClients.length + 1;
  entities.CommunicationEvent.records = [...communicationEvents];
  entities.CommunicationEvent.sequence = communicationEvents.length + 1;

  return { entities, base44 };
}

async function recordSuccessfulRuntimeTest(base44, order, serviceKey, recipientPhone = "+16025550077") {
  return executeOrderServiceRuntime({
    base44,
    order,
    serviceKey,
    runtimeType: serviceKey === "instant_lead_response" ? "test_lead" : "simulate_missed_call",
    recipientPhone,
    runtimeData:
      serviceKey === "instant_lead_response"
        ? {
            lead_name: "Runtime Proof Prospect",
            lead_phone: recipientPhone,
          }
        : {
            caller_name: "Runtime Proof Caller",
            caller_phone: recipientPhone,
            call_status: "no-answer",
          },
    sendSms: async () => ({
      provider_message_id: `SM_${serviceKey}`,
      provider_status: "queued",
    }),
  });
}

test("paid order initializes canonical install pipeline and links existing structures", async () => {
  const { base44, entities } = createFakeBase44();
  const order = await entities.Order.get("order_1");

  const result = await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  assert.equal(result.order.payment_status, "paid");
  assert.equal(result.order.pipeline_status, "Ready for Install");
  assert.equal(result.order.client_id, result.client.id);
  assert.equal(result.order.client_project_id, result.clientProject.id);
  assert.equal(result.order.onboarding_client_id, result.onboardingClient.id);
  assert.deepEqual(
    result.order.items.map((item) => [item.service_key, item.install_status]),
    [
      ["instant_lead_response", "Ready for Install"],
      ["missed_call_text_back", "Ready for Install"],
    ]
  );
  assert.deepEqual(result.order.install_configuration.shared, {
    twilio_business_phone: "",
    business_hours: "",
    after_hours_behavior: "",
    consent_behavior: "",
    opt_out_message: "",
  });
  assert.equal(result.clientProject.step_payment, "complete");
  assert.equal(result.onboardingClient.status, "In Setup");
  assert.equal(result.onboardingClient.pipeline_status, "Ready for Install");
  assert.equal(entities.Client.records.length, 1);
  assert.equal(entities.ClientProject.records.length, 1);
  assert.equal(entities.OnboardingClient.records.length, 1);
  assert.equal(entities.CommunicationEvent.records.length, 4);
  assert.equal(result.order.activation_package_tier, "basic");
  assert.equal(result.order.purchase_onboarding_handoff.next_missing_field, "business_hours");
  assert.equal(result.onboardingClient.activation_package_tier, "basic");
  assert.equal(result.onboardingClient.next_onboarding_question, "What are the client's normal business hours?");
});

test("null install configuration normalizes to empty tracked service config", async () => {
  const { base44, entities } = createFakeBase44({ install_configuration: null });
  const order = await entities.Order.get("order_1");

  const normalized = normalizeInstallConfiguration(order.install_configuration, order.items);
  assert.deepEqual(Object.keys(normalized.services).sort(), [
    "instant_lead_response",
    "missed_call_text_back",
  ]);

  const result = await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_null_config",
    now: "2026-04-22T12:05:00.000Z",
  });

  assert.equal(result.order.payment_status, "paid");
  assert.equal(result.order.pipeline_status, "Ready for Install");
  assert.equal(result.order.install_configuration.shared.business_hours, "");
});

test("paid order initialization re-enables canonical tracked items with persisted false defaults", async () => {
  const { base44, entities } = createFakeBase44({
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        service_key: "instant_lead_response",
        tracking_enabled: false,
        status: "pending",
      },
      {
        product_id: "prod_UNi5QL0bQl98If",
        product_name: "Missed Call Text-Back",
        service_key: "missed_call_text_back",
        tracking_enabled: false,
        status: "pending",
      },
    ],
  });
  const order = await entities.Order.get("order_1");

  const result = await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_false_defaults",
    now: "2026-04-22T12:05:00.000Z",
  });

  assert.equal(result.order.pipeline_status, "Ready for Install");
  assert.deepEqual(
    result.order.items.map((item) => [item.service_key, item.tracking_enabled, item.install_status]),
    [
      ["instant_lead_response", true, "Ready for Install"],
      ["missed_call_text_back", true, "Ready for Install"],
    ]
  );
});

test("purchase onboarding handoff detects pro package and first missing intake field", () => {
  const order = {
    business_name: "Signal Med Spa",
    customer_name: "Jamie Owner",
    customer_email: "owner@example.com",
    customer_phone: "+16025550123",
    items: [
      buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response"),
      buildTrackedItem("prod_UNi5QL0bQl98If", "Missed Call Text-Back"),
      buildTrackedItem("prod_UNi5N0l5MtaV0R", "14-Day Nurture Sequence"),
      buildTrackedItem("prod_UNi5fLL2SyJJdP", "AI Booking Agent"),
      buildTrackedItem("prod_UNi5PWv05ECzXI", "Old Lead Reactivation"),
      buildTrackedItem("prod_UNi5dvOUm6Fi9i", "Review Request Automation"),
    ],
  };
  const normalizedOrder = {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      ...(
        item.product_id === "prod_UNi5RHiKNSTfQl"
          ? { service_key: "instant_lead_response", tracking_enabled: true }
          : item.product_id === "prod_UNi5QL0bQl98If"
          ? { service_key: "missed_call_text_back", tracking_enabled: true }
          : item.product_id === "prod_UNi5N0l5MtaV0R"
          ? { service_key: "nurture_sequence_14d", tracking_enabled: true }
          : item.product_id === "prod_UNi5fLL2SyJJdP"
          ? { service_key: "ai_booking_agent", tracking_enabled: true }
          : item.product_id === "prod_UNi5PWv05ECzXI"
          ? { service_key: "lead_reactivation", tracking_enabled: true }
          : { service_key: "review_request", tracking_enabled: true }
      ),
    })),
  };

  const handoff = buildPurchaseOnboardingHandoff({ order: normalizedOrder });

  assert.equal(handoff.package_tier, "pro");
  assert.equal(handoff.package_key, "pro_system");
  assert.equal(handoff.service_keys.length, 6);
  assert.equal(handoff.next_missing_field, "business_hours");
  assert.equal(handoff.next_question, "What are the client's normal business hours?");
});

test("pipeline_status rollups are deterministic across mixed service states", () => {
  assert.equal(
    derivePipelineStatus(buildTrackedOrder(["Ready for Install", "Configuring"])),
    "Configuring"
  );
  assert.equal(
    derivePipelineStatus(buildTrackedOrder(["Testing", "Live"])),
    "Testing"
  );
  assert.equal(
    derivePipelineStatus(buildTrackedOrder(["Live", "Error"])),
    "Error"
  );
  assert.equal(
    derivePipelineStatus(buildTrackedOrder(["Live", "Ready for Install"])),
    "Configuring"
  );
  assert.equal(
    derivePipelineStatus(buildTrackedOrder(["Live", "Live"])),
    "Live"
  );
});

test("pipeline_status fails closed when payment is pending, failed, null, or missing", () => {
  const unsafePaymentStatuses = ["pending", "failed", null, undefined];
  const trackedLiveItems = [
    {
      product_id: "prod_UNi5RHiKNSTfQl",
      product_name: "Instant Lead Response",
      service_key: "instant_lead_response",
      tracking_enabled: true,
      install_status: "Live",
      status: "live",
    },
  ];

  for (const payment_status of unsafePaymentStatuses) {
    const order = {
      payment_status,
      install_initialized_at: "2026-04-22T12:05:00.000Z",
      items: trackedLiveItems,
    };

    assert.equal(derivePipelineStatus(order), "Pending Payment");
    assert.equal(
      mapPipelineStatusToOrderStatus({
        pipelineStatus: "Live",
        trackedItems: trackedLiveItems,
        paymentStatus: payment_status,
      }),
      "pending_payment"
    );
  }
});

test("duplicate paid-order initialization is idempotent for records and audit events", async () => {
  const { base44, entities } = createFakeBase44();
  const firstOrder = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order: firstOrder,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  const countsAfterFirstRun = {
    clients: entities.Client.records.length,
    projects: entities.ClientProject.records.length,
    onboarding: entities.OnboardingClient.records.length,
    events: entities.CommunicationEvent.records.length,
  };

  const secondOrder = await entities.Order.get("order_1");
  const secondResult = await initializePaidOrderInstallPipeline({
    base44,
    order: secondOrder,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:10:00.000Z",
  });

  assert.equal(secondResult.order.install_initialized_at, "2026-04-22T12:05:00.000Z");
  assert.deepEqual(
    {
      clients: entities.Client.records.length,
      projects: entities.ClientProject.records.length,
      onboarding: entities.OnboardingClient.records.length,
      events: entities.CommunicationEvent.records.length,
    },
    countsAfterFirstRun
  );
});

test("paid order initialization safely reuses and backfills a single exact legacy match", async () => {
  const { base44, entities } = createFakeBase44WithState({
    clients: [
      {
        id: "client_legacy",
        email: "owner@example.com",
        full_name: "Jamie Owner",
        business_name: "Signal Med Spa",
        phone: "+16025550123",
        status: "Onboarding",
      },
    ],
    clientProjects: [
      {
        id: "project_legacy",
        client_email: "owner@example.com",
        client_name: "Jamie Owner",
        business_name: "Signal Med Spa",
        step_onboarding: "pending",
      },
    ],
    onboardingClients: [
      {
        id: "onboarding_legacy",
        email: "owner@example.com",
        owner_name: "Jamie Owner",
        business_name: "Signal Med Spa",
        phone: "+16025550123",
      },
    ],
  });
  const order = await entities.Order.get("order_1");

  const result = await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  assert.equal(result.client.id, "client_legacy");
  assert.equal(result.clientProject.id, "project_legacy");
  assert.equal(result.onboardingClient.id, "onboarding_legacy");
  assert.equal((await entities.ClientProject.get("project_legacy")).client_id, "client_legacy");
  assert.equal((await entities.OnboardingClient.get("onboarding_legacy")).client_id, "client_legacy");
  assert.equal((await entities.OnboardingClient.get("onboarding_legacy")).client_project_id, "project_legacy");
  assert.equal((await entities.OnboardingClient.get("onboarding_legacy")).order_id, "order_1");
  assert.equal(entities.Client.records.length, 1);
  assert.equal(entities.ClientProject.records.length, 1);
  assert.equal(entities.OnboardingClient.records.length, 1);
});

test("paid order initialization fails closed when heuristic linking is ambiguous", async () => {
  const { base44, entities } = createFakeBase44WithState({
    clients: [
      {
        id: "client_1",
        email: "owner@example.com",
        full_name: "Jamie Owner",
        business_name: "Signal Med Spa",
      },
      {
        id: "client_2",
        email: "owner@example.com",
        full_name: "Jamie Owner Duplicate",
        business_name: "Signal Med Spa",
      },
    ],
  });
  const order = await entities.Order.get("order_1");

  await assert.rejects(
    initializePaidOrderInstallPipeline({
      base44,
      order,
      stripeCustomerId: "cus_123",
      now: "2026-04-22T12:05:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallLinkingError);
      assert.equal(error.code, "install_linking_client_ambiguous");
      return true;
    }
  );

  const updatedOrder = await entities.Order.get("order_1");
  assert.equal(updatedOrder.payment_status, "paid");
  assert.equal(updatedOrder.pipeline_status, "Paid");
  assert.match(updatedOrder.pipeline_error, /Multiple client records match paid order/);
  assert.equal(updatedOrder.client_id, undefined);
  assert.equal(entities.ClientProject.records.length, 0);
  assert.equal(entities.OnboardingClient.records.length, 0);
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.event_type === "workflow_triggered" &&
        event.status === "failed" &&
        event.order_id === "order_1"
    )
  );
});

test("mirror records resync from order truth instead of preserving drift", async () => {
  const { base44, entities } = createFakeBase44();
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: buildCompleteConfigPatch(),
    note: "Ops completed base SMS configuration",
    now: "2026-04-22T12:08:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Testing",
    now: "2026-04-22T12:12:00.000Z",
  });
  await recordSuccessfulRuntimeTest(base44, currentOrder, "instant_lead_response");
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Live",
    now: "2026-04-22T12:14:00.000Z",
  });

  await entities.ClientProject.update(currentOrder.client_project_id, {
    step_sms: "pending",
    step_live: "pending",
  });
  await entities.OnboardingClient.update(currentOrder.onboarding_client_id, {
    twilio_number: "+15555550000",
    step_twilio: false,
    step_messages_customized: false,
    step_instant_response: false,
  });

  await syncInstallMirrorsFromOrder({
    base44,
    order: currentOrder,
    now: "2026-04-22T12:20:00.000Z",
  });

  const syncedProject = await entities.ClientProject.get(currentOrder.client_project_id);
  const syncedOnboarding = await entities.OnboardingClient.get(currentOrder.onboarding_client_id);

  assert.equal(syncedProject.step_sms, "in_progress");
  assert.equal(syncedProject.step_live, "in_progress");
  assert.equal(syncedOnboarding.twilio_number, "+16025550999");
  assert.equal(syncedOnboarding.step_twilio, true);
  assert.equal(syncedOnboarding.step_messages_customized, true);
  assert.equal(syncedOnboarding.step_instant_response, true);
  assert.equal(syncedOnboarding.step_missed_call, false);
});

test("required configuration blocks invalid transitions and logs the blocked attempt", async () => {
  const { base44, entities } = createFakeBase44();
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "instant_lead_response",
      nextStatus: "Testing",
      now: "2026-04-22T12:12:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.equal(error.code, "install_transition_blocked");
      assert.ok(error.details?.blocked_event_id);
      return true;
    }
  );

  const unchangedOrder = await entities.Order.get("order_1");
  assert.equal(
    unchangedOrder.items.find((item) => item.service_key === "instant_lead_response").install_status,
    "Configuring"
  );

  const blockedEvent = entities.CommunicationEvent.records.find(
    (event) => event.event_type === "service_transition_blocked"
  );
  assert.ok(blockedEvent);
  const metadata = getEventMetadata(blockedEvent);
  assert.equal(blockedEvent.service_key, "instant_lead_response");
  assert.equal(metadata.requested_status, "Testing");
  assert.ok(metadata.validation.missing_fields.includes("shared.twilio_business_phone"));
  assert.ok(metadata.validation.missing_fields.includes("services.instant_lead_response.sms_template"));
});

test("config-backed transitions stay per-service and successful updates are logged", async () => {
  const { base44, entities } = createFakeBase44();
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: buildCompleteConfigPatch({ includeInstant: true, includeMissed: false }),
    note: "Instant Lead Response config completed first",
    now: "2026-04-22T12:08:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Testing",
    note: "Twilio number mapped and ready for QA",
    now: "2026-04-22T12:12:00.000Z",
  });
  await recordSuccessfulRuntimeTest(base44, currentOrder, "instant_lead_response");
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Live",
    note: "QA passed",
    now: "2026-04-22T12:14:00.000Z",
  });

  const queue = await listInstallQueueOrders(base44);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].pipeline_status, "Configuring");

  const instantService = queue[0].trackedItems.find((item) => item.service_key === "instant_lead_response");
  const missedService = queue[0].trackedItems.find((item) => item.service_key === "missed_call_text_back");

  assert.equal(instantService.install_status, "Live");
  assert.equal(instantService.configuration_complete, true);
  assert.equal(missedService.install_status, "Ready for Install");
  assert.equal(missedService.configuration_complete, false);
  assert.ok(missedService.missing_configuration_fields.includes("services.missed_call_text_back.sms_template"));

  const eventTypes = entities.CommunicationEvent.records.map((event) => event.event_type);
  assert.ok(eventTypes.includes("service_configuration_updated"));
  assert.ok(eventTypes.includes("service_status_changed"));
  assert.ok(eventTypes.includes("status_update"));
});

test("live transition stays blocked until a successful remote test exists", async () => {
  const { base44, entities } = createFakeBase44();
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: buildCompleteConfigPatch({ includeInstant: true, includeMissed: false }),
    note: "Instant Lead Response config completed first",
    now: "2026-04-22T12:08:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Testing",
    now: "2026-04-22T12:12:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "instant_lead_response",
      nextStatus: "Live",
      now: "2026-04-22T12:14:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("service_test.successful_runtime"));
      return true;
    }
  );

  await recordSuccessfulRuntimeTest(base44, currentOrder, "instant_lead_response");

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Live",
    now: "2026-04-22T12:16:00.000Z",
  });

  assert.equal(
    currentOrder.items.find((item) => item.service_key === "instant_lead_response").install_status,
    "Live"
  );
});

test("booking agent config validation blocks Testing until canonical booking config is complete", async () => {
  const { base44, entities } = createFakeBase44({
    items: [
      buildTrackedItem("prod_UNi5fLL2SyJJdP", "AI Booking Agent"),
    ],
  });
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "ai_booking_agent",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "ai_booking_agent",
      nextStatus: "Testing",
      now: "2026-04-22T12:12:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("services.ai_booking_agent.booking_link"));
      assert.ok(error.details?.validation?.missing_fields?.includes("services.ai_booking_agent.booking_mode"));
      assert.ok(error.details?.validation?.missing_fields?.includes("services.ai_booking_agent.intake_fields"));
      return true;
    }
  );
});

test("booking agent Live stays blocked until a successful booking-agent test exists", async () => {
  const { base44, entities } = createFakeBase44({
    items: [
      buildTrackedItem("prod_UNi5fLL2SyJJdP", "AI Booking Agent"),
    ],
  });
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: {
      services: {
        ai_booking_agent: {
          booking_link: "https://calendar.example.com/signal-med-spa",
          booking_mode: "external_link",
          business_hours: "Mon-Fri 8am-5pm",
          confirmation_template: "Thanks {{first_name}}. Book here: {{booking_link}}",
          reminder_enabled: true,
          reminder_template: "Reminder: {{scheduled_at}} is reserved here {{booking_link}}",
          intake_fields: ["lead_name", "lead_email"],
        },
      },
    },
    now: "2026-04-22T12:08:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "ai_booking_agent",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "ai_booking_agent",
    nextStatus: "Testing",
    now: "2026-04-22T12:12:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "ai_booking_agent",
      nextStatus: "Live",
      now: "2026-04-22T12:14:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("service_test.successful_runtime"));
      return true;
    }
  );

  await executeBookingSimulation({
    base44,
    order: currentOrder,
    leadName: "Booking Proof Lead",
    leadEmail: "proof@example.com",
    leadPhone: "+16025550088",
    scheduledAt: "2026-04-23T17:00:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "ai_booking_agent",
    nextStatus: "Live",
    now: "2026-04-22T12:16:00.000Z",
  });

  assert.equal(
    currentOrder.items.find((item) => item.service_key === "ai_booking_agent").install_status,
    "Live"
  );
});

test("lead reactivation config validation blocks Testing until canonical reactivation config is complete", async () => {
  const { base44, entities } = createFakeBase44(buildLeadReactivationOrderOverride());
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "lead_reactivation",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "lead_reactivation",
      nextStatus: "Testing",
      now: "2026-04-22T12:12:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("services.lead_reactivation.target_segment"));
      assert.ok(error.details?.validation?.missing_fields?.includes("services.lead_reactivation.message_template"));
      return true;
    }
  );
});

test("lead reactivation Live stays blocked until a successful reactivation test exists", async () => {
  const { base44, entities } = createFakeBase44(buildLeadReactivationOrderOverride());
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: {
      services: {
        lead_reactivation: {
          target_segment: "all_dormant",
          message_template: "Hi {{first_name}}, this is {{business_name}} checking in.",
          max_batch_size: 25,
        },
      },
    },
    now: "2026-04-22T12:08:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "lead_reactivation",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "lead_reactivation",
    nextStatus: "Testing",
    now: "2026-04-22T12:12:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "lead_reactivation",
      nextStatus: "Live",
      now: "2026-04-22T12:14:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("service_test.successful_runtime"));
      return true;
    }
  );

  await executeLeadReactivationTest({
    base44,
    order: currentOrder,
    maxTestLeads: 3,
    now: "2026-04-22T12:15:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "lead_reactivation",
    nextStatus: "Live",
    now: "2026-04-22T12:16:00.000Z",
  });

  assert.equal(
    currentOrder.items.find((item) => item.service_key === "lead_reactivation").install_status,
    "Live"
  );
});

test("review request config validation blocks Testing until canonical review-request config is complete", async () => {
  const { base44, entities } = createFakeBase44(buildReviewRequestOrderOverride());
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "review_request",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "review_request",
      nextStatus: "Testing",
      now: "2026-04-22T12:12:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("services.review_request.review_link"));
      assert.ok(error.details?.validation?.missing_fields?.includes("services.review_request.trigger_event"));
      assert.ok(error.details?.validation?.missing_fields?.includes("services.review_request.message_template"));
      assert.ok(error.details?.validation?.missing_fields?.includes("services.review_request.channel"));
      return true;
    }
  );
});

test("review request Live stays blocked until a successful review-request test exists", async () => {
  const { base44, entities } = createFakeBase44(buildReviewRequestOrderOverride());
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: {
      services: {
        review_request: {
          review_link: "https://reviews.example.com/signal-med-spa",
          trigger_event: "manual_trigger",
          message_template: "Hi {{first_name}}, review us here: {{review_link}}",
          channel: "email",
          send_delay_minutes: 15,
          fallback_internal_feedback_enabled: true,
        },
      },
    },
    now: "2026-04-22T12:08:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "review_request",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "review_request",
    nextStatus: "Testing",
    now: "2026-04-22T12:12:00.000Z",
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "review_request",
      nextStatus: "Live",
      now: "2026-04-22T12:14:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("service_test.successful_runtime"));
      return true;
    }
  );

  await executeReviewRequestTest({
    base44,
    order: currentOrder,
    recipientEmail: "reviewer@example.com",
    customerName: "Proof Customer",
    triggerEvent: "manual_trigger",
    now: "2026-04-22T12:15:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "review_request",
    nextStatus: "Live",
    now: "2026-04-22T12:16:00.000Z",
  });

  assert.equal(
    currentOrder.items.find((item) => item.service_key === "review_request").install_status,
    "Live"
  );
});

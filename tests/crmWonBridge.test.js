import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  bridgeCrmWonToPayment,
  buildWonPendingPaymentPatch,
  resolvePaidOrderForLead,
} from "../base44/functions/_shared/crmWonBridge.js";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
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
      created_date: data.created_date || "2026-06-06T12:00:00.000Z",
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
    this.records[index] = { ...this.records[index], ...patch, id };
    return { ...this.records[index] };
  }
}

function createFakeBase44({ leads = [], orders = [], events = [] } = {}) {
  const entities = {
    Leads: new InMemoryCollection(leads),
    Order: new InMemoryCollection(orders),
    Client: new InMemoryCollection(),
    ClientProject: new InMemoryCollection(),
    OnboardingClient: new InMemoryCollection(),
    CommunicationEvent: new InMemoryCollection(events),
  };

  return {
    entities,
    base44: {
      asServiceRole: {
        entities,
        functions: {
          async invoke() {
            return { success: true };
          },
        },
      },
    },
  };
}

const lead = {
  id: "lead_1",
  full_name: "Jamie Owner",
  business_name: "Signal Med Spa",
  email: "owner@example.com",
  phone: "+16025550123",
  status: "Qualified",
  crm_stage: "Proposal Sent",
};

test("CRM Won patch blocks onboarding when no paid or manual-paid order exists", async () => {
  const { base44 } = createFakeBase44({ leads: [lead] });

  const result = await buildWonPendingPaymentPatch({
    base44,
    lead,
    note: "Ready to close",
    now: "2026-06-06T12:00:00.000Z",
  });

  assert.equal(result.blocked, true);
  assert.equal(result.paidOrder, null);
  assert.equal(result.patch.crm_stage, "Won Pending Payment");
  assert.equal(result.patch.payment_source, "order_required");
  assert.equal(result.patch.onboarding_blocked_reason, "won_pending_payment_order_required");
});

test("CRM Won bridge keeps invoice-pending leads out of onboarding", async () => {
  const { base44, entities } = createFakeBase44({ leads: [lead] });

  const result = await bridgeCrmWonToPayment({
    base44,
    lead,
    package_key: "growth_system",
    payment_source: "invoice_pending",
    note: "Invoice will be sent",
    now: "2026-06-06T12:00:00.000Z",
  });

  assert.equal(result.success, true);
  assert.equal(result.status, "won_pending_payment");
  assert.equal(result.onboarding_blocked, true);
  assert.equal(entities.Order.records.length, 0);
  assert.equal(entities.OnboardingClient.records.length, 0);

  const updatedLead = await entities.Leads.get("lead_1");
  assert.equal(updatedLead.crm_stage, "Won Pending Payment");
  assert.equal(updatedLead.payment_source, "invoice_pending");
  assert.equal(updatedLead.onboarding_blocked_reason, "won_pending_payment_order_required");
});

test("CRM Won can resolve an existing paid order without creating duplicate onboarding", async () => {
  const { base44 } = createFakeBase44({
    leads: [lead],
    orders: [
      {
        id: "order_paid_1",
        customer_email: "owner@example.com",
        business_name: "Signal Med Spa",
        payment_status: "paid",
        payment_source: "stripe",
      },
    ],
  });

  const paidOrder = await resolvePaidOrderForLead(base44, lead);

  assert.equal(paidOrder.id, "order_paid_1");
});

test("runtime entrypoints route through paid-order guards", () => {
  const attachEntry = fs.readFileSync("base44/functions/attachAdminOnboardingOrder/entry.ts", "utf8");
  const installPipelineEntry = fs.readFileSync("base44/functions/installPipeline/entry.ts", "utf8");
  const crmWonBridgeEntry = fs.readFileSync("base44/functions/crmWonBridge/entry.ts", "utf8");

  assert.match(attachEntry, /attachAdminOnboardingToOrder/);
  assert.match(attachEntry, /requireAdminUser/);
  assert.doesNotMatch(attachEntry, /onboarding_client_id && order_id/);
  assert.match(installPipelineEntry, /install_pipeline_requires_paid_order/);
  assert.match(crmWonBridgeEntry, /bridgeCrmWonToPayment/);
});

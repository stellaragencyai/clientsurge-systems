import test from "node:test";
import assert from "node:assert/strict";

import { resolveClientPortalAccess } from "../base44/functions/_shared/portalOwnership.js";

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

function createFakeBase44({
  clients = [],
  projects = [],
  orders = [],
} = {}) {
  const entities = {
    Client: new InMemoryCollection(clients),
    ClientProject: new InMemoryCollection(projects),
    Order: new InMemoryCollection(orders),
  };

  return {
    entities,
    base44: {
      asServiceRole: {
        entities,
      },
    },
  };
}

test("portal resolves canonically linked project from a paid order", async () => {
  const { base44 } = createFakeBase44({
    clients: [
      {
        id: "client_1",
        email: "owner@example.com",
        business_name: "Signal Med Spa",
      },
    ],
    projects: [
      {
        id: "project_1",
        client_id: "client_1",
        client_email: "owner@example.com",
        business_name: "Signal Med Spa",
      },
    ],
    orders: [
      {
        id: "order_1",
        customer_email: "owner@example.com",
        payment_status: "paid",
        client_id: "client_1",
        client_project_id: "project_1",
        created_date: "2026-04-22T12:00:00.000Z",
      },
    ],
  });

  const resolution = await resolveClientPortalAccess({
    base44,
    userEmail: "owner@example.com",
  });

  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.resolution_type, "linked_paid_order");
  assert.equal(resolution.project.id, "project_1");
  assert.equal(resolution.order.id, "order_1");
});

test("portal fails closed when multiple paid orders point to different projects", async () => {
  const { base44 } = createFakeBase44({
    projects: [
      {
        id: "project_1",
        client_email: "owner@example.com",
        business_name: "Signal Med Spa",
      },
      {
        id: "project_2",
        client_email: "owner@example.com",
        business_name: "Second Business",
      },
    ],
    orders: [
      {
        id: "order_1",
        customer_email: "owner@example.com",
        payment_status: "paid",
        client_project_id: "project_1",
        created_date: "2026-04-22T12:00:00.000Z",
      },
      {
        id: "order_2",
        customer_email: "owner@example.com",
        payment_status: "paid",
        client_project_id: "project_2",
        created_date: "2026-04-23T12:00:00.000Z",
      },
    ],
  });

  const resolution = await resolveClientPortalAccess({
    base44,
    userEmail: "owner@example.com",
  });

  assert.equal(resolution.status, "ambiguous");
  assert.equal(resolution.code, "portal_project_ambiguous");
});

test("portal safely backfills client_id for a single legacy email-only project", async () => {
  const { base44, entities } = createFakeBase44({
    clients: [
      {
        id: "client_1",
        email: "owner@example.com",
        business_name: "Signal Med Spa",
      },
    ],
    projects: [
      {
        id: "project_legacy",
        client_email: "owner@example.com",
        business_name: "Signal Med Spa",
      },
    ],
  });

  const resolution = await resolveClientPortalAccess({
    base44,
    userEmail: "owner@example.com",
  });

  assert.equal(resolution.status, "resolved");
  assert.equal(resolution.resolution_type, "legacy_email_backfilled");
  assert.equal(resolution.project.id, "project_legacy");
  assert.equal((await entities.ClientProject.get("project_legacy")).client_id, "client_1");
});

test("portal returns not_found instead of inventing a project", async () => {
  const { base44 } = createFakeBase44();

  const resolution = await resolveClientPortalAccess({
    base44,
    userEmail: "missing@example.com",
  });

  assert.equal(resolution.status, "not_found");
  assert.equal(resolution.code, "portal_project_not_found");
});

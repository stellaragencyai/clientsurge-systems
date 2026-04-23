import test from "node:test";
import assert from "node:assert/strict";

import {
  OnboardingMirrorMutationError,
  updateAdminOnboardingChecklistStep,
} from "../base44/functions/_shared/onboardingMirrorControls.js";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
  }

  async get(id) {
    const record = this.records.find((entry) => entry.id === id);
    if (!record) {
      return null;
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

function createFakeBase44({ onboardingClients = [], events = [] } = {}) {
  const entities = {
    OnboardingClient: new InMemoryCollection(onboardingClients),
    CommunicationEvent: new InMemoryCollection(events),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
    },
  };
}

test("manual onboarding checklist steps remain editable and log canonical context", async () => {
  const { base44, entities } = createFakeBase44({
    onboardingClients: [
      {
        id: "onboarding_1",
        business_name: "Signal Med Spa",
        order_id: "order_1",
        client_id: "client_1",
        client_project_id: "project_1",
        step_lead_sources: false,
      },
    ],
  });

  const updated = await updateAdminOnboardingChecklistStep({
    base44,
    onboardingClientId: "onboarding_1",
    stepKey: "step_lead_sources",
    value: true,
  });

  assert.equal(updated.step_lead_sources, true);
  assert.equal(entities.CommunicationEvent.records.length, 1);
  assert.equal(
    entities.CommunicationEvent.records[0].event_type,
    "workflow_triggered"
  );
  assert.equal(entities.CommunicationEvent.records[0].order_id, "order_1");
});

test("derived onboarding checklist steps are blocked from direct mutation", async () => {
  const { base44 } = createFakeBase44({
    onboardingClients: [
      {
        id: "onboarding_1",
        business_name: "Signal Med Spa",
        step_instant_response: false,
      },
    ],
  });

  await assert.rejects(
    updateAdminOnboardingChecklistStep({
      base44,
      onboardingClientId: "onboarding_1",
      stepKey: "step_instant_response",
      value: true,
    }),
    (error) => {
      assert.ok(error instanceof OnboardingMirrorMutationError);
      assert.equal(error.code, "onboarding_mirror_step_derived");
      return true;
    }
  );
});

test("unsupported onboarding checklist keys fail closed", async () => {
  const { base44 } = createFakeBase44({
    onboardingClients: [
      {
        id: "onboarding_1",
      },
    ],
  });

  await assert.rejects(
    updateAdminOnboardingChecklistStep({
      base44,
      onboardingClientId: "onboarding_1",
      stepKey: "status",
      value: true,
    }),
    (error) => {
      assert.ok(error instanceof OnboardingMirrorMutationError);
      assert.equal(error.code, "onboarding_mirror_step_unsupported");
      return true;
    }
  );
});

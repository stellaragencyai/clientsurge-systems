import test from "node:test";
import assert from "node:assert/strict";

import {
  applyLeadImport,
  buildLeadPipelineSnapshot,
  enrichLeadForPipeline,
  LEAD_PIPELINE_MAX_FETCH,
  listLeadReactivationTargets,
  prepareLeadImport,
} from "../base44/functions/_shared/leadPipeline.js";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
  }

  async list() {
    return [...this.records];
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
    const index = this.records.findIndex((record) => record.id === id);
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

  async get(id) {
    const record = this.records.find((entry) => entry.id === id);
    if (!record) {
      throw new Error(`Record ${id} not found`);
    }
    return { ...record };
  }
}

function createFakeBase44(leads = []) {
  const entities = {
    Leads: new InMemoryCollection(leads),
    CommunicationEvent: new InMemoryCollection([]),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
    },
  };
}

test("prepareLeadImport normalizes rows and safely distinguishes create, update, and ambiguous matches", async () => {
  const existingLeads = [
    {
      id: "lead_1",
      created_date: "2026-04-01T00:00:00.000Z",
      full_name: "Alex Existing",
      business_name: "Signal Med Spa",
      email: "alex@example.com",
      phone: "+16025550001",
      business_type: "med_spa",
      problem: "Need more bookings",
      status: "Contacted",
    },
    {
      id: "lead_2",
      created_date: "2026-04-02T00:00:00.000Z",
      full_name: "Jordan Existing",
      business_name: "Signal Med Spa",
      email: "jordan@example.com",
      phone: "+16025550002",
      business_type: "med_spa",
      problem: "Need follow-up",
      status: "Qualified",
    },
  ];

  const preview = prepareLeadImport({
    existingLeads,
    rows: [
      {
        full_name: "Alex Existing",
        business_name: "Signal Med Spa",
        email: "ALEX@example.com",
        phone: "(602) 555-0001",
        status: "qualified",
      },
      {
        full_name: "Taylor New",
        business_name: "Glow Dental",
        email: "taylor@example.com",
        phone: "602-555-0003",
      },
      {
        full_name: "Conflict Lead",
        business_name: "Signal Med Spa",
        email: "jordan@example.com",
        phone: "602-555-0001",
      },
    ],
    importSource: "migration_batch",
    now: "2026-04-22T12:00:00.000Z",
  });

  assert.equal(preview.counts.updates, 1);
  assert.equal(preview.counts.creates, 1);
  assert.equal(preview.counts.ambiguous, 1);
  assert.equal(preview.actions[0].action, "update");
  assert.equal(preview.actions[1].action, "create");
  assert.equal(preview.actions[2].action, "ambiguous");
  assert.equal(preview.actions[1].normalized_lead.normalized_phone, "+16025550003");
});

test("buildLeadPipelineSnapshot derives canonical actionability counts and filtered pages", async () => {
  const snapshot = buildLeadPipelineSnapshot({
    leads: [
      {
        id: "lead_1",
        created_date: "2026-03-01T00:00:00.000Z",
        full_name: "Dormant Qualified",
        business_name: "Signal Med Spa",
        email: "qualified@example.com",
        phone: "+16025550001",
        business_type: "med_spa",
        problem: "Need bookings",
        status: "Qualified",
        lead_score: 90,
        last_contacted_at: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "lead_2",
        created_date: "2026-04-20T00:00:00.000Z",
        full_name: "Fresh New",
        business_name: "Signal Med Spa",
        email: "new@example.com",
        phone: "+16025550002",
        business_type: "med_spa",
        problem: "Need speed",
        status: "New",
        lead_score: 55,
      },
      {
        id: "lead_3",
        created_date: "2026-04-05T00:00:00.000Z",
        full_name: "Follow Up",
        business_name: "Signal Med Spa",
        email: "follow@example.com",
        phone: "+16025550003",
        business_type: "med_spa",
        problem: "Need follow-up",
        status: "Contacted",
        lead_score: 30,
        next_follow_up_at: "2026-04-10T00:00:00.000Z",
      },
    ],
    events: [],
    filters: { segment: "follow_up" },
    limit: 10,
    offset: 0,
    now: "2026-04-22T12:00:00.000Z",
  });

  assert.equal(snapshot.summary.total_leads, 3);
  assert.equal(snapshot.summary.segment_counts.reactivation, 1);
  assert.equal(snapshot.summary.segment_counts.follow_up, 3);
  assert.equal(snapshot.summary.segment_counts.qualification, 0);
  assert.equal(snapshot.pagination.total_filtered, 3);
  assert.equal(snapshot.leads.length, 3);
  assert.equal(Array.isArray(snapshot.summary.priority_queue), true);
  assert.equal(snapshot.summary.priority_queue[0].next_action.label, "Follow up now");
  assert.equal(snapshot.summary.priority_queue[0].recommended_offer.primary_service_key, "lead_reactivation");
});

test("enrichLeadForPipeline derives advisory recommended offer, demo stage, and next action from canonical lead context", async () => {
  const enriched = enrichLeadForPipeline(
    {
      id: "lead_demo",
      created_date: "2026-04-10T00:00:00.000Z",
      full_name: "Demo Lead",
      business_name: "Signal Med Spa",
      email: "demo@example.com",
      phone: "+16025550010",
      business_type: "med_spa",
      problem: "Need more consults",
      source: "website",
      intake_type: "demo_booking",
      status: "Contacted",
      lead_score: 84,
      ai_intent: "booking_ready",
      next_follow_up_at: "2026-04-21T00:00:00.000Z",
    },
    "2026-04-22T12:00:00.000Z"
  );

  assert.equal(enriched.demo_stage, "requested");
  assert.equal(enriched.outreach_status.code, "follow_up_due");
  assert.equal(enriched.next_action.code, "work_demo_request");
  assert.equal(enriched.recommended_offer.primary_service_key, "ai_booking_agent");
  assert.equal(enriched.recommended_offer.package_key, "growth_system");
  assert.equal(enriched.activation_priority_score > 0, true);
  assert.equal(["Hot", "High", "Medium", "Low"].includes(enriched.activation_priority), true);
});

test("buildLeadPipelineSnapshot counts demo-stage leads and recommended package mix without fake pipeline math", async () => {
  const snapshot = buildLeadPipelineSnapshot({
    leads: [
      {
        id: "lead_demo_requested",
        created_date: "2026-04-15T00:00:00.000Z",
        full_name: "Requested Demo",
        business_name: "Signal Med Spa",
        email: "requested@example.com",
        phone: "+16025550011",
        business_type: "med_spa",
        problem: "Need a demo",
        source: "website",
        intake_type: "demo_booking",
        status: "Contacted",
        lead_score: 80,
        ai_intent: "booking_ready",
      },
      {
        id: "lead_demo_booked",
        created_date: "2026-04-10T00:00:00.000Z",
        full_name: "Booked Demo",
        business_name: "Signal Med Spa",
        email: "booked@example.com",
        phone: "+16025550012",
        business_type: "med_spa",
        problem: "Need to close",
        source: "website",
        intake_type: "demo_booking",
        status: "Booked",
        lead_score: 72,
        booked_at: "2026-04-20T00:00:00.000Z",
      },
    ],
    events: [],
    filters: {},
    limit: 10,
    offset: 0,
    now: "2026-04-22T12:00:00.000Z",
  });

  assert.equal(snapshot.summary.segment_counts.demo_requested, 1);
  assert.equal(snapshot.summary.segment_counts.awaiting_close, 1);
  assert.equal(snapshot.summary.recommended_offer_counts.starter_system, 1);
  assert.equal(snapshot.summary.recommended_offer_counts.growth_system, 1);
});

test("applyLeadImport writes canonical Leads records and logs one import summary event", async () => {
  const { base44, entities } = createFakeBase44([
    {
      id: "lead_existing",
      created_date: "2026-04-01T00:00:00.000Z",
      full_name: "Alex Existing",
      business_name: "Signal Med Spa",
      email: "alex@example.com",
      phone: "+16025550001",
      business_type: "med_spa",
      problem: "Need bookings",
      status: "Contacted",
    },
  ]);

  const result = await applyLeadImport({
    base44,
    rows: [
      {
        full_name: "Alex Existing",
        business_name: "Signal Med Spa",
        email: "alex@example.com",
        phone: "+16025550001",
        status: "Qualified",
      },
      {
        full_name: "Taylor New",
        business_name: "Glow Dental",
        email: "taylor@example.com",
        phone: "6025550002",
      },
    ],
    importSource: "manual_import",
    now: "2026-04-22T12:00:00.000Z",
  });

  assert.equal(result.counts.creates, 1);
  assert.equal(result.counts.updates, 1);
  assert.equal(result.import_event_id.startsWith("rec_"), true);
  assert.equal((await entities.Leads.list()).length, 2);
  assert.equal((await entities.CommunicationEvent.list()).length, 1);
});

test("listLeadReactivationTargets reuses canonical dormant-segment rules against Leads", async () => {
  const { base44 } = createFakeBase44([
    {
      id: "lead_1",
      created_date: "2026-02-01T00:00:00.000Z",
      full_name: "Dormant One",
      business_name: "Signal Med Spa",
      email: "one@example.com",
      phone: "+16025550001",
      business_type: "med_spa",
      problem: "Need bookings",
      status: "Qualified",
      last_contacted_at: "2026-02-15T00:00:00.000Z",
    },
    {
      id: "lead_2",
      created_date: "2026-04-15T00:00:00.000Z",
      full_name: "Fresh One",
      business_name: "Signal Med Spa",
      email: "two@example.com",
      phone: "+16025550002",
      business_type: "med_spa",
      problem: "Need replies",
      status: "Contacted",
      last_contacted_at: "2026-04-16T00:00:00.000Z",
    },
    {
      id: "lead_3",
      created_date: "2026-02-10T00:00:00.000Z",
      full_name: "Other Business",
      business_name: "Other Spa",
      email: "other@example.com",
      phone: "+16025550003",
      business_type: "med_spa",
      problem: "Need help",
      status: "Qualified",
      last_contacted_at: "2026-02-11T00:00:00.000Z",
    },
  ]);

  const targets = await listLeadReactivationTargets({
    base44,
    order: { business_name: "Signal Med Spa" },
    targetSegment: "qualified_unbooked",
    maxBatchSize: 25,
    now: "2026-04-22T12:00:00.000Z",
  });

  assert.equal(targets.length, 1);
  assert.equal(targets[0].id, "lead_1");
});

test("buildLeadPipelineSnapshot handles a 5000+ lead dashboard page with rich filters and pagination metadata", async () => {
  const leads = Array.from({ length: 5200 }, (_, index) => ({
    id: `lead_scale_${index}`,
    created_date: `2026-04-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
    full_name: `Scale Lead ${index}`,
    business_name: index % 2 === 0 ? "Signal Med Spa" : "Glow Dental",
    email: `scale${index}@example.com`,
    phone: `+1602555${String(index).padStart(4, "0")}`,
    business_type: index % 2 === 0 ? "med_spa" : "dental",
    problem: "Imported scale test lead",
    source: index % 3 === 0 ? "csv_import" : "website",
    intake_type: index % 5 === 0 ? "demo_booking" : "lead_capture",
    status: index % 7 === 0 ? "Booked" : index % 3 === 0 ? "Qualified" : "New",
    lead_score: index % 100,
    activation_priority: index % 11 === 0 ? "Hot" : index % 4 === 0 ? "High" : "Low",
  }));

  const snapshot = buildLeadPipelineSnapshot({
    leads,
    events: [],
    filters: { source: "csv_import", priority: "Hot" },
    limit: 100,
    offset: 100,
    now: "2026-05-01T12:00:00.000Z",
  });

  assert.equal(LEAD_PIPELINE_MAX_FETCH >= 25000, true);
  assert.equal(snapshot.summary.total_leads, 5200);
  assert.equal(snapshot.summary.actionable_leads > 0, true);
  assert.equal(snapshot.pagination.returned, 58);
  assert.equal(snapshot.pagination.offset, 100);
  assert.equal(snapshot.pagination.total_filtered, 158);
  assert.equal(snapshot.pagination.has_more, false);
  assert.equal(snapshot.filter_options.sources.includes("csv_import"), true);
  assert.equal(snapshot.filter_options.stage_groups.includes("booked"), true);
  assert.equal(snapshot.summary.activation_segments.length >= 7, true);
});

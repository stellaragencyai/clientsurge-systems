#!/usr/bin/env node

import { buildAdminLeadRows } from "../src/lib/adminLeadLoadModel.js";

const leadCount = Number.parseInt(process.env.CLIENTSURGE_ADMIN_LOAD_LEADS || "5000", 10);
const budgetMs = Number.parseInt(process.env.CLIENTSURGE_ADMIN_LOAD_BUDGET_MS || "3000", 10);

function buildLead(index) {
  const statuses = ["New", "Contacted", "Qualified", "Booked", "Client"];
  const status = statuses[index % statuses.length];

  return {
    id: `lead-${index}`,
    full_name: `Load Test Lead ${index}`,
    business_name: `Load Test Business ${index}`,
    email: `load-${index}@example.test`,
    phone: `+1555000${String(index).padStart(4, "0")}`,
    status,
    stage_group: status === "Client" ? "closed" : status === "Booked" ? "booked" : "working",
    source: index % 2 === 0 ? "website" : "manual_import",
    intake_type: index % 3 === 0 ? "demo_booking" : "lead_capture",
    lead_score: (index * 7) % 100,
    activation_priority: index % 5 === 0 ? "Hot" : index % 2 === 0 ? "High" : "Medium",
    actionability: index % 4 === 0 ? ["follow_up", "high_value_outreach"] : ["nurture"],
    recommended_offer: {
      package_name: index % 3 === 0 ? "Growth System" : "Starter System",
      primary_service_name: "Instant Lead Response",
      reason: "Fixture lead has enough intent for operator review.",
      angle: "Respond quickly and book the consultation.",
      source_fields: ["status", "lead_score"],
    },
    next_action: {
      label: "Review and follow up",
      detail: "Fixture next action used for admin load verification.",
    },
    outreach_status: {
      label: "Working",
      helper: "Continue structured follow-up.",
    },
    recent_movement: {
      label: "Recent lead activity",
      detail: "Fixture activity for load verification.",
    },
    created_date: new Date(Date.now() - index * 60000).toISOString(),
    updated_date: new Date(Date.now() - index * 30000).toISOString(),
    last_contacted_at: index % 2 === 0 ? new Date().toISOString() : null,
  };
}

const leads = Array.from({ length: leadCount }, (_, index) => buildLead(index + 1));
const started = performance.now();
const sortedByScore = buildAdminLeadRows(leads, { field: "lead_score", direction: "desc" });
const sortedByDate = buildAdminLeadRows(leads, { field: "updated_date", direction: "desc" });
const tableProjection = sortedByScore.map((lead) => ({
  id: lead.id,
  lead: `${lead.full_name} ${lead.business_name}`,
  status: lead.status,
  score: lead.lead_score,
  nextAction: lead.next_action?.label,
  offer: lead.recommended_offer?.package_name,
}));
const elapsedMs = performance.now() - started;

const result = {
  lead_count: leadCount,
  budget_ms: budgetMs,
  row_model_ms: Math.round(elapsedMs),
  top_score: sortedByScore[0]?.lead_score ?? null,
  newest_id: sortedByDate[0]?.id ?? null,
  projected_rows: tableProjection.length,
  pass: elapsedMs < budgetMs && tableProjection.length === leadCount,
};

console.log(JSON.stringify(result, null, 2));

if (!result.pass) {
  process.exitCode = 1;
}

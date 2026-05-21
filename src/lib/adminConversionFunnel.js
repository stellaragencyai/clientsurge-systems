const STATUS_ALIASES = {
  contacted: ["Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed", "Client"],
  booked: ["Booked", "Closed", "Client"],
  paid: ["Client", "Closed"],
};

const STAGE_ALIASES = {
  contacted: ["working", "qualified", "booked", "closed"],
  booked: ["booked", "closed"],
  paid: ["closed"],
};

function sumKeys(source = {}, keys = []) {
  return keys.reduce((total, key) => total + (Number(source[key]) || 0), 0);
}

function resolveStageCount({ stageCounts, statusCounts, statusKey, stageKey }) {
  const stageValue = sumKeys(stageCounts, STAGE_ALIASES[stageKey]);
  const statusValue = sumKeys(statusCounts, STATUS_ALIASES[statusKey]);
  return Math.max(stageValue, statusValue);
}

export function buildAdminConversionFunnel(summary = {}) {
  const statusCounts = summary.status_counts || {};
  const stageCounts = summary.stage_counts || {};
  const total = Number(summary.total_leads) || sumKeys(statusCounts, Object.keys(statusCounts));
  const safeTotal = Math.max(total, 0);

  const stages = [
    {
      key: "lead",
      label: "Lead",
      helper: "Captured in CRM",
      count: safeTotal,
      tone: "blue",
    },
    {
      key: "contacted",
      label: "Contacted",
      helper: "Reached or qualified",
      count: resolveStageCount({ stageCounts, statusCounts, statusKey: "contacted", stageKey: "contacted" }),
      tone: "purple",
    },
    {
      key: "booked",
      label: "Booked",
      helper: "Demo or appointment set",
      count: resolveStageCount({ stageCounts, statusCounts, statusKey: "booked", stageKey: "booked" }),
      tone: "emerald",
    },
    {
      key: "paid",
      label: "Paid",
      helper: "Converted customer",
      count: resolveStageCount({ stageCounts, statusCounts, statusKey: "paid", stageKey: "paid" }),
      tone: "amber",
    },
  ];

  return stages.map((stage) => {
    const percentage = safeTotal > 0 ? Math.round((stage.count / safeTotal) * 100) : 0;
    return {
      ...stage,
      count: Math.max(stage.count, 0),
      percentage: Math.min(Math.max(percentage, 0), 100),
    };
  });
}

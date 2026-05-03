import { base44 } from "@/api/base44Client";

export function getLeadPipelineError(error, fallback) {
  return error?.data?.error || error?.message || fallback;
}

export async function fetchLeadPipelineSummary(filters = {}) {
  const response = await base44.functions.invoke("getLeadPipelineSummary", filters);
  const data = response?.data || {
    summary: {},
    leads: [],
    pagination: {},
    filter_options: {},
  };

  // Sort lead list and priority queue by lead_score descending (high-intent first)
  if (Array.isArray(data.leads)) {
    data.leads = [...data.leads].sort((a, b) => (b.lead_score ?? 0) - (a.lead_score ?? 0));
  }
  return data;
}

export async function previewLeadImport({ rows, import_source = "manual_import" }) {
  const response = await base44.functions.invoke("importLeads", {
    rows,
    import_source,
    dry_run: true,
  });

  return response?.data?.preview || null;
}

export async function executeLeadImport({ rows, import_source = "manual_import" }) {
  const response = await base44.functions.invoke("importLeads", {
    rows,
    import_source,
    dry_run: false,
  });

  return response?.data?.result || null;
}

export async function triggerLeadScoring(lead_id = null) {
  const response = await base44.functions.invoke("scoreLeads", lead_id ? { lead_id } : {});
  return response?.data || {};
}

export async function saveLeadStatus({ lead_id, status, note = "" }) {
  const response = await base44.functions.invoke("updateLeadStatus", {
    lead_id,
    status,
    note,
  });

  return response?.data || {};
}

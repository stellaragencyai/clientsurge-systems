import { base44 } from "@/api/base44Client";

export function getLeadPipelineError(error, fallback) {
  return error?.data?.error || error?.message || fallback;
}

export async function fetchLeadPipelineSummary(filters = {}) {
  const response = await base44.functions.invoke("getLeadPipelineSummary", filters);
  return response?.data || {
    summary: {},
    leads: [],
    pagination: {},
    filter_options: {},
  };
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

export async function saveLeadStatus({ lead_id, status, note = "" }) {
  const response = await base44.functions.invoke("updateLeadStatus", {
    lead_id,
    status,
    note,
  });

  return response?.data || {};
}

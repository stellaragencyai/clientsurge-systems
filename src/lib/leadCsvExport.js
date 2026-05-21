export const LEAD_CSV_FIELDS = [
  ["full_name", "Full Name"],
  ["business_name", "Business"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["status", "Status"],
  ["lead_score", "Lead Score"],
  ["source", "Source"],
  ["intake_type", "Intake Type"],
  ["last_contacted_at", "Last Contacted"],
  ["next_follow_up_at", "Next Follow-Up"],
  ["created_date", "Created"],
];

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\r?\n/g, " ");
  if (/[",]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildLeadsCsv(leads = []) {
  const header = LEAD_CSV_FIELDS.map(([, label]) => escapeCsvValue(label)).join(",");
  const rows = (leads || []).map((lead) =>
    LEAD_CSV_FIELDS.map(([field]) => escapeCsvValue(lead?.[field])).join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadCsvFile({ csv, filename }) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

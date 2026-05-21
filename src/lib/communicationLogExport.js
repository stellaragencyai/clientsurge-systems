const CSV_COLUMNS = [
  ["created_date", "Created"],
  ["status", "Status"],
  ["channel", "Channel"],
  ["event_type", "Event Type"],
  ["provider", "Provider"],
  ["subject", "Subject"],
  ["message_body", "Message"],
  ["error_message", "Error"],
  ["provider_message_id", "Provider ID"],
  ["context_type", "Context Type"],
  ["context_id", "Context ID"],
];

export function buildCommunicationLogQuery(filter) {
  if (filter === "failed") return { status: "failed" };
  if (filter === "unmatched") return { context_type: "inbound_sms_unmatched" };
  if (filter === "received") return { event_type: "sms_received" };
  if (filter === "email_sent") return { event_type: "email_sent" };
  if (filter === "email_failed") return { event_type: "email_failed" };
  return {};
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\r?\n/g, " ");
  if (/[",]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildCommunicationLogsCsv(logs) {
  const header = CSV_COLUMNS.map(([, label]) => escapeCsvValue(label)).join(",");
  const rows = (logs || []).map((log) =>
    CSV_COLUMNS.map(([key]) => escapeCsvValue(log?.[key])).join(",")
  );
  return [header, ...rows].join("\n");
}

export function getCommunicationLogFilterLabel(filter) {
  const labels = {
    all: "All Events",
    failed: "Failed",
    unmatched: "Unmatched",
    received: "Received",
    email_sent: "Email Sent",
    email_failed: "Email Failed",
  };
  return labels[filter] || filter;
}

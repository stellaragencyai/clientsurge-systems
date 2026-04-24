const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: "bg-gray-100 text-gray-600" },
  scheduled: { label: "Scheduled", color: "bg-amber-100 text-amber-700" },
  sending:   { label: "Sending…",  color: "bg-blue-100 text-blue-700" },
  sent:      { label: "Sent",      color: "bg-green-100 text-green-700" },
  paused:    { label: "Paused",    color: "bg-orange-100 text-orange-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};

export default function CampaignStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
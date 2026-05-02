import { CheckCircle2, Clock, Loader2, AlertCircle, RotateCcw } from "lucide-react";

const STATUS_CONFIG = {
  completed:  { icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50 border-green-200",  label: "Completed" },
  processing: { icon: Loader2,      color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",    label: "Processing", spin: true },
  queued:     { icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",  label: "Queued" },
  failed:     { icon: AlertCircle,  color: "text-red-600",    bg: "bg-red-50 border-red-200",      label: "Failed" },
};

const JOB_LABELS = {
  instant_sms:           "Instant SMS",
  confirmation_email:    "Confirmation Email",
  admin_notification:    "Admin Notification",
  nurture_sequence:      "Nurture Sequence",
  webhook_dispatch:      "Webhook Dispatch",
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TaskJobRow({ job, onRetrigger, retriggering }) {
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-border last:border-0">
      {/* Status icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color} ${cfg.spin ? "animate-spin" : ""}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">
            {JOB_LABELS[job.job_type] || job.job_type}
          </p>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          {job.attempts > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {job.attempts} attempt{job.attempts > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {job.lead_name}{job.lead_business ? ` · ${job.lead_business}` : ""}
        </p>
        {job.last_error && (
          <p className="text-xs text-red-600 mt-1 truncate">Error: {job.last_error}</p>
        )}
        {job.trigger_event && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Trigger: {job.trigger_event}</p>
        )}
      </div>

      {/* Time + retrigger */}
      <div className="flex-shrink-0 text-right flex flex-col items-end gap-1.5">
        <p className="text-[11px] text-muted-foreground">{formatDate(job.created_date)}</p>
        {(job.status === "failed" || job.status === "queued") && (
          <button
            onClick={() => onRetrigger(job.id)}
            disabled={retriggering}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            {retriggering ? "..." : "Run"}
          </button>
        )}
      </div>
    </div>
  );
}
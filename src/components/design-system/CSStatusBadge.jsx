import { CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react";

const CONFIG = {
  success: {
    icon: CheckCircle2,
    label: "Verified",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending: {
    icon: Loader2,
    label: "Processing",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  warning: {
    icon: AlertCircle,
    label: "Needs Attention",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  error: {
    icon: XCircle,
    label: "Failed",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default function CSStatusBadge({ status = "pending", label }) {
  const config = CONFIG[status] || CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}>
      <Icon className={`h-3.5 w-3.5 ${status === "pending" ? "animate-spin" : ""}`} />
      {label || config.label}
    </span>
  );
}

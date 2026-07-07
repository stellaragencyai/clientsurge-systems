/**
 * PortalStatusBadge — visual status indicator for normalized portal card states.
 * Renders safe, client-facing labels. Never exposes raw backend terms.
 */
import { CheckCircle2, Clock, AlertCircle, Settings, RefreshCw } from "lucide-react";
import { CARD_STATUS } from "@/lib/portalStateEngine";

const STATUS_CONFIG = {
  [CARD_STATUS.LIVE]: {
    icon: CheckCircle2,
    label: "Active",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  [CARD_STATUS.NEEDS_PROOF]: {
    icon: Clock,
    label: "Verifying",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  [CARD_STATUS.BLOCKED]: {
    icon: AlertCircle,
    label: "Needs Attention",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  [CARD_STATUS.SETUP_REQUIRED]: {
    icon: Settings,
    label: "Setup Required",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  [CARD_STATUS.SYNCING]: {
    icon: RefreshCw,
    label: "Syncing",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
};

export default function PortalStatusBadge({ status, size = "sm" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[CARD_STATUS.SYNCING];
  const Icon = config.icon;
  const sizeClasses = size === "sm"
    ? "px-2.5 py-1 text-xs gap-1.5"
    : "px-3 py-1.5 text-sm gap-2";

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} font-semibold`}>
      <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {config.label}
    </span>
  );
}
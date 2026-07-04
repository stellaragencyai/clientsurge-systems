import React from "react";
import { Info } from "lucide-react";

/**
 * StandardMetricCard — matches the "Credit Summary" cards from the reference:
 * Small white card with a title, large bold value, status dot, info icon,
 * and an outlined "Take Action" button at the bottom.
 *
 * Props:
 * - label: the metric name (e.g., "Open Accounts")
 * - value: the primary number/value (e.g., "27", "43%")
 * - status: "danger" | "warning" | "success" | "neutral" — controls the dot color
 * - actionLabel: text for the bottom button (e.g., "Take Action")
 * - onAction: click handler for the action button
 * - tooltip: optional info tooltip text on hover
 */
const STATUS_COLORS = {
  danger: "#FF4D4D",
  warning: "#F5A623",
  success: "#22C55E",
  neutral: "#9CA3AF",
};

export default function StandardMetricCard({
  label,
  value,
  status = "neutral",
  actionLabel = "Take Action",
  onAction,
  tooltip,
  loading = false,
}) {
  const dotColor = STATUS_COLORS[status] || STATUS_COLORS.neutral;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200/80 flex flex-col"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)" }}
    >
      {/* Header row: label + info icon */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {status !== "neutral" && (
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
          )}
          {tooltip && (
            <span title={tooltip} className="cursor-help text-gray-300 hover:text-gray-400 transition-colors">
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="px-4 py-3 flex-1 flex items-center">
        {loading ? (
          <div className="w-16 h-8 rounded bg-gray-100 animate-pulse" />
        ) : (
          <span className="text-2xl font-bold text-gray-900 leading-none">
            {value ?? "—"}
          </span>
        )}
      </div>

      {/* Action button */}
      {actionLabel && onAction && (
        <div className="px-4 pb-4">
          <button
            onClick={onAction}
            className="w-full py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
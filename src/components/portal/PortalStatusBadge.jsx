/**
 * PortalStatusBadge — visual status indicator for normalized portal card states.
 * Renders safe, client-facing labels using the centralized ClientStatusLanguage map.
 * Never exposes raw backend terms (NeedsProof, SetupRequired, etc.).
 */
import { getClientStatusConfig } from "@/lib/clientStatusLanguage";

export default function PortalStatusBadge({ status, size = "sm" }) {
  const config = getClientStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = size === "sm"
    ? "px-2.5 py-1 text-xs gap-1.5"
    : "px-3 py-1.5 text-sm gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses} font-semibold`}
      style={{
        background: config.bg,
        color: config.color,
        borderColor: config.border,
      }}
    >
      <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {config.label}
    </span>
  );
}
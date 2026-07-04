import { PHASES } from "@/lib/twilioGrowthEnginePhases";

/**
 * Compact phase badge for use in tables, rows, and cards.
 */
export default function TwilioGrowthEnginePhaseBadge({ phase, showLabel = true, size = "sm" }) {
  const config = PHASES[phase] || PHASES[0];
  const sizeClass = size === "xs"
    ? "text-[9px] px-1.5 py-0.5"
    : "text-[10px] px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClass} flex-shrink-0`}
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
      title={config.name}
    >
      {config.short}
      {showLabel && <span className="hidden sm:inline">{config.name}</span>}
    </span>
  );
}
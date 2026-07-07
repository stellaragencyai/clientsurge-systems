/**
 * PortalMetricCard — Premium SaaS metric card for the client portal Overview.
 * Uses CSCard design system component with electric-blue accent.
 *
 * Props:
 *   icon    — lucide-react icon component
 *   label   — string (metric label)
 *   value   — string | number
 *   accent  — hex color (default #0088CC)
 *   onClick — function (optional)
 */
import { ArrowRight } from "lucide-react";
import CSCard from "@/components/design-system/CSCard";

export default function PortalMetricCard({
  icon: Icon,
  label,
  value,
  accent = "#0088CC",
  onClick = null,
}) {
  return (
    <CSCard onClick={onClick} className="!p-5" hover={!!onClick}>
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent}14, ${accent}06)`,
            border: `1px solid ${accent}20`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {onClick && (
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#00AEEF] transition-colors" />
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 font-display tracking-tight">{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wide">{label}</p>
    </CSCard>
  );
}
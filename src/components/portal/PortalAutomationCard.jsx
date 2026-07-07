/**
 * PortalAutomationCard — Premium automation card for the client portal Automations section.
 * Shows automation name, icon, description, status, last verified, and action.
 * Uses CSCard design system component.
 *
 * States (mapped from internal CARD_STATUS):
 *   Active            — green, running
 *   Verifying         — blue, pulsing
 *   Preparing         — amber
 *   Paused            — gray
 *   Action Required   — red/orange
 *   Upgrade Available — purple/gold
 *
 * Props:
 *   name        — string
 *   description — string
 *   icon        — lucide-react icon component
 *   statusLabel — string (client-facing status label)
 *   statusColor — hex color
 *   lastRun     — ISO date string (optional)
 *   onClick     — function (optional action)
 *   actionLabel — string (optional button text)
 */
import { ArrowRight } from "lucide-react";
import CSCard from "@/components/design-system/CSCard";

export default function PortalAutomationCard({
  name,
  description,
  icon: Icon,
  statusLabel,
  statusColor,
  lastRun,
  onClick,
  actionLabel = "View Details",
}) {
  const isActionable = !!onClick;
  const isPulsing = statusLabel === "Verifying" || statusLabel === "Active";

  return (
    <CSCard onClick={isActionable ? onClick : null} className="!p-5" hover={isActionable}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${statusColor}14, ${statusColor}06)`,
            border: `1px solid ${statusColor}25`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color: statusColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{name}</h3>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0`}
              style={{
                color: statusColor,
                background: `${statusColor}12`,
                border: `1px solid ${statusColor}25`,
              }}
            >
              {isPulsing && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: statusColor }}
                />
              )}
              {statusLabel}
            </span>
          </div>

          {description && (
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>
          )}

          {lastRun && (
            <p className="text-[11px] text-gray-400 font-medium">
              Last activity: {new Date(lastRun).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          {isActionable && (
            <button
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0088CC] hover:text-[#00AEEF] transition-colors"
            >
              {actionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </CSCard>
  );
}
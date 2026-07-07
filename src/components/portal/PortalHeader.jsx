/**
 * PortalHeader — Phase 4.3 strengthened header.
 * Shows: page title, business name, current plan, system status chip,
 * support shortcut, notification bell, and profile avatar.
 *
 * Props:
 *   sectionLabel    — string (current tab display name)
 *   businessName    — string
 *   plan            — string (optional, e.g. "Starter System")
 *   deploymentStatus — string (optional: live, onboarding, configuring, etc.)
 *   onOpenMobile     — function
 *   onSupportClick   — function (optional)
 *   children         — ReactNode (notification bell, avatar, etc.)
 */
import { Menu, ChevronRight, LifeBuoy } from "lucide-react";

export default function PortalHeader({
  sectionLabel,
  businessName,
  plan,
  deploymentStatus,
  onOpenMobile,
  onSupportClick,
  children,
}) {
  const statusColors = {
    live: { bg: "#10B98112", color: "#059669", border: "#10B98125", label: "Live" },
    onboarding: { bg: "#00AEEF12", color: "#0088CC", border: "#00AEEF25", label: "Onboarding" },
    configuring: { bg: "#D4AF3712", color: "#B8941F", border: "#D4AF3725", label: "Configuring" },
    ready: { bg: "#10B98112", color: "#059669", border: "#10B98125", label: "Ready" },
    pending: { bg: "#9CA3AF12", color: "#6B7280", border: "#9CA3AF25", label: "Pending" },
    paused: { bg: "#9CA3AF12", color: "#6B7280", border: "#9CA3AF25", label: "Paused" },
    error: { bg: "#EF444412", color: "#DC2626", border: "#EF444425", label: "Needs Attention" },
  };

  const chipConfig = deploymentStatus
    ? statusColors[deploymentStatus] || statusColors.pending
    : null;

  return (
    <header
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 h-16 flex items-center justify-between flex-shrink-0"
      role="banner"
    >
      {/* Left: mobile menu + business context + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business name + plan + status chip (hidden on mobile) */}
        <div className="hidden sm:flex flex-col leading-tight min-w-0">
          <span className="text-xs font-medium text-gray-400 truncate" title={businessName || "Portal"}>
            {businessName || "Portal"}
          </span>
          <div className="flex items-center gap-1.5">
            {plan && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#0088CC]">
                {plan}
              </span>
            )}
            {chipConfig && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                style={{
                  color: chipConfig.color,
                  background: chipConfig.bg,
                  border: `1px solid ${chipConfig.border}`,
                }}
              >
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: chipConfig.color }}
                />
                {chipConfig.label}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline flex-shrink-0" />

        {/* Page title */}
        <h1 className="text-base md:text-lg font-bold text-gray-900 font-display truncate">
          {sectionLabel || "Dashboard"}
        </h1>
      </div>

      {/* Right: support shortcut + notifications + avatar */}
      <div className="flex items-center gap-2 md:gap-3">
        {onSupportClick && (
          <button
            onClick={onSupportClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#0088CC] hover:bg-blue-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            aria-label="Contact support"
          >
            <LifeBuoy className="w-4 h-4" />
            <span className="hidden lg:inline">Support</span>
          </button>
        )}
        {children}
      </div>
    </header>
  );
}
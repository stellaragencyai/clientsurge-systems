/**
 * PremiumPortalTopBar — Enhancement #1
 * Sticky premium top command bar replacing the plain portal header.
 * Shows: page title, ClientSurge Portal eyebrow, business name, current plan chip,
 * system status chip, support status chip (if available), notification bell, profile menu.
 */
import { Menu, ChevronRight } from "lucide-react";
import PortalProfileMenu from "./PortalProfileMenu";

const STATUS_COLORS = {
  live: { bg: "#10B98112", color: "#059669", border: "#10B98125", label: "Live" },
  onboarding: { bg: "#00AEEF12", color: "#0088CC", border: "#00AEEF25", label: "Onboarding" },
  configuring: { bg: "#D4AF3712", color: "#B8941F", border: "#D4AF3725", label: "Configuring" },
  ready: { bg: "#10B98112", color: "#059669", border: "#10B98125", label: "Ready" },
  pending: { bg: "#9CA3AF12", color: "#6B7280", border: "#9CA3AF25", label: "Pending" },
  paused: { bg: "#9CA3AF12", color: "#6B7280", border: "#9CA3AF25", label: "Paused" },
  error: { bg: "#EF444412", color: "#DC2626", border: "#EF444425", label: "Needs Attention" },
};

const SUPPORT_STATUS_CONFIG = {
  "Open": { bg: "#EF444412", color: "#DC2626", border: "#EF444425", label: "Support: Open" },
  "Waiting On Client": { bg: "#D4AF3712", color: "#B8941F", border: "#D4AF3725", label: "Awaiting Your Response" },
  "Waiting On Provider": { bg: "#D4AF3712", color: "#B8941F", border: "#D4AF3725", label: "Awaiting Provider" },
  "Monitoring": { bg: "#00AEEF12", color: "#0088CC", border: "#00AEEF25", label: "Monitoring" },
  "Resolved": { bg: "#10B98112", color: "#059669", border: "#10B98125", label: "Support: Resolved" },
  "No Open Issues": null,
};

export default function PremiumPortalTopBar({
  sectionLabel,
  businessName,
  plan,
  deploymentStatus,
  supportStatus,
  onOpenMobile,
  onNavigateTab,
  onSignOut,
  user,
  children,
}) {
  const chipConfig = deploymentStatus ? STATUS_COLORS[deploymentStatus] || STATUS_COLORS.pending : null;
  const supportChip = supportStatus ? SUPPORT_STATUS_CONFIG[supportStatus] || null : null;

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

        <div className="hidden sm:flex flex-col leading-tight min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00AEEF]">
            ClientSurge Portal
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
                style={{ color: chipConfig.color, background: chipConfig.bg, border: `1px solid ${chipConfig.border}` }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: chipConfig.color }} />
                {chipConfig.label}
              </span>
            )}
            {supportChip && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                style={{ color: supportChip.color, background: supportChip.bg, border: `1px solid ${supportChip.border}` }}
              >
                {supportChip.label}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:inline flex-shrink-0" />

        <h1 className="text-base md:text-lg font-bold text-gray-900 font-display truncate">
          {sectionLabel || "Dashboard"}
        </h1>
      </div>

      {/* Right: notifications + profile menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {children}
        <PortalProfileMenu
          user={user}
          businessName={businessName}
          onNavigateTab={onNavigateTab}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  );
}
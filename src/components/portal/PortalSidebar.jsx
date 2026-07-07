/**
 * PortalSidebar — Phase 4.3 reduced-overwhelm sidebar.
 * Primary nav visible: Dashboard, Setup Progress, Performance, Leads,
 * Reports, Billing, Support.
 * Lower-frequency tools (Settings) in a collapsible "More" group.
 */
import { useState } from "react";
import {
  LayoutDashboard, Rocket, Zap, Target, Activity, Users, UserCheck,
  CheckSquare, ListChecks, CreditCard, FolderOpen, Calendar, Gift,
  MessageSquare, Package, FileText, Bell, Settings, LogOut, X, MapPin,
  ChevronDown, MoreHorizontal,
} from "lucide-react";
import { PORTAL_SECTIONS } from "@/lib/portalNavigationConfig";

const ICON_MAP = {
  LayoutDashboard, Rocket, Zap, Target, Activity, Users, UserCheck,
  CheckSquare, ListChecks, CreditCard, FolderOpen, Calendar, Gift,
  MessageSquare, Package, FileText, Bell, Settings, MapPin,
};

const PRIMARY_SECTION_IDS = [
  "overview", "onboarding", "automations", "leads", "reports", "billing", "support",
];

export default function PortalSidebar({
  section,
  onSectionChange,
  onLogout,
  businessName,
  userEmail,
  project,
  mobileOpen,
  onCloseMobile,
}) {
  const [moreExpanded, setMoreExpanded] = useState(false);
  const safeBusiness = businessName || "Your Business";
  const safeEmail = userEmail || "—";

  const primarySections = PORTAL_SECTIONS.filter((s) => PRIMARY_SECTION_IDS.includes(s.id));
  const secondarySections = PORTAL_SECTIONS.filter((s) => !PRIMARY_SECTION_IDS.includes(s.id));

  const renderNavButton = (item) => {
    const Icon = ICON_MAP[item.icon] || LayoutDashboard;
    const isActive = section === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          onSectionChange(item.id);
          onCloseMobile?.();
        }}
        aria-current={isActive ? "page" : undefined}
        title={item.label}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF] ${
          isActive
            ? "bg-[#00AEEF] text-white shadow-[0_2px_8px_rgba(0,174,239,0.3)]"
            : "text-gray-600 hover:bg-blue-50 hover:text-[#0088CC]"
        }`}
      >
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-[260px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        role="navigation"
        aria-label="Client portal navigation"
      >
        {/* Logo + mobile close */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
            >
              <span className="text-white text-xs font-bold">CS</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-gray-900">ClientSurge</span>
              <span className="text-[10px] text-gray-400">Client Portal</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business identity + plan badge */}
        <div className="px-4 py-3 border-b border-gray-50 bg-blue-50/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Business</p>
          <p className="text-sm font-bold text-gray-900 truncate" title={safeBusiness}>{safeBusiness}</p>
          {project?.plan && (
            <span
              className="mt-1.5 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
            >
              {project.plan}
            </span>
          )}
        </div>

        {/* Primary nav — 7 visible destinations */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {primarySections.map(renderNavButton)}

          {/* Collapsible "More" for lower-frequency tools */}
          {secondarySections.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setMoreExpanded(!moreExpanded)}
                aria-expanded={moreExpanded}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
              >
                <MoreHorizontal className="w-[18px] h-[18px] flex-shrink-0 text-gray-400" />
                <span className="truncate">More</span>
                <ChevronDown
                  className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${moreExpanded ? "rotate-180" : ""}`}
                />
              </button>
              {moreExpanded && (
                <div className="space-y-1 mt-1 ml-3 border-l border-gray-100 pl-2">
                  {secondarySections.map(renderNavButton)}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User footer + logout */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-500">
                {(safeBusiness || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate" title={safeBusiness}>{safeBusiness}</p>
              <p className="text-[10px] text-gray-400 truncate" title={safeEmail}>{safeEmail}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            aria-label="Sign out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
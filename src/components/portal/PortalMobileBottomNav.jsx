/**
 * PortalMobileBottomNav — 5 primary destinations for mobile.
 * Fixed bottom bar, 48px touch targets, active state highlighting.
 */
import { LayoutDashboard, Rocket, Zap, Users, MessageSquare } from "lucide-react";
import { PORTAL_MOBILE_NAV } from "@/lib/portalNavigationConfig";

const ICON_MAP = { LayoutDashboard, Rocket, Zap, Users, MessageSquare };

export default function PortalMobileBottomNav({ section, onSectionChange }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 safe-area-bottom-bar"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {PORTAL_MOBILE_NAV.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-h-[48px] min-w-[48px] transition-colors"
              style={{ color: isActive ? "#00AEEF" : "#9ca3af" }}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
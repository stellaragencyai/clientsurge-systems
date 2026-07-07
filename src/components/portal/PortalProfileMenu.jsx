/**
 * PortalProfileMenu — Enhancement #2
 * Avatar/profile dropdown that opens a menu with:
 *   - Account settings → settings tab
 *   - Support → support tab
 *   - Return to main website → /
 *   - Sign out → opens confirmation modal
 */
import { useState, useRef, useEffect } from "react";
import { Settings, MessageSquare, ExternalLink, LogOut, ChevronDown } from "lucide-react";

export default function PortalProfileMenu({ user, businessName, onNavigateTab, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const displayName = user?.full_name || businessName || "Account";
  const email = user?.email || "";
  const initial = (displayName || "U")[0].toUpperCase();

  const handleAction = (action) => {
    setOpen(false);
    if (action === "settings") onNavigateTab?.("settings");
    else if (action === "support") onNavigateTab?.("support");
    else if (action === "website") window.location.href = "/";
    else if (action === "logout") onSignOut?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}>
          <span className="text-xs font-bold text-white">{initial}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User identity */}
          <div className="px-4 py-2 border-b border-gray-50 mb-1">
            <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
            {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
          </div>

          {/* Menu items */}
          <button
            onClick={() => handleAction("settings")}
            role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <Settings className="w-4 h-4 text-gray-400" />
            Account Settings
          </button>

          <button
            onClick={() => handleAction("support")}
            role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <MessageSquare className="w-4 h-4 text-gray-400" />
            Support
          </button>

          <a
            href="/"
            role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
            Return to Main Website
          </a>

          <div className="border-t border-gray-50 mt-1 pt-1">
            <button
              onClick={() => handleAction("logout")}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
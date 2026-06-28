import { LayoutDashboard, Users, MessageSquare } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * MobileBottomNav — persistent bottom navigation bar for mobile devices only.
 * Shows on screens ≤640px. Hidden on desktop.
 *
 * Props:
 *   onNavigate?: (tabId: string) => void  — if provided, calls this instead of route navigation
 *   activeTab?: string                     — current active tab ID (when using onNavigate)
 */
export default function MobileBottomNav({ onNavigate, activeTab }) {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: "overview", icon: LayoutDashboard, label: "Overview", path: "/client-portal", tabId: "progress" },
    { id: "leads", icon: Users, label: "Leads", path: "/client-portal?tab=leads", tabId: "leads" },
    { id: "messages", icon: MessageSquare, label: "Messages", path: "/client-portal?tab=support", tabId: "support" },
  ];

  const handleTabClick = (tab) => {
    if (onNavigate) {
      onNavigate(tab.tabId);
    } else {
      navigate(tab.path);
    }
  };

  const isTabActive = (tab) => {
    if (activeTab) return activeTab === tab.tabId;
    return location.pathname === tab.path.split("?")[0];
  };

  return (
    <>
      <style>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid rgba(0,136,204,0.12);
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 40;
          padding-bottom: env(safe-area-inset-bottom);
        }
        @media (max-width: 640px) {
          .mobile-bottom-nav { display: flex; }
        }
      `}</style>
      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "10px 8px",
                minHeight: "56px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: isActive ? "#0088CC" : "rgba(27,20,13,0.5)",
                transition: "color 0.2s ease",
              }}
            >
              <Icon style={{ width: "20px", height: "20px" }} />
              <span style={{ fontSize: "10px", fontWeight: "600" }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
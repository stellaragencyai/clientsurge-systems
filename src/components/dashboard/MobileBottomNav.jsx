import { LayoutDashboard, Package, Headphones, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/client-dashboard" },
    { icon: Package, label: "Services", path: "/client-dashboard?tab=services" },
    { icon: Headphones, label: "Support", path: "/client-dashboard?tab=support" },
    { icon: Home, label: "Home", path: "/" },
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: "none",
      "@media (max-width: 640px)": {
        display: "flex",
      },
      borderTop: "1px solid rgba(154,92,46,0.12)",
      background: "rgba(255,255,255,0.98)",
      backdropFilter: "blur(12px)",
      zIndex: 40,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
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
              color: isActive ? "#9a5c2e" : "rgba(27,20,13,0.5)",
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
      <style>{`
        @media (max-width: 640px) {
          div { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
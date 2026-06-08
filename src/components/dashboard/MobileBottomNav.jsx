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
      <div className="mobile-bottom-nav">
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
      </div>
    </>
  );
}
import { LayoutDashboard, Package, Headphones, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollOrNavigate = (path, targetId) => {
    if (targetId && location.pathname === "/client-portal") {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", `#${targetId}`);
        return;
      }
    }
    navigate(path);
  };

  const tabs = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/client-portal" },
    { icon: Package, label: "Systems", path: "/client-portal#dashboard-systems", targetId: "dashboard-systems" },
    { icon: Headphones, label: "Support", path: "/contact" },
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
      <nav className="mobile-bottom-nav" aria-label="Client dashboard mobile navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path === "/client-portal"
            ? location.pathname === "/client-portal" && !location.hash
            : location.pathname === tab.path || location.hash === `#${tab.targetId}`;
          return (
            <button
              key={tab.label}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => scrollOrNavigate(tab.path, tab.targetId)}
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
              <Icon style={{ width: "20px", height: "20px" }} aria-hidden="true" />
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

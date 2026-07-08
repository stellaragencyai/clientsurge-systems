import { Headphones, Eye, ClipboardList } from "lucide-react";

export default function ServiceCardActions({ serviceKey, orderId }) {
  const actions = [
    { icon: Eye, label: "View Status", action: "status" },
    { icon: ClipboardList, label: "Setup Tasks", action: "tasks" },
    { icon: Headphones, label: "Get Help", action: "help" },
  ];

  const handleAction = (actionType) => {
    if (actionType === "help") {
      window.location.href = "mailto:support@clientsurgesystems.com?subject=ClientSurge%20Dashboard%20Support";
      return;
    }

    if (actionType === "tasks") {
      if (orderId) {
        window.location.href = `/setup/credentials?order_id=${encodeURIComponent(orderId)}`;
        return;
      }
      window.location.href = "mailto:support@clientsurgesystems.com?subject=ClientSurge%20Setup%20Help";
      return;
    }

    window.dispatchEvent(new CustomEvent("clientsurge:dashboard-focus-status", {
      detail: { serviceKey, orderId },
    }));
    document.getElementById("dashboard-status")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
      gap: "8px",
    }}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.action}
            type="button"
            aria-label={`${action.label}${serviceKey ? ` for ${serviceKey}` : ""}`}
            onClick={() => handleAction(action.action)}
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(0,174,239,0.16)",
              background: "rgba(0,174,239,0.04)",
              padding: "10px 12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
              color: "#0088CC",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,174,239,0.12)";
              e.currentTarget.style.borderColor = "rgba(0,174,239,0.4)";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(0,174,239,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,174,239,0.04)";
              e.currentTarget.style.borderColor = "rgba(0,174,239,0.16)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Icon style={{ width: "16px", height: "16px" }} aria-hidden="true" />
            <span style={{ fontSize: "10px", fontWeight: "600", lineHeight: 1.2 }}>
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

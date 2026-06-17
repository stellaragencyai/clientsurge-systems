import { Headphones, Eye, Download } from "lucide-react";

export default function ServiceCardActions({ serviceKey, orderId }) {
  const actions = [
    { icon: Eye, label: "View Details", action: "view" },
    { icon: Download, label: "Setup Guide", action: "guide" },
    { icon: Headphones, label: "Get Help", action: "help" },
  ];

  const handleAction = (actionType) => {
    // Placeholder for actions — can integrate modals or navigation later
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
      gap: "8px",
    }}>
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <button
            key={idx}
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
            <Icon style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "10px", fontWeight: "600", lineHeight: 1.2 }}>
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
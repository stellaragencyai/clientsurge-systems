import { FileText, Headphones, Eye, Download, MessageCircle } from "lucide-react";

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
              border: "1px solid rgba(154,92,46,0.18)",
              background: "rgba(154,92,46,0.05)",
              padding: "10px 12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              color: "#9a5c2e",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(154,92,46,0.12)";
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(154,92,46,0.05)";
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.18)";
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
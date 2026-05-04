import { CheckCircle, Clock, MessageSquare } from "lucide-react";

// Plain-English label map — no technical jargon exposed to clients
const PLAIN_STATUS = {
  "Paid": "Payment Confirmed",
  "Ready for Install": "Queued for Setup",
  "Configuring": "Being Configured",
  "Testing": "Being Tested",
  "Live": "Live & Active",
  "Error": "Needs Attention",
};

export default function DashboardHeader({ activeServices, project, order }) {
  const liveCount = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressCount = activeServices.filter(s => ["Configuring", "Testing", "Ready for Install"].includes(s.installStatus)).length;
  const totalServices = activeServices.length;

  if (totalServices === 0) return null;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px",
    }}>
      {[
        { icon: MessageSquare, label: "Automation Systems", value: totalServices, sub: "in your account", color: "#1b140d" },
        { icon: CheckCircle, label: "Live & Running", value: liveCount, sub: "capturing leads now", color: "#16a34a" },
        { icon: Clock, label: "Being Set Up", value: inProgressCount, sub: "our team is on it", color: "#d97706" },
      ].map(({ icon: Icon, label, value, sub, color }) => (
        <div key={label} style={{
          background: "#ffffff", border: "1px solid rgba(0,174,239,0.14)",
          borderRadius: "16px", padding: "18px 20px",
          boxShadow: "0 2px 12px rgba(0,59,143,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Icon style={{ width: "14px", height: "14px", color: "rgba(0,174,239,0.6)" }} />
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: "900", color, margin: "0 0 2px", lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: "11px", color: "rgba(10,22,40,0.4)", margin: 0 }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}
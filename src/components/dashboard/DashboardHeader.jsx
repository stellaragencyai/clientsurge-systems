import { Zap, BarChart2, CheckCircle, Clock } from "lucide-react";

export default function DashboardHeader({ userEmail, activeServices, project, order }) {
  const liveCount = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressCount = activeServices.filter(s => ["Configuring", "Testing", "Ready for Install"].includes(s.installStatus)).length;
  const totalServices = activeServices.length;
  const firstName = userEmail ? userEmail.split("@")[0].split(".")[0] : "there";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div style={{
      borderRadius: "20px",
      padding: "clamp(24px,4vw,36px)",
      marginBottom: "28px",
      border: "1px solid rgba(154,92,46,0.12)",
      position: "relative",
      overflow: "hidden",
    }}>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg,#c8965c,#f5d9a8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap style={{ width: "18px", height: "18px", color: "#3d1f0a" }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(154,92,46,0.7)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                ClientSurge Systems
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: "800", color: "#1b140d", margin: "0 0 4px", lineHeight: 1.15 }}>
              Welcome back, {displayName} 👋
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.55)", margin: 0 }}>
              Your AI automation systems are being monitored and installed by our team.
            </p>
          </div>
          {liveCount > 0 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "9999px",
              background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.3)",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#4ade80" }}>{liveCount} System{liveCount > 1 ? "s" : ""} Live</span>
            </div>
          )}
        </div>

        {/* Quick stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
          {[
            { icon: BarChart2, label: "Total Services", value: totalServices, color: "#f5d9a8" },
            { icon: CheckCircle, label: "Live & Active", value: liveCount, color: "#4ade80" },
            { icon: Clock, label: "In Setup", value: inProgressCount + (totalServices - liveCount - inProgressCount), color: "#fbbf24" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(154,92,46,0.12)",
              borderRadius: "12px", padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Icon style={{ width: "14px", height: "14px", color: "rgba(154,92,46,0.5)" }} />
                <span style={{ fontSize: "10px", fontWeight: "600", color: "rgba(27,20,13,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "900", color, margin: 0, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.2)} }`}</style>
    </div>
  );
}
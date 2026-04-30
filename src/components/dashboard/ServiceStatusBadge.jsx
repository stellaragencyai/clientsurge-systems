export default function ServiceStatusBadge({ orderStatus, paymentStatus }) {
  const config = (() => {
    if (orderStatus === "active") return { label: "Live", color: "#22c55e", bg: "rgba(34,197,94,0.12)", dot: "#22c55e" };
    if (orderStatus === "in_progress") return { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", dot: "#f59e0b" };
    if (paymentStatus === "paid") return { label: "Setting Up", color: "#9a5c2e", bg: "rgba(154,92,46,0.12)", dot: "#c8965c" };
    return { label: "Pending", color: "rgba(27,20,13,0.45)", bg: "rgba(27,20,13,0.06)", dot: "rgba(27,20,13,0.3)" };
  })();

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "9999px",
      background: config.bg, border: `1px solid ${config.color}33`,
      fontSize: "11px", fontWeight: "700", color: config.color,
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: config.dot,
        boxShadow: orderStatus === "active" ? `0 0 6px ${config.dot}` : "none",
        animation: orderStatus === "active" ? "livePulse 2s ease-in-out infinite" : "none",
      }} />
      {config.label}
      <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </span>
  );
}
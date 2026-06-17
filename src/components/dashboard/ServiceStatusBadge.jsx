export default function ServiceStatusBadge({ installStatus }) {
  const config = (() => {
    if (installStatus === "Live")               return { label: "Live",             color: "#22c55e", bg: "rgba(34,197,94,0.12)"  };
    if (installStatus === "Testing")            return { label: "Testing",          color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
    if (installStatus === "Configuring")        return { label: "Configuring",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (installStatus === "Ready for Install")  return { label: "Ready for Setup",  color: "#0088CC", bg: "rgba(0,136,204,0.12)"  };
    if (installStatus === "Error")              return { label: "Needs Attention",  color: "#ef4444", bg: "rgba(239,68,68,0.12)"  };
    return                                             { label: "Pending",          color: "rgba(27,20,13,0.45)", bg: "rgba(27,20,13,0.06)" };
  })();

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "9999px",
      background: config.bg, border: `1px solid ${config.color}33`,
      fontSize: "11px", fontWeight: "700", color: config.color,
      letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%", background: config.color,
        boxShadow: installStatus === "Live" ? `0 0 6px ${config.color}` : "none",
        animation: installStatus === "Live" ? "livePulse 2s ease-in-out infinite" : "none",
        flexShrink: 0,
      }} />
      {config.label}
      <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </span>
  );
}
export default function ServiceCardProgressBar({ stageIndex, totalStages = 5 }) {
  const percentComplete = (stageIndex / totalStages) * 100;

  const stageDescriptions = [
    "Payment confirmed",
    "System setup starting",
    "Configuring integrations",
    "Running tests",
    "Live & delivering results",
  ];

  const stageColors = [
    "#0088CC", // Paid - electric blue
    "#00AEEF", // Ready - sky blue
    "#3b82f6", // Configuring - blue
    "#6366f1", // Testing - indigo
    "#22c55e", // Live - green
  ];

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#0a1628" }}>
          Step {Math.min(stageIndex + 1, totalStages)} of {totalStages}
        </span>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(10,22,40,0.55)" }}>
          {stageDescriptions[stageIndex] || "Starting setup"}
        </span>
      </div>
      <div style={{
        width: "100%",
        height: "8px",
        borderRadius: "9999px",
        background: "rgba(0,174,239,0.08)",
        overflow: "hidden",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
      }}>
        <div style={{
          width: `${percentComplete}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${stageColors[stageIndex]}, ${stageColors[Math.min(stageIndex + 1, totalStages - 1)]})`,
          borderRadius: "9999px",
          transition: "width 0.5s ease",
          boxShadow: `0 0 12px ${stageColors[stageIndex]}80`,
        }} />
      </div>
    </div>
  );
}
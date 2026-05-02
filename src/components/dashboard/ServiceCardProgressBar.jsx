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
    "#9a5c2e", // Paid - brown
    "#3b82f6", // Ready - blue
    "#f59e0b", // Configuring - amber
    "#8b5cf6", // Testing - purple
    "#22c55e", // Live - green
  ];

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#1b140d" }}>
          Step {Math.min(stageIndex + 1, totalStages)} of {totalStages}
        </span>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(27,20,13,0.6)" }}>
          {stageDescriptions[stageIndex] || "Starting setup"}
        </span>
      </div>
      <div style={{
        width: "100%",
        height: "8px",
        borderRadius: "9999px",
        background: "rgba(154,92,46,0.1)",
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
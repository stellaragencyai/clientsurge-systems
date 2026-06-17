export default function ServiceCardProgressBar({ stageIndex, totalStages = 5 }) {
  const percentComplete = (stageIndex / totalStages) * 100;

  const stageDescriptions = [
    "Payment confirmed",
    "System setup starting",
    "Configuring integrations",
    "Running tests",
    "Live & delivering results",
  ];

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#0A1628" }}>
          Step {Math.min(stageIndex + 1, totalStages)} of {totalStages}
        </span>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(10,22,40,0.5)" }}>
          {stageDescriptions[stageIndex] || "Starting setup"}
        </span>
      </div>
      <div style={{
        width: "100%",
        height: "8px",
        borderRadius: "9999px",
        background: "rgba(0,174,239,0.07)",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${percentComplete}%`,
          height: "100%",
          background: "linear-gradient(90deg, #0088CC, #00AEEF)",
          borderRadius: "9999px",
          transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 0 14px rgba(0,174,239,0.45)",
        }} />
      </div>
    </div>
  );
}
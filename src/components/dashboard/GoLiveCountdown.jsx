// Enhancement 1: Estimated Go-Live Countdown
const STAGE_DAYS_REMAINING = {
  "Paid": 7,
  "Ready for Install": 6,
  "Configuring": 4,
  "Testing": 2,
  "Live": 0,
  "Error": null,
};

const STAGE_MESSAGE = {
  "Paid": "We're getting your installer assigned.",
  "Ready for Install": "Your installer is ready to begin.",
  "Configuring": "Your automation flows are being built right now.",
  "Testing": "Almost there — final tests running.",
  "Live": "Your system is live and capturing leads.",
  "Error": "Our team is working to resolve the issue.",
};

export default function GoLiveCountdown({ installStatus }) {
  if (installStatus === "Live") {
    return (
      <div style={{
        borderRadius: "14px",
        background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.04) 100%)",
        border: "1px solid rgba(34,197,94,0.2)",
        padding: "18px 20px",
        marginBottom: "20px",
        display: "flex", alignItems: "center", gap: "14px",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
          background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
        }}>🚀</div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: "800", color: "#16a34a", margin: "0 0 3px" }}>Your System is Live!</p>
          <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.55)", margin: 0 }}>
            Your automation is running and responding to leads 24/7.
          </p>
        </div>
      </div>
    );
  }

  if (installStatus === "Error") {
    return (
      <div style={{
        borderRadius: "14px",
        background: "rgba(239,68,68,0.05)",
        border: "1px solid rgba(239,68,68,0.2)",
        padding: "18px 20px",
        marginBottom: "20px",
        display: "flex", alignItems: "center", gap: "14px",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
        }}>⚠️</div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: "800", color: "#dc2626", margin: "0 0 3px" }}>Action Needed</p>
          <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.55)", margin: 0 }}>
            Our team has been notified and is working on a fix.
          </p>
        </div>
      </div>
    );
  }

  const days = STAGE_DAYS_REMAINING[installStatus] ?? 7;
  const message = STAGE_MESSAGE[installStatus] || "";

  return (
    <div style={{
      borderRadius: "14px",
      background: "linear-gradient(135deg, rgba(154,92,46,0.07) 0%, rgba(200,150,92,0.04) 100%)",
      border: "1px solid rgba(154,92,46,0.14)",
      padding: "18px 20px",
      marginBottom: "20px",
      display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
    }}>
      {/* Big number */}
      <div style={{
        width: "60px", height: "60px", borderRadius: "14px", flexShrink: 0,
        background: "linear-gradient(135deg, rgba(154,92,46,0.12), rgba(200,150,92,0.08))",
        border: "1px solid rgba(154,92,46,0.18)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "22px", fontWeight: "900", color: "#9a5c2e", lineHeight: 1 }}>{days}</span>
        <span style={{ fontSize: "9px", fontWeight: "700", color: "rgba(154,92,46,0.65)", textTransform: "uppercase", letterSpacing: "0.08em" }}>days</span>
      </div>
      <div>
        <p style={{ fontSize: "13px", fontWeight: "800", color: "#1b140d", margin: "0 0 4px" }}>
          Estimated Time to Live
        </p>
        <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.55)", margin: 0, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
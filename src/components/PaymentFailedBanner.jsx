/**
 * PaymentFailedBanner — #263
 * Red banner shown at top of ClientPortal when billing_status === "past_due"
 */
export default function PaymentFailedBanner({ billing_status, onDismiss }) {
  if (billing_status !== "past_due") return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #7F1D1D, #991B1B)",
      border: "1px solid #F87171",
      borderRadius: 12,
      padding: "14px 20px",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <p style={{ color: "#FEE2E2", fontWeight: 700, fontSize: 14, margin: 0 }}>
            Payment Failed — Action Required
          </p>
          <p style={{ color: "#FCA5A5", fontSize: 13, margin: "2px 0 0" }}>
            Your last payment didn't go through. Please update your payment method to keep your automations running.
          </p>
        </div>
      </div>
      <a
        href="mailto:nolan@clientsurgesystems.com?subject=Payment%20Update%20Needed"
        style={{
          background: "#EF4444", color: "#fff", borderRadius: 9999,
          padding: "8px 16px", fontSize: 12, fontWeight: 700,
          textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        Fix Payment →
      </a>
    </div>
  );
}

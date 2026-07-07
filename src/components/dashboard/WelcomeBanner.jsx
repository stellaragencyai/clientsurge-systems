import { ArrowRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const STAGES = [
  { label: "Payment Confirmed", key: "paid" },
  { label: "Setup Info Received", key: "setup_submitted" },
  { label: "We're Configuring", key: "configuring" },
  { label: "You're Live!", key: "live" },
];

function getStageIndex(order, hasSetupInfo) {
  if (!order) return 0;
  if (order.order?.services?.some(s => s.install_status === "Live")) return 3;
  if (order.order?.services?.some(s => ["Configuring", "Testing"].includes(s.install_status))) return 2;
  if (hasSetupInfo) return 1;
  return 0;
}

export default function WelcomeBanner({ user, order, hasSetupInfo, portalState }) {
  const businessName = order?.business_name || order?.customer_name || null;
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const rawStageIndex = getStageIndex({ order }, hasSetupInfo);
  const currentStage = STAGES[rawStageIndex];
  // Phase A.5: Gate "Live" celebration behind PortalStateEngine proof validation
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isLive = rawStageIndex === 3 && isProofLive;
  const stageIndex = isProofLive ? rawStageIndex : Math.min(rawStageIndex, 2);
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  return (
    <div style={{
      borderRadius: "20px",
      background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)",
      padding: "clamp(24px,4vw,36px)",
      marginBottom: "24px",
      boxShadow: "0 12px 40px rgba(0,59,143,0.22)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-40%", right: "-5%",
        width: "350px", height: "350px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,174,239,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Greeting */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(0,174,239,0.7)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 6px" }}>
            ClientSurge Systems
          </p>
          <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: "800", color: "#ffffff", margin: "0 0 6px", lineHeight: 1.2 }}>
            {isLive ? `🎉 You're live, ${displayName}!` : `Welcome, ${displayName}! 👋`}
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
            {businessName ? `${businessName} · ` : ""}
            {isLive
              ? "Your automation system is active and capturing leads."
              : "Here's exactly where things stand with your setup."}
          </p>
        </div>

        {/* Progress timeline */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          background: "rgba(255,255,255,0.06)", borderRadius: "14px",
          padding: "16px 20px", marginBottom: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {STAGES.map((stage, i) => {
            const done = i < stageIndex;
            const active = i === stageIndex;
            const isLast = i === STAGES.length - 1;
            return (
              <div key={stage.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                    background: done ? "rgba(34,197,94,0.3)" : active ? "rgba(0,174,239,0.35)" : "rgba(255,255,255,0.07)",
                    border: `2px solid ${done ? "rgba(34,197,94,0.7)" : active ? "rgba(0,174,239,0.8)" : "rgba(255,255,255,0.15)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? "0 0 14px rgba(0,174,239,0.4)" : "none",
                  }}>
                    {done ? (
                      <CheckCircle2 style={{ width: "14px", height: "14px", color: "#4ade80" }} />
                    ) : active ? (
                      <Clock style={{ width: "13px", height: "13px", color: "#00AEEF" }} />
                    ) : (
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.3)" }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: "9px", fontWeight: "700", textAlign: "center",
                    color: done ? "#4ade80" : active ? "#ffffff" : "rgba(255,255,255,0.35)",
                    lineHeight: 1.3, maxWidth: "72px", display: "block",
                  }}>
                    {stage.label}
                  </span>
                </div>
                {!isLast && (
                  <div style={{
                    flex: 1, height: "2px", margin: "0 6px", marginBottom: "18px",
                    background: i < stageIndex ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Single primary CTA based on state */}
        {stageIndex === 0 && (
          <div style={{
            background: "rgba(0,174,239,0.15)", border: "1px solid rgba(0,174,239,0.4)",
            borderRadius: "12px", padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
          }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", margin: "0 0 2px" }}>
                ✦ One thing left — we need 5 minutes of your time
              </p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                Submit your business details so we can build your system.
              </p>
            </div>
            {order?.id && (
              <a
                href={`/setup/credentials?order_id=${order.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "10px 20px", borderRadius: "9999px",
                  background: "linear-gradient(135deg,#00AEEF,#003B8F)",
                  color: "#ffffff", fontWeight: "700", fontSize: "13px",
                  textDecoration: "none", whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(0,174,239,0.35)",
                  flexShrink: 0,
                }}
              >
                Submit Setup Info <ArrowRight style={{ width: "13px", height: "13px" }} />
              </a>
            )}
          </div>
        )}

        {stageIndex === 1 && (
          <div style={{
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "12px", padding: "14px 18px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#4ade80", margin: "0 0 2px" }}>
              ✓ We received your setup info!
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Our team is reviewing your details and will start configuration within 24–48 hours. No action needed.
            </p>
          </div>
        )}

        {stageIndex === 2 && (
          <div style={{
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
            borderRadius: "12px", padding: "14px 18px",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <Zap style={{ width: "18px", height: "18px", color: "#fbbf24", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#fbbf24", margin: "0 0 2px" }}>
                We're actively building your system
              </p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                You'll receive an email when everything is tested and ready to go live.
              </p>
            </div>
          </div>
        )}

        {stageIndex === 3 && (
          <div style={{
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: "12px", padding: "14px 18px",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <span style={{ fontSize: "22px" }}>🚀</span>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#4ade80", margin: 0 }}>
              Your automation is live and working. New leads will be responded to automatically.
            </p>
          </div>
        )}

        {/* Phase A.5: Proof gate notice when not Live */}
        {!isProofLive && rawStageIndex === 3 && (
          <div style={{
            background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.2)",
            borderRadius: "12px", padding: "14px 18px",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <Clock style={{ width: "18px", height: "18px", color: "#00AEEF", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#00AEEF", margin: "0 0 2px" }}>
                We're verifying your system is fully live
              </p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                Your setup is complete — we're running final checks before confirming go-live.
              </p>
            </div>
          </div>
        )}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}
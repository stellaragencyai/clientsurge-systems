import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Zap } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const STAGES = [
  { label: "Payment", detail: "Confirmed", key: "paid" },
  { label: "Setup Info", detail: "Received", key: "setup_submitted" },
  { label: "Build", detail: "Configured", key: "configuring" },
  { label: "Launch", detail: "Proof Verified", key: "live" },
];

function getStageIndex(order, hasSetupInfo) {
  if (!order) return 0;
  const services = order?.services || order?.order?.services || [];
  if (services.some(s => s.install_status === "Live")) return 3;
  if (services.some(s => ["Configuring", "Testing"].includes(s.install_status))) return 2;
  if (hasSetupInfo) return 1;
  return 0;
}

function getHeroStatus({ stageIndex, rawStageIndex, isProofLive }) {
  if (!isProofLive && rawStageIndex === 3) {
    return {
      eyebrow: "Proof-gated launch",
      title: "Verification checks are running",
      body: "Your setup may be complete, but this dashboard will not label the system live until verified proof is available.",
      color: "#00AEEF",
      icon: ShieldCheck,
    };
  }

  if (stageIndex === 0) {
    return {
      eyebrow: "Action required",
      title: "Setup information needed",
      body: "Submit your business details so the installation team can configure your automation system.",
      color: "#00AEEF",
      icon: Clock,
    };
  }

  if (stageIndex === 1) {
    return {
      eyebrow: "Received",
      title: "Setup information received",
      body: "Your details are in review. The dashboard updates as the build progresses through verified stages.",
      color: "#22c55e",
      icon: CheckCircle2,
    };
  }

  if (stageIndex === 2) {
    return {
      eyebrow: "In progress",
      title: "We are configuring your system",
      body: "Testing and verification come next. No action is needed from you unless the dashboard asks for it.",
      color: "#fbbf24",
      icon: Zap,
    };
  }

  return {
    eyebrow: "Live & verified",
    title: "Your automation is live and verified",
    body: "The system is marked live only because the portal has verified supporting proof.",
    color: "#22c55e",
    icon: CheckCircle2,
  };
}

export default function WelcomeBanner({ user, order, hasSetupInfo, portalState }) {
  const businessName = order?.business_name || order?.customer_name || null;
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const rawStageIndex = getStageIndex(order, hasSetupInfo);
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isLive = rawStageIndex === 3 && isProofLive;
  const stageIndex = isProofLive ? rawStageIndex : Math.min(rawStageIndex, 2);
  const isAdmin = portalState?.meta?.is_admin_preview || false;
  const heroStatus = getHeroStatus({ stageIndex, rawStageIndex, isProofLive });
  const StatusIcon = heroStatus.icon;

  return (
    <div style={{
      borderRadius: "28px",
      background: "linear-gradient(135deg,#071326 0%,#082A58 52%,#004EA8 100%)",
      padding: "clamp(26px,4vw,42px)",
      marginBottom: "22px",
      boxShadow: "0 28px 80px rgba(0,59,143,0.22)",
      position: "relative", overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.12)",
    }}>
      <div style={{
        position: "absolute", top: "-40%", right: "-8%",
        width: "460px", height: "460px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,174,239,0.22) 0%, rgba(0,174,239,0.06) 35%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-35%", left: "-10%",
        width: "360px", height: "360px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}>
          <div style={{ minWidth: "min(100%, 420px)", flex: "1 1 420px" }}>
            <p style={{ fontSize: "11px", fontWeight: "900", color: "#38C8FF", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 8px" }}>
              ClientSurge Systems
            </p>
            <h1 style={{
              fontSize: "clamp(28px,4vw,42px)",
              fontWeight: "900",
              color: "#ffffff",
              WebkitTextFillColor: "#ffffff",
              backgroundImage: "none",
              margin: "0 0 10px",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              textShadow: "0 2px 18px rgba(0,0,0,0.28)",
            }}>
              {isLive ? `System live, ${displayName}` : `Welcome, ${displayName}`}
            </h1>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.82)", margin: 0, maxWidth: "640px", lineHeight: 1.6 }}>
              {businessName ? `${businessName} · ` : ""}
              {isLive
                ? "Your automation system is active and verified by system evidence."
                : "A clean, proof-gated view of where your setup currently stands."}
            </p>
          </div>

          <div style={{
            flex: "0 1 320px",
            minWidth: "260px",
            borderRadius: "20px",
            padding: "16px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: `${heroStatus.color}22`, border: `1px solid ${heroStatus.color}55` }}>
                <StatusIcon style={{ width: "17px", height: "17px", color: heroStatus.color }} />
              </div>
              <div>
                <p style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.14em", textTransform: "uppercase", color: heroStatus.color, margin: 0 }}>{heroStatus.eyebrow}</p>
                <p style={{ fontSize: "14px", fontWeight: "800", color: "#ffffff", margin: "2px 0 0" }}>{heroStatus.title}</p>
              </div>
            </div>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.78)", margin: 0 }}>{heroStatus.body}</p>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "10px",
          background: "rgba(255,255,255,0.07)",
          borderRadius: "20px",
          padding: "10px",
          border: "1px solid rgba(255,255,255,0.11)",
          marginBottom: stageIndex === 0 && order?.id ? "18px" : 0,
        }}>
          {STAGES.map((stage, i) => {
            const done = i < stageIndex || (i === 3 && isLive);
            const active = i === stageIndex && !done;
            const waiting = !done && !active;
            return (
              <div key={stage.key} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderRadius: "15px",
                padding: "12px",
                background: done ? "rgba(34,197,94,0.12)" : active ? "rgba(0,174,239,0.14)" : "rgba(255,255,255,0.045)",
                border: `1px solid ${done ? "rgba(34,197,94,0.28)" : active ? "rgba(0,174,239,0.32)" : "rgba(255,255,255,0.08)"}`,
              }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "12px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "rgba(34,197,94,0.18)" : active ? "rgba(0,174,239,0.2)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${done ? "rgba(34,197,94,0.38)" : active ? "rgba(0,174,239,0.42)" : "rgba(255,255,255,0.1)"}`,
                }}>
                  {done ? (
                    <CheckCircle2 style={{ width: "16px", height: "16px", color: "#4ade80" }} />
                  ) : active ? (
                    <Clock style={{ width: "15px", height: "15px", color: "#38C8FF" }} />
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.42)" }}>{i + 1}</span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: "850", color: waiting ? "rgba(255,255,255,0.45)" : "#ffffff", margin: 0, lineHeight: 1.2 }}>{stage.label}</p>
                  <p style={{ fontSize: "10px", fontWeight: "750", color: done ? "#4ade80" : active ? "#38C8FF" : "rgba(255,255,255,0.34)", margin: "3px 0 0", lineHeight: 1.2 }}>{stage.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {stageIndex === 0 && order?.id && (
          <div style={{
            marginTop: "18px",
            background: "rgba(0,174,239,0.12)", border: "1px solid rgba(0,174,239,0.34)",
            borderRadius: "18px", padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
          }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.76)", margin: 0, lineHeight: 1.5 }}>
              Finish the setup form so we can configure routing, messaging, and verification correctly.
            </p>
            <a
              href={`/setup/credentials?order_id=${order.id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "10px 18px", borderRadius: "9999px",
                background: "#ffffff",
                color: "#003B8F", fontWeight: "850", fontSize: "12px",
                textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 8px 20px rgba(0,0,0,0.16)",
                flexShrink: 0,
              }}
            >
              Submit Setup Info <ArrowRight style={{ width: "13px", height: "13px" }} />
            </a>
          </div>
        )}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}

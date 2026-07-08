import { CreditCard, Loader2, CheckCircle2, Settings, ShieldCheck, TestTube, Rocket } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

export default function DeploymentProgressBar({ pipelineStatus, installStatus, portalState }) {
  const stages = [
    { key: "Paid", label: "Payment Confirmed", icon: CreditCard },
    { key: "Configuring", label: "AI Configuring", icon: Settings },
    { key: "Testing", label: "Verification Tests", icon: TestTube },
    { key: "Live", label: "Live After Proof", icon: Rocket },
  ];

  const rawIndex = stages.findIndex((s) => s.key === installStatus);
  // Phase A.5: Gate "System Live" behind PortalStateEngine proof validation
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isComplete = installStatus === "Live" && isProofLive;
  const isError = installStatus === "Error";
  const currentIndex = (!isProofLive && installStatus === "Live") ? 2 : rawIndex;
  const isActive = currentIndex >= 0 && currentIndex < stages.length;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  const getStatusLabel = (idx) => {
    if (idx < currentIndex) return "Completed";
    if (idx === currentIndex) return isComplete ? "Completed" : "In Progress";
    return "Pending";
  };

  const statusCopy = isComplete
    ? "Your system is fully live because verification proof has passed."
    : isError
    ? "Setup paused — please check your credentials."
    : pipelineStatus
    ? `Current pipeline state: ${pipelineStatus}.`
    : "Provisioning progress is based on verified setup state, not fake live claims.";

  return (
    <div style={{
      background: "linear-gradient(180deg, #ffffff 0%, #F7FCFF 100%)",
      border: "1px solid rgba(0,174,239,0.15)",
      borderRadius: "22px",
      padding: "clamp(20px, 3vw, 30px)",
      marginBottom: "24px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 16px 42px rgba(0,59,143,0.08)",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg, #003B8F, #00AEEF, rgba(0,174,239,0.08))",
      }} />

      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(0, 174, 239, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(0, 174, 239, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 174, 239, 0); }
        }
        .deploy-stage-active {
          animation: pulse-ring 2.2s infinite;
        }
      `}</style>

      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "900", color: "rgba(0,174,239,0.78)", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 6px" }}>
              Deployment Pipeline
            </p>
            <p style={{ fontSize: "15px", fontWeight: "800", color: "#0A1628", margin: 0, letterSpacing: "-0.02em" }}>
              {statusCopy}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", border: "1px solid rgba(0,174,239,0.16)", background: "#fff", borderRadius: "999px", padding: "8px 12px" }}>
            {isComplete ? (
              <CheckCircle2 style={{ width: "18px", height: "18px", color: "#22c55e" }} />
            ) : !isError ? (
              <Loader2 style={{ width: "18px", height: "18px", color: "#00AEEF", animation: "spin 1s linear infinite" }} />
            ) : null}
            <span style={{ fontSize: "11px", fontWeight: "850", color: isComplete ? "#16a34a" : "#003B8F", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {isComplete ? "Verified" : "Proof-gated"}
            </span>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", position: "relative" }}>
            {stages.map((stage, idx) => {
              const isCompleted = isComplete ? idx <= currentIndex : idx < currentIndex;
              const isStageActive = idx === currentIndex && !isComplete;
              const isUpcoming = idx > currentIndex || currentIndex < 0;
              const StageIcon = stage.icon;

              return (
                <div key={stage.key} style={{
                  borderRadius: "18px",
                  padding: "14px",
                  background: isCompleted
                    ? "rgba(34,197,94,0.08)"
                    : isStageActive
                    ? "rgba(0,174,239,0.09)"
                    : "rgba(10,22,40,0.025)",
                  border: `1px solid ${
                    isCompleted
                      ? "rgba(34,197,94,0.24)"
                      : isStageActive
                      ? "rgba(0,174,239,0.28)"
                      : "rgba(10,22,40,0.06)"
                  }`,
                  minHeight: "118px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "14px" }}>
                    <div
                      className={isStageActive ? "deploy-stage-active" : ""}
                      style={{
                        width: "42px", height: "42px", borderRadius: "15px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isCompleted
                          ? "linear-gradient(135deg, #16a34a, #22c55e)"
                          : isStageActive
                          ? "linear-gradient(135deg, rgba(0,174,239,0.22), rgba(0,136,204,0.12))"
                          : "#ffffff",
                        border: `1px solid ${
                          isCompleted
                            ? "rgba(34,197,94,0.35)"
                            : isStageActive
                            ? "rgba(0,174,239,0.48)"
                            : "rgba(10,22,40,0.08)"
                        }`,
                        color: isCompleted ? "#fff" : isStageActive ? "#0088CC" : "rgba(10,22,40,0.28)",
                        boxShadow: isCompleted ? "0 10px 22px rgba(34,197,94,0.16)" : "none",
                        transition: "all 0.4s ease",
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? <CheckCircle2 style={{ width: "18px", height: "18px" }} /> : <StageIcon style={{ width: "18px", height: "18px" }} />}
                    </div>
                    <span style={{
                      fontSize: "9px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em",
                      color: isCompleted ? "#16a34a" : isStageActive ? "#0088CC" : "rgba(10,22,40,0.34)",
                    }}>
                      {getStatusLabel(idx)}
                    </span>
                  </div>

                  <p style={{
                    fontSize: "12px", fontWeight: "900", margin: "0 0 5px",
                    color: isUpcoming ? "rgba(10,22,40,0.46)" : "#0A1628",
                    letterSpacing: "-0.01em",
                  }}>
                    {stage.label}
                  </p>
                  <p style={{ fontSize: "11px", lineHeight: 1.45, color: isUpcoming ? "rgba(10,22,40,0.35)" : "rgba(10,22,40,0.58)", margin: 0 }}>
                    {idx === 3 ? "Only shown live after proof passes." : "Verified by setup status."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {isError && (
          <div style={{
            marginTop: "16px", padding: "12px 16px",
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "12px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: "#ef4444", margin: 0 }}>
              Setup paused due to missing credentials. Add your Twilio and email settings to resume.
            </p>
          </div>
        )}

        {!isError && !isComplete && (
          <div style={{
            marginTop: "16px", padding: "12px 16px",
            background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.18)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <ShieldCheck style={{ width: "15px", height: "15px", color: "#0088CC", flexShrink: 0 }} />
            <p style={{ fontSize: "12px", fontWeight: "700", color: "#0088CC", margin: 0 }}>
              Final live status is held until verification proof is available. That keeps the dashboard truthful.
            </p>
          </div>
        )}
      </div>

      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

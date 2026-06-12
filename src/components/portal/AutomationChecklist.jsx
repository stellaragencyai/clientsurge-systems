/**
 * AutomationChecklist + SetupProgressBar — #265 #266
 * Reads live data from AutomationChecklist and AutomationChecklistStep entities.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const FALLBACK_FIELDS = [
  { key: "twilio_configured", label: "Twilio SMS configured", icon: "📱" },
  { key: "instant_response_built", label: "Instant lead response live", icon: "⚡" },
  { key: "missed_call_textback", label: "Missed call text-back", icon: "📞" },
  { key: "followup_sequence_built", label: "Follow-up sequences built", icon: "🔁" },
  { key: "lead_sources_connected", label: "Lead sources connected", icon: "🔗" },
  { key: "messages_customized", label: "Messages customized", icon: "✍️" },
  { key: "end_to_end_tested", label: "End-to-end tested", icon: "✅" },
  { key: "dashboard_delivered", label: "Dashboard delivered", icon: "📊" },
  { key: "went_live", label: "System is live", icon: "🚀" },
];

export default function AutomationChecklist({ order_id }) {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order_id) {
      setChecklists([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const response = await base44.functions.invoke("getClientPortalProjectActivity", {
          section: "checklist",
        });
        if (mounted) {
          setChecklists(response?.checklists || []);
        }
      } catch {
        if (mounted) {
          setChecklists([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [order_id]);

  const allSteps = checklists.flatMap((record) => record.steps || []);
  const completed = allSteps.filter((step) => step.status === "complete").length;
  const pct = allSteps.length > 0 ? Math.round((completed / allSteps.length) * 100) : 0;

  if (loading) {
    return <div style={{ color: "#6B7280", fontSize: 13, padding: 20 }}>Loading setup status...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#9CA3AF", fontSize: 13 }}>Setup Progress</span>
          <span style={{ color: pct === 100 ? "#00FFB3" : "#F59E0B", fontWeight: 700, fontSize: 13 }}>{pct}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 9999, height: 8, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 9999,
              width: `${pct}%`,
              transition: "width 0.6s ease",
              background: pct === 100 ? "linear-gradient(90deg,#00D4FF,#00FFB3)" : "linear-gradient(90deg,#00AEEF,#7C3AED)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checklists.length === 0 ? (
          <div style={{ color: "#6B7280", fontSize: 13, padding: "12px 4px" }}>
            No install checklist has been initialized for this order yet.
          </div>
        ) : (
          checklists.map((checklist) => {
            const steps = checklist.steps || [];
            const stepCount = steps.length || FALLBACK_FIELDS.length;
            const doneCount = steps.filter((step) => step.status === "complete").length;
            return (
              <div
                key={checklist.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <p style={{ color: "#D1FAE5", fontSize: 13, fontWeight: 700, margin: 0 }}>
                      {checklist.business_name || checklist.service_key}
                    </p>
                    <p style={{ color: "#6B7280", fontSize: 11, margin: "4px 0 0" }}>
                      {checklist.service_key} · {doneCount}/{stepCount} steps complete
                    </p>
                  </div>
                  <span style={{ color: checklist.status === "active" ? "#00FFB3" : "#F59E0B", fontSize: 11, fontWeight: 700 }}>
                    {checklist.status || "not_started"}
                  </span>
                </div>
                {(steps.length ? steps : FALLBACK_FIELDS).map((item) => {
                  const done = steps.length ? item.status === "complete" : checklist?.[item.key];
                  const label = steps.length ? item.step_label : item.label;
                  const icon = steps.length ? "•" : item.icon;
                  const stepKey = steps.length ? item.id : item.key;
                  return (
                    <div
                      key={stepKey}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        background: done ? "rgba(0,255,179,0.04)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${done ? "rgba(0,255,179,0.15)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 10,
                      }}
                    >
                      <span style={{ fontSize: 16, minWidth: 20 }}>{icon}</span>
                      <span style={{ color: done ? "#D1FAE5" : "#6B7280", fontSize: 13, flex: 1 }}>{label}</span>
                      <span style={{ color: done ? "#00FFB3" : "rgba(255,255,255,0.15)", fontSize: 16 }}>{done ? "✓" : "○"}</span>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * OnboardingFieldsPanel — #277
 * Makes onboarding_complete, went_live, twilio_configured visible and toggleable in admin UI.
 */
import { useState } from "react";

const FIELDS = [
  { key: "twilio_configured",        label: "Twilio Configured",         icon: "📱" },
  { key: "lead_sources_connected",   label: "Lead Sources Connected",    icon: "🔗" },
  { key: "instant_response_built",   label: "Instant Response Built",    icon: "⚡" },
  { key: "followup_sequence_built",  label: "Follow-Up Sequence Built",  icon: "🔁" },
  { key: "missed_call_textback",     label: "Missed Call Textback",      icon: "📞" },
  { key: "messages_customized",      label: "Messages Customized",       icon: "✍️" },
  { key: "end_to_end_tested",        label: "End-to-End Tested",        icon: "✅" },
  { key: "dashboard_delivered",      label: "Dashboard Delivered",       icon: "📊" },
  { key: "went_live",                label: "Went Live",                 icon: "🚀" },
  { key: "onboarding_complete",      label: "Onboarding Complete",       icon: "🎉" },
];

export default function OnboardingFieldsPanel({ onboarding, onUpdate }) {
  const [saving, setSaving] = useState({});

  const toggle = async (field) => {
    setSaving(s => ({ ...s, [field]: true }));
    try {
      const { ClientOnboarding } = await import("@/api/entities");
      await ClientOnboarding.update(onboarding.id, { [field]: !onboarding[field] });
      onUpdate?.({ ...onboarding, [field]: !onboarding[field] });
    } finally {
      setSaving(s => ({ ...s, [field]: false }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ color: "#9CA3AF", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
        Onboarding Steps
      </p>
      {FIELDS.map(f => (
        <div key={f.key} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: onboarding[f.key] ? "rgba(0,255,179,0.04)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${onboarding[f.key] ? "rgba(0,255,179,0.15)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{f.icon}</span>
            <span style={{ color: onboarding[f.key] ? "#D1FAE5" : "#9CA3AF", fontSize: 13 }}>{f.label}</span>
          </div>
          <button onClick={() => toggle(f.key)} disabled={saving[f.key]} style={{
            background: onboarding[f.key] ? "rgba(0,255,179,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${onboarding[f.key] ? "rgba(0,255,179,0.3)" : "rgba(255,255,255,0.1)"}`,
            color: onboarding[f.key] ? "#00FFB3" : "#6B7280",
            borderRadius: 9999, padding: "4px 14px", fontSize: 11, fontWeight: 700,
            cursor: saving[f.key] ? "not-allowed" : "pointer",
          }}>
            {saving[f.key] ? "..." : onboarding[f.key] ? "✓ Done" : "Mark Done"}
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * GlobalAutomationToggle — master emergency switch to pause ALL outbound SMS/Email.
 * Critical operational safeguard during Twilio outages or carrier issues.
 * Writes a flag to AdminSettings that all automation functions should check.
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Power, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function GlobalAutomationToggle() {
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await base44.admin.entities.AdminSettings.list("-created_date", 1);
        if (settings?.[0]) {
          setSettingsId(settings[0].id);
          // Use a description field as a flag store (since no dedicated field exists yet)
          const desc = settings[0].description || "";
          setPaused(desc.includes("AUTOMATIONS_PAUSED=true"));
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const toggle = async () => {
    setSaving(true);
    setFeedback("");
    const newPaused = !paused;
    try {
      if (settingsId) {
        const current = await base44.admin.entities.AdminSettings.list("-created_date", 1);
        const desc = (current?.[0]?.description || "").replace(/AUTOMATIONS_PAUSED=(true|false)/g, "").trim();
        const newDesc = `${desc} AUTOMATIONS_PAUSED=${newPaused}`.trim();
        await base44.admin.entities.AdminSettings.update(settingsId, { description: newDesc });
      }
      setPaused(newPaused);
      setFeedback(newPaused ? "All automations paused." : "Automations resumed.");
      setTimeout(() => setFeedback(""), 4000);
    } catch {
      setFeedback("Failed to update. Try again.");
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div
      className="rounded-xl border px-4 py-3 flex items-center gap-4"
      style={{
        background: paused ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.05)",
        borderColor: paused ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.2)",
      }}
    >
      <div className="flex-1">
        <p className="text-sm font-bold text-foreground flex items-center gap-2">
          {paused ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
          Automation Master Switch
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {paused
            ? "⚠️ All outbound SMS & Email automations are PAUSED. Re-enable when ready."
            : "All automations are active and processing normally."}
        </p>
        {feedback && <p className="text-xs font-semibold mt-1" style={{ color: paused ? "#dc2626" : "#15803d" }}>{feedback}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all flex-shrink-0"
        style={{ background: paused ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#dc2626,#b91c1c)" }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
        {saving ? "Saving..." : paused ? "Resume All" : "Pause All"}
      </button>
    </div>
  );
}
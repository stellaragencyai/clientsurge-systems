/**
 * TriggerVoiceCallButton — #555
 * Admin lead detail: "Trigger Voice Call Now" button for HOT leads only.
 * Calls triggerOutboundCall backend function.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Phone } from "lucide-react";

export default function TriggerVoiceCallButton({ lead }) {
  const [calling, setCalling] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Only show for HOT leads (score >= 80 or status = "Hot")
  const isHot = (lead?.lead_score >= 80) || lead?.status === "Hot";
  if (!isHot) return null;

  const trigger = async () => {
    if (!lead?.phone) return alert("No phone number for this lead.");
    setCalling(true); setError(null);
    try {
      await base44.functions.invoke("triggerOutboundCall", { lead_id: lead.id, phone: lead.phone, business_name: lead.business_name });
      setDone(true);
    } catch (e) {
      setError("Failed to trigger call. Check Retell/Twilio config.");
    } finally { setCalling(false); }
  };

  return (
    <div style={{ marginTop: 12 }}>
      {done ? (
        <div style={{ color: "#00FFB3", fontSize: 13, fontWeight: 600 }}>✅ Voice call triggered successfully</div>
      ) : (
        <button onClick={trigger} disabled={calling}
          style={{ display: "flex", alignItems: "center", gap: 8, background: calling ? "rgba(168,85,247,0.2)" : "linear-gradient(135deg,#A855F7,#7C3AED)", color: "#fff", border: "none", borderRadius: 9999, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: calling ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(168,85,247,0.3)" }}>
          <Phone style={{ width: 14, height: 14 }} />
          {calling ? "Triggering..." : "Trigger Voice Call Now"}
        </button>
      )}
      {error && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}

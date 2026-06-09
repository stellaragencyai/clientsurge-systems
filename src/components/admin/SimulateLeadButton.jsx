/**
 * SimulateLeadButton — admin-only trigger to simulate a live inbound lead.
 * Fires a test payload to webhookLeadCapture for pipeline verification.
 * Used in QA tools and automation tracking panel.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const NICHES = [
  { label: "Med Spa", niche: "med_spa", name: "Test Client - Med Spa" },
  { label: "Dental", niche: "dental", name: "Test Client - Dental" },
  { label: "HVAC", niche: "hvac", name: "Test Client - HVAC" },
  { label: "Roofing", niche: "roofing", name: "Test Client - Roofing" },
];

export default function SimulateLeadButton({ compact = false }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedNiche, setSelectedNiche] = useState("med_spa");

  const simulate = async () => {
    setLoading(true);
    setResult(null);
    const niche = NICHES.find((n) => n.niche === selectedNiche) || NICHES[0];
    try {
      await base44.functions.invoke("submitLeadCapture", {
        full_name: niche.name,
        business_name: `${niche.label} Test Business`,
        email: `test+${Date.now()}@clientsurgesystems.com`,
        phone: "+16025550001",
        business_type: niche.label,
        problem: "Simulated inbound test lead from admin panel.",
        source: "admin_simulation",
        consent_given: true,
        consent_source: "admin_test",
        consent_text_version: "admin_sim_v1",
        requested_channels: ["sms", "email"],
      });
      setResult({ success: true, message: `Test lead simulated for ${niche.label}.` });
    } catch (err) {
      setResult({ success: false, message: err?.message || "Simulation failed." });
    }
    setLoading(false);
    setTimeout(() => setResult(null), 6000);
  };

  if (compact) {
    return (
      <button
        onClick={simulate}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
        Simulate Lead
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <p className="text-sm font-bold text-foreground flex items-center gap-2">
        <Zap className="w-4 h-4 text-violet-600" /> Simulate Inbound Lead
      </p>
      <p className="text-xs text-muted-foreground">
        Fire a test lead through the full pipeline to verify SMS, email, and AI routing.
      </p>
      <div className="flex gap-2 flex-wrap">
        {NICHES.map((n) => (
          <button
            key={n.niche}
            onClick={() => setSelectedNiche(n.niche)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              selectedNiche === n.niche
                ? "border-violet-400 bg-violet-50 text-violet-700"
                : "border-border text-muted-foreground hover:border-violet-300"
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>
      <button
        onClick={simulate}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60 transition-all"
        style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {loading ? "Simulating..." : "Run Simulation"}
      </button>
      {result && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
            result.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {result.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {result.message}
        </div>
      )}
    </div>
  );
}
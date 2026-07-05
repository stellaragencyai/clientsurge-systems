import { StatusPill, statusColorFromGate } from "./helpers";

const CATEGORY_MAP = {
  "Automation Product Delivery": ["automation_delivery_gate"],
  "Analytics / Tracking / Proof": ["analytics_tracking_gate", "proof_engine_gate", "ga4_gate"],
  "Checkout / Revenue": ["checkout_revenue_gate", "stripe_gate", "payment_gate"],
  "Client Portal": ["client_portal_gate", "portal_live_gate"],
  "Onboarding": ["onboarding_gate", "onboarding_ready_gate"],
  "AI Voice": ["ai_voice_gate", "voice_frontline_gate", "elevenlabs_gate"],
  "Security / Technical Reliability": ["security_gate", "technical_reliability_gate", "webhook_security_gate"],
  "Website / CTA / Lead Capture": ["website_gate", "cta_gate", "lead_capture_gate"],
};

const SPRINT1_KEYS = new Set(["instant_lead_response", "missed_call_text_back", "twilio_webhook_route_health", "automation_delivery_gate"]);

function CategoryCard({ title, gates }) {
  if (!gates || gates.length === 0) {
    return (
      <div className="rounded-xl border p-3" style={{ background: "#fafafa", borderColor: "#E5E7EB" }}>
        <p className="text-xs font-bold text-gray-700 mb-1">{title}</p>
        <p className="text-[10px] text-gray-400">No gates defined in this category</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border p-3" style={{ background: "#fff", borderColor: "#E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <p className="text-xs font-bold text-gray-700 mb-2">{title}</p>
      <div className="space-y-1.5">
        {gates.map((g) => {
          const isSprint1 = SPRINT1_KEYS.has(g.gate_key);
          return (
            <div key={g.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] text-gray-600 truncate">{g.gate_name || g.gate_key}</span>
                {isSprint1 && <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 rounded">SPRINT 1</span>}
              </div>
              <StatusPill color={statusColorFromGate(g)} label={g.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FullPlatformGatesPanel({ gates }) {
  const allGates = gates || [];
  const sprint1Gates = allGates.filter((g) => SPRINT1_KEYS.has(g.gate_key));
  const fullPlatformGates = allGates.filter((g) => !SPRINT1_KEYS.has(g.gate_key));

  const sprint1AllPassed = sprint1Gates.every((g) => g.status === "proof_passed" || g.status === "approved");
  const fullPlatformAllPassed = fullPlatformGates.length > 0 && fullPlatformGates.every((g) => g.status === "approved" || g.status === "proof_passed");

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <h3 className="text-sm font-bold text-gray-900">Full Platform Gates</h3>
      </div>

      {/* Sprint 1 vs Full Platform banner */}
      <div className="rounded-lg p-3 mb-4 flex items-center gap-3" style={{ background: sprint1AllPassed ? "rgba(245,158,11,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${sprint1AllPassed ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)"}` }}>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-800">
            Sprint 1: {sprint1AllPassed ? "Conditional Go (QA scope only)" : "Not Ready"}
            <span className="text-gray-400 font-normal"> → Full Platform: {fullPlatformAllPassed ? "Ready" : "Not Fully Launch Ready"}</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Sprint 1 conditional-go does NOT imply full platform readiness.</p>
        </div>
      </div>

      {/* Uncategorized gates go into a catch-all */}
      {(() => {
        const categorized = new Set(Object.values(CATEGORY_MAP).flat());
        const uncategorized = allGates.filter((g) => !categorized.has(g.gate_key) && !SPRINT1_KEYS.has(g.gate_key));
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(CATEGORY_MAP).map(([cat, keys]) => {
              const catGates = allGates.filter((g) => keys.includes(g.gate_key));
              return <CategoryCard key={cat} title={cat} gates={catGates} />;
            })}
            {uncategorized.length > 0 && <CategoryCard title="Other Gates" gates={uncategorized} />}
          </div>
        );
      })()}
    </div>
  );
}
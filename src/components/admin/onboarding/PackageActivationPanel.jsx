import { useState } from "react";
import {
  Zap, Phone, Mail, Calendar, Star, RefreshCw,
  CheckCircle2, AlertCircle, Circle, Loader2,
  Brain, ShieldCheck, ChevronDown, ChevronUp,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const SERVICE_META = {
  instant_lead_response: { icon: Zap, label: "Instant Lead Response", color: "#0088CC" },
  missed_call_text_back: { icon: Phone, label: "Missed Call Text-Back", color: "#7C3AED" },
  nurture_sequence_14d: { icon: Mail, label: "14-Day Nurture Sequence", color: "#059669" },
  ai_booking_agent: { icon: Calendar, label: "AI Booking Agent", color: "#0077B6" },
  review_request: { icon: Star, label: "Review Request", color: "#DC2626" },
  lead_reactivation: { icon: RefreshCw, label: "Lead Reactivation", color: "#DB2777" },
};

const PACKAGE_SERVICES = {
  starter_system: ["instant_lead_response", "ai_booking_agent"],
  growth_system: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
  elite_system: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent", "lead_reactivation", "review_request"],
};

export default function PackageActivationPanel({ order }) {
  const [aiCheck, setAiCheck] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  if (!order) {
    return null;
  }

  const packageKey = order.pricing_summary?.package_key || order.package_type || order.selected_package_type;
  const services = packageKey
    ? (PACKAGE_SERVICES[packageKey] || [])
    : (order.items || []).map((item) => item.service_key).filter(Boolean);
  const packageLabel = packageKey
    ? packageKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Custom Bundle";

  const allLive = services.length > 0 && services.every((serviceKey) => {
    const item = (order.items || []).find((entry) => entry.service_key === serviceKey);
    return item?.install_status === "Live";
  });

  const runAiCheck = async () => {
    setCheckLoading(true);
    setError("");
    setAiCheck(null);
    try {
      const res = await base44.functions.invoke("aiOnboardingIntelligence", {
        order_id: order.id,
        package_key: packageKey,
        service_keys: services,
      });
      setAiCheck(res.data);
    } catch (checkError) {
      setError(checkError?.message || "AI check failed");
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden mt-4"
      style={{ borderColor: allLive ? "rgba(34,197,94,0.35)" : "rgba(0,174,239,0.25)" }}
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,174,239,0.1)" }}>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Package Activation</p>
            <p className="text-xs text-muted-foreground">{packageLabel} · {services.length} services</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allLive && (
            <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> All Live
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border bg-white">
          <div className="pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Services In This Package</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {services.map((serviceKey) => {
                const meta = SERVICE_META[serviceKey];
                const item = (order.items || []).find((entry) => entry.service_key === serviceKey);
                const status = item?.install_status || "Paid";
                const isLive = status === "Live";
                const isError = status === "Error";
                const Icon = meta?.icon || Circle;

                return (
                  <div
                    key={serviceKey}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border"
                    style={{
                      background: isLive ? "rgba(34,197,94,0.06)" : isError ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.02)",
                      borderColor: isLive ? "rgba(34,197,94,0.25)" : isError ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta?.color}18` }}>
                      <Icon className="w-3 h-3" style={{ color: meta?.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{meta?.label || serviceKey}</p>
                      <p className={`text-[10px] font-semibold ${isLive ? "text-green-700" : isError ? "text-red-600" : "text-muted-foreground"}`}>
                        {status}
                      </p>
                    </div>
                    {isLive && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 ml-auto" />}
                    {isError && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {aiCheck && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-wider">AI Pre-Flight Analysis</p>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${aiCheck.ready_to_activate ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {aiCheck.ready_to_activate ? "✓ Ready" : "⚠ Blockers Found"}
                </span>
              </div>

              {aiCheck.blockers?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Blockers</p>
                  {aiCheck.blockers.map((blocker, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiCheck.auto_filled?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Auto-Filled Defaults</p>
                  {aiCheck.auto_filled.map((filled, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{filled}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiCheck.warnings?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Warnings</p>
                  {aiCheck.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiCheck.activation_sequence && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Activation Order</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiCheck.activation_sequence.map((serviceKey, index) => {
                      const meta = SERVICE_META[serviceKey];
                      return (
                        <span
                          key={serviceKey}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${meta?.color}15`, color: meta?.color }}
                        >
                          {index + 1}. {meta?.label || serviceKey}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={runAiCheck}
              disabled={checkLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {checkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
              {checkLoading ? "Analyzing..." : "AI Pre-Flight Check"}
            </button>

            {allLive && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                All Services Live
              </div>
            )}
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 space-y-1.5">
            <p className="font-semibold">Legacy bulk activation is retired.</p>
            <p>
              The old <code>aiPackageOrchestrator</code> path is intentionally disabled. Use the canonical install workspace and per-service order status updates instead of trying to auto-activate from this panel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Zap, Phone, Mail, Calendar, Star, RefreshCw,
  CheckCircle2, AlertCircle, Circle, Loader2,
  PlayCircle, Brain, ShieldCheck, ChevronDown, ChevronUp
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const SERVICE_META = {
  instant_lead_response:  { icon: Zap,       label: "Instant Lead Response",     color: "#0088CC" },
  missed_call_text_back:  { icon: Phone,      label: "Missed Call Text-Back",     color: "#7C3AED" },
  nurture_sequence_14d:   { icon: Mail,       label: "14-Day Nurture Sequence",   color: "#059669" },
  ai_booking_agent:       { icon: Calendar,   label: "AI Booking Agent",          color: "#D97706" },
  review_request:         { icon: Star,       label: "Review Request",            color: "#DC2626" },
  lead_reactivation:      { icon: RefreshCw,  label: "Lead Reactivation",         color: "#DB2777" },
};

const PACKAGE_SERVICES = {
  starter_system: ["instant_lead_response", "ai_booking_agent"],
  growth_system:  ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
  elite_system:   ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent", "lead_reactivation", "review_request"],
};

export default function PackageActivationPanel({ client, order, onUpdate }) {
  const [aiCheck, setAiCheck] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateResult, setActivateResult] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  if (!order) return null;

  const packageKey = order.pricing_summary?.package_key || order.package_type || order.selected_package_type;
  const services = packageKey ? (PACKAGE_SERVICES[packageKey] || []) : (order.items || []).map(i => i.service_key).filter(Boolean);
  const packageLabel = packageKey
    ? packageKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "Custom Bundle";

  const allLive = services.length > 0 && services.every(sk => {
    const item = (order.items || []).find(i => i.service_key === sk);
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
    } catch (e) {
      setError(e?.message || "AI check failed");
    } finally {
      setCheckLoading(false);
    }
  };

  const runActivation = async () => {
    setActivating(true);
    setError("");
    setActivateResult(null);
    try {
      const res = await base44.functions.invoke("aiPackageOrchestrator", {
        order_id: order.id,
        package_key: packageKey,
        service_keys: services,
      });
      setActivateResult(res.data);
      onUpdate();
    } catch (e) {
      setError(e?.message || "Activation failed");
    } finally {
      setActivating(false);
    }
  };

  const canActivate = !allLive && !activating;

  return (
    <div
      className="rounded-2xl border overflow-hidden mt-4"
      style={{ borderColor: allLive ? "rgba(34,197,94,0.35)" : "rgba(0,174,239,0.25)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(p => !p)}
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
          {/* Service Status Grid */}
          <div className="pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Services In This Package</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {services.map(sk => {
                const meta = SERVICE_META[sk];
                const item = (order.items || []).find(i => i.service_key === sk);
                const status = item?.install_status || "Paid";
                const isLive = status === "Live";
                const isError = status === "Error";
                const Icon = meta?.icon || Circle;
                return (
                  <div
                    key={sk}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border"
                    style={{
                      background: isLive ? "rgba(34,197,94,0.06)" : isError ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.02)",
                      borderColor: isLive ? "rgba(34,197,94,0.25)" : isError ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta?.color}18` }}>
                      <Icon className="w-3 h-3" style={{ color: meta?.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{meta?.label || sk}</p>
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

          {/* AI Pre-Flight Check */}
          {aiCheck && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-wider">AI Pre-Flight Analysis</p>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${aiCheck.ready_to_activate ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {aiCheck.ready_to_activate ? "✓ Ready" : "⚠ Blockers Found"}
                </span>
              </div>

              {aiCheck.blockers?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Blockers</p>
                  {aiCheck.blockers.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiCheck.auto_filled?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Auto-Filled Defaults</p>
                  {aiCheck.auto_filled.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiCheck.warnings?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Warnings</p>
                  {aiCheck.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiCheck.activation_sequence && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Activation Order</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiCheck.activation_sequence.map((sk, i) => {
                      const meta = SERVICE_META[sk];
                      return (
                        <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${meta?.color}15`, color: meta?.color }}>
                          {i + 1}. {meta?.label || sk}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activation Result */}
          {activateResult && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm font-bold text-green-800">Activation Launched</p>
              </div>
              {activateResult.services_queued?.length > 0 && (
                <p className="text-xs text-green-700">
                  Queued: {activateResult.services_queued.map(sk => SERVICE_META[sk]?.label || sk).join(", ")}
                </p>
              )}
              {activateResult.message && (
                <p className="text-xs text-green-700">{activateResult.message}</p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={runAiCheck}
              disabled={checkLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {checkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
              {checkLoading ? "Analyzing..." : "AI Pre-Flight Check"}
            </button>

            {!allLive && (
              <button
                onClick={runActivation}
                disabled={!canActivate || (aiCheck && !aiCheck.ready_to_activate)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40"
                style={{
                  background: canActivate && (!aiCheck || aiCheck.ready_to_activate)
                    ? "linear-gradient(135deg,#0088CC,#003B8F)"
                    : undefined,
                  cursor: canActivate && (!aiCheck || aiCheck.ready_to_activate) ? "pointer" : "not-allowed",
                }}
              >
                {activating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                {activating ? "Activating..." : "Activate All Services"}
              </button>
            )}

            {allLive && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                All Services Live
              </div>
            )}
          </div>

          {aiCheck && !aiCheck.ready_to_activate && (
            <p className="text-xs text-muted-foreground">
              Fix the blockers above before activating, or run the check again after updating credentials.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
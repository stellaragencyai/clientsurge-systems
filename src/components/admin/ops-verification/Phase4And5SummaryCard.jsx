/**
 * Phase 4+5 Combined Readiness Summary — top-level card showing both phases
 * and full platform impact (Phase 3 parked = not 100%).
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Package, Monitor, Ban, AlertTriangle } from "lucide-react";
import { StatusPill } from "./helpers";

export default function Phase4And5SummaryCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getPhase4And5Readiness", {});
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load Phase 4+5 summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const p4 = data?.phase_4;
  const p5 = data?.phase_5;
  const p3 = data?.phase_3_parked;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}>
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Phase 4 + 5 Combined Readiness</p>
            <p className="text-[11px] text-gray-400">Onboarding/Install OS + Client Portal/Updates — truth-based</p>
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} className="p-1 rounded hover:bg-gray-50 disabled:opacity-50" title="Refresh">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <RefreshCw className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {p4 && p5 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Phase 4 */}
            <div className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#00AEEF]" />
                  <span className="text-xs font-bold text-gray-900">Phase 4: Onboarding + Install OS</span>
                </div>
                <StatusPill
                  color={p4.complete ? "green" : p4.readiness_score > 0 ? "yellow" : "red"}
                  label={p4.complete ? "Complete" : p4.readiness_score > 0 ? `${p4.readiness_score}%` : "Blocked"}
                />
              </div>
              <p className="text-[11px] text-gray-500 mb-1">
                <strong>Blockers:</strong> {p4.blockers?.length || 0}
              </p>
              <p className="text-[11px] text-gray-500 mb-1">
                <strong>Next:</strong> {p4.next_action}
              </p>
            </div>

            {/* Phase 5 */}
            <div className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#00AEEF]" />
                  <span className="text-xs font-bold text-gray-900">Phase 5: Client Portal + Updates</span>
                </div>
                <StatusPill
                  color={p5.complete ? "green" : p5.total_portals > 0 ? "yellow" : "red"}
                  label={p5.complete ? "Ready" : p5.total_portals > 0 ? "Partial" : "Blocked"}
                />
              </div>
              <p className="text-[11px] text-gray-500 mb-1">
                <strong>Portals:</strong> {p5.total_portals} ({p5.portals_safe_to_render} safe)
              </p>
              <p className="text-[11px] text-gray-500 mb-1">
                <strong>Next:</strong> {p5.next_action}
              </p>
            </div>
          </div>
        )}

        {/* Phase 3 parked */}
        {p3 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-start gap-2">
            <Ban className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-gray-700">Phase 3 (AI Booking Agent) — Parked / Skipped</p>
              <p className="text-[11px] text-gray-500">{p3.reason}</p>
            </div>
          </div>
        )}

        {/* Full platform impact */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Full Platform Impact</p>
            <p className="text-[11px] text-amber-700">{data?.full_platform_impact}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              <strong>Platform 100%:</strong> {data?.full_platform_100_percent ? "Yes" : "No — blocked by Phase 3"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
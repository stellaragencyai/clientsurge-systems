/**
 * Phase 5 — Client Portal + Status Updates panel.
 * Shows portal readiness, access status, linked records, truth checks, and blockers.
 * Conservative, truth-based — no fake progress.
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Eye, Monitor, MessageSquare, ShieldCheck, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import { StatusPill } from "./helpers";

export default function Phase5ClientPortalPanel() {
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
      setError(err.message || "Failed to load Phase 5 data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const p5 = data?.phase_5;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,174,239,0.10)" }}>
            <Monitor className="w-4 h-4 text-[#00AEEF]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Phase 5 — Client Portal + Status Updates</p>
            <p className="text-[11px] text-gray-400">Truthful client-facing progress, automations, proof, and support</p>
          </div>
        </div>
        <button onClick={fetchData} disabled={loading} className="p-1 rounded hover:bg-gray-50 disabled:opacity-50" title="Refresh">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <RefreshCw className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>

      <div className="px-4 py-3 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {p5 && (
          <>
            {/* Portal readiness summary */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400">Portals</span>
                <span className={`text-2xl font-bold ${p5.total_portals === 0 ? "text-red-600" : "text-gray-900"}`}>
                  {p5.total_portals}
                </span>
              </div>
              <StatusPill
                color={p5.complete ? "green" : p5.total_portals > 0 ? "yellow" : "red"}
                label={p5.complete ? "Portal Infrastructure Ready" : p5.total_portals > 0 ? "Partial — Gaps Remain" : "Blocked — No Portals"}
              />
            </div>

            {/* Portal counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <PortalTile icon={Monitor} label="Total Portals" value={p5.total_portals} />
              <PortalTile icon={CheckCircle2} label="Active" value={p5.portals_active} color="green" />
              <PortalTile icon={Eye} label="Access Enabled" value={p5.portals_access_enabled} color={p5.portals_access_enabled === p5.total_portals && p5.total_portals > 0 ? "green" : "amber"} />
              <PortalTile icon={ShieldCheck} label="Linked Project" value={p5.portals_with_linked_project} total={p5.total_portals} />
              <PortalTile icon={ShieldCheck} label="Linked Install OS" value={p5.portals_with_install_os} total={p5.total_portals} />
              <PortalTile icon={CheckCircle2} label="Safe to Render" value={p5.portals_safe_to_render} total={p5.total_portals} color="green" />
            </div>

            {/* Gates */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">LaunchGates</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {Object.entries(p5.gates || {}).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-[11px] font-semibold text-gray-600">{key.replace(/_/g, " ")}</span>
                    <StatusPill color={status === "proof_passed" ? "green" : status === "partial" ? "yellow" : "red"} label={status.replace(/_/g, " ")} />
                  </div>
                ))}
              </div>
            </div>

            {/* Truth check */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs font-bold text-gray-700">Client-Facing Truth Check</p>
              </div>
              <p className="text-[11px] text-gray-500">
                {p5.total_portals === 0
                  ? "No portals exist — no client-facing data to verify"
                  : p5.portals_safe_to_render === p5.total_portals
                    ? "All portals have linked data and access enabled — safe to render truthful status"
                    : "Some portals lack linked data or access — client portal may show incomplete/blocked status"}
              </p>
            </div>

            {/* Status update model */}
            <div className="rounded-lg border border-gray-100 px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-xs font-bold text-gray-700">Status Update Timeline</p>
              </div>
              <p className="text-[11px] text-gray-500">
                Status updates displayed from CommunicationEvent/CommunicationLog records. No external sends during this build.
                Timeline entries: onboarding started, install checklist created, configuration in progress, proof passed, approval needed, blocked/missing info.
              </p>
            </div>

            {/* Blockers */}
            {p5.blockers?.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-xs font-bold text-amber-800">Blockers</p>
                </div>
                <ul className="space-y-0.5">
                  {p5.blockers.map((b, i) => (
                    <li key={i} className="text-[11px] text-amber-700">• {b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next action */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase text-gray-400">Next:</span>
              <p className="text-[11px] text-gray-700">{p5.next_action}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PortalTile({ icon: Icon, label, value, total, color = "gray" }) {
  const colors = {
    gray: "bg-gray-50 border-gray-100 text-gray-900",
    green: "bg-green-50 border-green-200 text-green-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  const complete = total !== undefined && value === total && total > 0;
  const hasGaps = total !== undefined && value < total;
  const cls = complete ? colors.green : hasGaps ? colors.amber : colors[color] || colors.gray;
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${cls}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" />
        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      </div>
      <p className="text-lg font-bold">
        {value}{total !== undefined ? `/${total}` : ""}
      </p>
    </div>
  );
}
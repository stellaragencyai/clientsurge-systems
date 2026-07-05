/**
 * Phase 4 — Client Onboarding + Installation OS panel.
 * Shows order→client→project→install OS→checklist→proof linkage chain,
 * readiness score, blockers, and next action. Truth-based, no fake completion.
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Link2, Package, User, FolderKanban, ClipboardList, ShieldCheck, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import { StatusPill, safeJsonParse } from "./helpers";

export default function Phase4OnboardingPanel() {
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
      setError(err.message || "Failed to load Phase 4 data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const p4 = data?.phase_4;
  const chains = data?.chains || [];
  const checklistCoverage = data?.checklist_coverage || {};

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,174,239,0.10)" }}>
            <Package className="w-4 h-4 text-[#00AEEF]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Phase 4 — Client Onboarding + Installation OS</p>
            <p className="text-[11px] text-gray-400">Order → Client → Project → Install OS → Checklist → Proof linkage</p>
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

        {p4 && (
          <>
            {/* Readiness score */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400">Readiness</span>
                <span className={`text-2xl font-bold ${p4.readiness_score === 100 ? "text-green-600" : p4.readiness_score > 0 ? "text-amber-600" : "text-red-600"}`}>
                  {p4.readiness_score}%
                </span>
              </div>
              <StatusPill
                color={p4.complete ? "green" : p4.readiness_score > 0 ? "yellow" : "red"}
                label={p4.complete ? "Structure Complete" : p4.readiness_score > 0 ? "Partial — Gaps Remain" : "Blocked"}
              />
            </div>

            {/* Linkage chain counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <LinkTile icon={Package} label="Orders" value={p4.total_orders} />
              <LinkTile icon={User} label="Clients Linked" value={p4.clients_linked} total={p4.total_orders} />
              <LinkTile icon={FolderKanban} label="Projects Linked" value={p4.projects_linked} total={p4.total_orders} />
              <LinkTile icon={ClipboardList} label="Onboarding Clients" value={p4.onboarding_clients_linked} total={p4.total_orders} />
              <LinkTile icon={ShieldCheck} label="Install OS Created" value={p4.install_os_created} total={p4.total_orders} />
              <LinkTile icon={ClipboardList} label="Checklists Seeded" value={p4.checklists_seeded} total={p4.total_orders} />
              <LinkTile icon={CheckCircle2} label="Proof Logs Exist" value={p4.proof_logs_exist} total={p4.total_orders} />
            </div>

            {/* Linkage chain visualization */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Linked Record Chain</p>
              <div className="flex items-center gap-1 flex-wrap text-[11px]">
                <ChainLink icon={Package} label="Order" active={p4.total_orders > 0} />
                <ChainArrow />
                <ChainLink icon={User} label="Client" active={p4.clients_linked > 0} />
                <ChainArrow />
                <ChainLink icon={FolderKanban} label="Project" active={p4.projects_linked > 0} />
                <ChainArrow />
                <ChainLink icon={ShieldCheck} label="Install OS" active={p4.install_os_created > 0} />
                <ChainArrow />
                <ChainLink icon={ClipboardList} label="Checklist" active={p4.checklists_seeded > 0} />
                <ChainArrow />
                <ChainLink icon={CheckCircle2} label="Proof" active={p4.proof_logs_exist > 0} />
                <ChainArrow />
                <ChainLink icon={Link2} label="Portal" active={(data?.phase_5?.total_portals || 0) > 0} />
              </div>
            </div>

            {/* Gates */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">LaunchGates</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(p4.gates || {}).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-[11px] font-semibold text-gray-600">{key.replace(/_/g, " ")}</span>
                    <StatusPill color={status === "proof_passed" ? "green" : status === "partial" ? "yellow" : "red"} label={status.replace(/_/g, " ")} />
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist coverage */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Checklist Seed Coverage</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px]">
                {Object.entries(checklistCoverage).map(([sk, cov]) => (
                  <div key={sk} className="flex items-center justify-between rounded px-2 py-1" style={{ background: cov.parked ? "rgba(107,114,128,0.05)" : "transparent" }}>
                    <span className="text-gray-600 font-semibold flex items-center gap-1">
                      {cov.parked && <Ban className="w-2.5 h-2.5 text-gray-400" />}
                      {sk.replace(/_/g, " ")}
                      {cov.parked && <span className="text-[9px] text-gray-400">(parked)</span>}
                    </span>
                    <span className="text-gray-500">
                      {cov.total} total · {cov.active} active · {cov.proof_passed} proof
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Blockers */}
            {p4.blockers?.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-xs font-bold text-amber-800">Blockers</p>
                </div>
                <ul className="space-y-0.5">
                  {p4.blockers.map((b, i) => (
                    <li key={i} className="text-[11px] text-amber-700">• {b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next action */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase text-gray-400">Next:</span>
              <p className="text-[11px] text-gray-700">{p4.next_action}</p>
            </div>
          </>
        )}

        {/* Sample chains */}
        {chains.length > 0 && (
          <details className="text-[11px]">
            <summary className="cursor-pointer text-gray-500 font-semibold hover:text-gray-700">Sample Linkage Chains ({Math.min(chains.length, 20)})</summary>
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {chains.map((c) => (
                <div key={c.order_id} className="rounded border border-gray-100 px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 truncate">{c.business_name}</span>
                    <StatusPill color={c.onboarding_stage === "live" ? "green" : c.missing_links.length > 0 ? "red" : "yellow"} label={c.onboarding_stage.replace(/_/g, " ")} />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                    {c.missing_links.length > 0 ? `Missing: ${c.missing_links.join(", ")}` : "All links present"}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Phase 3 parked warning */}
        {data?.phase_3_parked && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <Ban className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-bold text-gray-700">Phase 3 (AI Booking Agent) — Parked</p>
            </div>
            <p className="text-[11px] text-gray-500">{data.phase_3_parked.reason}</p>
            <p className="text-[11px] text-gray-500 mt-0.5"><strong>Impact:</strong> {data.phase_3_parked.impact}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkTile({ icon: Icon, label, value, total }) {
  const complete = total !== undefined && value === total;
  const hasGaps = total !== undefined && value < total;
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${complete ? "bg-green-50 border-green-200" : hasGaps ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={`w-3 h-3 ${complete ? "text-green-600" : hasGaps ? "text-amber-600" : "text-gray-400"}`} />
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className={`text-lg font-bold ${complete ? "text-green-700" : hasGaps ? "text-amber-700" : "text-gray-900"}`}>
        {value}{total !== undefined ? `/${total}` : ""}
      </p>
    </div>
  );
}

function ChainLink({ icon: Icon, label, active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${active ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-400 border border-gray-100"}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function ChainArrow() {
  return <span className="text-gray-300">→</span>;
}
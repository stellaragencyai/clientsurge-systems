import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { StatusPill, EvidenceRow, fmtDate } from "./helpers";
import { Loader2, RefreshCw, FlaskConical, ShieldCheck, AlertTriangle, MessageSquare, Mail, Pause, Ban } from "lucide-react";

const STATUS_COLOR = {
  pending: "gray",
  ready_for_proof: "yellow",
  pass: "green",
  fail: "red",
};

export default function Sprint2ScaffoldingPanel() {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchScaffolding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getSprint2Scaffolding", {});
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load Sprint 2 scaffolding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScaffolding(); }, [fetchScaffolding]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setError(null);
    try {
      await base44.functions.invoke("seedSprint2Scaffolding", {});
      await fetchScaffolding();
    } catch (err) {
      setError(err.message || "Failed to seed Sprint 2 scaffolding");
    } finally {
      setSeeding(false);
    }
  }, [fetchScaffolding]);

  const hasChecklistGaps = data?.checklist_warnings?.length > 0;
  const needsSeeding = data?.checklists?.inbound_sms_assistant?.exists === false || data?.checklists?.nurture_sequence_14d?.exists === false;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
          <h3 className="text-sm font-bold text-gray-900">Sprint 2 Scaffolding — Proof Workflows, Cadence & Rules</h3>
        </div>
        <div className="flex items-center gap-2">
          {(needsSeeding || hasChecklistGaps) && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
              {seeding ? "Seeding…" : "Seed Scaffolding"}
            </button>
          )}
          <button
            onClick={fetchScaffolding}
            disabled={loading}
            className="p-1 rounded hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Next most important action */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-start gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600 flex-shrink-0 mt-0.5">Next Action:</span>
            <span className="text-xs text-blue-900 font-medium">{data.next_most_important_action}</span>
          </div>

          {/* Checklist warnings */}
          {hasChecklistGaps && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-xs font-bold text-amber-700">Checklist Reconciliation Warnings</p>
              </div>
              <ul className="space-y-1">
                {data.checklist_warnings.map((w, i) => (
                  <li key={i} className="text-[11px] text-amber-600 pl-4">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Proof workflows */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Proof Workflows (5)</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.proof_workflows.map((wf) => (
                <ProofWorkflowCard key={wf.key} wf={wf} />
              ))}
            </div>
          </div>

          {/* Intent classification matrix */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Intent Classification Matrix (7 Labels)
            </p>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-bold text-gray-500">Label</th>
                      <th className="text-left px-3 py-2 font-bold text-gray-500">Description</th>
                      <th className="text-left px-3 py-2 font-bold text-gray-500">Example Triggers</th>
                      <th className="text-center px-3 py-2 font-bold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.intent_labels.map((label) => (
                      <tr key={label.key} className="border-b border-gray-50 last:border-0">
                        <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">{label.label}</td>
                        <td className="px-3 py-2 text-gray-600">{label.description}</td>
                        <td className="px-3 py-2 text-gray-500 text-[11px]">{label.example_triggers.join(", ")}</td>
                        <td className="px-3 py-2 text-center">
                          <StatusPill color="green" label={label.scaffolding_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Nurture cadence preview */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> 14-Day Nurture Cadence (6 Steps)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.nurture_cadence.map((step) => (
                <div key={step.day} className="rounded-xl border border-gray-200 bg-white p-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-900">Day {step.day}</span>
                    <StatusPill color="green" label={step.scaffolding_status} />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 mb-1">{step.step_name}</p>
                  <p className="text-[11px] text-gray-500 mb-1">{step.purpose}</p>
                  <p className="text-[11px] text-gray-600 bg-gray-50 rounded px-2 py-1">{step.content_guidance}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Channel:</span>
                    <span className="text-[10px] text-gray-600">{step.channel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nurture rules */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Nurture Rules & Guardrails
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.nurture_rules.map((rule) => {
                const Icon = rule.key === "pause_on_reply" ? Pause : rule.key === "opt_out_exclusion" ? Ban : ShieldCheck;
                return (
                  <div key={rule.key} className="rounded-lg border border-gray-200 bg-white p-2.5 flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">{rule.label}</p>
                      <p className="text-[10px] text-gray-500">{rule.description}</p>
                    </div>
                    <StatusPill color="green" label={rule.status} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidence summary */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Current Evidence Summary</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(data.evidence_summary || {}).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-gray-200 bg-white p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{key.replace(/_/g, " ")}</p>
                  <p className={`text-lg font-bold ${val > 0 ? "text-gray-900" : "text-gray-300"}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist status */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">AutomationChecklist Status</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(data.checklists || {}).map(([service, cl]) => (
                <div key={service} className="rounded-xl border border-gray-200 bg-white p-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <p className="text-xs font-bold text-gray-900 mb-2">{service.replace(/_/g, " ")}</p>
                  {cl.exists ? (
                    <div className="space-y-1">
                      <EvidenceRow label="Status" value={cl.status} warning={cl.status === "not_started"} />
                      <EvidenceRow label="Client Approved" value={cl.client_approved ? "Yes" : "No"} warning={cl.client_approved} />
                      <EvidenceRow label="Went Live At" value={cl.went_live_at ? fmtDate(cl.went_live_at) : "Not live"} />
                      <EvidenceRow label="Dashboard Excluded" value={cl.dashboard_excluded ? "Yes" : "No"} />
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      ⚠ Checklist row missing — click "Seed Scaffolding" to create
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {data.checked_at && (
            <p className="text-[10px] text-gray-300">Checked: {new Date(data.checked_at).toLocaleString()}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ProofWorkflowCard({ wf }) {
  const color = STATUS_COLOR[wf.current_status] || "gray";
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-gray-900">{wf.label}</p>
        <StatusPill color={color} label={wf.current_status} />
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Required Evidence</p>
          <ul className="space-y-0.5">
            {wf.required_evidence.map((e, i) => (
              <li key={i} className="text-[11px] text-gray-600 pl-3">• {e}</li>
            ))}
          </ul>
        </div>
        {wf.blocker && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            ⚠ {wf.blocker}
          </div>
        )}
        <p className="text-[11px] text-gray-600">
          <span className="font-bold text-gray-500">Next: </span>{wf.next_action}
        </p>
        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Safe to pass:</span>
          <StatusPill color={wf.safe_to_pass ? "green" : "red"} label={wf.safe_to_pass ? "Yes" : "No"} />
        </div>
      </div>
    </div>
  );
}
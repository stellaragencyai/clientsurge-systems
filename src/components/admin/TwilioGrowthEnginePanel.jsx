import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ShieldAlert, ShieldCheck, ShieldX, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronRight,
  Phone, MessageSquare, Mail, Zap, Star, RotateCcw, FileText,
  Radio, Mic, ClipboardList, Database, Wrench,
} from "lucide-react";
import TwilioGrowthEngineRepairQueue from "./TwilioGrowthEngineRepairQueue";
import { getRevenueImpact } from "@/lib/twilioGrowthRevenueImpact";
import MinimumDefinitionOfDone from "./MinimumDefinitionOfDone";
import AsanaSyncNotes from "./AsanaSyncNotes";
import LaunchReadinessSummary from "./twilio-growth/LaunchReadinessSummary";
import FirstLaunchScopeSummary from "./twilio-growth/FirstLaunchScopeSummary";
import CoreLaunchFirstWarning from "./twilio-growth/CoreLaunchFirstWarning";
import ProgressSinceLastAudit from "./twilio-growth/ProgressSinceLastAudit";
import EvidenceSourceMap from "./twilio-growth/EvidenceSourceMap";
import OwnershipBadge from "./twilio-growth/OwnershipBadge";
import OperatorNotes from "./twilio-growth/OperatorNotes";

const STATUS_STYLES = {
  green: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Proven" },
  yellow: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  red: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Not Done" },
};

const PROOF_STATUS_STYLES = {
  pass: { color: "#059669", label: "Pass" },
  pending: { color: "#D97706", label: "Pending" },
  fail: { color: "#DC2626", label: "Fail" },
  missing: { color: "#6B7280", label: "Missing" },
};

const SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  nurture_sequence_14d: "Nurture Sequence (14-Day)",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
};

const REQUIRED_EVIDENCE = {
  instant_lead_response: "CommunicationLog or CommunicationEvent tied to a real lead, with valid provider_message_id and final delivery proof (delivery_status=delivered).",
  missed_call_text_back: "Inbound call event plus related follow-up communication evidence, and no webhook 404/405 blocker.",
  inbound_sms_assistant: "Inbound SMS CommunicationEvent plus a classification/response record.",
  ai_voice_receptionist: "Inbound voice CommunicationEvent plus a meaningful call_summary or non-empty transcript. Ringing-only events are not sufficient proof.",
  nurture_sequence_14d: "Sequence enrollment record with a valid lead ID and proof for each outbound step in the sequence.",
  review_request: "Review link configured (review_link_set) plus a logged outbound communication event.",
  lead_reactivation: "Dormant lead segment identified plus a logged reactivation workflow CommunicationEvent or CommunicationLog.",
};

const WORK_ITEM_NOTES = [
  { phase: "Phase 1 — Evidence Records", items: "Create AutomationProofLog pass records for instant_lead_response and missed_call_text_back. These are the first two capabilities that need real evidence." },
  { phase: "Phase 2 — Route Health", items: "Verify Twilio webhook URLs are configured and returning 200. Repair any 404/405 errors on the missed-call webhook." },
  { phase: "Phase 3 — Provider Error Review", items: "Inspect Twilio 400 errors in CommunicationLog and CommunicationEvent. Check request payloads, sender permissions, and credentials." },
  { phase: "Phase 4 — Voice Readiness", items: "Connect ElevenLabs agent IDs and phone number IDs. Enable inbound_voice_enabled only after a real call test passes with a transcript." },
  { phase: "Phase 5 — Review & Referral", items: "Create real AutomationProofLog records for review_request and lead_reactivation flows. Build the referral entity/automation before claiming it as active." },
];

export default function TwilioGrowthEnginePanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [activeView, setActiveView] = useState("capabilities");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getTwilioGrowthEngineAudit", {});
      setData(res?.data || res);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load Twilio Growth Engine audit.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRow = (key) => {
    setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Twilio Growth Engine</h2>
          <p className="text-sm text-gray-400 mt-0.5">Truth-first audit of every Twilio/SMS/voice capability. Admin only — no public claims.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Admin-only trust warning banner */}
      <TrustWarningBanner proofLogsEmpty={data?.proof_logs_empty} />

      {/* Admin-only test-data exclusion explainer */}
      <TestDataExclusionPanel quarantine={data?.quarantine} />

      {/* Admin-only work-item ordering notes */}
      <WorkItemNotes />

      {/* Admin-only minimum definition of done */}
      <MinimumDefinitionOfDone />

      {/* View toggle */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: "capabilities", label: "Capability Matrix" },
          { id: "proof", label: "Proof Center" },
          { id: "repair", label: "Repair Queue" },
          { id: "asana", label: "Asana Gate" },
          { id: "qa", label: "QA Checklists" },
          { id: "evidence", label: "Evidence Map" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeView === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Computing audit from live data…</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <p className="text-sm text-red-600 font-semibold mb-1">Audit failed to load</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-400">No audit data available.</p>
        </div>
      ) : (
        <>
          {activeView === "capabilities" && (
            <CapabilityMatrix
              capabilities={data.capabilities || []}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              deliveryStats={data.delivery_stats}
              eventStats={data.event_stats}
              missedCallStats={data.missed_call_stats}
              voiceReadiness={data.voice_readiness}
            />
          )}
          {activeView === "proof" && (
            <ProofCenter proofByService={data.proof_by_service || {}} />
          )}
          {activeView === "repair" && (
            <TwilioGrowthEngineRepairQueue data={data} onRefresh={fetchData} />
          )}
          {activeView === "asana" && (
            <AsanaCompletionGate data={data} />
          )}
          {activeView === "qa" && (
            <QAChecklistView checklists={data.qa_checklists || []} />
          )}
        </>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-6 flex-wrap">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status Legend</p>
        {Object.entries(STATUS_STYLES).map(([key, style]) => {
          const Icon = style.icon;
          return (
            <div key={key} className="flex items-center gap-2">
              <Icon className="w-4 h-4" style={{ color: style.color }} />
              <span className="text-xs font-medium text-gray-600">{style.label}</span>
            </div>
          );
        })}
        <div className="ml-auto text-[11px] text-gray-400">
          Green = proven by real records and proof logs · Yellow = partial infrastructure, proof incomplete · Red = no implementation or usable evidence
        </div>
      </div>
    </div>
  );
}

// ── Trust Warning Banner ──
function TrustWarningBanner({ proofLogsEmpty }) {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-3"
      style={{
        background: proofLogsEmpty
          ? "linear-gradient(135deg, rgba(220,38,38,0.06), rgba(220,38,38,0.02))"
          : "linear-gradient(135deg, rgba(217,119,6,0.06), rgba(217,119,6,0.02))",
        border: `1px solid ${proofLogsEmpty ? "rgba(220,38,38,0.2)" : "rgba(217,119,6,0.2)"}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: proofLogsEmpty ? "rgba(220,38,38,0.1)" : "rgba(217,119,6,0.1)",
          border: `1px solid ${proofLogsEmpty ? "rgba(220,38,38,0.25)" : "rgba(217,119,6,0.25)"}`,
        }}
      >
        {proofLogsEmpty ? <ShieldX className="w-4 h-4 text-red-600" /> : <ShieldAlert className="w-4 h-4 text-amber-600" />}
      </div>
      <div>
        <p className="text-sm font-bold mb-1" style={{ color: proofLogsEmpty ? "#DC2626" : "#D97706" }}>
          {proofLogsEmpty
            ? "No automation is production-trusted yet — AutomationProofLog is empty"
            : "Capabilities must stay untrusted until backed by proof records"}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          All capability statuses below are computed from real database records (CommunicationLog, CommunicationEvent,
          AutomationProofLog, AutomationChecklist, AdminSettings). No status is marked green unless proof logs exist.
          Internal, smoke, and test records are excluded from production metrics but preserved in the database.
        </p>
        {proofLogsEmpty && (
          <p className="text-xs font-semibold text-red-600 mt-2">
            ⚠ No automation is production-trusted yet because no proof logs exist.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Test Data Exclusion Panel ──
function TestDataExclusionPanel({ quarantine }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Test Data Exclusion — Admin Only</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        Internal, smoke, and test records are excluded from production metrics on this dashboard but are preserved in the database.
        No records are deleted — they are quarantined and shown here for transparency.
      </p>
      {quarantine && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Production Leads (sample)</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{quarantine.production_leads_count || 0}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Excluded (test/smoke/internal)</p>
            <p className="text-lg font-bold text-amber-700 mt-1">{quarantine.excluded_leads_count || 0}</p>
          </div>
        </div>
      )}
      {quarantine?.rules && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Exclusion Rules</p>
          <ul className="text-[11px] text-gray-500 space-y-1">
            {quarantine.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-gray-300 mt-0.5">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Work Item Notes ──
function WorkItemNotes() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Work Item Priority — Admin Only</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">Private notes on the recommended order of work for the Twilio Growth Engine backlog.</p>
      <div className="space-y-3">
        {WORK_ITEM_NOTES.map((note, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500">{i + 1}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{note.phase}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{note.items}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Capability Matrix ──
function CapabilityMatrix({ capabilities, expandedRows, toggleRow, deliveryStats, eventStats, missedCallStats, voiceReadiness }) {
  return (
    <div className="space-y-4">
      {/* Delivery stats summary */}
      {deliveryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total SMS Logs" value={deliveryStats.total} />
          <StatCard label="Delivered" value={deliveryStats.delivered} color="#059669" />
          <StatCard label="Sent Only" value={deliveryStats.sent_only} color="#D97706" />
          <StatCard label="Queued" value={deliveryStats.queued} color="#6B7280" />
          <StatCard label="Failed" value={deliveryStats.failed} color="#DC2626" />
          <StatCard label="Weak Proof" value={deliveryStats.weak_proof_count} color="#D97706" />
          <StatCard label="No Provider ID" value={deliveryStats.without_provider_message_id} color="#DC2626" />
        </div>
      )}

      {/* Missed-call recovery */}
      {missedCallStats && (
        <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Missed-Call Recovery Reliability</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Webhook Status" value={missedCallStats.webhook_status} color={missedCallStats.webhook_status === "blocked" ? "#DC2626" : missedCallStats.webhook_status === "configured" ? "#059669" : "#6B7280"} />
            <StatCard label="SMS Attempts" value={missedCallStats.sms_attempts} />
            <StatCard label="Successful Sends" value={missedCallStats.successful_sends} color="#059669" />
            <StatCard label="Failures" value={missedCallStats.failures} color="#DC2626" />
          </div>
          {missedCallStats.has_404 && (
            <p className="mt-3 text-xs font-semibold text-red-600">⚠ Webhook returning 404 — repair the missed-call webhook URL in Twilio console.</p>
          )}
          {missedCallStats.has_405 && (
            <p className="mt-3 text-xs font-semibold text-red-600">⚠ Webhook returning 405 — method not allowed.</p>
          )}
          {missedCallStats.last_error && (
            <p className="mt-3 text-xs text-gray-400">Last error: {missedCallStats.last_error}</p>
          )}
        </div>
      )}

      {/* Voice readiness */}
      {voiceReadiness && (
        <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h3 className="text-sm font-bold text-gray-900 mb-3">AI Voice Readiness</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <BooleanStat label="Inbound Voice Enabled" value={voiceReadiness.inbound_voice_enabled} />
            <BooleanStat label="Voice Calls Enabled" value={voiceReadiness.voice_calls_enabled} />
            <BooleanStat label="ElevenLabs Agent IDs" value={voiceReadiness.has_elevenlabs_agent_ids} />
            <BooleanStat label="Transcript Proof" value={voiceReadiness.has_transcript_proof} />
          </div>
          {voiceReadiness.blockers?.length > 0 && (
            <div className="mt-3 space-y-1">
              {voiceReadiness.blockers.map((b, i) => (
                <p key={i} className="text-xs text-red-600 font-medium">⚠ {b}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Capability table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Capability Status Matrix</h3>
          <p className="text-xs text-gray-400 mt-0.5">Each row shows computed status, evidence checked, blockers, and next action.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {capabilities.map((cap) => {
            const style = STATUS_STYLES[cap.status] || STATUS_STYLES.red;
            const Icon = style.icon;
            const isExpanded = expandedRows[cap.key];
            return (
              <div key={cap.key}>
                <button
                  onClick={() => toggleRow(cap.key)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: style.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cap.label}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {cap.evidence_sources?.[0] || "No evidence checked"}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
                    style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
                  >
                    {style.label}
                  </span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 space-y-3 bg-gray-50/50">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence Sources Checked</p>
                      <ul className="space-y-1">
                        {cap.evidence_sources?.map((src, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                            <span>{src}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {cap.blockers?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Blockers</p>
                        <ul className="space-y-1">
                          {cap.blockers.map((b, i) => (
                            <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                              <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {cap.next_action && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Next Required Action</p>
                        <p className="text-xs text-gray-600">{cap.next_action}</p>
                      </div>
                    )}
                    {cap.proof && (
                      <div className="flex gap-3 text-[11px]">
                        <span className="text-gray-400">Proof: <span className="text-green-600 font-semibold">{cap.proof.passed} pass</span> · <span className="text-amber-600 font-semibold">{cap.proof.pending} pending</span> · <span className="text-red-600 font-semibold">{cap.proof.failed} fail</span></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Plan */}
      <ActionPlan capabilities={capabilities} deliveryStats={deliveryStats} missedCallStats={missedCallStats} voiceReadiness={voiceReadiness} />
    </div>
  );
}

// ── Action Plan ──
function ActionPlan({ capabilities, deliveryStats, missedCallStats, voiceReadiness }) {
  const actions = [];

  const automationProofCap = capabilities?.find(c => c.key === "automation_proof_logs");
  if (automationProofCap && automationProofCap.proof?.total === 0) {
    actions.push("Create proof tests for instant_lead_response and missed_call_text_back — no AutomationProofLog records exist.");
  }

  if (missedCallStats?.has_404) {
    actions.push("Repair Twilio missed-call webhook URL in Twilio console/Base44 function route — webhook is returning 404.");
  }

  if (deliveryStats && (deliveryStats.without_provider_message_id > 0 || deliveryStats.weak_proof_count > 0)) {
    actions.push("Inspect request payload and Twilio credentials/sender permissions — weak/null provider message IDs detected.");
  }

  if (voiceReadiness && !voiceReadiness.has_elevenlabs_agent_ids) {
    actions.push("Connect ElevenLabs agent and phone number IDs — AI voice receptionist cannot function without them.");
  }

  if (deliveryStats && deliveryStats.weak_proof_count > 0) {
    actions.push("Exclude smoke/internal/test records from production KPIs — test data pollution detected.");
  }

  if (actions.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-4 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <p className="text-xs text-green-700 font-semibold">No immediate blockers detected. Continue maintaining proof records.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <h3 className="text-sm font-bold text-gray-900 mb-3">Action Plan — Computed from Status</h3>
      <div className="space-y-2">
        {actions.map((a, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 mt-0.5">{i + 1}</span>
            <p className="text-xs text-gray-600">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Proof Center ──
function ProofCenter({ proofByService }) {
  const serviceKeys = Object.keys(REQUIRED_EVIDENCE);
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          This page does not run tests. It shows what evidence is required before a service can be marked trusted.
        </p>
      </div>

      {serviceKeys.map(sk => {
        const proof = proofByService[sk] || { total: 0, passed: 0, failed: 0, pending: 0 };
        const proofStatus = proof.total === 0 ? "missing" : proof.passed > 0 ? "pass" : proof.pending > 0 ? "pending" : "fail";
        const proofStyle = PROOF_STATUS_STYLES[proofStatus];
        return (
          <div key={sk} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h4 className="text-sm font-bold text-gray-900">{SERVICE_LABELS[sk] || sk}</h4>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ color: proofStyle.color, background: `${proofStyle.color}11`, border: `1px solid ${proofStyle.color}30` }}
              >
                {proofStyle.label}
              </span>
            </div>
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Required Evidence</p>
              <p className="text-xs text-gray-600 leading-relaxed">{REQUIRED_EVIDENCE[sk]}</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-gray-400">Proof logs: <span className="font-semibold text-gray-700">{proof.total}</span></span>
              <span className="text-green-600">Pass: <span className="font-semibold">{proof.passed}</span></span>
              <span className="text-amber-600">Pending: <span className="font-semibold">{proof.pending}</span></span>
              <span className="text-red-600">Fail: <span className="font-semibold">{proof.failed}</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── QA Checklist View ──
function QAChecklistView({ checklists }) {
  if (!checklists || checklists.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-400">No AutomationChecklist records found.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {checklists.map(cl => {
        const allFalse = cl.all_false;
        const status = allFalse ? "red" : cl.went_live_at ? "green" : "yellow";
        const style = STATUS_STYLES[status];
        const Icon = style.icon;
        return (
          <div key={cl.id} className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{cl.business_name || "Unknown"}</p>
                <p className="text-xs text-gray-400">{SERVICE_LABELS[cl.service_key] || cl.service_key}</p>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                {cl.status || "unknown"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <BooleanStat label="Twilio" value={cl.twilio_configured} small />
              <BooleanStat label="Resend" value={cl.resend_configured} small />
              <BooleanStat label="Booking Link" value={cl.booking_link_set} small />
              <BooleanStat label="Review Link" value={cl.review_link_set} small />
              <BooleanStat label="Lead Form" value={cl.lead_form_connected} small />
              <BooleanStat label="Event Logging" value={cl.communication_event_logging_verified} small />
              <BooleanStat label="Test Lead Sent" value={cl.test_lead_sent} small />
              <BooleanStat label="Test Response" value={cl.test_response_received} small />
              <BooleanStat label="Client Approved" value={cl.client_approved} small />
            </div>
            {allFalse && (
              <p className="mt-3 text-xs font-semibold text-red-600">All checklist flags are false or missing — configure before go-live.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Small stat card ──
function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-lg font-bold mt-1" style={{ color: color || "#111827" }}>{value}</p>
    </div>
  );
}

function BooleanStat({ label, value, small }) {
  return (
    <div className="flex items-center gap-1.5">
      {value ? (
        <CheckCircle2 className={small ? "w-3 h-3 text-green-500 flex-shrink-0" : "w-4 h-4 text-green-500 flex-shrink-0"} />
      ) : (
        <MinusCircle className={small ? "w-3 h-3 text-gray-300 flex-shrink-0" : "w-4 h-4 text-gray-300 flex-shrink-0"} />
      )}
      <span className={small ? "text-[11px] text-gray-600" : "text-xs text-gray-600"}>{label}</span>
    </div>
  );
}
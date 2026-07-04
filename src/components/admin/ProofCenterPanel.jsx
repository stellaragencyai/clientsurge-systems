import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, FileSearch } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "inbound_sms_assistant",
  "ai_voice_receptionist",
  "nurture_sequence_14d",
  "review_request",
  "lead_reactivation",
];

const EVIDENCE_RULES = {
  instant_lead_response:
    "CommunicationLog or CommunicationEvent tied to a real lead, with valid provider_message_id and final delivery proof where available.",
  missed_call_text_back:
    "Inbound call event plus related follow-up communication evidence, and no webhook 404/405 blocker.",
  inbound_sms_assistant:
    "Inbound SMS event plus classification/response record showing the assistant handled it.",
  ai_voice_receptionist:
    "Inbound voice event plus meaningful call summary or transcript. Ringing-only events are not sufficient.",
  nurture_sequence_14d:
    "Sequence enrollment record plus valid lead ID and proof for each outbound step in the sequence.",
  review_request:
    "Review link configured plus logged outbound communication evidence (SMS or email) to the client.",
  lead_reactivation:
    "Dormant segment identified plus logged reactivation workflow evidence (outbound SMS/email to dormant leads).",
};

const STATUS_META = {
  pass: {
    label: "Pass",
    icon: CheckCircle2,
    color: "#059669",
    bg: "rgba(5,150,105,0.07)",
    border: "rgba(5,150,105,0.2)",
  },
  fail: {
    label: "Fail",
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.2)",
  },
  missing: {
    label: "Missing",
    icon: AlertTriangle,
    color: "#9ca3af",
    bg: "rgba(156,163,175,0.07)",
    border: "rgba(156,163,175,0.2)",
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.missing;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function ServiceCard({ serviceKey, proofLog }) {
  const rules = EVIDENCE_RULES[serviceKey] || "Evidence rules not defined.";
  const status = proofLog ? proofLog.status : "missing";
  const meta = STATUS_META[status] || STATUS_META.missing;
  const Icon = meta.icon;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "#fff", borderColor: "#E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
          >
            <Icon className="w-4 h-4" style={{ color: meta.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{serviceKey}</p>
            <p className="text-[11px] text-gray-400">Proof Status</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="px-5 py-4 space-y-3 text-sm">
        {/* Required evidence */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Required Evidence</p>
          <p className="text-xs text-gray-600 leading-relaxed">{rules}</p>
        </div>

        {/* Latest proof log details */}
        {proofLog ? (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {proofLog.evidence_summary && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Latest Evidence</p>
                <p className="text-xs text-gray-700 leading-relaxed">{proofLog.evidence_summary}</p>
              </div>
            )}
            {proofLog.failure_reason && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-red-400 mb-0.5">Failure Reason</p>
                <p className="text-xs text-red-600 leading-relaxed">{proofLog.failure_reason}</p>
              </div>
            )}
            {proofLog.repair_action && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 mb-0.5">Repair Action</p>
                <p className="text-xs text-amber-700 leading-relaxed">{proofLog.repair_action}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-gray-400">
              {proofLog.tested_at && (
                <span>Tested: {new Date(proofLog.tested_at).toLocaleString()}</span>
              )}
              {proofLog.tested_by && <span>By: {proofLog.tested_by}</span>}
              {proofLog.provider_message_id && (
                <span>Provider ID: {proofLog.provider_message_id}</span>
              )}
              {proofLog.business_name && <span>Client: {proofLog.business_name}</span>}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 italic">
              No AutomationProofLog record exists for this service yet. Create a proof test and pass it before marking
              this service trusted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProofCenterPanel() {
  const [proofLogs, setProofLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const allLogs = await base44.entities.AutomationProofLog.list("-tested_at", 200);
      const byService = {};
      for (const log of allLogs || []) {
        if (!log.service_key) continue;
        if (!byService[log.service_key] || !byService[log.service_key].tested_at) {
          byService[log.service_key] = log;
        } else if (
          new Date(log.tested_at || 0).getTime() > new Date(byService[log.service_key].tested_at || 0).getTime()
        ) {
          byService[log.service_key] = log;
        }
      }
      setProofLogs(byService);
    } catch (err) {
      setError(err?.message || "Failed to load proof logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalLogs = Object.keys(proofLogs).length;
  const passCount = SERVICE_KEYS.filter((k) => proofLogs[k]?.status === "pass").length;
  const failCount = SERVICE_KEYS.filter((k) => proofLogs[k]?.status === "fail").length;
  const pendingCount = SERVICE_KEYS.filter((k) => proofLogs[k]?.status === "pending").length;
  const missingCount = SERVICE_KEYS.filter((k) => !proofLogs[k] || !proofLogs[k]?.status).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.18)" }}>
              <ShieldCheck className="w-5 h-5" style={{ color: "#00AEEF" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Twilio Automation Proof Center</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Read-only readiness view. Shows what evidence is required before a service can be marked trusted.
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>

        {/* Disclaimer banner */}
        <div
          className="mt-4 rounded-lg p-3 flex items-start gap-2.5"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <FileSearch className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>This page does not run tests.</strong> It shows what evidence is required before a service can be
            marked trusted. No SMS, calls, or external communications are triggered from this view.
          </p>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{passCount}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Pass</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Pending</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{failCount}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Fail</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{missingCount}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Missing</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Service cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SERVICE_KEYS.map((key) => (
            <ServiceCard key={key} serviceKey={key} proofLog={proofLogs[key] || null} />
          ))}
        </div>
      )}
    </div>
  );
}
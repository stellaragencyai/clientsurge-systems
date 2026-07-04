import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";

const STATUS_CONFIG = {
  green: {
    color: "#059669",
    bg: "rgba(5,150,105,0.06)",
    border: "rgba(5,150,105,0.2)",
    icon: CheckCircle2,
    label: "Proven",
  },
  yellow: {
    color: "#D97706",
    bg: "rgba(217,119,6,0.06)",
    border: "rgba(217,119,6,0.2)",
    icon: AlertTriangle,
    label: "Partial",
  },
  red: {
    color: "#DC2626",
    bg: "rgba(220,38,38,0.06)",
    border: "rgba(220,38,38,0.2)",
    icon: XCircle,
    label: "Not Done",
  },
};

const SERVICE_KEY_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  ai_booking_agent: "AI Booking Agent",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.red;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function CapabilityRow({ cap }) {
  const cfg = STATUS_CONFIG[cap.status_color] || STATUS_CONFIG.red;
  const Icon = cfg.icon;
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
          >
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{cap.capability_name}</p>
            <p className="text-[10px] text-gray-400 font-mono">{cap.capability_key}</p>
          </div>
        </div>
        <StatusBadge status={cap.status_color} />
      </div>

      {/* Evidence summary */}
      <div className="mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Evidence</p>
        <p className="text-xs text-gray-600 leading-relaxed">{cap.evidence_summary || "No evidence computed"}</p>
      </div>

      {/* Entities checked */}
      {cap.evidence_entities_checked?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {cap.evidence_entities_checked.map((e) => (
            <span
              key={e}
              className="text-[10px] font-semibold rounded-md px-1.5 py-0.5"
              style={{ background: "rgba(0,174,239,0.06)", color: "#0079c1", border: "1px solid rgba(0,174,239,0.12)" }}
            >
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Blockers */}
      {cap.blockers?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">Blockers</p>
          <ul className="space-y-0.5">
            {cap.blockers.map((b, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">▸</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next action */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Next Action</p>
        <p className="text-xs font-medium text-gray-700">{cap.next_required_action}</p>
      </div>

      {/* Metrics */}
      <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400">Proof Logs</p>
          <p className="text-sm font-bold text-gray-700">{cap.proof_log_count || 0}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Delivered SMS</p>
          <p className="text-sm font-bold text-gray-700">{cap.delivered_sms_count || 0}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Weak Proof</p>
          <p className="text-sm font-bold" style={{ color: cap.weak_proof_count > 0 ? "#D97706" : "#9CA3AF" }}>
            {cap.weak_proof_count || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ cl }) {
  const flags = [
    { key: "twilio_configured", label: "Twilio" },
    { key: "resend_configured", label: "Resend" },
    { key: "booking_link_set", label: "Booking Link" },
    { key: "review_link_set", label: "Review Link" },
    { key: "lead_form_connected", label: "Lead Form" },
    { key: "communication_event_logging_verified", label: "Event Logging" },
    { key: "test_lead_sent", label: "Test Lead Sent" },
    { key: "test_response_received", label: "Test Response" },
    { key: "client_approved", label: "Client Approved" },
  ];

  const trueCount = flags.filter((f) => cl[f.key]).length;
  const allTrue = trueCount === flags.length;
  const noneTrue = trueCount === 0;

  const status = allTrue ? "green" : noneTrue ? "red" : "yellow";
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold text-gray-900">
            {SERVICE_KEY_LABELS[cl.service_key] || cl.service_key}
          </p>
          <p className="text-[10px] text-gray-400">
            {cl.business_name || "No business"} · {cl.status}
          </p>
        </div>
        <span
          className="text-[10px] font-bold rounded-full px-2 py-0.5"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          {trueCount}/{flags.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {flags.map((f) => (
          <span
            key={f.key}
            className="text-[9px] font-semibold rounded px-1.5 py-0.5"
            style={{
              background: cl[f.key] ? "rgba(5,150,105,0.08)" : "rgba(229,231,235,0.5)",
              color: cl[f.key] ? "#059669" : "#9CA3AF",
            }}
          >
            {cl[f.key] ? "✓" : "✗"} {f.label}
          </span>
        ))}
      </div>
      {(cl.last_tested_at || cl.went_live_at) && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-[10px] text-gray-400">
          {cl.last_tested_at && <span>Last tested: {new Date(cl.last_tested_at).toLocaleDateString()}</span>}
          {cl.went_live_at && <span>Went live: {new Date(cl.went_live_at).toLocaleDateString()}</span>}
        </div>
      )}
    </div>
  );
}

export default function TwilioGrowthEngineAudit() {
  const [data, setData] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("computeTwilioGrowthEngineAudit", {});
      setData(res.data);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to run audit");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChecklists = useCallback(async () => {
    try {
      const cls = await base44.entities.AutomationChecklist.list("-created_date", 100);
      const serviceKeys = Object.keys(SERVICE_KEY_LABELS);
      setChecklists((cls || []).filter((c) => serviceKeys.includes(c.service_key)));
    } catch (_) {}
  }, []);

  useEffect(() => {
    runAudit();
    loadChecklists();
  }, [runAudit, loadChecklists]);

  const greenCount = (data?.capabilities || []).filter((c) => c.status_color === "green").length;
  const yellowCount = (data?.capabilities || []).filter((c) => c.status_color === "yellow").length;
  const redCount = (data?.capabilities || []).filter((c) => c.status_color === "red").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Twilio Growth Engine Audit
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Honest proof-status matrix. No public marketing claims — admin truth layer only.
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? "Computing..." : "Run Audit"}
        </button>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-gray-600">
          <span className="w-3 h-3 rounded-full" style={{ background: "#059669" }} />
          Green = proven by real records & proof logs
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <span className="w-3 h-3 rounded-full" style={{ background: "#D97706" }} />
          Yellow = partial infrastructure, proof incomplete
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <span className="w-3 h-3 rounded-full" style={{ background: "#DC2626" }} />
          Red = no implementation or no usable evidence
        </span>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-gray-400">Green</p>
            <p className="text-2xl font-bold text-emerald-600">{greenCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-gray-400">Yellow</p>
            <p className="text-2xl font-bold text-amber-600">{yellowCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-gray-400">Red</p>
            <p className="text-2xl font-bold text-red-600">{redCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-gray-400">Delivered SMS</p>
            <p className="text-2xl font-bold text-gray-900">{data.delivered_sms_count || 0}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-gray-400">Excluded Test Records</p>
            <p className="text-2xl font-bold text-gray-500">{data.excluded_test_records || 0}</p>
          </div>
        </div>
      )}

      {/* Proof log warning */}
      {data?.proof_log_warning && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">No Proof Logs Exist</p>
            <p className="text-xs text-red-600 mt-0.5">{data.proof_log_warning}</p>
          </div>
        </div>
      )}

      {/* Twilio blocker warnings */}
      {(data?.twilio_400_errors > 0 || data?.webhook_404_detected || data?.weak_proof_count > 0) && (
        <div className="rounded-xl p-4 space-y-1.5" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
          <p className="text-sm font-bold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Twilio Blockers Detected
          </p>
          {data.twilio_400_errors > 0 && (
            <p className="text-xs text-amber-700">• {data.twilio_400_errors} Twilio 400 errors in CommunicationLog/Event</p>
          )}
          {data.webhook_404_detected && (
            <p className="text-xs text-amber-700">• Webhook test result contains 404/405 — missed-call webhook is failing</p>
          )}
          {data.weak_proof_count > 0 && (
            <p className="text-xs text-amber-700">• {data.weak_proof_count} SMS sent without provider_message_id (weak/unverified proof)</p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <p className="text-sm font-bold text-red-700">Error running audit</p>
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {/* Capability matrix */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Capability Matrix</h3>
        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(data?.capabilities || []).map((cap) => (
              <CapabilityRow key={cap.capability_key} cap={cap} />
            ))}
          </div>
        )}
      </div>

      {/* QA Checklist view */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">QA Checklist by Service Key</h3>
        <p className="text-xs text-gray-500 mb-3">
          AutomationChecklist flags for each proof-required service.
        </p>
        {checklists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">No AutomationChecklist records found for proof-required service keys.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {checklists.map((cl) => (
              <ChecklistRow key={cl.id} cl={cl} />
            ))}
          </div>
        )}
      </div>

      {data?.ran_at && (
        <p className="text-[10px] text-gray-400 text-center">
          Last computed: {new Date(data.ran_at).toLocaleString()} by {data.capabilities?.[0]?.computed_by || "admin"}
        </p>
      )}
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  green: { label: "Proven", color: "#16a34a", bg: "rgba(22,163,74,0.06)", border: "rgba(22,163,74,0.2)", icon: CheckCircle2 },
  yellow: { label: "Partial", color: "#d97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle },
  red: { label: "Not Done", color: "#dc2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.2)", icon: XCircle },
};

const QA_SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "Nurture Sequence (14d)",
  ai_booking_agent: "AI Booking Agent",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
};

const QA_FLAG_LABELS = {
  twilio_configured: "Twilio Configured",
  resend_configured: "Resend Configured",
  booking_link_set: "Booking Link Set",
  review_link_set: "Review Link Set",
  lead_form_connected: "Lead Form Connected",
  communication_event_logging_verified: "Comm Event Logging Verified",
  test_lead_sent: "Test Lead Sent",
  test_response_received: "Test Response Received",
  client_approved: "Client Approved",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.red;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function CapabilityRow({ cap }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[cap.status_color] || STATUS_CONFIG.red;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: cap.status_color === 'green' ? 'rgba(22,163,74,0.2)' : cap.status_color === 'yellow' ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)', background: '#fff' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}55` }}
          />
          <span className="text-sm font-semibold text-gray-900 truncate">{cap.capability_name}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={cap.status_color} />
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Evidence Summary</p>
            <p className="text-xs text-gray-600 leading-relaxed">{cap.evidence_summary}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Entities Checked</p>
            <div className="flex flex-wrap gap-1.5">
              {cap.evidence_entities_checked?.map((e, i) => (
                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{e}</span>
              ))}
            </div>
          </div>
          {cap.blockers?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Blockers</p>
              <ul className="space-y-1">
                {cap.blockers.map((b, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Next Required Action</p>
            <p className="text-xs text-gray-700 font-medium">{cap.next_required_action}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TwilioGrowthEngineDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("computeTwilioGrowthEngineAudit", {});
      setData(res?.data || res);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load Twilio Growth Engine audit.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded bg-gray-100 animate-pulse" />
        {[1,2,3].map(i => (
          <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-50/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-semibold text-red-700 mb-1">Audit Failed</p>
        <p className="text-xs text-red-600">{error}</p>
        <button onClick={fetchAudit} className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">Retry →</button>
      </div>
    );
  }

  const capabilities = data?.capabilities || [];
  const greenCount = capabilities.filter(c => c.status_color === 'green').length;
  const yellowCount = capabilities.filter(c => c.status_color === 'yellow').length;
  const redCount = capabilities.filter(c => c.status_color === 'red').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Twilio Growth Engine Audit</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Honest capability matrix computed from real records. Admin-only — not for public display.
          </p>
        </div>
        <button
          onClick={fetchAudit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recompute
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{greenCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mt-1">Proven</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{yellowCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mt-1">Partial</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{redCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mt-1">Not Done</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 italic">
        <strong>Green</strong> = proven by real records and proof logs. <strong>Yellow</strong> = partial infrastructure exists but proof is incomplete. <strong>Red</strong> = no implementation or no usable evidence.
      </p>

      {/* No proof logs warning */}
      {data?.proofLogTotal === 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">No automation is production-trusted yet</p>
            <p className="text-xs text-red-600 mt-0.5">No AutomationProofLog records exist. No automation should be shown as "live" or "trusted" until proof logs pass.</p>
          </div>
        </div>
      )}

      {/* Action Plan */}
      {data?.actionPlan?.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <h3 className="text-sm font-bold text-blue-900 mb-3">📋 Immediate Action Plan</h3>
          <ol className="space-y-2">
            {data.actionPlan.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-blue-800">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="font-medium leading-relaxed">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Capability Matrix */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Capability Matrix</h3>
        <div className="space-y-2">
          {capabilities.map(cap => (
            <CapabilityRow key={cap.capability_key} cap={cap} />
          ))}
        </div>
      </div>

      {/* SMS Delivery Proof Health */}
      {data?.smsStats && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">SMS Delivery Proof Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Delivered", value: data.smsStats.delivered, color: "text-green-600" },
              { label: "Sent/Queued (not delivered)", value: data.smsStats.sentNotDelivered, color: "text-amber-600" },
              { label: "Failed", value: data.smsStats.failed, color: "text-red-600" },
              { label: "Skipped", value: data.smsStats.skipped, color: "text-gray-500" },
              { label: "Twilio 400 Errors", value: data.smsStats.twilio400Errors, color: "text-red-600" },
              { label: "Null Provider ID (outbound SMS)", value: data.smsStats.nullProviderMessageId, color: "text-amber-600" },
            ].map((stat, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] font-semibold text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Only <strong>delivered</strong> status counts as trusted delivery proof. Sent/queued = attempt only. Provider message ID required for strong outbound proof.
          </p>
        </div>
      )}

      {/* Webhook Readiness */}
      {data?.webhookStatus && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Twilio Webhook Readiness</h3>
          <div className="space-y-2">
            {Object.entries(data.webhookStatus).map(([field, info]) => (
              <div key={field} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  {info.present
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <span className="text-xs font-medium text-gray-700">{field}</span>
                </div>
                <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{info.present ? info.value : '— not set —'}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Last Webhook Test</p>
            <div className="flex items-center gap-2">
              {data.webhookTestHasError
                ? <AlertTriangle className="w-4 h-4 text-red-500" />
                : <CheckCircle2 className="w-4 h-4 text-green-500" />}
              <span className="text-xs text-gray-600">{data.lastTestResult || 'No test result recorded'}</span>
              {data.lastTestAt && (
                <span className="text-[10px] text-gray-400 ml-auto">
                  {new Date(data.lastTestAt).toLocaleString()}
                </span>
              )}
            </div>
            {data.webhookTestHasError && (
              <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Webhook test contains error indicators (404/405/failed/error). This is a blocker, not OK.</p>
            )}
          </div>
        </div>
      )}

      {/* AI Voice Readiness */}
      {data?.voiceSettings && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">AI Voice Readiness</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { label: "inbound_voice_enabled", value: data.voiceSettings.inbound_voice_enabled },
              { label: "voice_calls_enabled", value: data.voiceSettings.voice_calls_enabled },
              { label: "voice_webhook_url", value: data.voiceSettings.voice_webhook_url, isString: true },
              { label: "voice_forwarding_phone", value: data.voiceSettings.voice_forwarding_phone, isString: true },
              { label: "elevenlabs_agent_ids (populated)", value: data.voiceSettings.elevenlabs_agent_ids && Object.values(data.voiceSettings.elevenlabs_agent_ids).some(v => v) },
              { label: "elevenlabs_phone_number_ids (populated)", value: data.voiceSettings.elevenlabs_phone_number_ids && Object.values(data.voiceSettings.elevenlabs_phone_number_ids).some(v => v) },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100">
                <span className="text-xs font-medium text-gray-600">{item.label}</span>
                {item.isString
                  ? <span className={`text-xs font-semibold ${item.value ? 'text-green-600' : 'text-red-500'}`}>{item.value ? 'Set' : 'Missing'}</span>
                  : item.value
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            ))}
          </div>
          {data.voiceEvents && (
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{data.voiceEvents.count}</p>
                <p className="text-[10px] font-semibold text-gray-400">Voice Events</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{data.voiceEvents.with_call_sid}</p>
                <p className="text-[10px] font-semibold text-gray-400">Leads w/ Call SID</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{data.voiceEvents.with_transcript}</p>
                <p className="text-[10px] font-semibold text-gray-400">Leads w/ Transcript</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Automation Proof Readiness */}
      {data?.proofByService && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Automation Proof Log Readiness</h3>
          <p className="text-xs text-gray-400 mb-3">Total proof logs: <strong className="text-gray-700">{data.proofLogTotal}</strong></p>
          <div className="space-y-2">
            {Object.entries(data.proofByService).map(([key, counts]) => (
              <div key={key} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100">
                <span className="text-xs font-medium text-gray-700">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">PASS {counts.pass}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">FAIL {counts.fail}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">PEND {counts.pending}</span>
                </div>
              </div>
            ))}
            {Object.keys(data.proofByService).length === 0 && (
              <p className="text-xs text-red-500 font-medium">No AutomationProofLog records found for any service key.</p>
            )}
          </div>
        </div>
      )}

      {/* QA Checklist */}
      {data?.qaChecklist && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">QA Checklist by Service Key</h3>
          <div className="space-y-3">
            {data.qaChecklist.map(qa => (
              <div key={qa.service_key} className="rounded-lg border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50/50">
                  <span className="text-xs font-semibold text-gray-900">{QA_SERVICE_LABELS[qa.service_key] || qa.service_key}</span>
                  <StatusBadge status={qa.status} />
                </div>
                <div className="px-3 py-2 grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {Object.entries(QA_FLAG_LABELS).map(([flag, label]) => (
                    <div key={flag} className="flex items-center gap-1.5 text-[10px]">
                      {qa.flags[flag]
                        ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                        : <XCircle className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                      <span className={qa.flags[flag] ? 'text-gray-700 font-medium' : 'text-gray-400'}>{label}</span>
                    </div>
                  ))}
                </div>
                {(qa.flags.last_tested_at || qa.flags.went_live_at) && (
                  <div className="px-3 pb-2 flex gap-4 text-[10px] text-gray-400">
                    {qa.flags.last_tested_at && <span>Last tested: {new Date(qa.flags.last_tested_at).toLocaleDateString()}</span>}
                    {qa.flags.went_live_at && <span>Went live: {new Date(qa.flags.went_live_at).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Data Exclusion */}
      {data?.excludedCount !== undefined && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Test/Internal Data Exclusion</h3>
          <p className="text-xs text-gray-500">
            Records excluded from production metrics (not deleted): <strong className="text-gray-900">{data.excludedCount}</strong>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Exclusion patterns: clientsurge-install.internal, clientsurge.test, test+, smoke, test, internal, backfill
          </p>
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center pt-2">
        Audit run: {data?.auditRunId} · Computed at {data?.computedAt && new Date(data.computedAt).toLocaleString()} · Admin-only, not for public display
      </p>
    </div>
  );
}
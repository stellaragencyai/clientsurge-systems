import {
  CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Radio,
  FileText, ClipboardList, Mic, Database, Users,
} from "lucide-react";

const STATUS_CONFIG = {
  complete: { color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)", icon: CheckCircle2, label: "Complete" },
  partial: { color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)", icon: AlertTriangle, label: "Partial" },
  missing: { color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)", icon: XCircle, label: "Missing" },
};

function evaluateProviderConfig(data) {
  const s = data?.settings_summary || {};
  const evidence = [];
  const blockers = [];
  let checks = 0;
  let passed = 0;

  if (s.twilio_enabled !== undefined) { checks++; if (s.twilio_enabled) { passed++; evidence.push("twilio_enabled = true"); } else blockers.push("twilio_enabled is false"); }
  if (s.twilio_from_number !== undefined) { checks++; if (s.twilio_from_number) { passed++; evidence.push(`twilio_from_number = ${s.twilio_from_number}`); } else blockers.push("twilio_from_number not set"); }
  if (s.twilio_account_sid_present !== undefined) { checks++; if (s.twilio_account_sid_present) { passed++; evidence.push("TWILIO_ACCOUNT_SID present"); } else blockers.push("TWILIO_ACCOUNT_SID not set"); }
  if (s.twilio_auth_token_present !== undefined) { checks++; if (s.twilio_auth_token_present) { passed++; evidence.push("TWILIO_AUTH_TOKEN present"); } else blockers.push("TWILIO_AUTH_TOKEN not set"); }
  if (s.resend_enabled !== undefined) { checks++; if (s.resend_enabled) { passed++; evidence.push("resend_enabled = true"); } else blockers.push("resend_enabled is false"); }
  if (s.resend_from_email !== undefined) { checks++; if (s.resend_from_email) { passed++; evidence.push(`resend_from_email = ${s.resend_from_email}`); } else blockers.push("resend_from_email not set"); }

  const status = passed === checks && checks > 0 ? "complete" : passed > 0 ? "partial" : "missing";
  const nextAction = status === "complete" ? "No action needed — provider configuration verified." : "Configure missing provider credentials/flags in AdminSettings.";
  return { status, evidence, blockers, nextAction };
}

function evaluateRouteConfig(data) {
  const s = data?.settings_summary || {};
  const mc = data?.missed_call_stats || {};
  const evidence = [];
  const blockers = [];
  let checks = 0, passed = 0;

  if (s.sms_webhook_url !== undefined) { checks++; if (s.sms_webhook_url) { passed++; evidence.push("sms_webhook_url configured"); } else blockers.push("sms_webhook_url not set"); }
  if (s.voice_webhook_url !== undefined) { checks++; if (s.voice_webhook_url) { passed++; evidence.push("voice_webhook_url configured"); } else blockers.push("voice_webhook_url not set"); }
  if (s.missed_call_webhook_url !== undefined) { checks++; if (s.missed_call_webhook_url) { passed++; evidence.push("missed_call_webhook_url configured"); } else blockers.push("missed_call_webhook_url not set"); }
  if (s.sms_status_callback_url !== undefined) { checks++; if (s.sms_status_callback_url) { passed++; evidence.push("sms_status_callback_url configured"); } else blockers.push("sms_status_callback_url not set"); }
  if (mc.webhook_status !== undefined) { checks++; if (mc.webhook_status === "configured") { passed++; evidence.push("missed-call webhook returns 200"); } else if (mc.webhook_status === "blocked") { blockers.push(`missed-call webhook blocked (${mc.has_404 ? "404" : "405"})`); } else { blockers.push("missed-call webhook status unknown"); } }

  const status = passed === checks && checks > 0 ? "complete" : passed > 0 ? "partial" : "missing";
  const nextAction = status === "complete" ? "No action needed — all routes configured." : "Set missing webhook URLs in AdminSettings and verify in Twilio console.";
  return { status, evidence, blockers, nextAction };
}

function evaluateEvidenceLogging(data) {
  const ds = data?.delivery_stats || {};
  const es = data?.event_stats || {};
  const evidence = [];
  const blockers = [];
  let checks = 0, passed = 0;

  if (ds.total !== undefined) { checks++; if (ds.total > 0) { passed++; evidence.push(`CommunicationLog: ${ds.total} SMS records`); } else blockers.push("CommunicationLog has 0 SMS records"); }
  if (ds.delivered !== undefined) { checks++; if (ds.delivered > 0) { passed++; evidence.push(`${ds.delivered} delivered SMS`); } else blockers.push("No delivered SMS proof"); }
  if (ds.with_provider_message_id !== undefined) { checks++; if (ds.with_provider_message_id > 0) { passed++; evidence.push(`${ds.with_provider_message_id} with provider_message_id`); } else blockers.push("No logs have provider_message_id"); }
  if (es.total !== undefined) { checks++; if (es.total > 0) { passed++; evidence.push(`CommunicationEvent: ${es.total} events`); } else blockers.push("CommunicationEvent has 0 records"); }
  if (es.twilio_400_errors !== undefined && es.twilio_400_errors > 0) { blockers.push(`${es.twilio_400_errors} Twilio 400 errors in events`); }
  if (es.failed_events !== undefined && es.failed_events > 0) { blockers.push(`${es.failed_events} failed events`); }

  const status = passed === checks && checks > 0 && blockers.length === 0 ? "complete" : passed > 0 ? "partial" : "missing";
  const nextAction = status === "complete" ? "No action needed — evidence logging verified." : "Generate real delivery evidence and resolve provider errors.";
  return { status, evidence, blockers, nextAction };
}

function evaluateAutomationChecklists(data) {
  const cls = data?.qa_checklists || [];
  const evidence = [];
  const blockers = [];
  const active = cls.filter(c => c.went_live_at);
  const allFalse = cls.filter(c => c.all_false);
  const inProgress = cls.filter(c => !c.all_false && !c.went_live_at);

  if (cls.length > 0) evidence.push(`${cls.length} AutomationChecklist records`);
  if (active.length > 0) evidence.push(`${active.length} went live`);
  if (inProgress.length > 0) evidence.push(`${inProgress.length} in progress`);
  if (allFalse.length > 0) { blockers.push(`${allFalse.length} checklists with all flags false`); evidence.push(`${allFalse.length} all-false checklists`); }

  const status = cls.length === 0 ? "missing" : allFalse.length === cls.length ? "missing" : active.length > 0 && allFalse.length === 0 ? "complete" : "partial";
  const nextAction = status === "complete" ? "No action needed — checklists verified." : "Complete checklist flags and mark went_live_at after testing.";
  return { status, evidence, blockers, nextAction };
}

function evaluateVoiceAssistant(data) {
  const vr = data?.voice_readiness || {};
  const s = data?.settings_summary || {};
  const evidence = [];
  const blockers = [];

  if (vr.inbound_voice_enabled) evidence.push("inbound_voice_enabled = true"); else blockers.push("inbound_voice_enabled is false");
  if (vr.voice_calls_enabled) evidence.push("voice_calls_enabled = true"); else blockers.push("voice_calls_enabled is false");
  if (s.has_elevenlabs_agent_ids) evidence.push("ElevenLabs agent IDs configured"); else blockers.push("No ElevenLabs agent IDs");
  if (s.has_elevenlabs_phone_number_ids) evidence.push("ElevenLabs phone number IDs configured"); else blockers.push("No ElevenLabs phone number IDs");
  if (vr.has_transcript_proof) evidence.push("Transcript proof exists"); else blockers.push("No transcript proof");
  if (vr.voice_webhook_url) evidence.push("voice_webhook_url configured"); else blockers.push("voice_webhook_url not set");

  const allPassed = vr.inbound_voice_enabled && vr.voice_calls_enabled && s.has_elevenlabs_agent_ids && s.has_elevenlabs_phone_number_ids && vr.has_transcript_proof;
  const anyPassed = vr.inbound_voice_enabled || vr.voice_calls_enabled || s.has_elevenlabs_agent_ids;
  const status = allPassed ? "complete" : anyPassed ? "partial" : "missing";
  const nextAction = status === "complete" ? "No action needed — voice assistant verified." : "Configure ElevenLabs agents, phone IDs, and run a real call test for transcript proof.";
  return { status, evidence, blockers, nextAction };
}

function evaluateProductionDataCleanliness(data) {
  const q = data?.quarantine || {};
  const ds = data?.delivery_stats || {};
  const evidence = [];
  const blockers = [];

  if (q.production_leads_count !== undefined) evidence.push(`${q.production_leads_count} production leads (sample)`);
  if (q.excluded_leads_count !== undefined) evidence.push(`${q.excluded_leads_count} test/smoke leads excluded`);
  if (ds.weak_proof_count > 0) { blockers.push(`${ds.weak_proof_count} weak-proof SMS logs (no provider_message_id)`); evidence.push(`${ds.weak_proof_count} weak-proof records`); }
  if (ds.without_provider_message_id > 0) { blockers.push(`${ds.without_provider_message_id} logs without provider_message_id`); }

  const status = q.excluded_leads_count === 0 && ds.weak_proof_count === 0 ? "complete" : (q.production_leads_count > 0 || ds.weak_proof_count === 0) ? "partial" : "missing";
  const nextAction = status === "complete" ? "No action needed — data is clean." : "Quarantine test records and resolve weak-proof SMS logs.";
  return { status, evidence, blockers, nextAction };
}

function evaluateClientFacingTrust(data) {
  const pbs = data?.proof_by_service || {};
  const caps = data?.capabilities || [];
  const evidence = [];
  const blockers = [];

  const serviceKeys = Object.keys(pbs);
  const passedServices = serviceKeys.filter(sk => pbs[sk].passed > 0);
  const missingServices = serviceKeys.filter(sk => pbs[sk].total === 0);
  const greenCaps = caps.filter(c => c.status === "green");

  if (data?.proof_logs_empty) blockers.push("AutomationProofLog is empty — no proof records exist");
  if (passedServices.length > 0) evidence.push(`${passedServices.length}/${serviceKeys.length} services have passing proof`);
  else blockers.push("0 services have passing proof logs");
  if (missingServices.length > 0) blockers.push(`${missingServices.length} services have no proof logs at all`);
  if (greenCaps.length > 0) evidence.push(`${greenCaps.length} capabilities marked green`);

  const status = passedServices.length === serviceKeys.length && serviceKeys.length > 0 ? "complete" : passedServices.length > 0 ? "partial" : "missing";
  const nextAction = status === "complete" ? "No action needed — trust proven by proof records." : "Create and pass AutomationProofLog records for each service before claiming customer-facing readiness.";
  return { status, evidence, blockers, nextAction };
}

const CATEGORIES = [
  { id: "provider", label: "Provider Configuration Readiness", icon: ShieldCheck, evaluator: evaluateProviderConfig },
  { id: "routes", label: "Route / Configuration Readiness", icon: Radio, evaluator: evaluateRouteConfig },
  { id: "evidence", label: "Evidence / Logging Readiness", icon: FileText, evaluator: evaluateEvidenceLogging },
  { id: "checklists", label: "Automation Checklist Readiness", icon: ClipboardList, evaluator: evaluateAutomationChecklists },
  { id: "voice", label: "Voice Assistant Readiness", icon: Mic, evaluator: evaluateVoiceAssistant },
  { id: "cleanliness", label: "Production Data Cleanliness", icon: Database, evaluator: evaluateProductionDataCleanliness },
  { id: "trust", label: "Client-Facing Trust Readiness", icon: Users, evaluator: evaluateClientFacingTrust },
];

export default function ReadinessScorecard({ data }) {
  if (!data) return null;

  const results = CATEGORIES.map(cat => ({ ...cat, ...cat.evaluator(data) }));
  const completeCount = results.filter(r => r.status === "complete").length;
  const partialCount = results.filter(r => r.status === "partial").length;
  const missingCount = results.filter(r => r.status === "missing").length;
  const overallPercent = Math.round((completeCount / results.length) * 100);

  return (
    <div className="space-y-4">
      {/* Explanation banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          This scorecard is for internal operational truth. It does not prove customer-facing readiness unless proof records exist.
        </p>
      </div>

      {/* Overall summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Readiness Scorecard</h3>
            <p className="text-xs text-gray-400 mt-0.5">Admin only — computed from live app data. No status is complete unless data proves it.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{overallPercent}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{completeCount}/{results.length} complete</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden flex">
          <div style={{ width: `${(completeCount / results.length) * 100}%`, background: "#059669" }} />
          <div style={{ width: `${(partialCount / results.length) * 100}%`, background: "#D97706" }} />
          <div style={{ width: `${(missingCount / results.length) * 100}%`, background: "#DC2626" }} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Complete: {completeCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Partial: {partialCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Missing: {missingCount}</span>
        </div>
      </div>

      {/* Category cards */}
      {results.map(cat => {
        const style = STATUS_CONFIG[cat.status];
        const Icon = style.icon;
        const CatIcon = cat.icon;
        return (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                  <CatIcon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">{cat.label}</h4>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                {style.label}
              </span>
            </div>

            {cat.evidence.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Evidence Checked</p>
                <ul className="space-y-0.5">
                  {cat.evidence.map((e, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {cat.blockers.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Blocking Issue</p>
                <ul className="space-y-0.5">
                  {cat.blockers.map((b, i) => (
                    <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                      <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Next Admin Action</p>
              <p className="text-xs text-gray-600">{cat.nextAction}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
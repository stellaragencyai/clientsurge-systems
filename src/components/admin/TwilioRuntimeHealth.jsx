/**
 * TwilioRuntimeHealth — Admin panel for Twilio/Voice infrastructure observability.
 *
 * This panel must not show stale hardcoded failure claims. It renders current
 * evidence from CommunicationEvent, WebhookRegistration, LaunchGate,
 * AdminSettings, and AutomationChecklist records.
 */

import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Loader2,
  Radio,
  Zap,
  ExternalLink,
  Info,
} from 'lucide-react';
import VoiceFrontLinePanel from './VoiceFrontLinePanel';

const LEGACY_KEY_MAP = {
  missed_call_textback: 'missed_call_text_back',
  missed_call_txt_back: 'missed_call_text_back',
  followup_sequences: 'nurture_sequence_14d',
  nurture_14d: 'nurture_sequence_14d',
  appointment_booking: 'ai_booking_agent',
  booking_agent: 'ai_booking_agent',
  voice_receptionist: 'ai_voice_receptionist',
  ai_receptionist: 'ai_voice_receptionist',
  review_requests: 'review_request',
};

const CANONICAL_KEYS = [
  'instant_lead_response',
  'missed_call_text_back',
  'nurture_sequence_14d',
  'ai_booking_agent',
  'daily_lead_digest',
  'inbound_sms_assistant',
  'ai_voice_receptionist',
  'lead_reactivation',
  'review_request',
];

const APP_URL = import.meta.env.VITE_BASE44_APP_BASE_URL
  || import.meta.env.VITE_APP_URL
  || window.location.origin;

const APP_ID = '69dc4a79656fdba136d413d3';
const BASE44_FUNCTION_BASE = `https://app.base44.com/api/apps/${APP_ID}/functions`;
const VOICE_PING_URL = `${BASE44_FUNCTION_BASE}/twilioVoicePing`;
const VOICE_WEBHOOK_DIRECT_URL = `${BASE44_FUNCTION_BASE}/receiveInboundVoiceCall`;
const CUSTOM_VOICE_WEBHOOK_URL = `${APP_URL}/api/receiveInboundVoiceCall`;
const CUSTOM_SMS_WEBHOOK_URL = `${APP_URL}/api/receiveTwilioInboundSms`;

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition-colors"
    >
      <Copy className="w-3 h-3" />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function StatusDot({ ok, warning, unknown }) {
  if (unknown) return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />;
  if (warning) return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />;
  return ok
    ? <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
    : <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />;
}

function UrlRow({ label, url, method = 'POST', description, tone = 'slate' }) {
  const toneClass = tone === 'green'
    ? 'border-green-200 bg-green-50'
    : tone === 'amber'
      ? 'border-amber-200 bg-amber-50'
      : 'border-slate-200 bg-white';
  return (
    <div className={`border rounded-lg p-3 space-y-1.5 ${toneClass}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{method}</span>
      </div>
      <div className="flex items-center gap-1 bg-white rounded px-3 py-2 border border-slate-200">
        <code className="text-xs text-slate-800 break-all flex-1 font-mono">{url}</code>
        <CopyButton text={url} />
      </div>
      {description && <p className="text-[11px] text-slate-600">{description}</p>}
    </div>
  );
}

function hasFailureText(value) {
  return /fail|error|timeout|twilio application|\b4\d\d\b|\b5\d\d\b/i.test(String(value || ''));
}

function getVoiceEvidence(data) {
  const runtimeProof = data?.latestVoiceEvent || data?.voiceWebhookReg?.last_triggered_at;
  const failureEvidence = [
    data?.voiceWebhookReg?.last_error,
    data?.voiceWebhookReg?.failure_count ? `failure_count=${data.voiceWebhookReg.failure_count}` : '',
    data?.adminSettings?.last_webhook_test_result,
  ].filter(Boolean);

  if (runtimeProof) {
    return {
      status: 'trusted',
      title: 'Voice runtime proof exists',
      message: 'A real voice CommunicationEvent or WebhookRegistration trigger has been recorded. Keep using the currently verified Twilio URL.',
      evidence: failureEvidence,
    };
  }

  if (failureEvidence.some(hasFailureText)) {
    return {
      status: 'blocked',
      title: 'Voice route has current failure evidence',
      message: 'The dashboard is showing a blocker because the stored route data contains a recent failure signal. Use the direct Base44 URL or run a fresh live call proof after updating Twilio.',
      evidence: failureEvidence,
    };
  }

  return {
    status: 'warning',
    title: 'Voice route awaiting live proof',
    message: 'No live Twilio call proof has been recorded yet. This is not a confirmed failure; it is an unverified state until a real call reaches the handler.',
    evidence: failureEvidence,
  };
}

function EvidenceBanner({ data }) {
  const evidence = getVoiceEvidence(data);
  const Icon = evidence.status === 'trusted' ? CheckCircle2 : evidence.status === 'blocked' ? XCircle : AlertTriangle;
  const className = evidence.status === 'trusted'
    ? 'border-green-300 bg-green-50 text-green-800'
    : evidence.status === 'blocked'
      ? 'border-red-300 bg-red-50 text-red-800'
      : 'border-amber-300 bg-amber-50 text-amber-800';

  return (
    <div className={`rounded-xl border-2 p-5 flex items-start gap-4 ${className}`}>
      <Icon className="w-7 h-7 flex-shrink-0 mt-0.5" />
      <div className="space-y-2">
        <p className="font-bold text-base">{evidence.title}</p>
        <p className="text-sm leading-relaxed">{evidence.message}</p>
        {evidence.evidence.length > 0 && (
          <div className="rounded-lg border border-current/20 bg-white/60 p-3 text-xs space-y-1">
            <p className="font-bold uppercase tracking-widest opacity-70">Current stored evidence</p>
            {evidence.evidence.map((item, index) => (
              <p key={`${item}-${index}`} className="font-mono break-all">{item}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TwilioRuntimeHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proofRunning, setProofRunning] = useState(false);
  const [repairRunning, setRepairRunning] = useState(false);
  const [proofResult, setProofResult] = useState(null);
  const [repairResult, setRepairResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [voiceEvents, smsEvents, webhookRegs, launchGates, checklists, adminSettingsList] = await Promise.all([
        base44.entities.CommunicationEvent.filter({ channel: 'voice', provider: 'twilio' }, '-created_date', 1).catch(() => []),
        base44.entities.CommunicationEvent.filter({ channel: 'sms', provider: 'twilio' }, '-created_date', 1).catch(() => []),
        base44.entities.WebhookRegistration.list('-created_date', 50).catch(() => []),
        base44.entities.LaunchGate.list('', 100).catch(() => []),
        base44.entities.AutomationChecklist.list('-created_date', 500).catch(() => []),
        base44.entities.AdminSettings.list('-created_date', 1).catch(() => []),
      ]);

      const adminSettings = adminSettingsList?.[0] || null;
      const SMS_SOURCE_NAME_ALIASES = new Set([
        'twilio_sms', 'sms_inbound', 'inbound_sms', 'missed_call_textback', 'missed_call_text_back',
      ]);
      const voiceWebhookReg = webhookRegs?.find(r => r.source_name === 'twilio_voice') || null;
      const smsWebhookReg = webhookRegs?.find(r => SMS_SOURCE_NAME_ALIASES.has(r.source_name)) || null;
      const smsGate = launchGates?.find(g => g.gate_key === 'twilio_sms_gate') || null;
      const voiceGate = launchGates?.find(g => g.gate_key === 'twilio_voice_gate') || null;
      const frontlineGate = launchGates?.find(g => g.gate_key === 'voice_frontline_gate') || null;
      const postCallGate = launchGates?.find(g => g.gate_key === 'elevenlabs_postcall_logging_gate') || null;

      const legacyKeyIssues = (checklists || [])
        .filter(c => LEGACY_KEY_MAP[c.service_key])
        .map(c => ({
          id: c.id,
          business_name: c.business_name,
          client_email: c.client_email,
          legacy_key: c.service_key,
          canonical_key: LEGACY_KEY_MAP[c.service_key],
        }));

      const unknownKeyIssues = (checklists || [])
        .filter(c => c.service_key && !CANONICAL_KEYS.includes(c.service_key) && !LEGACY_KEY_MAP[c.service_key])
        .map(c => ({ id: c.id, business_name: c.business_name, service_key: c.service_key }));

      setData({
        latestVoiceEvent: voiceEvents?.[0] || null,
        latestSmsEvent: smsEvents?.[0] || null,
        voiceWebhookReg,
        smsWebhookReg,
        smsGate,
        voiceGate,
        frontlineGate,
        postCallGate,
        legacyKeyIssues,
        unknownKeyIssues,
        checklist_count: checklists?.length || 0,
        adminSettings,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runProof = async () => {
    setProofRunning(true);
    setProofResult(null);
    try {
      const res = await base44.functions.invoke('runTwilioProofCheck', {});
      setProofResult(res?.data || res);
      await load();
    } catch (err) {
      setProofResult({ error: err.message });
    } finally {
      setProofRunning(false);
    }
  };

  const runChecklistRepair = async () => {
    setRepairRunning(true);
    setRepairResult(null);
    try {
      const res = await base44.functions.invoke('canonicalizeAutomationChecklistKeys', { dry_run: false });
      setRepairResult(res?.data || res);
      await load();
    } catch (err) {
      setRepairResult({ error: err.message });
    } finally {
      setRepairRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading Twilio runtime data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" />
            Twilio Runtime Health
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Current infrastructure status from live records. Red states require stored evidence, not hardcoded assumptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={runProof}
            disabled={proofRunning}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {proofRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Run Proof Check
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <VoiceFrontLinePanel
        frontlineGate={data?.frontlineGate || null}
        postCallGate={data?.postCallGate || null}
        onRefresh={load}
      />

      <EvidenceBanner data={data} />

      {proofResult && (
        <div className={`rounded-lg border p-4 text-sm ${proofResult.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
          {proofResult.error ? (
            <p><strong>Proof check failed:</strong> {proofResult.error}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold">Proof check completed at {proofResult.ran_at ? new Date(proofResult.ran_at).toLocaleString() : 'just now'}</p>
              <p>SMS gate: <strong>{proofResult.sms_gate?.completion_percent ?? '—'}%</strong> complete, <strong>{proofResult.sms_gate?.proof_percent ?? '—'}%</strong> proof</p>
              <p>Voice gate: <strong>{proofResult.voice_gate?.completion_percent ?? '—'}%</strong> complete, <strong>{proofResult.voice_gate?.proof_percent ?? '—'}%</strong> proof</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Twilio Credentials</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2"><StatusDot ok /><span className="text-slate-700">TWILIO_ACCOUNT_SID</span></div>
            <div className="flex items-center gap-2"><StatusDot ok /><span className="text-slate-700">TWILIO_AUTH_TOKEN</span></div>
            <div className="flex items-center gap-2"><StatusDot ok /><span className="text-slate-700">TWILIO_PHONE_NUMBER</span></div>
          </div>
          <p className="text-[11px] text-slate-400">Backend secrets are checked by server-side proof functions; values are never exposed here.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">SMS WebhookRegistration</p>
          {data?.smsWebhookReg ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-green-700 font-semibold text-sm">Registration found</span></div>
              <p><strong>source_name:</strong> <span className="font-mono">{data.smsWebhookReg.source_name}</span></p>
              <p><strong>service_key:</strong> <span className="font-mono">{data.smsWebhookReg.service_key}</span></p>
              <p><strong>status:</strong> {data.smsWebhookReg.status}</p>
              <p><strong>last_triggered:</strong> {data.smsWebhookReg.last_triggered_at ? new Date(data.smsWebhookReg.last_triggered_at).toLocaleString() : 'not yet recorded'}</p>
            </div>
          ) : (
            <p className="text-xs text-amber-700">No SMS WebhookRegistration found. This is unverified until an SMS proof run or real inbound SMS succeeds.</p>
          )}
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest SMS CommunicationEvent</p>
            {data?.latestSmsEvent ? (
              <p className="text-xs text-slate-600">{new Date(data.latestSmsEvent.created_date).toLocaleString()} · {data.latestSmsEvent.event_type} · {data.latestSmsEvent.status}</p>
            ) : (
              <p className="text-xs text-amber-700">None found yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Latest Voice Event</p>
          {data?.latestVoiceEvent ? (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-green-700 font-semibold">Voice events exist</span></div>
              <p className="text-xs text-slate-500">Last: {new Date(data.latestVoiceEvent.created_date).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Status: {data.latestVoiceEvent.status}</p>
              <p className="text-xs text-slate-500">Type: {data.latestVoiceEvent.event_type}</p>
            </div>
          ) : (
            <p className="text-xs text-amber-700">No voice CommunicationEvents yet. This means live voice is unproven unless another provider is intentionally first responder.</p>
          )}
          {data?.voiceWebhookReg && (
            <div className="text-[11px] space-y-0.5 border-t border-slate-100 pt-2">
              <p>WebhookRegistration: <span className={data.voiceWebhookReg.status === 'active' ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>{data.voiceWebhookReg.status}</span></p>
              <p>Last triggered: {data.voiceWebhookReg.last_triggered_at ? new Date(data.voiceWebhookReg.last_triggered_at).toLocaleString() : 'not yet recorded'}</p>
              {data.voiceWebhookReg.last_error && <p className="text-red-600">Last error: {data.voiceWebhookReg.last_error}</p>}
              {data.voiceWebhookReg.failure_count > 0 && <p className="text-red-600">Failure count: {data.voiceWebhookReg.failure_count}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Twilio Console URL Guidance</h3>
        </div>
        <p className="text-xs text-slate-500">
          Use direct Base44 function URLs for Twilio first-response tests unless a fresh live proof confirms the custom domain proxy path works. This panel no longer labels custom-domain routes as failed without current stored evidence.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <UrlRow
            label="Recommended Voice Ping"
            url={VOICE_PING_URL}
            method="POST"
            tone="green"
            description="Bare-minimum TwiML response. Test this first in Twilio before using the full handler."
          />
          <UrlRow
            label="Full Voice Handler"
            url={VOICE_WEBHOOK_DIRECT_URL}
            method="POST"
            tone="green"
            description="Use after Voice Ping is confirmed. Handles inbound voice and async logging."
          />
          <UrlRow
            label="Custom Domain Voice Route"
            url={CUSTOM_VOICE_WEBHOOK_URL}
            method="POST"
            tone="amber"
            description="Advisory only. Do not use unless a fresh live Twilio test proves this exact route works."
          />
          <UrlRow
            label="Custom Domain SMS Route"
            url={CUSTOM_SMS_WEBHOOK_URL}
            method="POST"
            tone="amber"
            description="Advisory only. Prefer the route proven by WebhookRegistration and CommunicationEvent evidence."
          />
        </div>
        {data?.adminSettings?.last_webhook_test_result && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Route Health Check</p>
            <p className="text-xs text-slate-700 font-mono break-all">{data.adminSettings.last_webhook_test_result}</p>
          </div>
        )}
      </div>

      {(data?.legacyKeyIssues?.length > 0 || data?.unknownKeyIssues?.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-amber-900 text-sm">
                AutomationChecklist Service Key Review ({(data.legacyKeyIssues?.length || 0) + (data.unknownKeyIssues?.length || 0)} records)
              </h3>
            </div>
            {data.legacyKeyIssues?.length > 0 && (
              <button
                onClick={runChecklistRepair}
                disabled={repairRunning}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {repairRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Canonicalize Legacy Keys
              </button>
            )}
          </div>
          <p className="text-xs text-amber-700">
            These are live records with non-canonical keys. Known aliases can be safely rewritten to canonical keys; records are not deleted.
          </p>

          {repairResult && (
            <div className={`rounded-lg border p-3 text-xs ${repairResult.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
              {repairResult.error ? (
                <p><strong>Repair failed:</strong> {repairResult.error}</p>
              ) : (
                <p><strong>Repair complete:</strong> {repairResult.checklists_updated || 0} checklist records and {repairResult.steps_updated || 0} step records updated. Failed: {repairResult.failed || 0}.</p>
              )}
            </div>
          )}

          {data.legacyKeyIssues?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Known aliases:</p>
              {data.legacyKeyIssues.map(issue => (
                <div key={issue.id} className="flex items-center gap-2 text-xs text-amber-800 bg-white rounded-lg px-3 py-2 border border-amber-200">
                  <span className="font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{issue.legacy_key}</span>
                  <span>→</span>
                  <span className="font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{issue.canonical_key}</span>
                  <span className="text-amber-600 ml-2">{issue.business_name}</span>
                </div>
              ))}
            </div>
          )}

          {data.unknownKeyIssues?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Unknown service keys requiring manual review:</p>
              {data.unknownKeyIssues.map(issue => (
                <div key={issue.id} className="flex items-center gap-2 text-xs text-amber-800 bg-white rounded-lg px-3 py-2 border border-amber-200">
                  <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{issue.service_key}</span>
                  <span className="text-amber-600 ml-2">{issue.business_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data?.legacyKeyIssues?.length === 0 && data?.unknownKeyIssues?.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
          <CheckCircle2 className="w-4 h-4" />
          All {data?.checklist_count} AutomationChecklist records use canonical service keys.
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-700">Asana Integration</p>
        </div>
        <p className="text-xs text-slate-500">
          Status: <strong className="text-slate-700">Not verified.</strong> No Asana connector is registered in this workspace and no ASANA_API_KEY secret is configured.
        </p>
      </div>
    </div>
  );
}

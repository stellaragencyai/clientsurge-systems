/**
 * VoiceFrontLinePanel — Operational control layer for the correct voice architecture.
 * ElevenLabs/Twilio Function as first responder → Base44 as proof/logging system of record.
 *
 * Shows:
 * - Current problem (Base44 /api routes failed live Twilio tests)
 * - Architecture overview: Twilio → ElevenLabs → Base44
 * - Gate status for voice_frontline_gate and elevenlabs_postcall_logging_gate
 * - ElevenLabs setup checklist (local state only, no fake records)
 * - Manual proof capture form (updates gate via recordVoiceTestResult function)
 * - Exact next actions for Nolan
 */

import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Phone, XCircle, AlertTriangle, Loader2, CheckCircle2,
  RefreshCw, Send, ArrowRight, Info
} from 'lucide-react';

const CHECKLIST_ITEMS = [
  { id: 'subscription_active', label: 'ElevenLabs subscription active and in good standing' },
  { id: 'number_imported', label: 'Twilio number +16025843227 imported into ElevenLabs Phone Numbers' },
  { id: 'agent_assigned', label: 'Sarah / ClientSurge agent assigned to handle inbound calls on that number' },
  { id: 'live_call_answered', label: 'Live call answered by ElevenLabs agent without application error' },
  { id: 'transcript_available', label: 'Call summary / transcript visible in ElevenLabs after call' },
  { id: 'postcall_webhook', label: 'ElevenLabs post-call webhook configured → Base44 receiveElevenLabsPostCallWebhook' },
  { id: 'base44_proof_received', label: 'Base44 receives real non-smoke call proof (CommunicationEvent created by ElevenLabs webhook)' },
];

const TEST_RESULT_OPTIONS = [
  { value: 'answered_by_elevenlabs', label: '✅ Answered by ElevenLabs — agent picked up normally' },
  { value: 'application_error', label: '❌ Application error — Twilio returned error to caller' },
  { value: 'no_answer', label: '📵 No answer — number did not respond at all' },
  { value: 'wrong_route', label: '⚠️ Wrong route — went to wrong handler / voicemail' },
];

function GateCard({ gate, label, emptyMessage }) {
  if (!gate) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xs text-slate-400 italic">{emptyMessage}</p>
      </div>
    );
  }
  const statusStyles = {
    passed: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    ready_for_proof: { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    blocked: { border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  };
  const s = statusStyles[gate.status] || statusStyles.blocked;
  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} p-3 space-y-1`}>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${s.dot} flex-shrink-0`} />
        <span className={`text-sm font-bold ${s.text}`}>{gate.status?.toUpperCase()}</span>
        <span className="text-[11px] text-slate-500">({gate.proof_percent ?? 0}% proof)</span>
      </div>
      {gate.current_blocker && (
        <p className="text-[11px] text-slate-600 leading-relaxed">{gate.current_blocker}</p>
      )}
      {gate.notes && (
        <p className="text-[10px] text-slate-400 italic mt-1 border-t border-slate-200 pt-1">{gate.notes.substring(0, 200)}{gate.notes.length > 200 ? '…' : ''}</p>
      )}
    </div>
  );
}

export default function VoiceFrontLinePanel({ frontlineGate, postCallGate, onRefresh }) {
  // Checklist stored locally — does not write to DB, does not fake records
  const [checklist, setChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cs_voice_el_checklist') || '{}'); }
    catch { return {}; }
  });
  const [testResult, setTestResult] = useState('');
  const [testNotes, setTestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const toggleCheck = (id) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    localStorage.setItem('cs_voice_el_checklist', JSON.stringify(updated));
  };

  const handleSeedGates = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await base44.functions.invoke('seedVoiceFrontlineGates', {});
      setSeedResult(res?.data || res);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setSeedResult({ error: err.message });
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmitTestResult = async (e) => {
    e.preventDefault();
    if (!testResult) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await base44.functions.invoke('recordVoiceTestResult', { result: testResult, notes: testNotes });
      setSubmitResult(res?.data || res);
      setTestResult('');
      setTestNotes('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      setSubmitResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const gatesExist = frontlineGate || postCallGate;

  return (
    <div className="space-y-5">

      {/* Architecture Overview */}
      <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-700 flex-shrink-0" />
          <h3 className="font-bold text-blue-900 text-sm">Voice Front-Line Architecture</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs text-blue-800 font-medium">
          <div className="rounded-lg bg-white border border-blue-300 px-3 py-2 text-center">
            <p className="font-bold text-slate-900">+16025843227</p>
            <p className="text-[10px] text-blue-600">Twilio Number</p>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="rounded-lg bg-white border-2 border-green-400 px-3 py-2 text-center">
            <p className="font-bold text-slate-900">ElevenLabs Agent</p>
            <p className="text-[10px] text-green-600">First Responder</p>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 text-center">
            <p className="font-bold text-slate-900">Base44</p>
            <p className="text-[10px] text-blue-600">Post-call logging / CRM</p>
          </div>
        </div>
        <p className="text-xs text-blue-800">
          <strong>Base44 role:</strong> System of record, dashboard, proof/logging layer — NOT first voice responder.
          Inbound call proof enters Base44 only after ElevenLabs sends the post-call webhook.
        </p>
      </div>

      {/* Current Problem */}
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-2">
        <p className="text-xs font-bold text-red-800 flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> Current Blocking Issues
        </p>
        <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
          <li><code className="bg-red-100 px-1 rounded font-mono">clientsurgesystems.com/api/receiveInboundVoiceCall</code> → ❌ Twilio application error on live call</li>
          <li><code className="bg-red-100 px-1 rounded font-mono">clientsurgesystems.com/api/twilioVoicePing</code> → ❌ Twilio application error on live call</li>
          <li><code className="bg-red-100 px-1 rounded font-mono">inbound_voice_enabled=false</code> and <code className="bg-red-100 px-1 rounded font-mono">voice_calls_enabled=false</code> in AdminSettings</li>
          <li>Voice gate is smoke-ready (simulated checks) but <strong>real inbound call proof is missing</strong></li>
        </ul>
        <div className="rounded-lg bg-white border border-red-300 p-2 mt-2">
          <p className="text-[11px] text-red-800 font-semibold">
            ⛔ Do NOT point Twilio Voice directly to <code className="bg-red-50 px-1 rounded font-mono">clientsurgesystems.com/api/*</code> for production voice
            until those routes pass a real live call test against a real phone.
          </p>
        </div>
      </div>

      {/* Gate Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold text-slate-800">Voice Front-Line Gates</p>
          <div className="flex items-center gap-2">
            {gatesExist && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            )}
            {!gatesExist && (
              <button
                onClick={handleSeedGates}
                disabled={seeding}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {seeding && <Loader2 className="w-3 h-3 animate-spin" />}
                {seeding ? 'Creating...' : 'Create Gates'}
              </button>
            )}
            {gatesExist && (
              <button
                onClick={handleSeedGates}
                disabled={seeding}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                {seeding && <Loader2 className="w-3 h-3 animate-spin" />}
                {seeding ? 'Checking...' : 'Re-seed missing'}
              </button>
            )}
          </div>
        </div>

        {seedResult && (
          <div className={`rounded-lg border p-3 text-xs ${seedResult.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {seedResult.error
              ? `Error: ${seedResult.error}`
              : `✅ Done. ${(seedResult.results || []).map(r => `${r.gate}: ${r.action}`).join(' | ')}`}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GateCard
            gate={frontlineGate}
            label="Voice Front-Line Responder"
            emptyMessage="Not seeded yet — click 'Create Gates' above"
          />
          <GateCard
            gate={postCallGate}
            label="ElevenLabs Post-Call Logging"
            emptyMessage="Not seeded yet — click 'Create Gates' above"
          />
        </div>
      </div>

      {/* ElevenLabs Setup Checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">ElevenLabs Front-Line Setup Checklist</p>
          <p className="text-xs text-slate-500 mt-0.5">Check items as you complete them externally. Saving to browser only — does not write to DB.</p>
        </div>
        <div className="space-y-1">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={!!checklist[item.id]}
                onChange={() => toggleCheck(item.id)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 cursor-pointer flex-shrink-0"
              />
              <span className={`text-sm ${checklist[item.id] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {item.label}
              </span>
              {checklist[item.id] && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />}
            </label>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
          Checking a box does not write to the database, create CommunicationEvents, or mark any gates as passed.
        </p>
      </div>

      {/* Manual Proof Capture */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Record Live Call Test Result</p>
          <p className="text-xs text-slate-500 mt-0.5">
            After calling <code className="bg-slate-100 px-1 rounded font-mono">+16025843227</code> with ElevenLabs connected,
            record what happened. Updates <code className="bg-slate-100 px-1 rounded font-mono">voice_frontline_gate</code> status only.
            Does NOT create fake CommunicationEvents.
          </p>
        </div>
        <form onSubmit={handleSubmitTestResult} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TEST_RESULT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  testResult === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="testResult"
                  value={opt.value}
                  checked={testResult === opt.value}
                  onChange={(e) => setTestResult(e.target.value)}
                  className="w-4 h-4 text-blue-600 flex-shrink-0"
                />
                <span className="text-xs font-medium text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={testNotes}
            onChange={(e) => setTestNotes(e.target.value)}
            placeholder="Optional notes — caller ID used, time of test, exact error observed..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />
          <button
            type="submit"
            disabled={!testResult || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Recording...' : 'Record Test Result'}
          </button>
        </form>
        {submitResult && (
          <div className={`rounded-lg border p-3 text-xs ${submitResult.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {submitResult.error
              ? `Error: ${submitResult.error}`
              : `✅ Recorded: ${submitResult.result} — voice_frontline_gate is now ${submitResult.gate?.status} (${submitResult.gate?.proof_percent}% proof)`}
          </div>
        )}
      </div>

      {/* Next Actions */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
        <p className="text-sm font-bold text-green-800">Next Actions — Complete Outside Base44</p>
        <ol className="text-xs text-green-800 list-decimal list-inside space-y-2">
          <li>Log in to <strong>ElevenLabs</strong> — confirm subscription is active and not suspended</li>
          <li>Go to <strong>ElevenLabs → Phone Numbers → Import</strong> → add <code className="bg-green-100 px-1 rounded font-mono">+16025843227</code> using Twilio credentials</li>
          <li>Under <strong>ElevenLabs → Phone Numbers</strong> — assign the <strong>Sarah / ClientSurge agent</strong> to that number for inbound calls</li>
          <li>Call <code className="bg-green-100 px-1 rounded font-mono">+16025843227</code> from a real phone — verify ElevenLabs agent answers the call</li>
          <li>If agent answers → come back here and record result as <strong>"Answered by ElevenLabs"</strong></li>
          <li>If application error → do NOT re-point Twilio to Base44 /api routes — investigate ElevenLabs console instead</li>
          <li>Once live call confirmed → configure <strong>ElevenLabs post-call webhook</strong> to send transcript/outcome to Base44 endpoint <code className="bg-green-100 px-1 rounded font-mono">receiveElevenLabsPostCallWebhook</code></li>
          <li>Place a final test call → confirm Base44 receives the post-call data (CommunicationEvent created) → elevenlabs_postcall_logging_gate can then be marked passed</li>
        </ol>
        <div className="rounded-lg bg-white border border-green-300 p-3 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-700">
            <strong>Twilio Console note:</strong> While ElevenLabs is being configured, Twilio Voice webhook for +16025843227
            should point to ElevenLabs, NOT to <code className="bg-green-50 px-1 rounded font-mono">clientsurgesystems.com/api/*</code>.
            Those custom-domain routes failed live tests.
          </p>
        </div>
      </div>

    </div>
  );
}
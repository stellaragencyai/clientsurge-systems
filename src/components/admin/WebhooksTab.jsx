/**
 * WebhooksTab — Twilio webhook URL config section within AdminSettingsPanel.
 *
 * Shows stored webhook URL settings and a seed/test action. It does not fake
 * CommunicationEvents and it does not hardcode stale failure claims. Red states
 * are based on current stored test evidence.
 */

import { useState } from 'react';
import { Copy, Radio, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const APP_ID = '69dc4a79656fdba136d413d3';
const BASE44_FUNCTION_BASE = `https://app.base44.com/api/apps/${APP_ID}/functions`;
const DIRECT_VOICE_PING_URL = `${BASE44_FUNCTION_BASE}/twilioVoicePing`;
const DIRECT_VOICE_HANDLER_URL = `${BASE44_FUNCTION_BASE}/receiveInboundVoiceCall`;

function hasFailureText(value) {
  return /fail|error|timeout|twilio application|\b4\d\d\b|\b5\d\d\b/i.test(String(value || ''));
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={copy} className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition-colors flex-shrink-0">
      <Copy className="w-3 h-3" />{copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function UrlField({ label, url, description, tone = 'slate' }) {
  const toneClass = tone === 'green'
    ? 'border-green-200 bg-green-50'
    : tone === 'amber'
      ? 'border-amber-200 bg-amber-50'
      : 'border-slate-200 bg-white';

  if (!url) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Not set — click "Seed Webhook URLs" below to populate.
        </div>
        {description && <p className="text-[11px] text-slate-500">{description}</p>}
      </div>
    );
  }

  return (
    <div className={`space-y-1 rounded-lg border p-3 ${toneClass}`}>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label} <span className="font-normal text-slate-400 normal-case tracking-normal">POST</span></p>
      <div className="flex items-center gap-1 bg-white rounded-lg px-3 py-2 border border-slate-200">
        <code className="text-xs text-slate-800 break-all flex-1 font-mono">{url}</code>
        <CopyBtn text={url} />
      </div>
      {description && <p className="text-[11px] text-slate-500">{description}</p>}
    </div>
  );
}

export default function WebhooksTab({ settings, onSettingsUpdated }) {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await base44.functions.invoke('seedTwilioWebhookSettings', {});
      const data = res?.data || res;
      setSeedResult(data);
      if (data && !data.error && onSettingsUpdated) {
        onSettingsUpdated(prev => ({
          ...prev,
          webhook_enabled: data.webhook_enabled,
          webhook_url: data.voice_webhook_url,
          voice_webhook_url: data.voice_webhook_url,
          sms_webhook_url: data.sms_webhook_url,
          missed_call_webhook_url: data.missed_call_webhook_url,
          last_webhook_test_result: data.last_webhook_test_result,
          last_webhook_test_at: data.last_webhook_test_at,
        }));
      }
    } catch (err) {
      setSeedResult({ error: err.message });
    } finally {
      setSeeding(false);
    }
  };

  const webhookEnabled = settings?.webhook_enabled;
  const testAt = settings?.last_webhook_test_at;
  const testResult = settings?.last_webhook_test_result;
  const hasFailureEvidence = hasFailureText(testResult);

  return (
    <div className="space-y-6">
      <div className={`flex items-start gap-3 rounded-xl border-2 p-4 ${hasFailureEvidence ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
        {hasFailureEvidence ? <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />}
        <div>
          <p className={`font-semibold text-sm ${hasFailureEvidence ? 'text-red-800' : 'text-amber-800'}`}>
            {hasFailureEvidence ? 'Webhook route has stored failure evidence' : 'Webhook route needs live proof'}
          </p>
          <p className={`text-xs mt-1 ${hasFailureEvidence ? 'text-red-700' : 'text-amber-700'}`}>
            This panel no longer labels routes as failed unless current stored evidence says so. Use the direct Base44 voice ping first, then verify with a real Twilio call or SMS.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <ExternalLink className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-800">Stored AdminSettings URLs</p>
        </div>
        <p className="text-xs text-slate-500">
          These are stored settings, not live proof. A route is only trusted after a real inbound Twilio event updates CommunicationEvent/WebhookRegistration evidence.
        </p>
        <UrlField
          label="Voice — A Call Comes In"
          url={settings?.voice_webhook_url}
          tone={hasFailureEvidence ? 'amber' : 'slate'}
          description="Stored route. Use only after a fresh Twilio call proves it reaches the handler."
        />
        <UrlField
          label="Messaging — A Message Comes In"
          url={settings?.sms_webhook_url}
          tone="slate"
          description="Stored route. Verify with a real inbound SMS before marking trusted."
        />
        <UrlField
          label="Missed Call / Voice Fallback"
          url={settings?.missed_call_webhook_url}
          tone="slate"
          description="Stored route. Verify before production use."
        />
      </div>

      <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5 space-y-3">
        <p className="text-sm font-bold text-green-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Recommended first live voice test
        </p>
        <p className="text-xs text-green-800">
          Start with the direct Base44 Voice Ping URL. It returns a bare-minimum TwiML response and avoids custom-domain proxy ambiguity.
        </p>
        <UrlField
          label="Direct Base44 Voice Ping"
          url={DIRECT_VOICE_PING_URL}
          tone="green"
          description="Twilio Console → Phone Numbers → Voice → A Call Comes In → Webhook POST. Use this first."
        />
        <UrlField
          label="Direct Base44 Full Voice Handler"
          url={DIRECT_VOICE_HANDLER_URL}
          tone="green"
          description="Switch to this only after Voice Ping works."
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-800">Seed / Test Webhook Routes</p>
        <p className="text-xs text-slate-500">
          This detects the app's public base URL, constructs handler routes, stores them in AdminSettings, and runs lightweight route checks. It does not create CommunicationEvents or fake a Twilio webhook.
        </p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
          {seeding ? 'Running...' : 'Seed Webhook URLs & Check Routes'}
        </button>

        {seedResult && (
          <div className={`rounded-lg border p-3 text-xs space-y-1 ${seedResult.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {seedResult.error ? (
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 flex-shrink-0" /><span><strong>Error:</strong> {seedResult.error}</span></div>
            ) : (
              <>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /><span><strong>Done.</strong> webhook_enabled={String(seedResult.webhook_enabled)}</span></div>
                {seedResult.route_checks?.map(r => (
                  <p key={r.name} className={r.ok ? 'text-green-700' : 'text-red-700'}>
                    {r.ok ? '✓' : '✗'} {r.name}: {r.ok ? `HTTP ${r.status}` : (r.error || `HTTP ${r.status}`)}
                  </p>
                ))}
                <p className="text-green-600">Tested: {new Date(seedResult.last_webhook_test_at).toLocaleString()}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600">Truth rule</p>
        <p>
          <code className="bg-slate-100 px-1 rounded">last_triggered_at</code> remains <strong>null</strong> until Twilio actually calls the handler with a real inbound call or SMS. This panel does not fake it.
          {testAt && <span className="block mt-1">Last route check: {new Date(testAt).toLocaleString()}</span>}
          {testResult && <span className="block mt-1 font-mono break-all">{testResult}</span>}
          <span className="block mt-1">webhook_enabled={String(webhookEnabled)}</span>
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold text-blue-800 flex items-center gap-1"><Info className="w-3.5 h-3.5" />Recommended architecture note</p>
        <p>
          If direct Base44 voice works but production voice needs lower latency or richer call handling, use ElevenLabs Agent or a Twilio Function as the first responder and log outcomes back to Base44 asynchronously.
        </p>
      </div>
    </div>
  );
}

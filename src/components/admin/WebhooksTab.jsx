/**
 * WebhooksTab — Twilio webhook URL config section within AdminSettingsPanel.
 * Shows stored voice_webhook_url, sms_webhook_url, missed_call_webhook_url from AdminSettings.
 * Provides a "Seed / Test Routes" action that calls seedTwilioWebhookSettings to write
 * the correct URLs and run lightweight GET health checks.
 * Never creates fake CommunicationEvents or fakes last_triggered_at.
 */

import { useState } from 'react';
import { Copy, Radio, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

function UrlField({ label, url, description }) {
  if (!url) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Not set — click "Seed Webhook URLs" below to populate.
        </div>
        {description && <p className="text-[11px] text-slate-400">{description}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label} <span className="font-normal text-slate-400 normal-case tracking-normal">POST</span></p>
      <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
        <code className="text-xs text-slate-800 break-all flex-1 font-mono">{url}</code>
        <CopyBtn text={url} />
      </div>
      {description && <p className="text-[11px] text-slate-400">{description}</p>}
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
      // Update local settings state with the returned URLs
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

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${webhookEnabled ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <Radio className={`w-5 h-5 flex-shrink-0 mt-0.5 ${webhookEnabled ? 'text-green-600' : 'text-amber-600'}`} />
        <div>
          <p className={`font-semibold text-sm ${webhookEnabled ? 'text-green-800' : 'text-amber-800'}`}>
            Webhooks: {webhookEnabled ? 'Enabled — routes verified' : 'Not yet configured'}
          </p>
          {testAt && (
            <p className="text-xs mt-0.5 text-slate-500">
              Last tested: {new Date(testAt).toLocaleString()} — {testResult}
            </p>
          )}
          {!testAt && (
            <p className="text-xs mt-0.5 text-slate-500">
              Click "Seed Webhook URLs" to detect routes, store the URLs, and run a lightweight health check.
            </p>
          )}
        </div>
      </div>

      {/* URL fields */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <ExternalLink className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-800">Twilio Console Webhook URLs</p>
        </div>
        <p className="text-xs text-slate-500">
          Paste these into Twilio Console → Phone Numbers → (your number). All use HTTP POST.
        </p>
        <UrlField
          label="Voice — A Call Comes In"
          url={settings?.voice_webhook_url}
          description="Twilio Console → Phone Numbers → Voice & Fax → 'A Call Comes In' → Webhook → POST"
        />
        <UrlField
          label="Voice — Call Status Changes"
          url={settings?.voice_webhook_url}
          description="Same URL handles status callbacks (completed, no-answer, busy). Set under 'Call Status Changes'."
        />
        <UrlField
          label="Messaging — A Message Comes In"
          url={settings?.sms_webhook_url}
          description="Twilio Console → Phone Numbers → Messaging → 'A Message Comes In' → Webhook → POST"
        />
        <UrlField
          label="Missed Call / Voice Fallback"
          url={settings?.missed_call_webhook_url}
          description="For missed-call text-back automation. Can also be set as Voice fallback URL."
        />
      </div>

      {/* Seed action */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-800">Seed / Test Webhook Routes</p>
        <p className="text-xs text-slate-500">
          This detects the app's public base URL, constructs the correct handler routes, stores them in
          AdminSettings, and runs a lightweight GET health check on each route. It does <strong>not</strong> create
          any CommunicationEvents or fake a Twilio webhook.
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

      {/* Honest note */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600">Note on last_triggered_at</p>
        <p>
          <code className="bg-slate-100 px-1 rounded">last_triggered_at</code> on the WebhookRegistration remains{' '}
          <strong>null</strong> until Twilio actually calls the handler with a real inbound call or SMS.
          This panel does not fake it. To get it populated, configure the URLs above in Twilio and
          place a real test call or send a test SMS to your Twilio number.
        </p>
      </div>
    </div>
  );
}
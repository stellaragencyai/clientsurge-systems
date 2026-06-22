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
      <div className="flex items-start gap-3 rounded-xl border-2 border-red-300 p-4 bg-red-50">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
        <div>
          <p className="font-semibold text-sm text-red-800">
            ⚠️ Voice Webhook: FAILED LIVE TEST
          </p>
          <p className="text-xs mt-1 text-red-700">
            <strong>Status:</strong> webhook_enabled=true, but real Twilio calls failed.
            Custom-domain /api routes do not work as Twilio webhook targets.
          </p>
          <p className="text-xs mt-1 text-red-700">
            <strong>Next Steps:</strong> Use ElevenLabs Agent as first voice responder, or configure Twilio Function + async logging to Base44. See Twilio Runtime Health panel for working direct Base44 URLs.
          </p>
        </div>
      </div>

      {/* URL fields */}
      <div className="bg-white rounded-xl border border-red-200 p-5 space-y-5">
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-2">
          <p className="text-xs font-bold text-red-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            ⚠️ These URLs are NOT recommended for live Twilio — they have FAILED live call tests
          </p>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <ExternalLink className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-800">Stored URLs (FAILED — do not use)</p>
        </div>
        <p className="text-xs text-slate-500">
          These URLs are stored in AdminSettings but are NOT safe for production Twilio webhooks.
          Real Twilio calls to these endpoints return application errors.
        </p>
        <UrlField
          label="[BROKEN] Voice — A Call Comes In"
          url={settings?.voice_webhook_url}
          description="❌ FAILED LIVE TEST — Do not paste into Twilio Console. Use direct Base44 URL in Twilio Runtime Health panel instead."
        />
        <UrlField
          label="[BROKEN] Voice — Call Status Changes"
          url={settings?.voice_webhook_url}
          description="❌ FAILED LIVE TEST — Same URL, same failure. Do not use."
        />
        <UrlField
          label="[BROKEN] Messaging — A Message Comes In"
          url={settings?.sms_webhook_url}
          description="❌ May also be failing — check Twilio Runtime Health for verified working URLs."
        />
        <UrlField
          label="[BROKEN] Missed Call / Voice Fallback"
          url={settings?.missed_call_webhook_url}
          description="❌ FAILED LIVE TEST — Do not use for production voice."
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

      {/* Recommended Architecture */}
      <div className="rounded-xl border-2 border-green-400 bg-green-50 p-5 space-y-3">
        <p className="text-sm font-bold text-green-800 flex items-center gap-2">
          ✅ Recommended Voice Architecture
        </p>
        <p className="text-xs text-green-800">
          Since custom-domain /api routes fail for live Twilio calls, use one of these architectures:
        </p>
        <div className="space-y-2">
          <div className="rounded-lg bg-white border border-green-300 p-3 space-y-1">
            <p className="text-xs font-semibold text-green-900">Option A: ElevenLabs Agent (Recommended)</p>
            <p className="text-xs text-green-700">
              ElevenLabs Agent answers inbound calls directly from Twilio. After call ends, async logging 
              sends call metadata (transcript, duration, outcome) to Base44. Base44 remains the system of record for leads and analytics.
            </p>
          </div>
          <div className="rounded-lg bg-white border border-green-300 p-3 space-y-1">
            <p className="text-xs font-semibold text-green-900">Option B: Twilio Function</p>
            <p className="text-xs text-green-700">
              Twilio Function (node.js/python) answers inbound calls and returns TwiML. Function then 
              async logs the call metadata to Base44 via backend function invocation or webhook. Base44 remains system of record.
            </p>
          </div>
        </div>
        <p className="text-xs text-green-700 font-semibold mt-2">
          In both cases: Base44 is NOT the first voice responder. External service handles the call, 
          then logs the outcome to Base44 asynchronously for CRM/analytics.
        </p>
      </div>
      </div>
      );
      }
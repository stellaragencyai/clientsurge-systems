import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Bell,
  Check,
  Loader2,
  Mail,
  MessageSquareText,
  Save,
  ShieldCheck,
} from 'lucide-react';

const DEFAULTS = {
  sms_enabled: false,
  email_enabled: true,
  marketing_enabled: false,
  appointment_updates: true,
  service_updates: true,
  support_updates: true,
};

function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <label className="flex items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-200">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition ${
          checked ? 'bg-sky-600' : 'bg-slate-300'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

export default function SaasCommunicationPreferences({ clientId, user }) {
  const [recordId, setRecordId] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [initialPreferences, setInitialPreferences] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const hasChanges = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(initialPreferences),
    [preferences, initialPreferences]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const filters = clientId ? { client_id: clientId } : { user_email: user?.email };
        const records = await base44.entities.CommunicationPreference.filter(
          filters,
          '-updated_date',
          1
        );
        const record = records?.[0];
        const next = record
          ? {
              sms_enabled: record.sms_enabled === true,
              email_enabled: record.email_enabled !== false,
              marketing_enabled: record.marketing_enabled === true,
              appointment_updates: record.appointment_updates !== false,
              service_updates: record.service_updates !== false,
              support_updates: record.support_updates !== false,
            }
          : DEFAULTS;

        if (!active) return;
        setRecordId(record?.id || null);
        setPreferences(next);
        setInitialPreferences(next);
      } catch (loadError) {
        if (!active) return;
        console.error('[SaasCommunicationPreferences] load failed', loadError);
        setError('We could not load your communication preferences. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [clientId, user?.email]);

  const updatePreference = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setStatus('');
    setError('');
  };

  const savePreferences = async () => {
    setSaving(true);
    setStatus('');
    setError('');

    const payload = {
      ...preferences,
      client_id: clientId || null,
      user_email: user?.email || null,
      consent_source: 'client_dashboard_settings',
      consent_version: 'client_preferences_v1_2026-07-11',
      preference_updated_at: new Date().toISOString(),
      sms_opt_out_at:
        initialPreferences.sms_enabled && !preferences.sms_enabled
          ? new Date().toISOString()
          : null,
    };

    try {
      let saved;
      if (recordId) {
        saved = await base44.entities.CommunicationPreference.update(recordId, payload);
      } else {
        saved = await base44.entities.CommunicationPreference.create(payload);
        setRecordId(saved?.id || null);
      }

      await base44.entities.CommunicationPreferenceHistory.create({
        client_id: clientId || null,
        user_email: user?.email || null,
        source: 'client_dashboard_settings',
        consent_version: payload.consent_version,
        previous_preferences_json: JSON.stringify(initialPreferences),
        current_preferences_json: JSON.stringify(preferences),
        changed_at: payload.preference_updated_at,
      }).catch((historyError) => {
        console.warn('[SaasCommunicationPreferences] history log failed', historyError);
      });

      setInitialPreferences(preferences);
      setStatus('Preferences updated successfully.');
    } catch (saveError) {
      console.error('[SaasCommunicationPreferences] save failed', saveError);
      setError('Your preferences were not saved. Please try again or contact support.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-sky-100 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-600" />
          <p className="mt-3 text-sm text-slate-500">Loading communication preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-blue-50 px-6 py-7 sm:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-lg shadow-sky-200">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Account settings</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Communication preferences</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Choose how ClientSurge Systems communicates with you. Operational and marketing messages are controlled separately.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-sky-600" />
              <h3 className="text-base font-black text-slate-950">SMS communications</h3>
            </div>
            <Toggle
              checked={preferences.sms_enabled}
              onChange={(value) => updatePreference('sms_enabled', value)}
              label="Enable SMS messages"
              description="Receive requested texts about appointments, onboarding, service updates, and support. Message and data rates may apply."
            />
            <Toggle
              checked={preferences.appointment_updates}
              onChange={(value) => updatePreference('appointment_updates', value)}
              label="Appointment reminders"
              description="Confirmations, reminders, and scheduling changes."
              disabled={!preferences.sms_enabled && !preferences.email_enabled}
            />
            <Toggle
              checked={preferences.service_updates}
              onChange={(value) => updatePreference('service_updates', value)}
              label="Service and installation updates"
              description="Important progress updates about your ClientSurge setup and active services."
              disabled={!preferences.sms_enabled && !preferences.email_enabled}
            />
            <Toggle
              checked={preferences.support_updates}
              onChange={(value) => updatePreference('support_updates', value)}
              label="Support responses"
              description="Replies and follow-ups related to support requests you initiate."
              disabled={!preferences.sms_enabled && !preferences.email_enabled}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-sky-600" />
              <h3 className="text-base font-black text-slate-950">Email communications</h3>
            </div>
            <Toggle
              checked={preferences.email_enabled}
              onChange={(value) => updatePreference('email_enabled', value)}
              label="Enable account email"
              description="Receive account, service, billing, onboarding, and support email when relevant."
            />
            <Toggle
              checked={preferences.marketing_enabled}
              onChange={(value) => updatePreference('marketing_enabled', value)}
              label="Product news and education"
              description="Optional product announcements, AI automation guidance, and ClientSurge updates."
            />

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Consent-first communication</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    SMS consent is optional and is not required to purchase or use ClientSurge services. Reply STOP to any text to opt out or HELP for assistance.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-sky-700">
                    <a href="/sms-terms" className="hover:underline">SMS Terms</a>
                    <a href="/privacy" className="hover:underline">Privacy Policy</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="min-h-5">
            {status ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Check className="h-4 w-4" /> {status}
              </p>
            ) : error ? (
              <p className="text-sm font-semibold text-red-700">{error}</p>
            ) : (
              <p className="text-xs text-slate-500">Changes are recorded for compliance and account security.</p>
            )}
          </div>
          <button
            type="button"
            disabled={!hasChanges || saving}
            onClick={savePreferences}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:from-sky-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </section>
    </div>
  );
}

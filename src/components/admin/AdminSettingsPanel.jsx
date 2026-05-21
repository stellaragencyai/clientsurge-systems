/**
 * AdminSettingsPanel — full settings including ALL message templates.
 * Fix #5
 */
import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Key, Save, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { fetchAdminSettings, getAdminSettingsError, saveAdminSettings } from '@/lib/adminSettingsApi';

const TABS = [
  { id: "channels", label: "Channels" },
  { id: "security", label: "Security" },
  { id: "instant", label: "Instant Response" },
  { id: "followup", label: "Follow-Up SMS" },
  { id: "nurture", label: "Nurture Emails" },
];

function Field({ label, helper, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

const VAR_HINT = "Variables: {name}, {business_name}, {booking_link}, {date}";

export default function AdminSettingsPanel() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState("channels");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await fetchAdminSettings();
      setSettings(data);
      setError('');
    } catch (err) {
      setError(getAdminSettingsError(err, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  };

  const set = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const setAllowedAdminIps = (value) => {
    set(
      'allowed_admin_ips',
      value
        .split(/[\n,]/)
        .map(ip => ip.trim())
        .filter(Boolean)
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const savedSettings = await saveAdminSettings(settings);
      setSettings(savedSettings);
      setError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(getAdminSettingsError(err, 'Failed to save settings'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage integrations, notifications, and all message templates.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" /><span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" /><span className="text-sm text-green-700">Settings saved successfully</span>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "channels" && (
        <div className="space-y-6">
          {/* Email */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Email Configuration</h3>
            </div>
            <div className="space-y-4">
              <Field label="Admin Notification Email" helper="Where lead alerts and admin emails are sent">
                <TextInput value={settings.lead_notification_email} onChange={v => set('lead_notification_email', v)} placeholder="admin@example.com" type="email" />
              </Field>
              <Field label="Resend From Email" helper="Must be verified with Resend">
                <TextInput value={settings.resend_from_email} onChange={v => set('resend_from_email', v)} placeholder="noreply@yourdomain.com" type="email" />
              </Field>
              <Field label="Resend Default Booking Link">
                <TextInput value={settings.booking_link_default} onChange={v => set('booking_link_default', v)} placeholder="https://calendly.com/..." />
              </Field>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`w-2 h-2 rounded-full ${settings.resend_enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-foreground">Resend Status: {settings.resend_enabled ? 'Connected' : 'Not Connected'}</span>
              </div>
            </div>
          </div>

          {/* SMS */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">SMS Configuration</h3>
            </div>
            <div className="space-y-4">
              <Field label="Twilio From Number">
                <TextInput value={settings.twilio_from_number} onChange={v => set('twilio_from_number', v)} placeholder="+15550001234" type="tel" />
              </Field>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`w-2 h-2 rounded-full ${settings.twilio_enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-foreground">Twilio Status: {settings.twilio_enabled ? 'Connected' : 'Not Connected'}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground">WhatsApp (via Twilio)</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <button
                  onClick={() => set('whatsapp_enabled', !settings.whatsapp_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.whatsapp_enabled ? 'bg-green-500' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-foreground">{settings.whatsapp_enabled ? 'WhatsApp Enabled' : 'WhatsApp Disabled'}</span>
              </div>
              <Field label="WhatsApp From Number" helper={'Must include "whatsapp:" prefix'}>
                <TextInput value={settings.whatsapp_from_number} onChange={v => set('whatsapp_from_number', v)} placeholder="whatsapp:+14155238886" />
              </Field>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Admin Access Controls</h3>
            </div>
            <div className="space-y-4">
              <Field
                label="Allowed Admin IPs"
                helper="Optional allowlist for admin access controls. Enter one IP per line or comma-separated. Leave empty to keep IP allowlisting disabled."
              >
                <TextArea
                  value={(settings.allowed_admin_ips || []).join('\n')}
                  onChange={setAllowedAdminIps}
                  placeholder={"203.0.113.10\n198.51.100.25"}
                  rows={4}
                />
              </Field>
            </div>
          </div>
        </div>
      )}

      {activeTab === "instant" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Instant Response Templates</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{VAR_HINT}</p>
            <div className="space-y-5">
              <Field label="Instant Response SMS" helper="Sent immediately when a new lead submits a form or contacts you">
                <TextArea value={settings.sms_template} onChange={v => set('sms_template', v)} placeholder="Hi {name}, thanks for reaching out to {business_name}! We'll follow up shortly. Book here: {booking_link}" rows={3} />
              </Field>
              <Field label="Email Confirmation Template" helper="Sent as the email confirmation to new leads">
                <TextArea value={settings.email_confirmation_template} onChange={v => set('email_confirmation_template', v)} placeholder="Hi {name}, thanks for your interest. We'll be in touch soon..." rows={4} />
              </Field>
              <Field label="Missed Call SMS" helper="Sent automatically when a call is missed">
                <TextArea value={settings.missed_call_sms_template} onChange={v => set('missed_call_sms_template', v)} placeholder="Hi! We missed your call. Reply here or book a time: {booking_link}" rows={3} />
              </Field>
              <Field label="Admin New Lead Notification Template">
                <TextArea value={settings.admin_notification_template} onChange={v => set('admin_notification_template', v)} placeholder="New lead: {name} from {business_name} — {phone}" rows={3} />
              </Field>
              <Field label="Booking Prompt SMS (24h after Qualified)" helper="Sent when a lead is qualified and hasn't booked">
                <TextArea value={settings.follow_up_booking_prompt_sms} onChange={v => set('follow_up_booking_prompt_sms', v)} placeholder="Hi {name}, just wanted to follow up — you can book your free call here: {booking_link}" rows={3} />
              </Field>
              <Field label="Booking Prompt Email Body (24h after Qualified)">
                <TextArea value={settings.follow_up_booking_prompt_email} onChange={v => set('follow_up_booking_prompt_email', v)} placeholder="Hi {name}, we'd love to connect..." rows={4} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {activeTab === "followup" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Follow-Up SMS Sequence</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{VAR_HINT}</p>
            <div className="space-y-5">
              <Field label="Day 1 Follow-Up SMS" helper="Sent 1 day after initial contact with no reply">
                <TextArea value={settings.follow_up_day1_sms} onChange={v => set('follow_up_day1_sms', v)} placeholder="Hi {name}, just checking in — still interested? Reply here or grab a time: {booking_link}" rows={3} />
              </Field>
              <Field label="Day 3 Follow-Up SMS" helper="Sent 3 days after initial contact with no reply">
                <TextArea value={settings.follow_up_day3_sms} onChange={v => set('follow_up_day3_sms', v)} placeholder="Hey {name}, we have a few open spots this week. Would love to help: {booking_link}" rows={3} />
              </Field>
              <Field label="Day 7 Follow-Up SMS" helper="Sent 7 days after initial contact with no reply">
                <TextArea value={settings.follow_up_day7_sms} onChange={v => set('follow_up_day7_sms', v)} placeholder="Hi {name}, last check-in from us. No pressure — if timing is off, just let us know." rows={3} />
              </Field>
            </div>
          </div>
        </div>
      )}

      {activeTab === "nurture" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">30-Day Nurture Email Steps</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{VAR_HINT}</p>
            <div className="space-y-8">
              {[
                { num: 1, label: "Day 0 — Welcome", subKey: "nurture_step1_subject", bodyKey: "nurture_step1_body" },
                { num: 2, label: "Day 3 — Case Study", subKey: "nurture_step2_subject", bodyKey: "nurture_step2_body" },
                { num: 3, label: "Day 7 — Testimonial", subKey: "nurture_step3_subject", bodyKey: "nurture_step3_body" },
                { num: 4, label: "Day 10 — Tip", subKey: "nurture_step4_subject", bodyKey: "nurture_step4_body" },
                { num: 5, label: "Day 14 — Case Study 2", subKey: "nurture_step5_subject", bodyKey: "nurture_step5_body" },
                { num: 6, label: "Day 18 — Testimonial 2", subKey: "nurture_step6_subject", bodyKey: "nurture_step6_body" },
                { num: 7, label: "Day 23 — Tip + Offer", subKey: "nurture_step7_subject", bodyKey: "nurture_step7_body" },
                { num: 8, label: "Day 30 — Final CTA", subKey: "nurture_step8_subject", bodyKey: "nurture_step8_body" },
              ].map(step => (
                <div key={step.num} className="rounded-xl border border-border p-5 space-y-3">
                  <p className="text-sm font-bold text-foreground">Step {step.num}: {step.label}</p>
                  <Field label="Subject Line">
                    <TextInput value={settings[step.subKey]} onChange={v => set(step.subKey, v)} placeholder={`Email subject for step ${step.num}...`} />
                  </Field>
                  <Field label="Email Body">
                    <TextArea value={settings[step.bodyKey]} onChange={v => set(step.bodyKey, v)} placeholder={`Email body for step ${step.num}...`} rows={4} />
                  </Field>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Key, Save, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import {
  fetchAdminSettings,
  getAdminSettingsError,
  saveAdminSettings,
} from '@/lib/adminSettingsApi';

export default function AdminSettingsPanel() {
  const [settings, setSettings] = useState({
    lead_notification_email: '',
    resend_from_email: '',
    twilio_from_number: '',
    twilio_enabled: false,
    whatsapp_enabled: false,
    whatsapp_from_number: '',
    resend_enabled: false,
    sms_template: '',
    email_confirmation_template: '',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
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
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage integrations and notifications</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">Settings saved successfully</span>
        </div>
      )}

      {/* Email Settings */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Email Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Admin Notification Email
            </label>
            <input
              type="email"
              value={settings.lead_notification_email}
              onChange={(e) => handleChange('lead_notification_email', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Resend From Email
            </label>
            <input
              type="email"
              value={settings.resend_from_email}
              onChange={(e) => handleChange('resend_from_email', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="noreply@apexflow.com"
            />
            <p className="text-xs text-muted-foreground mt-1">Must be verified with Resend</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-foreground">Resend Status: {settings.resend_enabled ? 'Connected' : 'Not Connected'}</span>
          </div>
        </div>
      </div>

      {/* SMS Settings */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">SMS Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Twilio From Number
            </label>
            <input
              type="tel"
              value={settings.twilio_from_number}
              onChange={(e) => handleChange('twilio_from_number', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className={`w-2 h-2 rounded-full ${settings.twilio_enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-foreground">Twilio Status: {settings.twilio_enabled ? 'Connected' : 'Not Connected'}</span>
          </div>
        </div>
      </div>

      {/* WhatsApp Settings */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-foreground">WhatsApp Business (via Twilio)</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <button
              onClick={() => handleChange('whatsapp_enabled', !settings.whatsapp_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.whatsapp_enabled ? 'bg-green-500' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-foreground">
              {settings.whatsapp_enabled ? 'WhatsApp Enabled' : 'WhatsApp Disabled'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WhatsApp From Number
            </label>
            <input
              type="text"
              value={settings.whatsapp_from_number}
              onChange={(e) => handleChange('whatsapp_from_number', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="whatsapp:+14155238886"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must include <code className="bg-muted px-1 rounded">whatsapp:</code> prefix — use your Twilio WhatsApp sender number.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800 space-y-1">
            <p className="font-semibold">Webhook setup required:</p>
            <p>In Twilio Console → Messaging → WhatsApp Sandbox (or approved sender), set the inbound webhook URL to:</p>
            <code className="block bg-white border border-green-200 rounded px-2 py-1 mt-1 font-mono break-all">
              https://&lt;your-app&gt;.base44.app/api/functions/receiveWhatsAppWebhook
            </code>
          </div>
        </div>
      </div>

      {/* Template Settings */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Message Templates</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Default SMS Template
            </label>
            <textarea
              value={settings.sms_template}
              onChange={(e) => handleChange('sms_template', e.target.value)}
              rows="3"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Hi {name}, thanks for your interest. Click here to book: {booking_link}"
            />
            <p className="text-xs text-muted-foreground mt-1">Use {'{name}'}, {'{booking_link}'}, {'{date}'} as variables</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Confirmation Template
            </label>
            <textarea
              value={settings.email_confirmation_template}
              onChange={(e) => handleChange('email_confirmation_template', e.target.value)}
              rows="3"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Thank you for reaching out. We'll follow up shortly..."
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
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
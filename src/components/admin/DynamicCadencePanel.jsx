import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Settings, RotateCcw, Check, AlertCircle } from 'lucide-react';

export default function DynamicCadencePanel() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const records = await base44.admin.entities.AdminSettings.list('-created_date', 1);
      setSettings(records?.[0] || getDefaultSettings());
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = () => ({
    cadence_default_mode: 'auto',
    cadence_switch_attempts: 3,
    cadence_pause_on_reply: true,
    cadence_engagement_threshold: 50,
    cadence_max_attempts: 6,
  });

  // Task 21 — Clamp numeric settings to valid range before saving
  const clamp = (val, min, max) => Math.max(min, Math.min(max, Number(val) || min));

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      // Task 21 — Apply range validation before persisting
      const validated = {
        cadence_default_mode: settings.cadence_default_mode,
        cadence_switch_attempts: clamp(settings.cadence_switch_attempts, 1, 10),
        cadence_pause_on_reply: settings.cadence_pause_on_reply,
        cadence_engagement_threshold: clamp(settings.cadence_engagement_threshold, 0, 100),
        cadence_max_attempts: clamp(settings.cadence_max_attempts, 2, 20),
      };
      setSettings(prev => ({ ...prev, ...validated }));

      const records = await base44.admin.entities.AdminSettings.list('-created_date', 1);
      const settingsId = records?.[0]?.id;

      if (settingsId) {
        await base44.admin.entities.AdminSettings.update(settingsId, validated);
      } else {
        await base44.admin.entities.AdminSettings.create(validated);
      }
      setError('');
      setSaveSuccess(true);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Dynamic Cadence Settings</h2>
        <Settings className="w-5 h-5 text-muted-foreground" />
      </div>

      {error && (
        <div className="flex gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Default Cadence Mode */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">Default Cadence Mode</label>
          <select
            value={settings?.cadence_default_mode || 'auto'}
            onChange={(e) => handleChange('cadence_default_mode', e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="auto">Auto (Alternate channels)</option>
            <option value="sms_first">SMS First (Switch to email after N attempts)</option>
            <option value="email_first">Email First (Switch to SMS after N attempts)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-2">Controls how follow-up channels are sequenced</p>
        </div>

        {/* Switch After N Attempts */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Switch Channel After N Attempts
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={settings?.cadence_switch_attempts || 3}
            onChange={(e) => handleChange('cadence_switch_attempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-lg text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-2">
            If no response after this many attempts on one channel, switch to the other
          </p>
        </div>

        {/* Pause on Reply */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.cadence_pause_on_reply ?? true}
              onChange={(e) => handleChange('cadence_pause_on_reply', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-semibold text-foreground">Pause Sequence When Lead Replies</span>
          </label>
          <p className="text-xs text-muted-foreground mt-2">Automatically pause follow-ups if lead responds to any message</p>
        </div>

        {/* Engagement Threshold */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Engagement Score Threshold
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings?.cadence_engagement_threshold || 50}
            onChange={(e) => handleChange('cadence_engagement_threshold', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-lg text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-2">
            If engagement score exceeds this threshold, increase follow-up frequency (send every 30 min instead of 60)
          </p>
        </div>

        {/* Max Attempts */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">Max Follow-Up Attempts</label>
          <input
            type="number"
            min="2"
            max="20"
            value={settings?.cadence_max_attempts || 6}
            onChange={(e) => handleChange('cadence_max_attempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-lg text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-2">Stop automation after this many total follow-up attempts (SMS + email)</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {/* Task 20 — Per-field disabled state + success feedback */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-60"
        >
          {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
        </button>
        <button
          onClick={loadSettings}
          className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition"
        >
          Reset
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">How it works:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Automation runs every 5 minutes and evaluates each lead's engagement</li>
          <li>• If lead replies, sequence pauses automatically (if enabled)</li>
          <li>• After N attempts without response, switches to alternate channel</li>
          <li>• Highly engaged leads get faster follow-ups (every 30 min)</li>
          <li>• Stops after max attempts to prevent over-contacting</li>
        </ul>
      </div>
    </div>
  );
}
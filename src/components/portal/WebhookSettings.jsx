import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Webhook, Save, Loader2, CheckCircle2, AlertCircle, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

const EVENT_TYPES = [
  { key: "task_completed", label: "Task Completed", desc: "Fired when an AI service task finishes successfully" },
  { key: "task_error", label: "Task Error", desc: "Fired when a task encounters an error" },
  { key: "lead_created", label: "Lead Created", desc: "Fired when a new lead enters your pipeline" },
  { key: "lead_status_changed", label: "Lead Status Changed", desc: "Fired when a lead's status updates" },
  { key: "sms_delivered", label: "SMS Delivered", desc: "Fired when an outbound SMS is delivered" },
  { key: "email_sent", label: "Email Sent", desc: "Fired when an automated email is sent" },
];

export default function WebhookSettings({ project }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [secretToken, setSecretToken] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(["task_completed", "task_error"]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load saved webhook config from admin settings
    const loadSettings = async () => {
      try {
        const res = await base44.functions.invoke("getAdminSettings", {});
        const settings = res?.data?.settings || res?.data || {};
        if (settings.webhook_url) setWebhookUrl(settings.webhook_url);
        if (settings.webhook_secret_token) setSecretToken(settings.webhook_secret_token);
      } catch (_) {}
    };
    loadSettings();
  }, []);

  const toggleEvent = (key) => {
    setSelectedEvents((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!webhookUrl) { setError("Please enter a webhook URL."); return; }
    try { new URL(webhookUrl); } catch (_) { setError("Please enter a valid URL."); return; }
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("updateAdminSettings", {
        webhook_url: webhookUrl,
        webhook_enabled: true,
        webhook_secret_token: secretToken || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to save webhook settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl) { setError("Enter a webhook URL first."); return; }
    setTesting(true);
    setTestResult(null);
    setError("");
    try {
      const res = await base44.functions.invoke("dispatchLeadWebhook", {
        test: true,
        webhook_url: webhookUrl,
        event_type: "test_ping",
        payload: {
          event: "test_ping",
          message: "ClientSurge webhook test — connection successful!",
          timestamp: new Date().toISOString(),
          project_id: project?.id,
        },
      });
      setTestResult({ success: true, message: "Webhook test delivered successfully!" });
    } catch (err) {
      setTestResult({ success: false, message: err?.data?.error || err?.message || "Test failed. Check your URL." });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setWebhookUrl("");
    setSecretToken("");
    setSelectedEvents(["task_completed", "task_error"]);
    setTestResult(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Webhook className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Webhook Notifications</h2>
            <p className="text-sm text-muted-foreground">Receive real-time POST requests to your endpoint when events occur</p>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Your endpoint must respond with a <strong>2xx status code</strong> within 5 seconds. Failed deliveries will be retried up to 3 times.</span>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Endpoint Configuration</h3>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Webhook URL *</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => { setWebhookUrl(e.target.value); setError(""); }}
            placeholder="https://your-app.com/webhooks/clientsurge"
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Secret Token <span className="font-normal text-muted-foreground">(optional — sent as X-Webhook-Secret header)</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={secretToken}
              onChange={(e) => setSecretToken(e.target.value)}
              placeholder="your-secret-token"
              className="w-full px-4 py-2.5 pr-10 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {testResult && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-xl border ${
            testResult.success
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {testResult.success
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {testResult.message}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Webhook"}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !webhookUrl}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            {testing ? "Testing..." : "Send Test Ping"}
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Event Subscriptions */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Events to Subscribe</h3>
        <p className="text-sm text-muted-foreground">Choose which events trigger a webhook delivery to your endpoint.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EVENT_TYPES.map((event) => {
            const active = selectedEvents.includes(event.key);
            return (
              <button
                key={event.key}
                onClick={() => toggleEvent(event.key)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{event.label}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    active ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{event.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payload Example */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-3">
        <h3 className="font-semibold text-foreground">Example Payload</h3>
        <pre className="bg-muted rounded-xl p-4 text-xs text-foreground overflow-x-auto leading-relaxed">{`{
  "event": "task_completed",
  "timestamp": "2026-04-25T14:32:00Z",
  "project_id": "${project?.id || "proj_abc123"}",
  "data": {
    "task_type": "sms_sent",
    "lead_id": "lead_xyz789",
    "status": "delivered",
    "message": "Instant SMS delivered to lead"
  }
}`}</pre>
      </div>
    </div>
  );
}
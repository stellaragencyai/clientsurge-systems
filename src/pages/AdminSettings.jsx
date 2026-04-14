import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Zap, Mail, Link2, Settings, ArrowLeft } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("twilio");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await base44.entities.AdminSettings.list();
      setSettings(data.length > 0 ? data[0] : {});
    } catch (err) {
      console.error("Error loading settings:", err);
    }
    setLoading(false);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
            Access Denied
          </h1>
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  const handleSettingChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        await base44.entities.AdminSettings.update(settings.id, settings);
      } else {
        await base44.entities.AdminSettings.create(settings);
      }
      alert("Settings saved successfully");
    } catch (err) {
      alert("Error saving settings: " + err.message);
    }
    setSaving(false);
  };

  const handleTestProvider = async (providerType) => {
    setTestingProvider(providerType);
    try {
      const result = await base44.functions.invoke("testProviderConnections", {
        provider_type: providerType,
      });
      setTestResults(result.data.results);
    } catch (err) {
      setTestResults({
        error: err.message,
      });
    }
    setTestingProvider(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Admin Settings
            </h1>
          </div>
          <p className="text-muted-foreground">
            Configure Twilio, email, webhooks, and communication templates
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {[
            { id: "twilio", label: "Twilio SMS", icon: Zap },
            { id: "email", label: "Email", icon: Mail },
            { id: "webhooks", label: "Webhooks", icon: Link2 },
            { id: "templates", label: "Templates", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-border p-8">
          {/* Twilio Tab */}
          {activeTab === "twilio" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Twilio Enabled
                </label>
                <input
                  type="checkbox"
                  checked={settings.twilio_enabled || false}
                  onChange={(e) =>
                    handleSettingChange("twilio_enabled", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
                />
              </div>

              <SettingInput
                label="Twilio From Number"
                value={settings.twilio_from_number || ""}
                onChange={(e) =>
                  handleSettingChange("twilio_from_number", e.target.value)
                }
                placeholder="+1234567890"
              />

              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Credentials Status:</strong>
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  <p>
                    Account SID:{" "}
                    <span
                      className={
                        settings.twilio_account_sid_present
                          ? "text-green-600 font-medium"
                          : "text-destructive font-medium"
                      }
                    >
                      {settings.twilio_account_sid_present
                        ? "✓ Configured"
                        : "✗ Not Set"}
                    </span>
                  </p>
                  <p>
                    Auth Token:{" "}
                    <span
                      className={
                        settings.twilio_auth_token_present
                          ? "text-green-600 font-medium"
                          : "text-destructive font-medium"
                      }
                    >
                      {settings.twilio_auth_token_present
                        ? "✓ Configured"
                        : "✗ Not Set"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => handleTestProvider("twilio")}
                  disabled={testingProvider === "twilio"}
                  variant="outline"
                  className="gap-2"
                >
                  {testingProvider === "twilio" ? "Testing..." : "Test Twilio Connection"}
                </Button>
                {testResults?.twilio && (
                  <div className="mt-4 p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium text-foreground">
                      {testResults.twilio.status}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResults.twilio.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === "email" && (
            <div className="space-y-6">
              <SettingInput
                label="From Email (Sender)"
                type="email"
                value={settings.resend_from_email || ""}
                onChange={(e) =>
                  handleSettingChange("resend_from_email", e.target.value)
                }
                placeholder="noreply@yourcompany.com"
              />

              <SettingInput
                label="Admin Notification Email"
                type="email"
                value={settings.lead_notification_email || ""}
                onChange={(e) =>
                  handleSettingChange("lead_notification_email", e.target.value)
                }
                placeholder="admin@yourcompany.com"
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Provider
                </label>
                <select
                  value={settings.resend_enabled ? "resend" : "disabled"}
                  onChange={(e) =>
                    handleSettingChange("resend_enabled", e.target.value === "resend")
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="disabled">Disabled</option>
                  <option value="resend">Resend</option>
                </select>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => handleTestProvider("email")}
                  disabled={testingProvider === "email"}
                  variant="outline"
                  className="gap-2"
                >
                  {testingProvider === "email" ? "Testing..." : "Test Email Provider"}
                </Button>
                {testResults?.email && (
                  <div className="mt-4 p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium text-foreground">
                      {testResults.email.status}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResults.email.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === "webhooks" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Webhooks Enabled
                </label>
                <input
                  type="checkbox"
                  checked={settings.webhook_enabled || false}
                  onChange={(e) =>
                    handleSettingChange("webhook_enabled", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
                />
              </div>

              <SettingInput
                label="Webhook Target URL"
                value={settings.webhook_url || ""}
                onChange={(e) =>
                  handleSettingChange("webhook_url", e.target.value)
                }
                placeholder="https://your-webhook-provider.com/webhook"
              />

              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Example Payload:</strong>
                </p>
                <pre className="mt-3 text-xs bg-background rounded p-3 overflow-x-auto">
                  {JSON.stringify(
                    {
                      event: "lead_created",
                      timestamp: "2024-01-15T10:30:00Z",
                      lead: {
                        id: "lead_123",
                        full_name: "John Doe",
                        business_name: "Acme Corp",
                        email: "john@acme.com",
                        phone: "+1234567890",
                        niche: "Med Spa",
                        status: "NEW",
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => handleTestProvider("webhook")}
                  disabled={testingProvider === "webhook"}
                  variant="outline"
                  className="gap-2"
                >
                  {testingProvider === "webhook"
                    ? "Testing..."
                    : "Test Webhook"}
                </Button>
                {testResults?.webhook && (
                  <div className="mt-4 p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium text-foreground">
                      {testResults.webhook.status}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {testResults.webhook.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SMS Template
                </label>
                <textarea
                  value={settings.sms_template || ""}
                  onChange={(e) =>
                    handleSettingChange("sms_template", e.target.value)
                  }
                  placeholder="Hi {{full_name}}, thanks for reaching out to {{agency_name}}. We got your request and will follow up shortly."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Available variables: {`{{full_name}}, {{agency_name}}, {{booking_link}}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Confirmation Template
                </label>
                <textarea
                  value={settings.email_confirmation_template || ""}
                  onChange={(e) =>
                    handleSettingChange("email_confirmation_template", e.target.value)
                  }
                  placeholder="Hi {{full_name}}, thanks for reaching out. We received your request and will be in touch shortly."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Admin Notification Template
                </label>
                <textarea
                  value={settings.admin_notification_template || ""}
                  onChange={(e) =>
                    handleSettingChange("admin_notification_template", e.target.value)
                  }
                  placeholder="New Lead: {{full_name}} from {{business_name}}"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <SettingInput
                label="Default Booking Link"
                value={settings.booking_link_default || ""}
                onChange={(e) =>
                  handleSettingChange("booking_link_default", e.target.value)
                }
                placeholder="https://calendly.com/your-link"
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            size="lg"
            className="gap-2"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingInput({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
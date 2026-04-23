import { useState, useEffect } from "react";
import { MessageSquare, Mail, Eye, Save, X, AlertCircle, CheckCircle } from "lucide-react";
import {
  fetchAdminSettings,
  getAdminSettingsError,
  saveAdminSettings,
} from "@/lib/adminSettingsApi";

export default function CommunicationTemplates() {
  const [templates, setTemplates] = useState({ sms: "", email: "" });
  const [preview, setPreview] = useState(null);
  const [testData, setTestData] = useState({ name: "John", booking_link: "example.com/book" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const settings = await fetchAdminSettings();
      setTemplates({
        sms: settings.sms_template || "",
        email: settings.email_confirmation_template || "",
      });
      setError("");
    } catch (err) {
      setError(getAdminSettingsError(err, "Failed to load templates."));
    }
  };

  const handlePreview = (type) => {
    const content = templates[type];
    const rendered = renderTemplate(content, testData);
    setPreview({ type, content: rendered });
  };

  const renderTemplate = (template, data) => {
    let result = template;
    Object.keys(data).forEach((key) => {
      result = result.replace(new RegExp(`{${key}}`, "g"), data[key]);
    });
    return result;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await saveAdminSettings({
        sms_template: templates.sms,
        email_confirmation_template: templates.email,
      });
      setError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(getAdminSettingsError(err, "Failed to save templates."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Communication Templates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize SMS and email messages through the canonical admin settings endpoint.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          Templates saved successfully
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">SMS Template</h3>
        </div>
        <textarea
          value={templates.sms}
          onChange={(e) => setTemplates((prev) => ({ ...prev, sms: e.target.value }))}
          rows="4"
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
          placeholder="Hi {name}, thanks for your interest in our services. Book your appointment: {booking_link}"
        />
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>
            Variables: {"{name}"} {"{booking_link}"} {"{date}"}
          </span>
          <button
            onClick={() => handlePreview("sms")}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Email Template</h3>
        </div>
        <textarea
          value={templates.email}
          onChange={(e) => setTemplates((prev) => ({ ...prev, email: e.target.value }))}
          rows="6"
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
          placeholder={"Hi {name},\n\nThank you for reaching out! We're excited to help.\n\nYour booking link: {booking_link}\n\nQuestions? Reply to this email.\n\nBest regards,\nThe Team"}
        />
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>
            Variables: {"{name}"} {"{booking_link}"} {"{date}"}
          </span>
          <button
            onClick={() => handlePreview("email")}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Templates"}
        </button>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {preview.type === "sms" ? "SMS Preview" : "Email Preview"}
              </h3>
              <button onClick={() => setPreview(null)} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              className={`p-4 rounded-lg ${preview.type === "sms" ? "bg-blue-50" : "bg-gray-50"} border border-border`}
            >
              <p className="text-sm whitespace-pre-wrap text-foreground">{preview.content}</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Edit test variables:</p>
              <input
                type="text"
                value={testData.name}
                onChange={(e) => setTestData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={testData.booking_link}
                onChange={(e) => setTestData((prev) => ({ ...prev, booking_link: e.target.value }))}
                placeholder="Booking link"
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

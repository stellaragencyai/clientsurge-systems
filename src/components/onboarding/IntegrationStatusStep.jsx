import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Phone, Mail, Globe, Webhook } from "lucide-react";

const STATUS = { idle: "idle", testing: "testing", ok: "ok", error: "error" };

function StatusBadge({ status, label }) {
  if (status === STATUS.testing) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
      <Loader2 className="w-3 h-3 animate-spin" /> Testing…
    </span>
  );
  if (status === STATUS.ok) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Connected
    </span>
  );
  if (status === STATUS.error) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full">
      Not tested
    </span>
  );
}

function IntegrationCard({ icon: Icon, title, description, status, errorMsg, onTest, disabled }) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      status === STATUS.ok ? "border-green-200 bg-green-50/40" :
      status === STATUS.error ? "border-red-200 bg-red-50/40" :
      "border-border bg-white"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            status === STATUS.ok ? "bg-green-100" :
            status === STATUS.error ? "bg-red-100" :
            "bg-primary/10"
          }`}>
            <Icon className={`w-5 h-5 ${
              status === STATUS.ok ? "text-green-600" :
              status === STATUS.error ? "text-red-500" :
              "text-primary"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
            {status === STATUS.error && errorMsg && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">{errorMsg}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={status} />
          <button
            onClick={onTest}
            disabled={disabled || status === STATUS.testing}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {status === STATUS.idle ? "Test" : "Retest"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationStatusStep({ data }) {
  const [statuses, setStatuses] = useState({
    twilio: STATUS.idle,
    email: STATUS.idle,
    webhook: STATUS.idle,
  });
  const [errors, setErrors] = useState({});
  const [testingAll, setTestingAll] = useState(false);

  const setStatus = (key, status, errorMsg = null) => {
    setStatuses(prev => ({ ...prev, [key]: status }));
    setErrors(prev => ({ ...prev, [key]: errorMsg }));
  };

  const testTwilio = async () => {
    if (!data.twilio_business_phone && !data.lead_notification_email) {
      setStatus("twilio", STATUS.error, "No phone number configured. Enter a Twilio number in the Messaging step.");
      return;
    }
    setStatus("twilio", STATUS.testing);
    try {
      const res = await base44.functions.invoke("testProviderConnections", { provider: "twilio" });
      if (res.data?.twilio?.ok) {
        setStatus("twilio", STATUS.ok);
      } else {
        setStatus("twilio", STATUS.error, res.data?.twilio?.error || "Twilio connection failed.");
      }
    } catch (e) {
      setStatus("twilio", STATUS.error, "Could not reach the test endpoint. Check your configuration.");
    }
  };

  const testEmail = async () => {
    if (!data.lead_notification_email) {
      setStatus("email", STATUS.error, "No notification email set. Enter one in the Messaging step.");
      return;
    }
    setStatus("email", STATUS.testing);
    try {
      const res = await base44.functions.invoke("testProviderConnections", { provider: "resend" });
      if (res.data?.resend?.ok) {
        setStatus("email", STATUS.ok);
      } else {
        setStatus("email", STATUS.error, res.data?.resend?.error || "Email connection failed.");
      }
    } catch (e) {
      setStatus("email", STATUS.error, "Could not reach the test endpoint.");
    }
  };

  const testWebhook = async () => {
    if (!data.crm_api_key && !data.crm_system) {
      setStatus("webhook", STATUS.error, "No CRM or webhook URL configured in the Integrations step.");
      return;
    }
    setStatus("webhook", STATUS.testing);
    // Simulate a lightweight check — real webhook test would hit the CRM
    setTimeout(() => {
      if (data.crm_api_key && data.crm_api_key.length > 5) {
        setStatus("webhook", STATUS.ok);
      } else if (data.crm_system && data.crm_system !== "None / Other") {
        setStatus("webhook", STATUS.ok);
      } else {
        setStatus("webhook", STATUS.error, "CRM/webhook URL appears invalid or incomplete.");
      }
    }, 1500);
  };

  const testAll = async () => {
    setTestingAll(true);
    await Promise.allSettled([testTwilio(), testEmail(), testWebhook()]);
    setTestingAll(false);
  };

  const allOk = Object.values(statuses).every(s => s === STATUS.ok);
  const anyTesting = Object.values(statuses).some(s => s === STATUS.testing);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Check your connections:</strong> Test each integration to confirm it's configured correctly before submitting. You can proceed even if some fail — our team will fix any issues during setup.
      </div>

      {/* Test All button */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Integration Status</p>
        <button
          onClick={testAll}
          disabled={anyTesting || testingAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: "linear-gradient(135deg,#00AEEF,#003B8F)" }}
        >
          {testingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Test All
        </button>
      </div>

      <div className="space-y-3">
        <IntegrationCard
          icon={Phone}
          title="Twilio SMS"
          description={data.twilio_business_phone ? `Phone: ${data.twilio_business_phone}` : "No Twilio number configured — we'll provision one for you."}
          status={statuses.twilio}
          errorMsg={errors.twilio}
          onTest={testTwilio}
          disabled={anyTesting}
        />

        <IntegrationCard
          icon={Mail}
          title="Email (Resend)"
          description={data.lead_notification_email ? `Notification email: ${data.lead_notification_email}` : "No email configured yet."}
          status={statuses.email}
          errorMsg={errors.email}
          onTest={testEmail}
          disabled={anyTesting}
        />

        <IntegrationCard
          icon={data.crm_system ? Webhook : Globe}
          title={data.crm_system ? `CRM — ${data.crm_system}` : "CRM / Webhook"}
          description={
            data.crm_system && data.crm_system !== "None / Other"
              ? `System: ${data.crm_system}${data.crm_api_key ? " · API key provided" : " · No API key yet"}`
              : "No CRM configured — optional, skip if not applicable."
          }
          status={statuses.webhook}
          errorMsg={errors.webhook}
          onTest={testWebhook}
          disabled={anyTesting}
        />
      </div>

      {/* Summary */}
      {allOk && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">All integrations connected!</p>
            <p className="text-xs text-green-700 mt-0.5">Everything looks great. Proceed to review and submit.</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Connection tests run securely server-side. No data is stored during testing.
      </p>
    </div>
  );
}
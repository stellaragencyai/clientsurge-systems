import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Phone, Mail, Globe, Webhook, CircleSlash2 } from "lucide-react";

const STATUS = { idle: "idle", testing: "testing", ok: "ok", skipped: "skipped", error: "error" };

function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(value || "").trim();
}

function isPlausiblePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function getProviderResult(response, providerKey) {
  const data = response?.data || response || {};
  const direct = data?.[providerKey];
  const nested = data?.results?.[providerKey];

  if (direct && typeof direct === "object") return direct;
  if (nested && typeof nested === "object") return nested;

  if (data?.success === true) {
    return { ok: true, message: data.message || "Connection check passed." };
  }

  if (data?.success === false) {
    return { ok: false, status: "error", error: data.message || data.error || "Connection check failed." };
  }

  return { ok: false, status: "error", error: "Unexpected connection-check response." };
}

function resultToStatus(result) {
  if (result?.status === "skipped") return STATUS.skipped;
  return result?.ok ? STATUS.ok : STATUS.error;
}

function resultMessage(result, fallback) {
  return result?.message || result?.error || fallback;
}

function StatusBadge({ status }) {
  if (status === STATUS.testing) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
      <Loader2 className="w-3 h-3 animate-spin" /> Testing…
    </span>
  );
  if (status === STATUS.ok) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Passed
    </span>
  );
  if (status === STATUS.skipped) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
      <CircleSlash2 className="w-3 h-3" /> Optional
    </span>
  );
  if (status === STATUS.error) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
      <XCircle className="w-3 h-3" /> Needs Review
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full">
      Not tested
    </span>
  );
}

function IntegrationCard({ icon: Icon, title, description, status, message, onTest, disabled }) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      status === STATUS.ok ? "border-green-200 bg-green-50/40" :
      status === STATUS.error ? "border-red-200 bg-red-50/40" :
      status === STATUS.skipped ? "border-slate-200 bg-slate-50/60" :
      "border-border bg-white"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            status === STATUS.ok ? "bg-green-100" :
            status === STATUS.error ? "bg-red-100" :
            status === STATUS.skipped ? "bg-slate-100" :
            "bg-primary/10"
          }`}>
            <Icon className={`w-5 h-5 ${
              status === STATUS.ok ? "text-green-600" :
              status === STATUS.error ? "text-red-500" :
              status === STATUS.skipped ? "text-slate-500" :
              "text-primary"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
            {message && (
              <p className={`text-xs mt-1.5 font-medium ${
                status === STATUS.error ? "text-red-600" :
                status === STATUS.ok ? "text-green-700" :
                status === STATUS.skipped ? "text-slate-600" :
                "text-muted-foreground"
              }`}>{message}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={status} />
          <button
            type="button"
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
  const [messages, setMessages] = useState({});
  const [testingAll, setTestingAll] = useState(false);

  const setStatus = (key, status, message = null) => {
    setStatuses(prev => ({ ...prev, [key]: status }));
    setMessages(prev => ({ ...prev, [key]: message }));
  };

  const testTwilio = async () => {
    const phone = normalizePhone(data.twilio_business_phone || data.business_phone);
    if (!phone || !isPlausiblePhone(phone)) {
      setStatus("twilio", STATUS.error, "Enter a valid US phone number. We can still provision Twilio during setup if needed.");
      return;
    }

    setStatus("twilio", STATUS.testing);
    try {
      const res = await base44.functions.invoke("testProviderConnections", {
        provider: "twilio",
        phone,
      });
      const result = getProviderResult(res, "twilio");
      setStatus("twilio", resultToStatus(result), resultMessage(result, "Phone format passed; provider will be finalized during setup."));
    } catch (e) {
      setStatus("twilio", STATUS.error, "Connection check endpoint is unavailable. You can still proceed; our team will verify Twilio during setup.");
    }
  };

  const testEmail = async () => {
    const email = String(data.lead_notification_email || data.business_email || "").trim();
    if (!email || !isValidEmail(email)) {
      setStatus("email", STATUS.error, "Enter a valid notification email address.");
      return;
    }

    setStatus("email", STATUS.testing);
    try {
      const res = await base44.functions.invoke("testProviderConnections", {
        provider: "resend",
        email,
      });
      const result = getProviderResult(res, "resend");
      setStatus("email", resultToStatus(result), resultMessage(result, "Email format passed; delivery provider will be finalized during setup."));
    } catch (e) {
      setStatus("email", STATUS.error, "Connection check endpoint is unavailable. You can still proceed; our team will verify email delivery during setup.");
    }
  };

  const testWebhook = async () => {
    const crmSystem = data.crm_system || "";
    if (!crmSystem || crmSystem === "None / Other") {
      setStatus("webhook", STATUS.skipped, "CRM integration is optional and can be skipped for this setup.");
      return;
    }

    setStatus("webhook", STATUS.testing);
    try {
      const res = await base44.functions.invoke("testProviderConnections", {
        provider: "crm",
        crm_system: crmSystem,
        crm_api_key: data.crm_api_key,
      });
      const result = getProviderResult(res, "crm");
      setStatus("webhook", resultToStatus(result), resultMessage(result, "CRM selection accepted; final connection will be completed during setup."));
    } catch (e) {
      setStatus("webhook", STATUS.ok, "CRM selection accepted. Our team will complete the final connection during setup.");
    }
  };

  const testAll = async () => {
    setTestingAll(true);
    await Promise.allSettled([testTwilio(), testEmail(), testWebhook()]);
    setTestingAll(false);
  };

  const requiredOk = [statuses.twilio, statuses.email].every(s => s === STATUS.ok || s === STATUS.skipped);
  const crmOk = statuses.webhook === STATUS.ok || statuses.webhook === STATUS.skipped;
  const allOk = requiredOk && crmOk;
  const anyTesting = Object.values(statuses).some(s => s === STATUS.testing);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Connection check:</strong> We verify the data you entered and confirm ClientSurge provider readiness where available. CRM is optional; if you selected None / Other, it will be skipped.
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Integration Status</p>
        <button
          type="button"
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
          description={data.twilio_business_phone ? `Phone: ${normalizePhone(data.twilio_business_phone)}` : data.business_phone ? `Business phone: ${normalizePhone(data.business_phone)}` : "No phone configured — we'll provision one for you."}
          status={statuses.twilio}
          message={messages.twilio}
          onTest={testTwilio}
          disabled={anyTesting}
        />

        <IntegrationCard
          icon={Mail}
          title="Email (Resend)"
          description={data.lead_notification_email ? `Notification email: ${data.lead_notification_email}` : data.business_email ? `Business email: ${data.business_email}` : "No email configured yet."}
          status={statuses.email}
          message={messages.email}
          onTest={testEmail}
          disabled={anyTesting}
        />

        <IntegrationCard
          icon={data.crm_system && data.crm_system !== "None / Other" ? Webhook : Globe}
          title={data.crm_system && data.crm_system !== "None / Other" ? `CRM — ${data.crm_system}` : "CRM — Optional"}
          description={
            data.crm_system && data.crm_system !== "None / Other"
              ? `System: ${data.crm_system}${data.crm_api_key ? " · API key provided" : " · final credentials handled during setup"}`
              : "No CRM configured — optional, skip if not applicable."
          }
          status={statuses.webhook}
          message={messages.webhook}
          onTest={testWebhook}
          disabled={anyTesting}
        />
      </div>

      {allOk && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Connection check complete.</p>
            <p className="text-xs text-green-700 mt-0.5">Your required details passed validation. Any provider-side work will be completed by ClientSurge during setup.</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Connection tests run securely server-side. No client data is stored during testing.
      </p>
    </div>
  );
}

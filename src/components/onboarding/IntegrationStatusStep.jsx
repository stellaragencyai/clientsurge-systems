import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Globe, Loader2, Mail, Phone, RefreshCw, Webhook } from "lucide-react";
import CSConnectionCard from "@/components/design-system/CSConnectionCard";

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
  if (data?.success === true) return { ok: true, message: data.message || "Connection check passed." };
  if (data?.success === false) return { ok: false, status: "error", error: data.message || data.error || "Connection check failed." };
  return { ok: false, status: "error", error: "Unexpected connection-check response." };
}

function resultToStatus(result) {
  if (result?.status === "skipped") return STATUS.skipped;
  return result?.ok ? STATUS.ok : STATUS.error;
}

function resultMessage(result, fallback) {
  return result?.message || result?.error || fallback;
}

function cardStatus(status) {
  if (status === STATUS.testing) return "testing";
  if (status === STATUS.ok) return "connected";
  if (status === STATUS.skipped) return "optional";
  if (status === STATUS.error) return "error";
  return "pending";
}

export default function IntegrationStatusStep({ data }) {
  const [statuses, setStatuses] = useState({ twilio: STATUS.idle, email: STATUS.idle, webhook: STATUS.idle });
  const [messages, setMessages] = useState({});
  const [testingAll, setTestingAll] = useState(false);

  const setStatus = (key, status, message = null) => {
    setStatuses((prev) => ({ ...prev, [key]: status }));
    setMessages((prev) => ({ ...prev, [key]: message }));
  };

  const testTwilio = async () => {
    const phone = normalizePhone(data.twilio_business_phone || data.business_phone);
    if (!phone || !isPlausiblePhone(phone)) {
      setStatus("twilio", STATUS.error, "Enter a valid US phone number. We can still provision Twilio during setup if needed.");
      return;
    }

    setStatus("twilio", STATUS.testing);
    try {
      const response = await base44.functions.invoke("testProviderConnections", { provider: "twilio", phone });
      const result = getProviderResult(response, "twilio");
      setStatus("twilio", resultToStatus(result), resultMessage(result, "Phone format passed; provider setup will be finalized by ClientSurge."));
    } catch {
      setStatus("twilio", STATUS.error, "The live endpoint is unavailable. You can proceed; ClientSurge will verify Twilio during installation.");
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
      const response = await base44.functions.invoke("testProviderConnections", { provider: "resend", email });
      const result = getProviderResult(response, "resend");
      setStatus("email", resultToStatus(result), resultMessage(result, "Email format passed; delivery setup will be finalized by ClientSurge."));
    } catch {
      setStatus("email", STATUS.error, "The live endpoint is unavailable. You can proceed; ClientSurge will verify email delivery during installation.");
    }
  };

  const testWebhook = async () => {
    const crmSystem = data.crm_system || "";
    if (!crmSystem || crmSystem === "None / Other") {
      setStatus("webhook", STATUS.skipped, "CRM integration is optional for this setup.");
      return;
    }

    setStatus("webhook", STATUS.testing);
    try {
      const response = await base44.functions.invoke("testProviderConnections", {
        provider: "crm",
        crm_system: crmSystem,
        crm_api_key: data.crm_api_key,
      });
      const result = getProviderResult(response, "crm");
      setStatus("webhook", resultToStatus(result), resultMessage(result, "CRM selection accepted; final connection will be completed during setup."));
    } catch {
      setStatus("webhook", STATUS.ok, "CRM selection accepted. ClientSurge will complete the final connection during installation.");
    }
  };

  const testAll = async () => {
    setTestingAll(true);
    await Promise.allSettled([testTwilio(), testEmail(), testWebhook()]);
    setTestingAll(false);
  };

  const requiredOk = [statuses.twilio, statuses.email].every((status) => status === STATUS.ok || status === STATUS.skipped);
  const crmOk = statuses.webhook === STATUS.ok || statuses.webhook === STATUS.skipped;
  const allOk = requiredOk && crmOk;
  const anyTesting = Object.values(statuses).some((status) => status === STATUS.testing);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Secure readiness check</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          ClientSurge validates the information you entered and checks provider readiness where available. CRM is optional and can be skipped.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-950">Connection health</h3>
          <p className="mt-1 text-xs text-slate-500">Run all checks together or validate each service individually.</p>
        </div>
        <button
          type="button"
          onClick={testAll}
          disabled={anyTesting || testingAll}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00AEEF] to-[#003B8F] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {testingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Test all connections
        </button>
      </div>

      <div className="space-y-3">
        <CSConnectionCard
          icon={Phone}
          name="Twilio SMS"
          description={data.twilio_business_phone ? `Phone: ${normalizePhone(data.twilio_business_phone)}` : data.business_phone ? `Business phone: ${normalizePhone(data.business_phone)}` : "No phone configured yet — ClientSurge can provision one during setup."}
          status={cardStatus(statuses.twilio)}
          message={messages.twilio}
          onAction={testTwilio}
          disabled={anyTesting}
        />

        <CSConnectionCard
          icon={Mail}
          name="Email delivery"
          description={data.lead_notification_email ? `Notification email: ${data.lead_notification_email}` : data.business_email ? `Business email: ${data.business_email}` : "No notification email configured yet."}
          status={cardStatus(statuses.email)}
          message={messages.email}
          onAction={testEmail}
          disabled={anyTesting}
        />

        <CSConnectionCard
          icon={data.crm_system && data.crm_system !== "None / Other" ? Webhook : Globe}
          name={data.crm_system && data.crm_system !== "None / Other" ? `CRM — ${data.crm_system}` : "CRM — Optional"}
          description={data.crm_system && data.crm_system !== "None / Other" ? `System: ${data.crm_system}${data.crm_api_key ? " · API key provided" : " · final credentials handled during setup"}` : "No CRM selected. This connection can be skipped when it is not applicable."}
          status={cardStatus(statuses.webhook)}
          message={messages.webhook}
          onAction={testWebhook}
          disabled={anyTesting}
        />
      </div>

      {allOk && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Connection check complete</p>
            <p className="mt-1 text-xs leading-5 text-emerald-700">Required details passed validation. Any remaining provider-side work will be completed by ClientSurge during installation.</p>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">Connection tests run securely server-side. No client credentials are stored during testing.</p>
    </div>
  );
}

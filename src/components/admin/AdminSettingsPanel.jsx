import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Key,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  ensureGa4Configuration,
  fetchAdminSettings,
  fetchGa4ConfigurationStatus,
  GA4_KEY_EVENTS,
  GA4_MEASUREMENT_ID,
  GA4_REPAIR_STAGES,
  getAdminSettingsError,
  saveAdminSettings,
} from "@/lib/adminSettingsApi";
import EmailTemplatePreviewModal from "./EmailTemplatePreviewModal";
import WebhooksTab from "./WebhooksTab";

const TABS = [
  { id: "channels", label: "Channels", icon: Mail },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "webhooks", label: "Webhooks", icon: Sparkles },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "instant", label: "Instant Response", icon: MessageSquare },
  { id: "followup", label: "Follow-Up SMS", icon: MessageCircle },
  { id: "nurture", label: "Nurture Emails", icon: Mail },
];

const VAR_HINT = "Variables: {name}, {business_name}, {booking_link}, {date}, {phone}";
const SAMPLE_VALUES = {
  "{name}": "Maria Rodriguez",
  "{business_name}": "Sculpt Med Spa",
  "{booking_link}": "https://calendly.com/example",
  "{date}": "May 24, 2026",
  "{phone}": "(602) 555-0184",
};

function Field({ label, helper, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-[0.08em] text-slate-600">{label}</label>
      {children}
      {helper ? <p className="text-xs leading-5 text-slate-500">{helper}</p> : null}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
    />
  );
}

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function StatusValue({ value, trueLabel = "Passed", falseLabel = "Failed", unknownLabel = "Unknown" }) {
  if (value === true) return <StatusPill ok label={trueLabel} />;
  if (value === false) return <StatusPill ok={false} label={falseLabel} />;
  return <StatusPill ok={false} label={unknownLabel} />;
}

function MetricTile({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
        <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600 ring-1 ring-sky-100"><Icon className="h-5 w-5" /></div>
        <div>
          <h3 className="text-base font-bold text-slate-950">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </section>
  );
}

function renderPreview(template = "") {
  return Object.entries(SAMPLE_VALUES).reduce((output, [token, value]) => output.replaceAll(token, value), template);
}

export default function AdminSettingsPanel() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("channels");
  const [previewModal, setPreviewModal] = useState(null);
  const [ga4Busy, setGa4Busy] = useState(false);
  const [ga4Stage, setGa4Stage] = useState("");
  const [ga4Result, setGa4Result] = useState(null);
  const [ga4Error, setGa4Error] = useState(null);

  const ga4 = settings?._ga4 || {};
  const ga4Verification = ga4Result || ga4.verification || {};
  const ga4Checks = ga4Verification.checks || {};
  const ga4StageLabel = GA4_REPAIR_STAGES.find((stage) => stage.id === ga4Stage)?.label || "";
  const dirty = useMemo(() => !loading && !saved, [loading, saved]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!ga4Busy) return undefined;

    let stageIndex = Math.max(0, GA4_REPAIR_STAGES.findIndex((stage) => stage.id === ga4Stage));
    const finalizingIndex = GA4_REPAIR_STAGES.findIndex((stage) => stage.id === "finalizing");
    const timer = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, finalizingIndex);
      setGa4Stage(GA4_REPAIR_STAGES[stageIndex]?.id || "finalizing");
    }, 1400);

    return () => window.clearInterval(timer);
  }, [ga4Busy, ga4Stage]);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await fetchAdminSettings();
      setSettings(data || {});
      setError("");
    } catch (err) {
      setError(getAdminSettingsError(err, "Failed to load settings"));
    } finally {
      setLoading(false);
    }
  }

  function set(field, value) {
    setSettings((previous) => ({ ...previous, [field]: value }));
    setSaved(false);
  }

  function setAllowedAdminIps(value) {
    set("allowed_admin_ips", value.split(/[\n,]/).map((ip) => ip.trim()).filter(Boolean));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveAdminSettings(settings);
      setSettings(result);
      setError("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(getAdminSettingsError(err, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  }

  async function repairGa4() {
    setGa4Busy(true);
    setError("");
    setGa4Error(null);
    setGa4Result(null);
    setGa4Stage("repairing_configuration");
    try {
      const migration = await ensureGa4Configuration({ onStage: setGa4Stage });
      const status = await fetchGa4ConfigurationStatus();
      const verification = migration?.verification || null;
      setGa4Result(verification);
      setGa4Stage("ga4_fully_verified");
      setSettings((previous) => ({ ...previous, _ga4: { repair: migration?.repair, verification, ...status } }));
    } catch (err) {
      const failedStage = err?.failed_stage || err?.data?.failed_stage || ga4Stage || "repairing_configuration";
      const failure = {
        message: err?.message || "GA4 repair failed",
        failed_stage: failedStage,
        failed_checks: err?.failed_checks || err?.data?.failed_checks || [],
        data: err?.data || null,
      };
      setGa4Stage(failedStage);
      setGa4Error(failure);
      setError(failure.message);
    } finally {
      setGa4Busy(false);
    }
  }

  function openPreview(name, value) {
    setPreviewModal({
      template_name: name,
      template_html: `<div style="font-family:Inter,Arial,sans-serif;line-height:1.65;padding:24px;color:#0f172a;white-space:pre-wrap">${renderPreview(value || "")}</div>`,
    });
  }

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-sky-500" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-28">
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-blue-50 px-7 py-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">System configuration</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Settings</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage customer communication channels, security, analytics integrity, webhooks, and automation templates from one control surface.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill ok={Boolean(settings.resend_enabled)} label={`Resend ${settings.resend_enabled ? "connected" : "needs attention"}`} />
            <StatusPill ok={Boolean(settings.twilio_enabled)} label={`Twilio ${settings.twilio_enabled ? "connected" : "needs attention"}`} />
            <StatusPill ok={Boolean(ga4.clean)} label={`GA4 ${ga4.clean ? "clean" : "repair needed"}`} />
          </div>
        </div>
      </div>

      {error ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div> : null}
      {saved ? <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />Settings saved successfully.</div> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="flex min-w-max gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab === id ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "channels" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SettingsCard icon={Mail} title="Email configuration" description="Control sender identity, notifications, and booking links.">
            <Field label="Admin notification email" helper="Lead alerts and operational notifications are sent here."><TextInput type="email" value={settings.lead_notification_email} onChange={(value) => set("lead_notification_email", value)} placeholder="admin@example.com" /></Field>
            <Field label="Resend from email" helper="This domain and sender must be verified in Resend."><TextInput type="email" value={settings.resend_from_email} onChange={(value) => set("resend_from_email", value)} placeholder="system@yourdomain.com" /></Field>
            <Field label="Default booking link"><TextInput value={settings.booking_link_default} onChange={(value) => set("booking_link_default", value)} placeholder="https://calendly.com/..." /></Field>
            <StatusPill ok={Boolean(settings.resend_enabled)} label={settings.resend_enabled ? "Resend connected" : "Resend not connected"} />
          </SettingsCard>

          <SettingsCard icon={MessageSquare} title="SMS configuration" description="Manage the Twilio number used for automated replies.">
            <Field label="Twilio from number" helper="Use E.164 format, for example +16025551234."><TextInput type="tel" value={settings.twilio_from_number} onChange={(value) => set("twilio_from_number", value)} placeholder="+15550001234" /></Field>
            <StatusPill ok={Boolean(settings.twilio_enabled)} label={settings.twilio_enabled ? "Twilio connected" : "Twilio not connected"} />
          </SettingsCard>

          <SettingsCard icon={MessageCircle} title="WhatsApp via Twilio" description="Optional WhatsApp channel using a Twilio-approved sender.">
            <button type="button" onClick={() => set("whatsapp_enabled", !settings.whatsapp_enabled)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${settings.whatsapp_enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <span>{settings.whatsapp_enabled ? "WhatsApp enabled" : "WhatsApp disabled"}</span><span className={`h-6 w-11 rounded-full p-1 transition ${settings.whatsapp_enabled ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`block h-4 w-4 rounded-full bg-white shadow transition ${settings.whatsapp_enabled ? "translate-x-5" : "translate-x-0"}`} /></span>
            </button>
            <Field label="WhatsApp from number" helper='Include the "whatsapp:" prefix.'><TextInput value={settings.whatsapp_from_number} onChange={(value) => set("whatsapp_from_number", value)} placeholder="whatsapp:+14155238886" /></Field>
          </SettingsCard>
        </div>
      ) : null}

      {activeTab === "analytics" ? (
        <div className="space-y-6">
          <SettingsCard icon={BarChart3} title="Google Analytics 4 integrity" description="Security, event naming, and migration state for the production GA4 configuration.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Measurement ID"><p className="font-mono text-sm font-bold text-slate-950">{GA4_MEASUREMENT_ID}</p></MetricTile>
              <MetricTile label="Record count"><p className="text-2xl font-bold text-slate-950">{ga4.record_count ?? "-"}</p></MetricTile>
              <MetricTile label="Legacy secret"><StatusValue value={ga4.has_legacy_secret == null ? null : ga4.has_legacy_secret === false} trueLabel="Removed" falseLabel="Still present" unknownLabel="Unknown" /></MetricTile>
              <MetricTile label="Canonical events"><StatusValue value={ga4.canonical_tracked_events == null || ga4.canonical_key_events == null ? null : Boolean(ga4.canonical_tracked_events && ga4.canonical_key_events)} trueLabel="Complete" falseLabel="Incomplete" unknownLabel="Unknown" /></MetricTile>
              <MetricTile label="Setup status"><p className="font-mono text-sm font-bold text-slate-950">{ga4.config?.setup_status || "-"}</p></MetricTile>
              <MetricTile label="Server-side tracking"><StatusValue value={ga4.config?.server_side_tracking_enabled == null ? null : ga4.config.server_side_tracking_enabled === true} trueLabel="Enabled" falseLabel="Disabled" unknownLabel="Unknown" /></MetricTile>
              <MetricTile label="Last verified"><p className="text-sm font-semibold text-slate-950">{ga4.config?.last_verified_at || "-"}</p></MetricTile>
              <MetricTile label="Verification ID"><p className="break-all font-mono text-xs font-semibold text-slate-950">{ga4Verification.verification_id || "-"}</p></MetricTile>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="font-bold text-slate-950">Canonical key events</h4>
                  <p className="mt-1 text-sm text-slate-500">Only these events should be marked as key events in GA4 Admin.</p>
                </div>
                <div className="flex flex-wrap gap-2">{GA4_KEY_EVENTS.map((eventName) => <span key={eventName} className="rounded-lg bg-slate-950 px-3 py-1.5 font-mono text-xs text-white">{eventName}</span>)}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Production site"><StatusValue value={ga4Checks.production_site?.passed} trueLabel="Healthy" falseLabel="Failed" unknownLabel="Not checked" /></MetricTile>
              <MetricTile label="MP debug validation"><StatusValue value={ga4Checks.measurement_protocol_debug?.passed} trueLabel="Passed" falseLabel="Failed" unknownLabel="Not checked" /></MetricTile>
              <MetricTile label="MP delivery"><StatusValue value={ga4Checks.measurement_protocol_delivery?.passed} trueLabel="Delivered" falseLabel="Failed" unknownLabel="Not checked" /></MetricTile>
              <MetricTile label="Static assertions"><StatusValue value={ga4Checks.static_code_assertions?.passed} trueLabel="Passed" falseLabel="Failed" unknownLabel="Not checked" /></MetricTile>
            </div>

            {ga4Busy ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <div className="flex items-center gap-3 text-sky-900">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="font-bold">{ga4StageLabel || "Repairing configuration..."}</p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {GA4_REPAIR_STAGES.map((stage) => {
                    const currentIndex = GA4_REPAIR_STAGES.findIndex((item) => item.id === ga4Stage);
                    const stageIndex = GA4_REPAIR_STAGES.findIndex((item) => item.id === stage.id);
                    const done = currentIndex > stageIndex || ga4Stage === "ga4_fully_verified";
                    const current = ga4Stage === stage.id && !done;
                    return (
                      <div key={stage.id} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${done ? "border-emerald-200 bg-white text-emerald-700" : current ? "border-sky-300 bg-white text-sky-800" : "border-slate-200 bg-white/70 text-slate-500"}`}>
                        {stage.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {ga4Error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">GA4 verification failed at {ga4Error.failed_stage || "unknown stage"}.</p>
                    <p className="mt-1 text-sm">{ga4Error.message}</p>
                    {ga4Error.failed_checks?.length ? <p className="mt-2 font-mono text-xs">Failed checks: {ga4Error.failed_checks.join(", ")}</p> : null}
                  </div>
                </div>
                <button type="button" onClick={repairGa4} disabled={ga4Busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-50">
                  <RefreshCw className="h-4 w-4" />Retry
                </button>
              </div>
            ) : ga4Verification.verified ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">GA4 fully verified.</p><p className="mt-1 text-sm">The backend marked the single clean GA4Configuration record active after Google validation, delivery, and production checks passed.</p></div></div>
            ) : ga4.clean ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">GA4 database configuration is clean.</p><p className="mt-1 text-sm">Run verification to prove the backend secret, Google delivery, and production domain before marking active.</p></div></div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><XCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">GA4 still requires repair.</p><p className="mt-1 text-sm">The repair action invokes the secured Base44 setup function, removes duplicate or legacy secret-bearing records, and then runs final backend verification.</p></div></div>
            )}

            <button type="button" onClick={repairGa4} disabled={ga4Busy} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50">
              {ga4Busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{ga4Busy ? (ga4StageLabel || "Repairing configuration...") : "Repair and verify GA4"}
            </button>
          </SettingsCard>
        </div>
      ) : null}

      {activeTab === "webhooks" ? <WebhooksTab settings={settings} onSettingsUpdated={setSettings} /> : null}

      {activeTab === "security" ? (
        <SettingsCard icon={Key} title="Admin access controls" description="Restrict administrative access to approved IP addresses when needed.">
          <Field label="Allowed Admin IPs" helper="Enter one IP per line or comma-separated. Leave empty to disable IP allowlisting."><TextArea value={(settings.allowed_admin_ips || []).join("\n")} onChange={setAllowedAdminIps} placeholder={"203.0.113.10\n198.51.100.25"} rows={5} /></Field>
        </SettingsCard>
      ) : null}

      {activeTab === "instant" ? (
        <SettingsCard icon={MessageSquare} title="Instant response templates" description={VAR_HINT}>
          <Field label="Instant response SMS"><TextArea value={settings.sms_template} onChange={(value) => set("sms_template", value)} placeholder="Hi {name}, thanks for reaching out to {business_name}. Book here: {booking_link}" /></Field>
          <Field label="Email confirmation template"><TextArea value={settings.email_confirmation_template} onChange={(value) => set("email_confirmation_template", value)} rows={5} /><button type="button" onClick={() => openPreview("Email Confirmation", settings.email_confirmation_template)} className="text-xs font-bold text-sky-600">Preview template</button></Field>
          <Field label="Missed call SMS"><TextArea value={settings.missed_call_sms_template} onChange={(value) => set("missed_call_sms_template", value)} /></Field>
          <Field label="Admin new lead notification"><TextArea value={settings.admin_notification_template} onChange={(value) => set("admin_notification_template", value)} /></Field>
          <Field label="Booking prompt SMS"><TextArea value={settings.follow_up_booking_prompt_sms} onChange={(value) => set("follow_up_booking_prompt_sms", value)} /></Field>
          <Field label="Booking prompt email"><TextArea value={settings.follow_up_booking_prompt_email} onChange={(value) => set("follow_up_booking_prompt_email", value)} rows={5} /><button type="button" onClick={() => openPreview("Booking Prompt Email", settings.follow_up_booking_prompt_email)} className="text-xs font-bold text-sky-600">Preview template</button></Field>
        </SettingsCard>
      ) : null}

      {activeTab === "followup" ? (
        <SettingsCard icon={MessageCircle} title="Follow-up SMS sequence" description={VAR_HINT}>
          <Field label="Day 1 follow-up"><TextArea value={settings.follow_up_day1_sms} onChange={(value) => set("follow_up_day1_sms", value)} /></Field>
          <Field label="Day 3 follow-up"><TextArea value={settings.follow_up_day3_sms} onChange={(value) => set("follow_up_day3_sms", value)} /></Field>
          <Field label="Day 7 follow-up"><TextArea value={settings.follow_up_day7_sms} onChange={(value) => set("follow_up_day7_sms", value)} /></Field>
        </SettingsCard>
      ) : null}

      {activeTab === "nurture" ? (
        <SettingsCard icon={Mail} title="30-day nurture email sequence" description={VAR_HINT}>
          {[1,2,3,4,5,6,7,8].map((number) => {
            const subjectKey = `nurture_step${number}_subject`;
            const bodyKey = `nurture_step${number}_body`;
            return <div key={number} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5"><p className="font-bold text-slate-950">Step {number}</p><Field label="Subject"><TextInput value={settings[subjectKey]} onChange={(value) => set(subjectKey, value)} /></Field><Field label="Body"><TextArea value={settings[bodyKey]} onChange={(value) => set(bodyKey, value)} rows={5} /><button type="button" onClick={() => openPreview(`Nurture Step ${number}`, settings[bodyKey])} className="text-xs font-bold text-sky-600">Preview template</button></Field></div>;
          })}
        </SettingsCard>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="hidden text-sm text-slate-500 sm:block">{saved ? "All changes saved." : dirty ? "Review your changes before leaving this page." : "Settings are up to date."}</p>
          <button onClick={handleSave} disabled={saving} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>

      {previewModal ? <EmailTemplatePreviewModal template_name={previewModal.template_name} template_html={previewModal.template_html} onClose={() => setPreviewModal(null)} /> : null}
    </div>
  );
}

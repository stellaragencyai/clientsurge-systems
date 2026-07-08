import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, Shield,
  Building2, Globe, Plug, Palette, Rocket, Sparkles,
} from "lucide-react";
import SetupAuthorizationStep from "@/components/onboarding/SetupAuthorizationStep";
import IntegrationStatusStep from "@/components/onboarding/IntegrationStatusStep";

const STORAGE_KEY_PREFIX = "clientsurge:credentials-wizard:";

const STEPS = [
  { id: "authorization", icon: Shield,     title: "Setup Authorization",      desc: "Accept the authorization agreement" },
  { id: "business",      icon: Building2,   title: "Business Info",           desc: "Basic details about your business" },
  { id: "brand",         icon: Palette,      title: "Brand & Design",          desc: "Colors and logo for your system" },
  { id: "messaging",     icon: Globe,         title: "Messaging Setup",        desc: "Phone number, booking link & hours" },
  { id: "integrations",  icon: Plug,         title: "Integrations",            desc: "Connect your lead sources" },
  { id: "connection",    icon: Plug,         title: "Connection Check",       desc: "Verify your integrations are live" },
  { id: "review",        icon: Rocket,       title: "Review & Submit",        desc: "Confirm everything looks good" },
];

const OTHER_INDUSTRY_OPTION = "Other / Not Listed";

const INDUSTRY_OPTIONS = [
  "HVAC",
  "Dental",
  "Roofing",
  "Plumbing & Drain Services",
  "Med Spas & Aesthetic Clinics",
  "Chiropractic & Physical Therapy",
  "Contractors & Trades",
  "Real Estate",
  "Personal Injury Law",
  "Veterinary Clinics",
  "Landscaping & Lawn Care",
  "Auto Repair / Detailing",
  OTHER_INDUSTRY_OPTION,
];

function trim(value) {
  return String(value || "").trim();
}

function getUSPhoneDigits(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

function normalizePhone(value = "") {
  const digits = getUSPhoneDigits(value);
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  return trim(value);
}

function formatUSPhone(value = "") {
  const digits = getUSPhoneDigits(value);
  if (digits.length === 10) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return trim(value);
}

function isValidUSPhone(value = "") {
  return getUSPhoneDigits(value).length === 10;
}

function normalizeEmail(value = "") {
  return trim(value).toLowerCase();
}

function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function normalizeUrl(value = "") {
  const raw = trim(value);
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    if (url.pathname === "/" && !url.search) return url.origin;
    return url.toString().replace(/\/$/, "");
  } catch {
    return withProtocol;
  }
}

function isValidUrl(value = "") {
  const raw = trim(value);
  if (!raw) return true;
  try {
    const url = new URL(normalizeUrl(raw));
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

function isValidHexColor(value = "") {
  return /^#[0-9A-F]{6}$/i.test(trim(value));
}

function resolveIndustry(data) {
  return data.industry === OTHER_INDUSTRY_OPTION ? trim(data.custom_industry) : trim(data.industry);
}

function normalizeDataForStep(prev, stepId) {
  const next = { ...prev };
  if (stepId === "business") {
    next.business_name = trim(next.business_name);
    next.custom_industry = trim(next.custom_industry);
    next.contact_name = trim(next.contact_name);
    next.business_phone = formatUSPhone(next.business_phone);
    next.business_email = normalizeEmail(next.business_email);
    next.website = normalizeUrl(next.website);
    next.address = trim(next.address);
    next.business_hours = trim(next.business_hours);
  }
  if (stepId === "brand") {
    next.primary_color = trim(next.primary_color).toUpperCase();
    next.secondary_color = trim(next.secondary_color).toUpperCase();
    next.tagline = trim(next.tagline);
  }
  if (stepId === "messaging") {
    next.twilio_business_phone = formatUSPhone(next.twilio_business_phone);
    next.booking_link = normalizeUrl(next.booking_link);
    next.lead_notification_email = normalizeEmail(next.lead_notification_email);
    next.customer_questions = trim(next.customer_questions);
  }
  if (stepId === "integrations") {
    next.google_review_link = normalizeUrl(next.google_review_link);
    next.other_lead_sources = trim(next.other_lead_sources);
    next.special_notes = trim(next.special_notes);
  }
  return next;
}

function readFunctionPayload(result) {
  return result?.data || result || {};
}

function Field({ label, hint, children, required, complete }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center justify-between gap-3 text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">
        <span>
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {complete && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Locked
          </span>
        )}
      </label>
      {hint && <p className="text-xs font-medium tracking-wide text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", onBlur, autoComplete, complete, inputMode }) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          complete
            ? "border-emerald-300 bg-emerald-50/40 pr-11 focus:border-emerald-400 focus:ring-emerald-200"
            : "border-slate-200 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
        }`}
      />
      {complete && <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 3, complete }) {
  return (
    <div className="relative">
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-none ${
          complete
            ? "border-emerald-300 bg-emerald-50/40 pr-11 focus:border-emerald-400 focus:ring-emerald-200"
            : "border-slate-200 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
        }`}
      />
      {complete && <CheckCircle2 className="absolute right-3 top-4 h-5 w-5 text-emerald-600" />}
    </div>
  );
}

function SelectInput({ value, onChange, options, placeholder, complete }) {
  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-all focus:outline-none focus:ring-2 ${
          complete
            ? "border-emerald-300 bg-emerald-50/40 pr-14 focus:border-emerald-400 focus:ring-emerald-200"
            : "border-slate-200 pr-10 hover:border-primary/40 focus:border-primary focus:ring-primary/20"
        } ${!value ? "text-slate-400" : ""}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">⌄</span>
      {complete && <CheckCircle2 className="absolute right-9 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />}
    </div>
  );
}

function CompletionSummary({ completed, total, title, note }) {
  const percent = Math.round((completed / total) * 100);
  const finished = completed === total;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${
      finished
        ? "border-emerald-200 bg-emerald-50"
        : "border-primary/15 bg-gradient-to-br from-primary/8 via-white to-sky-50"
    }`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border ${
            finished ? "border-emerald-200 bg-white text-emerald-700" : "border-primary/20 bg-white text-primary"
          }`}>
            {finished ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">{title}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-600">{note}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className={`text-2xl font-black ${finished ? "text-emerald-700" : "text-primary"}`}>{percent}%</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{completed}/{total} locked</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full transition-all duration-500 ${finished ? "bg-emerald-500" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange, complete }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 shadow-sm transition-all ${
      complete ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"
    }`}>
      <input
        type="color"
        value={value || "#000000"}
        onChange={e => onChange(e.target.value)}
        className="h-11 w-11 flex-shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {complete && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        </div>
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          onBlur={e => onChange(trim(e.target.value).toUpperCase())}
          placeholder="#000000"
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}

function ChipSelect({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition-all ${
              selected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary"
            }`}
          >
            {selected && <CheckCircle2 className="h-4 w-4" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function BusinessStep({ data, onChange }) {
  const industryComplete = Boolean(resolveIndustry(data));
  const statuses = {
    business_name: Boolean(trim(data.business_name)),
    industry: industryComplete,
    custom_industry: data.industry === OTHER_INDUSTRY_OPTION ? Boolean(trim(data.custom_industry)) : true,
    contact_name: Boolean(trim(data.contact_name)),
    business_phone: isValidUSPhone(data.business_phone),
    business_email: Boolean(trim(data.business_email)) && isValidEmail(data.business_email),
    website: Boolean(trim(data.website)) && isValidUrl(data.website),
    address: Boolean(trim(data.address)),
    brand_voice: Boolean(trim(data.brand_voice)),
    business_hours: Boolean(trim(data.business_hours)),
  };
  const trackedFields = [
    statuses.business_name,
    statuses.industry,
    statuses.contact_name,
    statuses.business_phone,
    statuses.business_email,
    statuses.website,
    statuses.address,
    statuses.brand_voice,
    statuses.business_hours,
  ];
  const completed = trackedFields.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <CompletionSummary
        title="Business intake scanner"
        completed={completed}
        total={trackedFields.length}
        note={completed === trackedFields.length ? "Business profile is clean, normalized, and ready for automation routing." : "Lock every field so the setup team gets clean data instead of manual cleanup work."}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Business Name" required complete={statuses.business_name}>
          <TextInput
            value={data.business_name}
            onChange={v => onChange("business_name", v)}
            onBlur={() => onChange("business_name", trim(data.business_name))}
            placeholder="Acme Med Spa"
            autoComplete="organization"
            complete={statuses.business_name}
          />
        </Field>

        <Field label="Industry / Niche" required complete={industryComplete} hint="Controls the default automation playbook.">
          <SelectInput
            value={data.industry}
            onChange={v => onChange("industry", v)}
            options={INDUSTRY_OPTIONS}
            placeholder="Select an industry"
            complete={industryComplete}
          />
        </Field>

        {data.industry === OTHER_INDUSTRY_OPTION && (
          <Field label="Custom Industry / Niche" required complete={statuses.custom_industry}>
            <TextInput
              value={data.custom_industry}
              onChange={v => onChange("custom_industry", v)}
              onBlur={() => onChange("custom_industry", trim(data.custom_industry))}
              placeholder="e.g. Salon, Gym, Legal Intake..."
              complete={statuses.custom_industry}
            />
          </Field>
        )}

        <Field label="Owner / Contact Name" complete={statuses.contact_name}>
          <TextInput
            value={data.contact_name}
            onChange={v => onChange("contact_name", v)}
            onBlur={() => onChange("contact_name", trim(data.contact_name))}
            placeholder="Jane Smith"
            autoComplete="name"
            complete={statuses.contact_name}
          />
        </Field>

        <Field label="Business Phone" required complete={statuses.business_phone} hint="Auto-formats to +1 (###) ###-####.">
          <TextInput
            value={data.business_phone}
            onChange={v => onChange("business_phone", v)}
            onBlur={() => onChange("business_phone", formatUSPhone(data.business_phone))}
            placeholder="+1 (602) 555-0100"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            complete={statuses.business_phone}
          />
        </Field>

        <Field label="Business Email" complete={statuses.business_email} hint="Lowercases and trims on blur.">
          <TextInput
            value={data.business_email}
            onChange={v => onChange("business_email", v)}
            onBlur={() => onChange("business_email", normalizeEmail(data.business_email))}
            placeholder="hello@yourbusiness.com"
            type="email"
            autoComplete="email"
            complete={statuses.business_email}
          />
        </Field>

        <Field label="Website URL" complete={statuses.website} hint="Adds https:// and cleans the domain.">
          <TextInput
            value={data.website}
            onChange={v => onChange("website", v)}
            onBlur={() => onChange("website", normalizeUrl(data.website))}
            placeholder="https://yourbusiness.com"
            type="url"
            autoComplete="url"
            complete={statuses.website}
          />
        </Field>
      </div>

      <Field label="Business Address" hint="Used for local SEO and lead routing." complete={statuses.address}>
        <TextInput
          value={data.address}
          onChange={v => onChange("address", v)}
          onBlur={() => onChange("address", trim(data.address))}
          placeholder="123 Main St, Phoenix, AZ 85001"
          autoComplete="street-address"
          complete={statuses.address}
        />
      </Field>

      <Field label="Brand Voice / Tone" complete={statuses.brand_voice}>
        <ChipSelect options={["Professional", "Friendly", "Luxury", "Casual", "Energetic"]} value={data.brand_voice} onChange={v => onChange("brand_voice", v)} />
      </Field>

      <Field label="Business Hours" hint="When are you open?" complete={statuses.business_hours}>
        <TextInput
          value={data.business_hours}
          onChange={v => onChange("business_hours", v)}
          onBlur={() => onChange("business_hours", trim(data.business_hours))}
          placeholder="Mon–Fri 9am–6pm, Sat 10am–3pm"
          complete={statuses.business_hours}
        />
      </Field>
    </div>
  );
}

function BrandStep({ data, onChange, onLogoUpload, logoUploading }) {
  const statuses = {
    logo_url: Boolean(trim(data.logo_url)),
    primary_color: isValidHexColor(data.primary_color),
    secondary_color: isValidHexColor(data.secondary_color),
    tagline: Boolean(trim(data.tagline)),
  };
  const trackedFields = Object.values(statuses);
  const completed = trackedFields.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <CompletionSummary
        title="Brand system scanner"
        completed={completed}
        total={trackedFields.length}
        note={completed === trackedFields.length ? "Brand assets are ready for consistent automation output." : "Load the brand assets so generated messages and pages feel custom, not generic."}
      />

      <Field label="Logo Upload" complete={statuses.logo_url}>
        <div className="flex items-start gap-4">
          <label className={`flex h-32 w-32 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
            statuses.logo_url ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
          }`}>
            {logoUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : data.logo_url ? (
              <img src={data.logo_url} alt="Logo" width="128" height="128" className="h-full w-full rounded-2xl object-contain p-2" />
            ) : (
              <><div className="text-2xl">🖼️</div><span className="mt-1 text-center text-xs font-medium text-muted-foreground">Click to upload</span></>
            )}
            <input type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
          </label>
        </div>
      </Field>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-900">Brand Colors</h3>
        <ColorPicker label="Primary Brand Color" value={data.primary_color} onChange={v => onChange("primary_color", v)} complete={statuses.primary_color} />
        <ColorPicker label="Secondary / Accent Color" value={data.secondary_color} onChange={v => onChange("secondary_color", v)} complete={statuses.secondary_color} />
      </div>

      <Field label="Tagline / Slogan" complete={statuses.tagline}>
        <TextInput
          value={data.tagline}
          onChange={v => onChange("tagline", v)}
          onBlur={() => onChange("tagline", trim(data.tagline))}
          placeholder="e.g. Your Beauty, Our Priority"
          complete={statuses.tagline}
        />
      </Field>
    </div>
  );
}

function MessagingStep({ data, onChange }) {
  const statuses = {
    twilio_business_phone: Boolean(trim(data.twilio_business_phone)) && isValidUSPhone(data.twilio_business_phone),
    booking_link: Boolean(trim(data.booking_link)) && isValidUrl(data.booking_link),
    lead_notification_email: Boolean(trim(data.lead_notification_email)) && isValidEmail(data.lead_notification_email),
    after_hours_behavior: Boolean(trim(data.after_hours_behavior)),
    customer_questions: Boolean(trim(data.customer_questions)),
  };
  const trackedFields = Object.values(statuses);
  const completed = trackedFields.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <CompletionSummary
        title="Messaging automation scanner"
        completed={completed}
        total={trackedFields.length}
        note={completed === trackedFields.length ? "Messaging inputs are ready for routing, booking, and follow-up automations." : "Normalize the messaging fields so the automations can route leads without human correction."}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Twilio Business Phone" hint="Leave blank if you do not have one yet; we will use the business phone for setup checks." complete={statuses.twilio_business_phone}>
          <TextInput
            value={data.twilio_business_phone}
            onChange={v => onChange("twilio_business_phone", v)}
            onBlur={() => onChange("twilio_business_phone", formatUSPhone(data.twilio_business_phone))}
            placeholder="+1 (602) 555-0200"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            complete={statuses.twilio_business_phone}
          />
        </Field>

        <Field label="Booking / Scheduling Link" required complete={statuses.booking_link}>
          <TextInput
            value={data.booking_link}
            onChange={v => onChange("booking_link", v)}
            onBlur={() => onChange("booking_link", normalizeUrl(data.booking_link))}
            placeholder="https://calendly.com/yourbusiness"
            type="url"
            complete={statuses.booking_link}
          />
        </Field>
      </div>

      <Field label="Lead Notification Email" required complete={statuses.lead_notification_email}>
        <TextInput
          value={data.lead_notification_email}
          onChange={v => onChange("lead_notification_email", v)}
          onBlur={() => onChange("lead_notification_email", normalizeEmail(data.lead_notification_email))}
          placeholder="you@yourbusiness.com"
          type="email"
          autoComplete="email"
          complete={statuses.lead_notification_email}
        />
      </Field>

      <Field label="After-Hours Behavior" complete={statuses.after_hours_behavior}>
        <ChipSelect options={["Send after-hours SMS", "Hold until we open"]} value={data.after_hours_behavior} onChange={v => onChange("after_hours_behavior", v)} />
      </Field>

      <Field label="Most Common Customer Questions" complete={statuses.customer_questions}>
        <TextArea
          value={data.customer_questions}
          onChange={v => onChange("customer_questions", v)}
          placeholder="e.g. What are your prices? Do you offer free consultations?"
          rows={3}
          complete={statuses.customer_questions}
        />
      </Field>
    </div>
  );
}

function IntegrationsStep({ data, onChange }) {
  const statuses = {
    crm_system: Boolean(trim(data.crm_system)),
    google_review_link: Boolean(trim(data.google_review_link)) && isValidUrl(data.google_review_link),
    other_lead_sources: Boolean(trim(data.other_lead_sources)),
    special_notes: Boolean(trim(data.special_notes)),
  };
  const trackedFields = Object.values(statuses);
  const completed = trackedFields.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <CompletionSummary
        title="Integration readiness scanner"
        completed={completed}
        total={trackedFields.length}
        note={completed === trackedFields.length ? "Integration context is locked and ready for the connection check." : "Add the operational context that prevents weak handoffs during installation."}
      />

      <Field label="CRM or Scheduling Software" complete={statuses.crm_system}>
        <ChipSelect options={["Calendly", "Acuity", "Jane App", "MindBody", "GoHighLevel", "HubSpot", "None / Other"]} value={data.crm_system} onChange={v => onChange("crm_system", v)} />
      </Field>

      <Field label="Google Review Link" complete={statuses.google_review_link}>
        <TextInput
          value={data.google_review_link}
          onChange={v => onChange("google_review_link", v)}
          onBlur={() => onChange("google_review_link", normalizeUrl(data.google_review_link))}
          placeholder="https://g.page/r/yourbusiness/review"
          type="url"
          complete={statuses.google_review_link}
        />
      </Field>

      <Field label="Other Lead Sources" hint="Angi, Thumbtack, Yelp, etc." complete={statuses.other_lead_sources}>
        <TextInput
          value={data.other_lead_sources}
          onChange={v => onChange("other_lead_sources", v)}
          onBlur={() => onChange("other_lead_sources", trim(data.other_lead_sources))}
          placeholder="e.g. Angi, Thumbtack, HomeAdvisor"
          complete={statuses.other_lead_sources}
        />
      </Field>

      <Field label="Anything Else We Should Know" complete={statuses.special_notes}>
        <TextArea
          value={data.special_notes}
          onChange={v => onChange("special_notes", v)}
          placeholder="Special instructions, existing automations, custom needs…"
          rows={4}
          complete={statuses.special_notes}
        />
      </Field>
    </div>
  );
}

function ReviewStep({ data, order }) {
  const industry = resolveIndustry(data);
  const sections = [
    { title: "Business Info", fields: [
      { label: "Business Name", value: trim(data.business_name) },
      { label: "Industry", value: industry },
      { label: "Phone", value: formatUSPhone(data.business_phone) },
      { label: "Email", value: normalizeEmail(data.business_email) },
      { label: "Website", value: normalizeUrl(data.website) },
    ]},
    { title: "Brand & Design", fields: [
      { label: "Logo", value: data.logo_url ? "✓ Uploaded" : "Not uploaded" },
      { label: "Primary Color", value: data.primary_color },
      { label: "Tagline", value: data.tagline },
      { label: "Brand Voice", value: data.brand_voice },
    ]},
    { title: "Messaging", fields: [
      { label: "Twilio Phone", value: formatUSPhone(data.twilio_business_phone || data.business_phone) || "To be provisioned" },
      { label: "Booking Link", value: normalizeUrl(data.booking_link) },
      { label: "Notification Email", value: normalizeEmail(data.lead_notification_email) },
    ]},
    { title: "Integrations", fields: [
      { label: "CRM System", value: data.crm_system || "None / Other" },
      { label: "Review Link", value: normalizeUrl(data.google_review_link) },
      { label: "Lead Sources", value: data.other_lead_sources },
    ]},
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p><strong>Almost done.</strong> Review the normalized setup data, then submit it to the ClientSurge installation system.</p>
        </div>
      </div>
      {sections.map(section => (
        <div key={section.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{section.title}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {section.fields.filter(f => f.value).map(f => (
              <div key={f.label} className="flex items-start justify-between gap-4 px-4 py-3">
                <p className="w-32 flex-shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">{f.label}</p>
                <p className="text-right text-sm font-medium text-slate-950 break-all">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CredentialsWizard({ order, onComplete }) {
  const [authorized, setAuthorized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");

  const storageKey = STORAGE_KEY_PREFIX + (order?.id || "anon");

  const [data, setData] = useState(() => {
    const defaults = {
      business_name: order?.business_name || "",
      industry: "",
      custom_industry: "",
      contact_name: order?.customer_name || "",
      business_phone: formatUSPhone(order?.customer_phone || ""),
      business_email: normalizeEmail(order?.customer_email || ""),
      website: "",
      address: "",
      brand_voice: "",
      business_hours: "",
      logo_url: "",
      primary_color: "#00AEEF",
      secondary_color: "#003B8F",
      tagline: "",
      twilio_business_phone: "",
      booking_link: "",
      lead_notification_email: normalizeEmail(order?.customer_email || ""),
      after_hours_behavior: "",
      customer_questions: "",
      crm_system: "None / Other",
      google_review_link: "",
      other_lead_sources: "",
      special_notes: "",
    };
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await base44.functions.invoke("checkSetupAuthorization", { order_id: order?.id });
        const payload = readFunctionPayload(result);
        if (payload?.authorized) {
          setAuthorized(true);
          setCurrentStep(1);
        }
      } catch {}
    };
    if (order?.id) checkAuth();
  }, [order?.id]);

  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(data)); } catch {}
  }, [data, storageKey]);

  const onChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setError("Please upload an image file for the logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file is too large. Please upload an image under 5MB.");
      return;
    }
    setLogoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange("logo_url", file_url);
    } catch { setError("Logo upload failed. Please try a smaller PNG or JPG."); }
    finally { setLogoUploading(false); }
  };

  useEffect(() => {
    if (authorized && currentStep === 0) setCurrentStep(1);
  }, [authorized, currentStep]);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const validateStep = () => {
    if (step.id === "business") {
      if (!trim(data.business_name)) return "Business name is required.";
      if (!trim(data.industry)) return "Industry / niche is required.";
      if (data.industry === OTHER_INDUSTRY_OPTION && !trim(data.custom_industry)) return "Custom industry / niche is required when Other is selected.";
      if (!trim(data.business_phone)) return "Business phone is required.";
      if (!isValidUSPhone(data.business_phone)) return "Enter a valid US business phone number.";
      if (trim(data.business_email) && !isValidEmail(data.business_email)) return "Enter a valid business email address.";
      if (!isValidUrl(data.website)) return "Enter a valid website URL or leave it blank.";
    }
    if (step.id === "brand") {
      if (trim(data.primary_color) && !isValidHexColor(data.primary_color)) return "Enter a valid primary hex color, like #00AEEF.";
      if (trim(data.secondary_color) && !isValidHexColor(data.secondary_color)) return "Enter a valid secondary hex color, like #003B8F.";
    }
    if (step.id === "messaging") {
      if (trim(data.twilio_business_phone) && !isValidUSPhone(data.twilio_business_phone)) return "Enter a valid Twilio/business SMS phone number or leave it blank.";
      if (!trim(data.booking_link)) return "Booking link is required.";
      if (!isValidUrl(data.booking_link)) return "Enter a valid booking link.";
      if (!trim(data.lead_notification_email)) return "Lead notification email is required.";
      if (!isValidEmail(data.lead_notification_email)) return "Enter a valid lead notification email.";
    }
    if (step.id === "integrations") {
      if (!isValidUrl(data.google_review_link)) return "Enter a valid Google review link or leave it blank.";
    }
    return null;
  };

  const handleNext = async () => {
    setError("");
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }

    setData(prev => normalizeDataForStep(prev, step.id));

    if (isLast) {
      await handleSubmit();
    } else {
      setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const normalizedData = normalizeDataForStep(
        normalizeDataForStep(
          normalizeDataForStep(
            normalizeDataForStep(data, "business"),
            "brand",
          ),
          "messaging",
        ),
        "integrations",
      );
      const businessPhone = normalizePhone(normalizedData.business_phone);
      const twilioPhone = normalizePhone(normalizedData.twilio_business_phone || normalizedData.business_phone);
      const websiteUrl = normalizeUrl(normalizedData.website);
      const bookingLink = normalizeUrl(normalizedData.booking_link);
      const googleReviewLink = normalizeUrl(normalizedData.google_review_link);
      const industry = resolveIndustry(normalizedData);
      const installConfig = {
        shared: {
          twilio_business_phone: twilioPhone,
          business_hours: trim(normalizedData.business_hours),
          after_hours_behavior: normalizedData.after_hours_behavior === "Hold until we open" ? "hold_until_open" : "send_after_hours_sms",
          consent_behavior: "include_opt_out_language",
        },
        brand: {
          business_name: trim(normalizedData.business_name),
          industry,
          contact_name: trim(normalizedData.contact_name),
          business_phone: businessPhone,
          business_email: normalizeEmail(normalizedData.business_email),
          website: websiteUrl,
          website_url: websiteUrl,
          address: trim(normalizedData.address),
          logo_url: trim(normalizedData.logo_url),
          primary_color: trim(normalizedData.primary_color) || "#00AEEF",
          secondary_color: trim(normalizedData.secondary_color) || "#003B8F",
          tagline: trim(normalizedData.tagline),
          brand_voice: trim(normalizedData.brand_voice),
          tone_of_voice: trim(normalizedData.brand_voice),
          google_business_url: googleReviewLink,
        },
        messaging: {
          booking_link: bookingLink,
          lead_notification_email: normalizeEmail(normalizedData.lead_notification_email),
          customer_questions: trim(normalizedData.customer_questions),
        },
        services: {
          ai_booking_agent: { booking_link: bookingLink },
        },
        integrations: {
          crm_system: normalizedData.crm_system || "None / Other",
          google_review_link: googleReviewLink,
          google_business_url: googleReviewLink,
          other_lead_sources: trim(normalizedData.other_lead_sources),
          special_notes: trim(normalizedData.special_notes),
        },
      };

      const result = await base44.functions.invoke("saveClientCredentials", {
        order_id: order.id,
        install_configuration: installConfig,
      });
      const payload = readFunctionPayload(result);
      if (payload?.success === false || payload?.error) {
        const validationMessage = payload?.validation_errors?.map((item) => item.message).join(" ");
        throw new Error(validationMessage || payload.error || "Failed to save setup information.");
      }

      try { sessionStorage.removeItem(storageKey); } catch {}
      onComplete?.(payload);
    } catch (err) {
      setError(err?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}>
          <div>
            <p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">Activation Wizard — Step 1 of {STEPS.length}</p>
            <p className="text-white font-semibold mt-0.5 text-lg">{order?.business_name || "Your Business"}</p>
          </div>
          <img src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png" alt="ClientSurge" width="200" height="50" style={{ height: 50, objectFit: "contain", mixBlendMode: "luminosity", opacity: 0.85 }} />
        </div>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
            <SetupAuthorizationStep
              order={order}
              onAuthorized={() => {
                setAuthorized(true);
                setCurrentStep(1);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="px-6 py-5 flex items-center justify-between flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}>
        <div>
          <p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">Activation Wizard — Step {currentStep + 1} of {STEPS.length}</p>
          <p className="text-white font-semibold mt-0.5 text-lg">{order?.business_name || "Your Business"}</p>
        </div>
        <img src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png" alt="ClientSurge" width="200" height="50" style={{ height: 50, objectFit: "contain", mixBlendMode: "luminosity", opacity: 0.85 }} />
      </div>

      <div className="h-1 bg-slate-200 flex-shrink-0">
        <div className="h-full transition-all duration-500" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%`, background: "linear-gradient(90deg,#00AEEF,#003B8F)" }} />
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              {(() => { const Icon = step.icon; return <Icon className="w-6 h-6 text-primary" />; })()}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">{step.title}</h2>
              <p className="text-sm font-medium text-slate-500">{step.desc}</p>
            </div>
          </div>
          <div className="rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Step {currentStep + 1} / {STEPS.length}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          {step.id === "business" && <BusinessStep data={data} onChange={onChange} />}
          {step.id === "brand" && <BrandStep data={data} onChange={onChange} onLogoUpload={handleLogoUpload} logoUploading={logoUploading} />}
          {step.id === "messaging" && <MessagingStep data={data} onChange={onChange} />}
          {step.id === "integrations" && <IntegrationsStep data={data} onChange={onChange} />}
          {step.id === "connection" && <IntegrationStatusStep data={data} />}
          {step.id === "review" && <ReviewStep data={data} order={order} />}

          {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        </div>

        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            onClick={() => { setError(""); setCurrentStep(s => s - 1); }}
            disabled={currentStep === 1 || saving}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving || logoUploading}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
            style={{ background: isLast ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#00AEEF,#003B8F)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isLast ? <><Rocket className="w-4 h-4" /> Submit Setup Info</> : <>Next <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

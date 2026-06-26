import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2,
  Building2, Palette, MessageSquare, Globe, Rocket, Plug,
} from "lucide-react";
import IntegrationStatusStep from "@/components/onboarding/IntegrationStatusStep";

// #407d — sessionStorage persistence so refresh doesn't lose wizard progress
const STORAGE_KEY_PREFIX = "clientsurge:credentials-wizard:";

// ── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: "business",     icon: Building2,     title: "Business Info",       desc: "Basic details about your business" },
  { id: "brand",        icon: Palette,        title: "Brand & Design",      desc: "Colors and logo for your system" },
  { id: "messaging",    icon: MessageSquare,  title: "Messaging Setup",     desc: "Phone number, booking link & hours" },
  { id: "integrations", icon: Globe,          title: "Integrations",        desc: "Connect your lead sources" },
  { id: "connection",   icon: Plug,           title: "Connection Check",    desc: "Verify your integrations are live" },
  { id: "review",       icon: Rocket,         title: "Review & Submit",     desc: "Confirm everything looks good" },
];

// ── Reusable field components ────────────────────────────────────────────────
function Field({ label, hint, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
    />
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value || "#000000"}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-white"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          className="mt-1 w-full px-3 py-1.5 rounded-lg border border-border bg-white text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        />
      </div>
      {value && (
        <div
          className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
          style={{ backgroundColor: value }}
        />
      )}
    </div>
  );
}

function ChipSelect({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
            value === opt
              ? "border-primary bg-primary/8 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function isValidGoogleBusinessUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    return hostname === "g.page" || hostname.endsWith("google.com");
  } catch {
    return false;
  }
}

// ── Step: Business Info ──────────────────────────────────────────────────────
function BusinessStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Business Name" required>
          <TextInput value={data.business_name} onChange={v => onChange("business_name", v)} placeholder="Acme Med Spa" />
        </Field>
        <Field label="Industry / Niche" required>
          <TextInput value={data.industry} onChange={v => onChange("industry", v)} placeholder="Med Spa, HVAC, Dental…" />
        </Field>
        <Field label="Owner / Contact Name">
          <TextInput value={data.contact_name} onChange={v => onChange("contact_name", v)} placeholder="Jane Smith" />
        </Field>
        <Field label="Business Phone" required>
          <TextInput value={data.business_phone} onChange={v => onChange("business_phone", v)} placeholder="+1 (602) 555-0100" type="tel" />
        </Field>
        <Field label="Business Email">
          <TextInput value={data.business_email} onChange={v => onChange("business_email", v)} placeholder="hello@yourbusiness.com" type="email" />
        </Field>
        <Field label="Website URL">
          <TextInput value={data.website} onChange={v => onChange("website", v)} placeholder="https://yourbusiness.com" />
        </Field>
      </div>
      <Field label="Business Address" hint="Used for local SEO and lead routing">
        <TextInput value={data.address} onChange={v => onChange("address", v)} placeholder="123 Main St, Phoenix, AZ 85001" />
      </Field>
      <Field label="Brand Voice / Tone">
        <ChipSelect
          options={["Professional", "Friendly", "Luxury", "Casual", "Energetic"]}
          value={data.brand_voice}
          onChange={v => onChange("brand_voice", v)}
        />
      </Field>
      <Field label="Business Hours" hint="When are you open? Our system respects these for SMS sends.">
        <TextInput value={data.business_hours} onChange={v => onChange("business_hours", v)} placeholder="Mon–Fri 9am–6pm, Sat 10am–3pm" />
      </Field>
    </div>
  );
}

// ── Step: Brand & Design ─────────────────────────────────────────────────────
function BrandStep({ data, onChange, onLogoUpload, logoUploading }) {
  return (
    <div className="space-y-6">
      <Field label="Logo Upload" hint="Upload your business logo (PNG or JPG recommended)">
        <div className="flex items-start gap-4">
          <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors flex-shrink-0">
            {logoUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : data.logo_url ? (
              <img src={data.logo_url} alt="Logo" width="128" height="128" className="w-full h-full object-contain rounded-xl p-2" />
            ) : (
              <>
                <div className="text-2xl">🖼️</div>
                <span className="text-xs text-muted-foreground mt-1 text-center">Click to upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onLogoUpload}
              className="hidden"
            />
          </label>
          <div className="flex-1 space-y-2">
            {data.logo_url ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Logo uploaded successfully
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Upload your logo to personalize your automated messages and client-facing pages.</p>
            )}
            {data.logo_url && (
              <button
                type="button"
                onClick={() => onChange("logo_url", "")}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
      </Field>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Brand Colors</h3>
        <ColorPicker
          label="Primary Brand Color"
          value={data.primary_color}
          onChange={v => onChange("primary_color", v)}
        />
        <ColorPicker
          label="Secondary / Accent Color"
          value={data.secondary_color}
          onChange={v => onChange("secondary_color", v)}
        />
      </div>

      <Field label="Tagline / Slogan" hint="If you have one — used in email headers and SMS sign-offs">
        <TextInput value={data.tagline} onChange={v => onChange("tagline", v)} placeholder="e.g. Your Beauty, Our Priority" />
      </Field>

      <Field label="Google Business Profile URL" hint="Helps us pull reviews and business data">
        <TextInput value={data.google_business_url} onChange={v => onChange("google_business_url", v)} placeholder="https://g.page/yourbusiness" />
      </Field>
    </div>
  );
}

// ── Step: Messaging ──────────────────────────────────────────────────────────
function MessagingStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>How this works:</strong> We'll use these details to configure your automated SMS and booking flow. The Twilio number is the number your leads receive texts from.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Twilio Business Phone" hint="Leave blank if you don't have one yet — we can provision one">
          <TextInput value={data.twilio_business_phone} onChange={v => onChange("twilio_business_phone", v)} placeholder="+1 (602) 555-0200" type="tel" />
        </Field>
        <Field label="Booking / Scheduling Link" required>
          <TextInput value={data.booking_link} onChange={v => onChange("booking_link", v)} placeholder="https://calendly.com/yourbusiness" />
        </Field>
      </div>
      <Field label="Lead Notification Email" hint="Where we send alerts when new leads come in" required>
        <TextInput value={data.lead_notification_email} onChange={v => onChange("lead_notification_email", v)} placeholder="you@yourbusiness.com" type="email" />
      </Field>
      <Field label="Does a client need a consultation before booking?">
        <ChipSelect
          options={["Yes — consultation first", "No — they can book directly"]}
          value={data.requires_consultation}
          onChange={v => onChange("requires_consultation", v)}
        />
      </Field>
      <Field label="After-Hours Behavior" hint="What should happen when someone contacts you outside business hours?">
        <ChipSelect
          options={["Send after-hours SMS", "Hold until we open"]}
          value={data.after_hours_behavior}
          onChange={v => onChange("after_hours_behavior", v)}
        />
      </Field>
      <Field label="Most Common Customer Questions" hint="We'll train your AI to answer these automatically">
        <TextArea
          value={data.customer_questions}
          onChange={v => onChange("customer_questions", v)}
          placeholder="e.g. What are your prices? Do you offer free consultations? How long does the service take?"
          rows={3}
        />
      </Field>
    </div>
  );
}

// ── Step: Integrations ───────────────────────────────────────────────────────
function IntegrationsStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Optional:</strong> Fill in whatever applies to your business. If you're not sure, leave it blank — our team will follow up.
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Lead Sources</h3>
        <Field label="Facebook / Meta Ads (Page ID or Form ID)" hint="If you run Facebook Lead Ads">
          <TextInput value={data.facebook_page_id} onChange={v => onChange("facebook_page_id", v)} placeholder="e.g. 1234567890" />
        </Field>
        <Field label="Google Ads Conversion ID" hint="From your Google Ads account">
          <TextInput value={data.google_ads_id} onChange={v => onChange("google_ads_id", v)} placeholder="AW-XXXXXXXXXX" />
        </Field>
        <Field label="Other Lead Sources" hint="Any other platforms sending you leads (Angi, Thumbtack, Yelp, etc.)">
          <TextInput value={data.other_lead_sources} onChange={v => onChange("other_lead_sources", v)} placeholder="e.g. Angi, Thumbtack, HomeAdvisor" />
        </Field>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">CRM / Scheduling</h3>
        <Field label="CRM or Scheduling Software" hint="What do you use to manage clients?">
          <ChipSelect
            options={["Calendly", "Acuity", "Jane App", "MindBody", "GoHighLevel", "HubSpot", "None / Other"]}
            value={data.crm_system}
            onChange={v => onChange("crm_system", v)}
          />
        </Field>
        <Field label="CRM API Key or Webhook URL" hint="If applicable — we'll connect it automatically">
          <TextInput value={data.crm_api_key} onChange={v => onChange("crm_api_key", v)} placeholder="Paste API key or webhook URL" />
        </Field>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Review Platforms</h3>
        <Field label="Google Review Link" hint="Direct link to your Google review page">
          <TextInput value={data.google_review_link} onChange={v => onChange("google_review_link", v)} placeholder="https://g.page/r/yourbusiness/review" />
        </Field>
        <Field label="Yelp / Other Review Platform Link">
          <TextInput value={data.other_review_link} onChange={v => onChange("other_review_link", v)} placeholder="https://yelp.com/biz/yourbusiness" />
        </Field>
      </div>

      <Field label="Anything Else We Should Know" hint="Special instructions, existing automations, or anything custom">
        <TextArea
          value={data.special_notes}
          onChange={v => onChange("special_notes", v)}
          placeholder="e.g. We already have a Twilio account, we use Acuity for bookings, we'd like SMS in English and Spanish…"
          rows={4}
        />
      </Field>
    </div>
  );
}

// ── Step: Review ─────────────────────────────────────────────────────────────
function ReviewStep({ data, order }) {
  const sections = [
    {
      title: "Business Info",
      fields: [
        { label: "Business Name", value: data.business_name },
        { label: "Industry", value: data.industry },
        { label: "Phone", value: data.business_phone },
        { label: "Email", value: data.business_email },
        { label: "Website", value: data.website },
        { label: "Brand Voice", value: data.brand_voice },
        { label: "Business Hours", value: data.business_hours },
      ],
    },
    {
      title: "Brand & Design",
      fields: [
        { label: "Logo", value: data.logo_url ? "✓ Uploaded" : "Not uploaded" },
        { label: "Primary Color", value: data.primary_color },
        { label: "Secondary Color", value: data.secondary_color },
        { label: "Tagline", value: data.tagline },
      ],
    },
    {
      title: "Messaging",
      fields: [
        { label: "Twilio Phone", value: data.twilio_business_phone || "To be provisioned" },
        { label: "Booking Link", value: data.booking_link },
        { label: "Notification Email", value: data.lead_notification_email },
        { label: "After-Hours", value: data.after_hours_behavior },
      ],
    },
    {
      title: "Integrations",
      fields: [
        { label: "CRM System", value: data.crm_system },
        { label: "Google Review Link", value: data.google_review_link },
        { label: "Lead Sources", value: data.other_lead_sources },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <strong>Almost done!</strong> Review your information below, then click Submit to send it to our team. We'll configure your system within 24–48 hours.
      </div>

      <div className="rounded-xl border border-border p-4 bg-white">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Order</p>
        <p className="text-sm font-semibold text-foreground">{order.business_name} — {order.customer_email}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Order ID: {order.id}</p>
      </div>

      {sections.map(section => (
        <div key={section.title} className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{section.title}</p>
          </div>
          <div className="divide-y divide-border">
            {section.fields.filter(f => f.value).map(f => (
              <div key={f.label} className="flex items-start justify-between px-4 py-2.5 gap-4">
                <p className="text-xs font-semibold text-muted-foreground w-32 flex-shrink-0">{f.label}</p>
                <p className="text-sm text-foreground text-right truncate">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? "bg-green-500 text-white" : active ? "text-white" : "bg-muted text-muted-foreground"
              }`}
              style={active ? { background: "linear-gradient(135deg,#00AEEF,#003B8F)" } : {}}
            >
              {done ? "✓" : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-12 transition-all ${done ? "bg-green-400" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function CredentialsWizard({ order, onComplete }) {
  // #407 — Determine tier from order.package_key
  const packageKey = order?.package_key || "starter";
  const tier = packageKey.toLowerCase().includes("elite")
    ? "elite"
    : packageKey.toLowerCase().includes("growth")
    ? "growth"
    : "starter";

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");

  // #407d — Restore from sessionStorage on mount
  const storageKey = STORAGE_KEY_PREFIX + (order?.id || "anon");

  const [data, setData] = useState(() => {
    const defaultData = {
      // Business
      business_name: order?.business_name || "",
      industry: "",
      contact_name: order?.customer_name || "",
      business_phone: order?.customer_phone || "",
      business_email: order?.customer_email || "",
      website: "",
      address: "",
      brand_voice: "",
      business_hours: "",
      // Brand
      logo_url: "",
      primary_color: "#00AEEF",
      secondary_color: "#003B8F",
      tagline: "",
      google_business_url: "",
      // Messaging
      twilio_business_phone: "",
      booking_link: "",
      lead_notification_email: order?.customer_email || "",
      requires_consultation: "",
      after_hours_behavior: "",
      customer_questions: "",
      // Integrations
      facebook_page_id: "",
      google_ads_id: "",
      other_lead_sources: "",
      crm_system: "",
      crm_api_key: "",
      google_review_link: "",
      other_review_link: "",
      special_notes: "",
    };

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved data over defaults — preserves order-prefilled fields
        return { ...defaultData, ...parsed };
      }
    } catch {}
    return defaultData;
  });

  // #407d — Persist to sessionStorage on every data change
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  }, [data, storageKey]);

  // #407d — Also persist current step
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey + ":step", String(currentStep));
    } catch {}
  }, [currentStep, storageKey]);

  // #407d — Restore step on mount
  useEffect(() => {
    try {
      const savedStep = sessionStorage.getItem(storageKey + ":step");
      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        if (!isNaN(stepNum) && stepNum >= 0 && stepNum < STEPS.length) {
          setCurrentStep(stepNum);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback((field, value) => setData(prev => ({ ...prev, [field]: value })), []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange("logo_url", file_url);
    } catch {
      setError("Logo upload failed. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  };

  // #407 — Filter steps by tier
  const ACTIVE_STEPS = STEPS.filter((s) => {
    if (tier === "starter") return !["integrations", "connection"].includes(s.id);
    return true;
  });
  const step = ACTIVE_STEPS[currentStep];
  const isLast = currentStep === ACTIVE_STEPS.length - 1;

  // Required field validation per step
  const validateStep = () => {
    if (step.id === "business") {
      if (!data.business_name.trim()) return "Business name is required.";
      if (!data.business_phone.trim()) return "Business phone is required.";
    }
    if (
      step.id === "brand" &&
      data.google_business_url.trim() &&
      !isValidGoogleBusinessUrl(data.google_business_url.trim())
    ) {
      return "Google Business Profile URL must use a google.com or g.page link.";
    }
    if (step.id === "messaging") {
      if (!data.booking_link.trim()) return "Booking link is required.";
      if (!data.lead_notification_email.trim()) return "Lead notification email is required.";
    }
    return null;
  };

  const handleNext = async () => {
    setError("");
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }

    if (isLast) {
      await handleSubmit();
    } else {
      setCurrentStep(s => Math.min(s + 1, ACTIVE_STEPS.length - 1));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const installConfig = {
        shared: {
          twilio_business_phone: data.twilio_business_phone,
          business_hours: data.business_hours,
          after_hours_behavior: data.after_hours_behavior === "Hold until we open"
            ? "hold_until_open"
            : "send_after_hours_sms",
          consent_behavior: "include_opt_out_language",
        },
        brand: {
          business_name: data.business_name,
          industry: data.industry,
          contact_name: data.contact_name,
          business_email: data.business_email,
          website: data.website,
          address: data.address,
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          tagline: data.tagline,
          brand_voice: data.brand_voice,
          google_business_url: data.google_business_url,
        },
        messaging: {
          booking_link: data.booking_link,
          lead_notification_email: data.lead_notification_email,
          requires_consultation: data.requires_consultation,
          customer_questions: data.customer_questions,
        },
        integrations: {
          facebook_page_id: data.facebook_page_id,
          google_ads_id: data.google_ads_id,
          other_lead_sources: data.other_lead_sources,
          crm_system: data.crm_system,
          crm_api_key: data.crm_api_key,
          google_review_link: data.google_review_link,
          other_review_link: data.other_review_link,
          special_notes: data.special_notes,
        },
      };

      // Use saveClientCredentials — handles intelligence check + auto-activation
      await base44.functions.invoke("saveClientCredentials", {
        order_id: order.id,
        install_configuration: installConfig,
      });

      // #408d — Advance workflow_stage to "Ready for Install" via saveClientCredentials response
      // saveClientCredentials already handles this internally — confirmed in backend function

      // #407d — Clear sessionStorage on successful submit
      try {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey + ":step");
      } catch {}

      onComplete?.();
    } catch {
      setError("Failed to save your information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // #407 — Tier label for display
  const tierLabel = tier === "elite" ? "Elite" : tier === "growth" ? "Growth" : "Starter";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}
      >
        <div>
          <p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">Setup Intake — {tierLabel} Plan</p>
          <p className="text-white font-semibold mt-0.5 text-lg">{order?.business_name || "Your Business"}</p>
        </div>
        <img
          src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
          alt="ClientSurge"
          width="200"
          height="50"
          style={{ height: 50, objectFit: "contain", mixBlendMode: "luminosity", opacity: 0.85 }}
        />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 flex-shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((currentStep + 1) / STEPS.length) * 100}%`,
            background: "linear-gradient(90deg,#00AEEF,#003B8F)",
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            {(() => { const Icon = step.icon; return <Icon className="w-5 h-5 text-primary" />; })()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          {step.id === "business"     && <BusinessStep data={data} onChange={onChange} />}
          {step.id === "brand"        && <BrandStep data={data} onChange={onChange} onLogoUpload={handleLogoUpload} logoUploading={logoUploading} />}
          {step.id === "messaging"    && <MessagingStep data={data} onChange={onChange} />}
          {step.id === "integrations" && <IntegrationsStep data={data} onChange={onChange} />}
          {step.id === "connection"   && <IntegrationStatusStep data={data} />}
          {step.id === "review"       && <ReviewStep data={data} order={order} />}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            onClick={() => { setError(""); setCurrentStep(s => s - 1); }}
            disabled={currentStep === 0 || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={saving || logoUploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{
              background: isLast
                ? "linear-gradient(135deg,#059669,#10b981)"
                : "linear-gradient(135deg,#00AEEF,#003B8F)",
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLast ? (
              <><Rocket className="w-4 h-4" /> Submit Setup Info</>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Questions? Email{" "}
          <a href="mailto:support@clientsurgesystems.com" className="text-primary underline">
            support@clientsurgesystems.com
          </a>
        </p>
      </div>
    </div>
  );
}
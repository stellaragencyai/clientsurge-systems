import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowRight, Loader2, CheckCircle2, Shield,
  Building2, Globe, Plug, Palette, Beaker, FileCheck, Rocket,
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
      <input
        type="color"
        value={value || "#000000"}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-white"
      />
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
            value === opt ? "border-primary bg-primary/8 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

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
        <ChipSelect options={["Professional", "Friendly", "Luxury", "Casual", "Energetic"]} value={data.brand_voice} onChange={v => onChange("brand_voice", v)} />
      </Field>
      <Field label="Business Hours" hint="When are you open?">
        <TextInput value={data.business_hours} onChange={v => onChange("business_hours", v)} placeholder="Mon–Fri 9am–6pm, Sat 10am–3pm" />
      </Field>
    </div>
  );
}

function BrandStep({ data, onChange, onLogoUpload, logoUploading }) {
  return (
    <div className="space-y-6">
      <Field label="Logo Upload">
        <div className="flex items-start gap-4">
          <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors flex-shrink-0">
            {logoUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : data.logo_url ? (
              <img src={data.logo_url} alt="Logo" width="128" height="128" className="w-full h-full object-contain rounded-xl p-2" />
            ) : (
              <><div className="text-2xl">🖼️</div><span className="text-xs text-muted-foreground mt-1 text-center">Click to upload</span></>
            )}
            <input type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
          </label>
        </div>
      </Field>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Brand Colors</h3>
        <ColorPicker label="Primary Brand Color" value={data.primary_color} onChange={v => onChange("primary_color", v)} />
        <ColorPicker label="Secondary / Accent Color" value={data.secondary_color} onChange={v => onChange("secondary_color", v)} />
      </div>
      <Field label="Tagline / Slogan">
        <TextInput value={data.tagline} onChange={v => onChange("tagline", v)} placeholder="e.g. Your Beauty, Our Priority" />
      </Field>
    </div>
  );
}

function MessagingStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Twilio Business Phone" hint="Leave blank if you don't have one yet">
          <TextInput value={data.twilio_business_phone} onChange={v => onChange("twilio_business_phone", v)} placeholder="+1 (602) 555-0200" type="tel" />
        </Field>
        <Field label="Booking / Scheduling Link" required>
          <TextInput value={data.booking_link} onChange={v => onChange("booking_link", v)} placeholder="https://calendly.com/yourbusiness" />
        </Field>
      </div>
      <Field label="Lead Notification Email" required>
        <TextInput value={data.lead_notification_email} onChange={v => onChange("lead_notification_email", v)} placeholder="you@yourbusiness.com" type="email" />
      </Field>
      <Field label="After-Hours Behavior">
        <ChipSelect options={["Send after-hours SMS", "Hold until we open"]} value={data.after_hours_behavior} onChange={v => onChange("after_hours_behavior", v)} />
      </Field>
      <Field label="Most Common Customer Questions">
        <TextArea value={data.customer_questions} onChange={v => onChange("customer_questions", v)} placeholder="e.g. What are your prices? Do you offer free consultations?" rows={3} />
      </Field>
    </div>
  );
}

function IntegrationsStep({ data, onChange }) {
  return (
    <div className="space-y-5">
      <Field label="CRM or Scheduling Software">
        <ChipSelect options={["Calendly", "Acuity", "Jane App", "MindBody", "GoHighLevel", "HubSpot", "None / Other"]} value={data.crm_system} onChange={v => onChange("crm_system", v)} />
      </Field>
      <Field label="Google Review Link">
        <TextInput value={data.google_review_link} onChange={v => onChange("google_review_link", v)} placeholder="https://g.page/r/yourbusiness/review" />
      </Field>
      <Field label="Other Lead Sources" hint="Angi, Thumbtack, Yelp, etc.">
        <TextInput value={data.other_lead_sources} onChange={v => onChange("other_lead_sources", v)} placeholder="e.g. Angi, Thumbtack, HomeAdvisor" />
      </Field>
      <Field label="Anything Else We Should Know">
        <TextArea value={data.special_notes} onChange={v => onChange("special_notes", v)} placeholder="Special instructions, existing automations, custom needs…" rows={4} />
      </Field>
    </div>
  );
}

function ReviewStep({ data, order }) {
  const sections = [
    { title: "Business Info", fields: [
      { label: "Business Name", value: data.business_name },
      { label: "Industry", value: data.industry },
      { label: "Phone", value: data.business_phone },
      { label: "Email", value: data.business_email },
      { label: "Website", value: data.website },
    ]},
    { title: "Brand & Design", fields: [
      { label: "Logo", value: data.logo_url ? "✓ Uploaded" : "Not uploaded" },
      { label: "Primary Color", value: data.primary_color },
      { label: "Tagline", value: data.tagline },
    ]},
    { title: "Messaging", fields: [
      { label: "Twilio Phone", value: data.twilio_business_phone || "To be provisioned" },
      { label: "Booking Link", value: data.booking_link },
      { label: "Notification Email", value: data.lead_notification_email },
    ]},
    { title: "Integrations", fields: [
      { label: "CRM System", value: data.crm_system },
      { label: "Review Link", value: data.google_review_link },
      { label: "Lead Sources", value: data.other_lead_sources },
    ]},
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <strong>Almost done!</strong> Review your information, then click Submit to send it to our team.
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
      contact_name: order?.customer_name || "",
      business_phone: order?.customer_phone || "",
      business_email: order?.customer_email || "",
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
      lead_notification_email: order?.customer_email || "",
      after_hours_behavior: "",
      customer_questions: "",
      crm_system: "",
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
    // Check if authorization already accepted
    base44.functions.invoke("checkSetupAuthorization", {}).then(() => {}).catch(() => {});
    // Use the order_id to check
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/functions/checkSetupAuthorization?order_id=${order?.id}`);
        const result = await res.json();
        if (result?.authorized) {
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
    setLogoUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange("logo_url", file_url);
    } catch { setError("Logo upload failed."); }
    finally { setLogoUploading(false); }
  };

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const validateStep = () => {
    if (step.id === "business") {
      if (!data.business_name.trim()) return "Business name is required.";
      if (!data.business_phone.trim()) return "Business phone is required.";
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
      setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
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
          after_hours_behavior: data.after_hours_behavior === "Hold until we open" ? "hold_until_open" : "send_after_hours_sms",
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
        },
        messaging: {
          booking_link: data.booking_link,
          lead_notification_email: data.lead_notification_email,
          customer_questions: data.customer_questions,
        },
        integrations: {
          crm_system: data.crm_system,
          google_review_link: data.google_review_link,
          other_lead_sources: data.other_lead_sources,
          special_notes: data.special_notes,
        },
      };

      await base44.functions.invoke("saveClientCredentials", {
        order_id: order.id,
        install_configuration: installConfig,
      });

      try { sessionStorage.removeItem(storageKey); } catch {}
      onComplete?.();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Step 0: Authorization gate
  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}>
          <div>
            <p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">Activation Wizard — Step 1 of {STEPS.length}</p>
            <p className="text-white font-semibold mt-0.5 text-lg">{order?.business_name || "Your Business"}</p>
          </div>
          <img src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png" alt="ClientSurge" width="200" height="50" style={{ height: 50, objectFit: "contain", mixBlendMode: "luminosity", opacity: 0.85 }} />
        </div>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
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
    <div className="min-h-screen flex flex-col">
      <div className="px-6 py-5 flex items-center justify-between flex-shrink-0" style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }}>
        <div>
          <p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">Activation Wizard — Step {currentStep + 1} of {STEPS.length}</p>
          <p className="text-white font-semibold mt-0.5 text-lg">{order?.business_name || "Your Business"}</p>
        </div>
        <img src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png" alt="ClientSurge" width="200" height="50" style={{ height: 50, objectFit: "contain", mixBlendMode: "luminosity", opacity: 0.85 }} />
      </div>

      <div className="h-1 bg-gray-100 flex-shrink-0">
        <div className="h-full transition-all duration-500" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%`, background: "linear-gradient(90deg,#00AEEF,#003B8F)" }} />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            {(() => { const Icon = step.icon; return <Icon className="w-5 h-5 text-primary" />; })()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          {step.id === "business" && <BusinessStep data={data} onChange={onChange} />}
          {step.id === "brand" && <BrandStep data={data} onChange={onChange} onLogoUpload={handleLogoUpload} logoUploading={logoUploading} />}
          {step.id === "messaging" && <MessagingStep data={data} onChange={onChange} />}
          {step.id === "integrations" && <IntegrationsStep data={data} onChange={onChange} />}
          {step.id === "connection" && <IntegrationStatusStep data={data} />}
          {step.id === "review" && <ReviewStep data={data} order={order} />}

          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex items-center justify-between gap-4 mt-6">
          <button
            onClick={() => { setError(""); setCurrentStep(s => s - 1); }}
            disabled={currentStep === 1 || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving || logoUploading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: isLast ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#00AEEF,#003B8F)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isLast ? <><Rocket className="w-4 h-4" /> Submit Setup Info</> : <>Next <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
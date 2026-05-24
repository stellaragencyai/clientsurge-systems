import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { trackLeadSubmitted } from "@/lib/analytics";

const NICHES = [
  "Med Spas & Aesthetic Clinics",
  "Dental & Orthodontics",
  "Chiropractic & Physical Therapy",
  "HVAC, Plumbing & Home Services",
  "Roofing & Restoration",
  "Contractors & Trades",
  "Other",
];

const CONTACT_METHODS = ["Email", "Phone Call", "Text Message"];
const CONTACT_METHOD_CHANNELS = {
  Email: ["email"],
  "Phone Call": ["call"],
  "Text Message": ["sms"],
};

const sections = [
  { step: 1, title: "Your Info" },
  { step: 2, title: "Business" },
  { step: 3, title: "Leads" },
  { step: 4, title: "Challenges" },
];

export default function LeadCaptureForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    niche: "",
    monthly_leads: "",
    biggest_problem: "",
    contact_method: "",
    consent_given: false,
    website_url: "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildProblemSummary = () => {
    const details = [];

    if (formData.biggest_problem) {
      details.push(`Primary challenge: ${formData.biggest_problem}`);
    }

    if (formData.monthly_leads) {
      details.push(`Monthly leads: ${formData.monthly_leads}`);
    }

    if (formData.contact_method) {
      details.push(`Preferred contact: ${formData.contact_method}`);
    }

    return details.join(" | ") || "Requested a demo from the website";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await base44.functions.invoke('submitLeadCapture', {
        full_name: formData.full_name,
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone,
        business_type: formData.niche || "Other",
        problem: buildProblemSummary(),
        source: "website_form",
        source_page: typeof window !== "undefined" ? window.location.pathname : "/",
        requested_channels: CONTACT_METHOD_CHANNELS[formData.contact_method] || [],
        consent_given: formData.consent_given === true,
        consent_source: "lead_capture_form",
        consent_text_version: "lead_capture_explicit_checkbox_v1",
        website_url: formData.website_url,
      });

      if (!result.data?.success) {
        throw new Error("Lead submission failed");
      }

      trackLeadSubmitted("landing_lead_capture_form", {
        deduplicated: Boolean(result.data?.deduplicated),
        business_type: formData.niche || "Other",
        requested_channels: CONTACT_METHOD_CHANNELS[formData.contact_method] || [],
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit form");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[600px] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
            Got It!
          </h2>
          <p className="text-muted-foreground mb-6">
            We've received your info. A specialist will contact you within 24 hours to discuss your automation plan.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
            Check your email for confirmation details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="demo-booking" className="py-20 px-6 bg-white rounded-3xl border border-border shadow-sm">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-2">
            Qualification Form
          </p>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Tell Us About Your Business
          </h2>
          <p className="text-muted-foreground mt-2">
            Quick questions to understand how we can help
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Step {step} of {sections.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round((step / sections.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={formData.website_url}
            onChange={(e) => updateField("website_url", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="space-y-5">
              <FormInput
                label="Full Name"
                required
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="Your full name"
              />
              <FormInput
                label="Email"
                required
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@company.com"
              />
              <FormInput
                label="Phone"
                required
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(555) 000-0000"
              />
            </div>
          )}

          {/* Step 2: Business */}
          {step === 2 && (
            <div className="space-y-5">
              <FormInput
                label="Business Name"
                required
                value={formData.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                placeholder="Your business name"
              />
              <FormSelect
                label="Industry / Niche"
                required
                value={formData.niche}
                onChange={(e) => updateField("niche", e.target.value)}
                options={NICHES}
              />
            </div>
          )}

          {/* Step 3: Leads */}
          {step === 3 && (
            <div className="space-y-5">
              <FormInput
                label="Monthly Lead Volume"
                required
                value={formData.monthly_leads}
                onChange={(e) => updateField("monthly_leads", e.target.value)}
                placeholder="e.g., 50, 150, etc."
              />
              <FormSelect
                label="Preferred Contact Method"
                required
                value={formData.contact_method}
                onChange={(e) => updateField("contact_method", e.target.value)}
                options={CONTACT_METHODS}
              />
            </div>
          )}

          {/* Step 4: Challenges */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Biggest Follow-Up Challenge
                </label>
                <textarea
                  required
                  value={formData.biggest_problem}
                  onChange={(e) => updateField("biggest_problem", e.target.value)}
                  placeholder="What's making it hard to convert leads?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  checked={formData.consent_given}
                  onChange={(e) => updateField("consent_given", e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span>
                  I agree to receive automated SMS and email messages from ClientSurge Systems about my inquiry.
                  Msg &amp; data rates may apply. Reply <strong>STOP</strong> to opt out. See our{" "}
                  <a href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</a>
                  {" "}and{" "}
                  <a href="/terms" className="underline hover:text-foreground">Terms</a>.
                </span>
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            {step === sections.length ? (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2 flex items-center"
              >
                {loading ? "Submitting..." : "Get Demo Link"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(Math.min(sections.length, step + 1))}
                className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors gap-2 flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            No spam. No pressure. Just a tailored follow-up about your lead system.
          </p>
          <p className="mt-2 text-xs text-muted-foreground text-center px-2">
            By submitting, you consent to receive automated SMS &amp; email messages from ClientSurge Systems. Reply <strong>STOP</strong> to opt out at any time. Msg &amp; data rates may apply.
          </p>
        </form>
      </div>
    </section>
  );
}

function FormInput({ label, required, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function FormSelect({ label, required, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Select an option...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}


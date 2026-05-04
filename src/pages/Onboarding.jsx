import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";
import OnboardingChatWidget from "../components/onboarding/OnboardingChatWidget";
import PostOnboardingFlow from "../components/forms/PostOnboardingFlow";

const SERVICES = ["Botox / Injectables", "Fillers", "Laser Treatments", "Facials / Skincare", "Body Contouring", "Weight Loss"];
const LEAD_SOURCES = ["Website Forms", "Instagram DMs", "Phone Calls", "Paid Ads"];
const RESPONSE_OPTIONS = ["Immediately", "Within 1 hour", "Same day", "Longer"];
const BRAND_VOICES = ["Professional", "Friendly", "Luxury", "Casual"];
const YES_NO = ["Yes", "No"];

const REQUIRED_FIELDS_BY_SECTION = {
  1: ["full_name", "business_name", "email", "phone"],
  2: ["services"],
  3: ["lead_sources"],
  5: ["response_speed"],
  6: ["requires_consultation"],
  7: ["brand_voice"],
  9: ["business_hours"],
  10: ["has_old_leads"],
  12: ["goals"],
};

const FIELD_LABELS = {
  full_name: "Full Name",
  business_name: "Business Name",
  email: "Email",
  phone: "Phone Number",
  services: "Services Offered",
  lead_sources: "Lead Sources",
  response_speed: "Response Speed",
  requires_consultation: "Consultation Requirement",
  brand_voice: "Brand Voice",
  business_hours: "Business Hours",
  has_old_leads: "Old Leads",
  goals: "Your Goals",
};

const sections = [
  { id: 1, title: "Business Information" },
  { id: 2, title: "Services Offered" },
  { id: 3, title: "Lead Sources" },
  { id: 4, title: "Current Process" },
  { id: 5, title: "Response Speed" },
  { id: 6, title: "Booking System" },
  { id: 7, title: "Brand Voice" },
  { id: 8, title: "Customer Questions" },
  { id: 9, title: "Business Hours" },
  { id: 10, title: "Old Leads" },
  { id: 11, title: "Access Information" },
  { id: 12, title: "Your Goals" },
];

export default function Onboarding() {
  const [currentSection, setCurrentSection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    website: "",
    social_media: "",
    services: [],
    lead_sources: [],
    current_process: "",
    response_speed: "",
    booking_link: "",
    calendar_system: "",
    requires_consultation: "",
    brand_voice: "",
    customer_questions: "",
    business_hours: "",
    has_old_leads: "",
    access_info: "",
    goals: "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleCheckbox = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[\d\s\-()]+$/.test(phone) && phone.replace(/\D/g, "").length >= 10;

  const getFieldError = (field, value) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? null : `Please select at least one option for ${FIELD_LABELS[field]}.`;
    }

    const normalized = typeof value === "string" ? value.trim() : value;

    if (!normalized) {
      return `${FIELD_LABELS[field]} is required.`;
    }

    if (field === "email" && !validateEmail(normalized)) {
      return "Please enter a valid email address.";
    }

    if (field === "phone" && !validatePhone(normalized)) {
      return "Please enter a valid phone number.";
    }

    return null;
  };

  const validateSections = (sectionIds) => {
    const nextErrors = {};

    sectionIds.forEach((sectionId) => {
      const fields = REQUIRED_FIELDS_BY_SECTION[sectionId] || [];
      fields.forEach((field) => {
        const message = getFieldError(field, formData[field]);
        if (message) {
          nextErrors[field] = message;
        }
      });
    });

    return nextErrors;
  };

  const goToSection = (targetSection) => {
    if (targetSection <= currentSection) {
      setError(null);
      setCurrentSection(targetSection);
      return;
    }

    const nextErrors = validateSections([currentSection]);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
      setError("Please complete the required fields in this section before continuing.");
      return;
    }

    setError(null);
    setCurrentSection(targetSection);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allRequiredErrors = validateSections(Object.keys(REQUIRED_FIELDS_BY_SECTION).map(Number));
    if (Object.keys(allRequiredErrors).length > 0) {
      setFieldErrors(allRequiredErrors);
      const firstInvalidSection = Object.entries(REQUIRED_FIELDS_BY_SECTION).find(([, fields]) =>
        fields.some((field) => allRequiredErrors[field])
      );
      if (firstInvalidSection) {
        setCurrentSection(Number(firstInvalidSection[0]));
      }
      setError("Please complete all required onboarding fields before submitting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await base44.functions.invoke("submitClientOnboarding", {
        ...formData,
        flow: "onboarding",
      });

      setSubmitted(true);
    } catch (err) {
      setError(err?.data?.error || err.message || "Failed to submit onboarding");
      setLoading(false);
    }
  };

  if (submitted) {
    return <PostOnboardingFlow businessName={formData.business_name} email={formData.email} />;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">
            Client Onboarding
          </p>
          <h1 className="font-display text-4xl font-semibold text-foreground mb-2">
            Let's Set Up Your System
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete all sections to get started
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Section {currentSection} of {sections.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentSection / sections.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentSection / sections.length) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {currentSection === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Business Information
              </h2>
              <InputField
                label="Full Name"
                required
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="Your full name"
                error={fieldErrors.full_name}
              />
              <InputField
                label="Business Name"
                required
                value={formData.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                placeholder="Your business name"
                error={fieldErrors.business_name}
              />
              <InputField
                label="Email"
                required
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="your@email.com"
                error={fieldErrors.email}
              />
              <InputField
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(555) 000-0000"
                error={fieldErrors.phone}
              />
              <InputField
                label="Website URL"
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
              <InputField
                label="Instagram / Social Media Links"
                value={formData.social_media}
                onChange={(e) => updateField("social_media", e.target.value)}
                placeholder="@yourhandle or links"
              />
            </div>
          )}

          {currentSection === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Services Offered
              </h2>
              <p className="text-muted-foreground">Select all that apply</p>
              <div className="space-y-3">
                {SERVICES.map((service) => (
                  <CheckboxItem
                    key={service}
                    checked={formData.services.includes(service)}
                    onChange={() => toggleCheckbox("services", service)}
                    label={service}
                  />
                ))}
              </div>
              {fieldErrors.services && (
                <p className="text-sm text-destructive">{fieldErrors.services}</p>
              )}
              <InputField
                label="Other Services (if any)"
                value={formData.services.find((s) => !SERVICES.includes(s)) || ""}
                onChange={(e) => {
                  const other = formData.services.find((s) => !SERVICES.includes(s));
                  if (other) {
                    updateField(
                      "services",
                      formData.services.filter((s) => s !== other)
                    );
                  }
                  if (e.target.value) {
                    updateField("services", [...formData.services, e.target.value]);
                  }
                }}
                placeholder="Describe other services"
              />
            </div>
          )}

          {currentSection === 3 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Lead Sources
              </h2>
              <p className="text-muted-foreground">Where do your leads come from?</p>
              <div className="space-y-3">
                {LEAD_SOURCES.map((source) => (
                  <CheckboxItem
                    key={source}
                    checked={formData.lead_sources.includes(source)}
                    onChange={() => toggleCheckbox("lead_sources", source)}
                    label={source}
                  />
                ))}
              </div>
              {fieldErrors.lead_sources && (
                <p className="text-sm text-destructive">{fieldErrors.lead_sources}</p>
              )}
              <InputField
                label="Other Sources (if any)"
                value={formData.lead_sources.find((s) => !LEAD_SOURCES.includes(s)) || ""}
                onChange={(e) => {
                  const other = formData.lead_sources.find((s) => !LEAD_SOURCES.includes(s));
                  if (other) {
                    updateField(
                      "lead_sources",
                      formData.lead_sources.filter((s) => s !== other)
                    );
                  }
                  if (e.target.value) {
                    updateField("lead_sources", [...formData.lead_sources, e.target.value]);
                  }
                }}
                placeholder="Describe other sources"
              />
            </div>
          )}

          {currentSection === 4 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Current Lead Handling
              </h2>
              <TextareaField
                label="How are leads currently handled after someone reaches out?"
                value={formData.current_process}
                onChange={(e) => updateField("current_process", e.target.value)}
                placeholder="Describe your current process..."
              />
            </div>
          )}

          {currentSection === 5 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Response Speed
              </h2>
              <SelectField
                label="How quickly do you typically respond to leads?"
                value={formData.response_speed}
                onChange={(e) => updateField("response_speed", e.target.value)}
                options={RESPONSE_OPTIONS}
                required
                error={fieldErrors.response_speed}
              />
            </div>
          )}

          {currentSection === 6 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Booking System
              </h2>
              <InputField
                label="Booking Link (scheduler, Acuity, etc.)"
                value={formData.booking_link}
                onChange={(e) => updateField("booking_link", e.target.value)}
                placeholder="https://your-booking-page.com/..."
              />
              <InputField
                label="Calendar System Used"
                value={formData.calendar_system}
                onChange={(e) => updateField("calendar_system", e.target.value)}
                placeholder="Google Calendar, Acuity Scheduling, etc."
              />
              <SelectField
                label="Do you require a consultation first?"
                value={formData.requires_consultation}
                onChange={(e) => updateField("requires_consultation", e.target.value)}
                options={YES_NO}
                required
                error={fieldErrors.requires_consultation}
              />
            </div>
          )}

          {currentSection === 7 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Brand Voice
              </h2>
              <SelectField
                label="How would you describe your brand voice?"
                value={formData.brand_voice}
                onChange={(e) => updateField("brand_voice", e.target.value)}
                options={BRAND_VOICES}
                required
                error={fieldErrors.brand_voice}
              />
            </div>
          )}

          {currentSection === 8 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Customer Questions
              </h2>
              <TextareaField
                label="What are the most common questions customers ask?"
                value={formData.customer_questions}
                onChange={(e) => updateField("customer_questions", e.target.value)}
                placeholder="List common FAQs..."
              />
            </div>
          )}

          {currentSection === 9 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Business Hours
              </h2>
              <TextareaField
                label="List your business hours and days open"
                value={formData.business_hours}
                onChange={(e) => updateField("business_hours", e.target.value)}
                placeholder="Monday-Friday: 9am-6pm\nSaturday: 10am-4pm\nClosed Sunday"
                required
                error={fieldErrors.business_hours}
              />
            </div>
          )}

          {currentSection === 10 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Old Leads Database
              </h2>
              <p className="text-muted-foreground">
                Do you have a list of old leads you'd like us to reactivate?
              </p>
              <SelectField
                label="Have you got old leads?"
                value={formData.has_old_leads}
                onChange={(e) => updateField("has_old_leads", e.target.value)}
                options={YES_NO}
                required
                error={fieldErrors.has_old_leads}
              />
            </div>
          )}

          {currentSection === 11 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Access Information
              </h2>
              <TextareaField
                label="Provide any relevant access or login details (if applicable)"
                value={formData.access_info}
                onChange={(e) => updateField("access_info", e.target.value)}
                placeholder="CRM logins, email access, etc. (if you want to share)"
              />
            </div>
          )}

          {currentSection === 12 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Your Goals
              </h2>
              <TextareaField
                label="What would success look like for you?"
                value={formData.goals}
                onChange={(e) => updateField("goals", e.target.value)}
                placeholder="Describe your ideal outcome..."
                required
                error={fieldErrors.goals}
              />
            </div>
          )}

          {error && (
            <div className="mt-8 bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setCurrentSection(Math.max(1, currentSection - 1));
              }}
              disabled={currentSection === 1}
              className="px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => goToSection(section.id)}
                  className={`w-8 h-8 rounded-lg font-medium text-xs transition-colors ${
                    currentSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {section.id}
                </button>
              ))}
            </div>

            {currentSection === sections.length ? (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToSection(Math.min(sections.length, currentSection + 1))}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
      <OnboardingChatWidget />
    </div>
  );
}

function InputField({ label, required = false, type = "text", value, onChange, placeholder, error }) {
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
        aria-invalid={Boolean(error)}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary ${error ? "border-destructive" : "border-border"}`}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, required = false, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        aria-invalid={Boolean(error)}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none ${error ? "border-destructive" : "border-border"}`}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${error ? "border-destructive" : "border-border"}`}
      >
        <option value="">Select an option...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function CheckboxItem({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border bg-white hover:bg-muted transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
      />
      <span className="text-foreground font-medium">{label}</span>
    </label>
  );
}

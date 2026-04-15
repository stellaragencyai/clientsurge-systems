import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertCircle } from "lucide-react";
import OnboardingChatWidget from "../components/onboarding/OnboardingChatWidget";

const SERVICES = ["Botox / Injectables", "Fillers", "Laser Treatments", "Facials / Skincare", "Body Contouring", "Weight Loss"];
const LEAD_SOURCES = ["Website Forms", "Instagram DMs", "Phone Calls", "Paid Ads"];
const RESPONSE_OPTIONS = ["Immediately", "Within 1 hour", "Same day", "Longer"];
const BRAND_VOICES = ["Professional", "Friendly", "Luxury", "Casual"];
const YES_NO = ["Yes", "No"];

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
  };

  const toggleCheckbox = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create the Client record
      await base44.entities.Client.create({
        ...formData,
        status: "Onboarding",
      });

      // 2. Auto-create the ClientProject so the portal is ready immediately
      await base44.entities.ClientProject.create({
        client_email: formData.email,
        client_name: formData.full_name,
        business_name: formData.business_name,
        plan: "Starter System",
        step_onboarding: "complete",
      });

      // 3. Invite the client to the platform (sends activation email with login link)
      await base44.users.inviteUser(formData.email, "user");

      // 4. Send portal welcome email
      await base44.functions.invoke("sendPortalWelcomeEmail", {
        client_name: formData.full_name,
        client_email: formData.email,
        business_name: formData.business_name,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit onboarding");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-3">
            Onboarding Received
          </h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Your onboarding has been received. We will begin setting up your system shortly.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <p className="text-sm text-muted-foreground">
              Check your email for next steps. Our team will reach out within 24 hours to confirm details and begin your setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
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

        {/* Progress Bar */}
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Section 1 */}
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
              />
              <InputField
                label="Business Name"
                required
                value={formData.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                placeholder="Your business name"
              />
              <InputField
                label="Email"
                required
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="your@email.com"
              />
              <InputField
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(555) 000-0000"
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

          {/* Section 2 */}
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

          {/* Section 3 */}
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

          {/* Section 4 */}
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

          {/* Section 5 */}
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
              />
            </div>
          )}

          {/* Section 6 */}
          {currentSection === 6 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Booking System
              </h2>
              <InputField
                label="Booking Link (Calendly, Acuity, etc.)"
                value={formData.booking_link}
                onChange={(e) => updateField("booking_link", e.target.value)}
                placeholder="https://calendly.com/..."
              />
              <InputField
                label="Calendar System Used"
                value={formData.calendar_system}
                onChange={(e) => updateField("calendar_system", e.target.value)}
                placeholder="Calendly, Acuity Scheduling, etc."
              />
              <SelectField
                label="Do you require a consultation first?"
                value={formData.requires_consultation}
                onChange={(e) => updateField("requires_consultation", e.target.value)}
                options={YES_NO}
              />
            </div>
          )}

          {/* Section 7 */}
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
              />
            </div>
          )}

          {/* Section 8 */}
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

          {/* Section 9 */}
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
              />
            </div>
          )}

          {/* Section 10 */}
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
              />
            </div>
          )}

          {/* Section 11 */}
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

          {/* Section 12 */}
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
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-8 bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentSection(Math.max(1, currentSection - 1))}
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
                  onClick={() => setCurrentSection(section.id)}
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
                onClick={() => setCurrentSection(Math.min(sections.length, currentSection + 1))}
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

function InputField({ label, required, type = "text", value, onChange, placeholder }) {
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
        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
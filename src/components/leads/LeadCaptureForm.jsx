import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone, hiddenHoneypotFilled, buildSourceAttribution } from "@/lib/formSanitizers";

const SMS_CONSENT_VERSION = "lead_capture_optional_sms_v2_2026-07-11";

export default function LeadCaptureForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    business_type: "",
    problem: "",
    consent_given: false,
    website_url: "",
  });

  const businessTypes = [
    "Med Spas & Aesthetic Clinics",
    "Dental & Orthodontics",
    "Chiropractic & Physical Therapy",
    "HVAC, Plumbing & Home Services",
    "Roofing & Restoration",
    "Contractors & Trades",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validate = () => {
    if (hiddenHoneypotFilled(formData.website_url)) return "bot";
    if (!formData.full_name.trim()) return "Please enter your full name.";
    if (!formData.business_name.trim()) return "Please enter your business name.";
    if (!isValidEmail(formData.email)) return "Please enter a valid email address.";
    if (!isValidPhone(formData.phone)) return "Please enter a valid phone number.";
    if (!formData.business_type.trim()) return "Please select your business type.";
    if (!formData.problem.trim()) return "Please describe the problem you want solved.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError === "bot") {
      setSuccess(true);
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const smsConsentGiven = formData.consent_given === true;
      const result = await base44.functions.invoke("submitLeadCapture", {
        full_name: formData.full_name.trim(),
        business_name: formData.business_name.trim(),
        email: normalizeEmail(formData.email),
        phone: normalizePhone(formData.phone),
        business_type: formData.business_type.trim(),
        problem: formData.problem.trim(),
        source: "lead_capture_page",
        requested_channels: smsConsentGiven ? ["sms", "email"] : ["email"],
        consent_given: smsConsentGiven,
        consent_source: smsConsentGiven ? "lead_capture_page_optional_sms_checkbox" : null,
        consent_text_version: smsConsentGiven ? SMS_CONSENT_VERSION : null,
        ...buildSourceAttribution("/leads/capture"),
      });

      if (!result.data?.success) throw new Error(result.data?.error || "Lead submission failed");

      setSuccess(true);
      setFormData({
        full_name: "",
        business_name: "",
        email: "",
        phone: "",
        business_type: "",
        problem: "",
        consent_given: false,
        website_url: "",
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || "Failed to submit form. Please try again or contact support@clientsurgesystems.com.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Thank You!</h3>
        <p className="text-sm text-green-700">We've received your information. We'll follow up by email, and by SMS only when you selected SMS consent.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4" noValidate>
      <input type="text" name="website_url" value={formData.website_url} onChange={handleChange} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div><label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="John Doe" autoComplete="name" className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" /></div>
      <div><label className="block text-sm font-medium text-foreground mb-1.5">Business Name</label><input type="text" name="business_name" value={formData.business_name} onChange={handleChange} required placeholder="Your Business" autoComplete="organization" className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" /></div>
      <div><label className="block text-sm font-medium text-foreground mb-1.5">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" autoComplete="email" aria-invalid={Boolean(formData.email && !isValidEmail(formData.email))} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" /></div>
      <div><label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 (555) 123-4567" autoComplete="tel" aria-invalid={Boolean(formData.phone && !isValidPhone(formData.phone))} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" /></div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Business Type</label>
        <select name="business_type" value={formData.business_type} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Select your business type</option>
          {businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div><label className="block text-sm font-medium text-foreground mb-1.5">What's your biggest problem right now?</label><textarea name="problem" value={formData.problem} onChange={handleChange} required placeholder="Tell us what you're struggling with..." rows={3} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" /></div>

      <div className="border border-border rounded-lg p-3 bg-muted/30">
        <p className="text-xs font-semibold text-foreground mb-2">Optional SMS consent</p>
        <label className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
          <input
            type="checkbox"
            checked={formData.consent_given}
            onChange={(e) => setFormData((prev) => ({ ...prev, consent_given: e.target.checked }))}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            aria-describedby="sms-consent-disclosure"
          />
          <span id="sms-consent-disclosure">
            I agree to receive SMS messages from ClientSurge Systems regarding my inquiry, appointments, onboarding, and service updates. Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out or <strong>HELP</strong> for help. Consent is not a condition of purchase. View <a href="/sms-terms" className="underline hover:text-foreground">SMS Terms</a> and <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
          </span>
        </label>
        <p className="mt-2 text-[11px] text-muted-foreground">You may submit this form without selecting SMS consent. We can respond by email.</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full rounded-lg h-11 text-base font-semibold">{loading ? "Submitting..." : "Submit"}</Button>
    </form>
  );
}

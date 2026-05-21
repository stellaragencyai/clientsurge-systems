import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await base44.functions.invoke("submitLeadCapture", {
        ...formData,
        source: "lead_capture_page",
        source_page: typeof window !== "undefined" ? window.location.pathname : "/capture-leads",
        requested_channels: ["sms", "email"],
        consent_given: formData.consent_given === true,
        consent_source: "lead_capture_page",
        consent_text_version: "lead_capture_explicit_checkbox_v1",
      });

      if (!result.data?.success) {
        throw new Error("Lead submission failed");
      }

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
      setError("Failed to submit form. Please try again.");
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
        <p className="text-sm text-green-700">
          We've received your information. We'll be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <input
        type="text"
        name="website_url"
        value={formData.website_url}
        onChange={handleChange}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Full Name
        </label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          placeholder="John Doe"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Business Name
        </label>
        <input
          type="text"
          name="business_name"
          value={formData.business_name}
          onChange={handleChange}
          required
          placeholder="Your Business"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="john@example.com"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="+1 (555) 123-4567"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Business Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Business Type
        </label>
        <select
          name="business_type"
          value={formData.business_type}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select your business type</option>
          {businessTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Problem */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          What's your biggest problem right now?
        </label>
        <textarea
          name="problem"
          value={formData.problem}
          onChange={handleChange}
          required
          placeholder="Tell us what you're struggling with..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* TCPA SMS Consent */}
      <label className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed border border-border rounded-lg p-3 bg-muted/30">
        <input
          type="checkbox"
          checked={formData.consent_given}
          onChange={(e) => setFormData((prev) => ({ ...prev, consent_given: e.target.checked }))}
          required
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
        />
        <span>
          I agree to receive automated SMS and email messages from ClientSurge Systems about my inquiry. Message &amp; data rates may apply. Reply <strong>STOP</strong> at any time to opt out.{" "}
          <a href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</a>
          {" - "}
          <a href="/terms" className="underline hover:text-foreground">Terms</a>
        </span>
      </label>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg h-11 text-base font-semibold"
      >
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}

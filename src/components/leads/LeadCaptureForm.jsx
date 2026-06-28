import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { normalizePhoneToE164 } from "@/lib/phoneNormalization";

const initialFormData = {
  full_name: "",
  business_name: "",
  email: "",
  phone: "",
  business_type: "",
  problem: "",
  consent_given: false,
  website_url: "",
};

const initialPhoneCheck = {
  status: "not_attempted",
  phone_e164: "",
  approved: false,
  checked_at: "",
  attempts: 0,
};

export default function LeadCaptureForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [phoneCode, setPhoneCode] = useState("");
  const [sendingPhoneCheck, setSendingPhoneCheck] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneCheck, setPhoneCheck] = useState(initialPhoneCheck);

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
    if (name === "phone") {
      const nextPhone = normalizePhoneToE164(value) || "";
      if (phoneCheck.phone_e164 && phoneCheck.phone_e164 !== nextPhone) {
        setPhoneCheck(initialPhoneCheck);
        setPhoneCode("");
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getNormalizedPhone = () => {
    const normalizedPhone = normalizePhoneToE164(formData.phone);
    if (!normalizedPhone) {
      setError("Enter a valid phone number.");
      return null;
    }
    return normalizedPhone;
  };

  const sendPhoneCheck = async () => {
    setError("");
    const normalizedPhone = getNormalizedPhone();
    if (!normalizedPhone) return;
    if (!formData.consent_given) {
      setError("Check the consent box first.");
      return;
    }

    setSendingPhoneCheck(true);
    try {
      const result = await base44.functions.invoke("twilioVerify", {
        action: "start",
        phone: normalizedPhone,
      });
      if (!result.data?.success) throw new Error(result.data?.error || "Could not start phone check");
      setPhoneCheck({
        status: result.data.status || "pending",
        phone_e164: normalizedPhone,
        approved: false,
        checked_at: "",
        attempts: phoneCheck.attempts,
      });
      setPhoneCode("");
    } catch (err) {
      setPhoneCheck((prev) => ({ ...prev, status: "failed", approved: false }));
      setError(err.message || "Could not start phone check.");
    } finally {
      setSendingPhoneCheck(false);
    }
  };

  const confirmPhoneCheck = async () => {
    setError("");
    const normalizedPhone = getNormalizedPhone();
    if (!normalizedPhone) return;
    if (!phoneCode.trim()) {
      setError("Enter the passcode from your text message.");
      return;
    }

    setCheckingPhone(true);
    try {
      const result = await base44.functions.invoke("twilioVerify", {
        action: "check",
        phone: normalizedPhone,
        code: phoneCode.trim(),
      });
      if (!result.data?.approved) throw new Error(result.data?.error || "Phone was not approved");
      setPhoneCheck({
        status: "approved",
        phone_e164: result.data.phone_e164 || normalizedPhone,
        approved: true,
        checked_at: result.data.checked_at || new Date().toISOString(),
        attempts: phoneCheck.attempts + 1,
      });
    } catch (err) {
      setPhoneCheck((prev) => ({ ...prev, status: "failed", approved: false, attempts: prev.attempts + 1 }));
      setError(err.message || "Phone check failed. Try again.");
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedPhone = getNormalizedPhone();
    if (!normalizedPhone) return;
    if (!phoneCheck.approved || phoneCheck.phone_e164 !== normalizedPhone) {
      setError("Confirm the phone number before submitting.");
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke("submitLeadCapture", {
        ...formData,
        phone: normalizedPhone,
        phone_number: normalizedPhone,
        phone_e164: normalizedPhone,
        phone_verified: true,
        phone_verification_status: "approved",
        phone_verified_at: phoneCheck.checked_at || new Date().toISOString(),
        verification_attempts: phoneCheck.attempts,
        message: formData.problem,
        problem: formData.problem,
        source: "website_form",
        source_page: typeof window !== "undefined" ? window.location.pathname : "/capture-leads",
        requested_channels: ["sms", "email"],
        consent_given: formData.consent_given === true,
        consent_source: "lead_capture_page",
        consent_text_version: "lead_capture_explicit_checkbox_v1",
      });

      if (!result.data?.success) throw new Error(result.data?.error || "Lead submission failed");

      setSuccess(true);
      setFormData(initialFormData);
      setPhoneCode("");
      setPhoneCheck(initialPhoneCheck);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">Thank You!</h3>
        <p className="text-sm text-green-700">We've received your information. We'll be in touch shortly.</p>
      </div>
    );
  }

  const phoneApproved = phoneCheck.approved && phoneCheck.phone_e164 === normalizePhoneToE164(formData.phone);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <input type="text" name="website_url" value={formData.website_url} onChange={handleChange} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Field label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" required />
      <Field label="Business Name" name="business_name" value={formData.business_name} onChange={handleChange} placeholder="Your Business" required />
      <Field label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
      <Field label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 123-4567" required />

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Phone check</p>
            <p className="text-xs text-muted-foreground">{phoneApproved ? "Phone confirmed." : "Confirm the phone before submitting."}</p>
          </div>
          {phoneApproved && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </div>
        {!phoneApproved && (
          <div className="space-y-3">
            <Button type="button" variant="outline" onClick={sendPhoneCheck} disabled={sendingPhoneCheck || checkingPhone} className="w-full">
              {sendingPhoneCheck ? "Sending..." : phoneCheck.status === "pending" ? "Resend passcode" : "Send passcode"}
            </Button>
            {phoneCheck.status !== "not_attempted" && (
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} placeholder="Passcode" className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <Button type="button" onClick={confirmPhoneCheck} disabled={checkingPhone || sendingPhoneCheck}>{checkingPhone ? "Checking..." : "Confirm"}</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Business Type</label>
        <select name="business_type" value={formData.business_type} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Select your business type</option>
          {businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">What's your biggest problem right now?</label>
        <textarea name="problem" value={formData.problem} onChange={handleChange} required placeholder="Tell us what you're struggling with..." rows={3} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
      </div>

      <label className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed border border-border rounded-lg p-3 bg-muted/30">
        <input type="checkbox" checked={formData.consent_given} onChange={(e) => setFormData((prev) => ({ ...prev, consent_given: e.target.checked }))} required className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
        <span>I agree to receive texts and emails from ClientSurge Systems about my inquiry. Message and data rates may apply. <a href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</a> - <a href="/terms" className="underline hover:text-foreground">Terms</a></span>
      </label>

      <Button type="submit" disabled={loading || !phoneApproved} className="w-full rounded-lg h-11 text-base font-semibold">
        {loading ? "Submitting..." : phoneApproved ? "Submit" : "Confirm phone to submit"}
      </Button>
    </form>
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  );
}

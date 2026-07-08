import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CSSuccessModal from '@/components/design-system/CSSuccessModal';

const PAID_ORDER_REQUIRED_MESSAGE =
  "We could not find a paid ClientSurge order for that email yet. Finish checkout first, then create your portal account with the same email.";
const GENERIC_SUBMIT_MESSAGE = "We could not create your account right now. Please try again or contact support.";

function getSubmitErrorMessage(err) {
  const status = err?.response?.status || err?.status;
  const code = err?.response?.data?.code || err?.data?.code;
  const apiMessage =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.data?.error ||
    err?.data?.message;

  if (code === "canonical_paid_order_not_found") {
    return PAID_ORDER_REQUIRED_MESSAGE;
  }

  if (status === 404 && /request failed with status code 404/i.test(err?.message || "")) {
    return PAID_ORDER_REQUIRED_MESSAGE;
  }

  return apiMessage || err?.message || GENERIC_SUBMIT_MESSAGE;
}

export default function SignupModal({ onClose, onSwitchToLogin }) {
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    website: "",
    business_type: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.business_name.trim()) e.business_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Required";
    else if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid phone number";
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined, submit: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await base44.functions.invoke("submitClientOnboarding", {
        ...form,
        flow: "signup",
      });

      setSuccess(true);
    } catch (err) {
      setErrors({ submit: getSubmitErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4">
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl z-10 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-border focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Create Account</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Start Your Onboarding</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your details and we'll get your account set up.</p>
        </div>

        {/* Success */}
        {success ? (
          <div className="px-8 py-16 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Jane Smith" error={errors.full_name} required />
              <Field label="Business Name" name="business_name" value={form.business_name} onChange={handleChange} placeholder="My Business" error={errors.business_name} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@business.com" error={errors.email} required />
              <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" error={errors.phone} required />
            </div>

            <Field label="Website (optional)" name="website" value={form.website} onChange={handleChange} placeholder="https://yoursite.com" />

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Business Type</label>
              <select
                name="business_type"
                value={form.business_type}
                onChange={handleChange}
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              >
                <option value="">Select your industry...</option>
                <option>Med Spas & Aesthetic Clinics</option>
                <option>Dental & Orthodontics</option>
                <option>Chiropractic & Physical Therapy</option>
                <option>HVAC, Plumbing & Home Services</option>
                <option>Roofing & Restoration</option>
                <option>Contractors & Trades</option>
                <option>Other Service Business</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", borderRadius: "9999px", boxShadow: "0 4px 18px rgba(0,136,204,0.35)" }}
              className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline focus:outline-none">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
      {success && (
        <CSSuccessModal
          isOpen={success}
          onClose={onClose}
          title="Account Linked!"
          message="Check your inbox for an activation link. Once your account is active, you can log in to your client portal and track your system setup."
          responseTime="within 1 business day"
          nextSteps={[
            'Check your email for an activation link',
            'Click the link to verify your account',
            'Log in to your client portal to track setup',
          ]}
          primaryCTA={{ label: 'Go to Client Portal', to: '/client-portal' }}
        />
      )}
      </div>
    </div>,
    document.body
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder, error, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition ${error ? "border-red-400 bg-red-50" : "border-input bg-background"}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
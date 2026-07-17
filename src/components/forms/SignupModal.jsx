import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, Mail, Phone, Sparkles, User, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CSSuccessModal from "@/components/design-system/CSSuccessModal";

const PAID_ORDER_REQUIRED_MESSAGE =
  "We could not find a paid ClientSurge order for that email yet. Finish checkout first, then create your portal account with the same email.";
const GENERIC_SUBMIT_MESSAGE = "We could not create your account right now. Please try again or contact support.";

const STEPS = [
  { id: "identity", title: "About you", description: "Tell us who will manage this account." },
  { id: "business", title: "Your business", description: "Give us the details needed to prepare your workspace." },
  { id: "confirm", title: "Review", description: "Confirm everything before we create your account." },
];

function getSubmitErrorMessage(err) {
  const status = err?.response?.status || err?.status;
  const code = err?.response?.data?.code || err?.data?.code;
  const apiMessage = err?.response?.data?.error || err?.response?.data?.message || err?.data?.error || err?.data?.message;
  if (code === "canonical_paid_order_not_found") return PAID_ORDER_REQUIRED_MESSAGE;
  if (status === 404 && /request failed with status code 404/i.test(err?.message || "")) return PAID_ORDER_REQUIRED_MESSAGE;
  return apiMessage || err?.message || GENERIC_SUBMIT_MESSAGE;
}

export default function SignupModal({ onClose, onSwitchToLogin }) {
  const [form, setForm] = useState({ full_name: "", business_name: "", email: "", phone: "", website: "", business_type: "" });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const nextErrors = {};
    if (step === 0) {
      if (!form.full_name.trim()) nextErrors.full_name = "Required";
      if (!form.email.trim()) nextErrors.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email";
      if (!form.phone.trim()) nextErrors.phone = "Required";
      else if (form.phone.replace(/\D/g, "").length < 10) nextErrors.phone = "Enter a valid phone number";
    }
    if (step === 1 && !form.business_name.trim()) nextErrors.business_name = "Required";
    return nextErrors;
  };

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: undefined, submit: undefined }));
  };

  const handleNext = () => {
    const nextErrors = validateStep();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await base44.functions.invoke("submitClientOnboarding", { ...form, flow: "signup" });
      setSuccess(true);
    } catch (err) {
      setErrors({ submit: getSubmitErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#020822]/80 p-4 backdrop-blur-xl">
      <div className="flex min-h-full items-center justify-center">
        <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-cyan-200/20 bg-white shadow-[0_40px_120px_rgba(0,8,35,0.55)] lg:grid-cols-[0.8fr_1.2fr]">
          <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:text-slate-950"><X className="h-4 w-4" /></button>

          <aside className="relative overflow-hidden bg-[#04102f] px-7 py-9 text-white sm:px-10 lg:px-12 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(0,194,255,0.24),transparent_30%),radial-gradient(circle_at_90%_85%,rgba(0,91,255,0.22),transparent_34%)]" />
            <div className="relative z-10">
              <div className="mb-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300"><Sparkles className="h-5 w-5" /></div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">ClientSurge onboarding</p>
              <h2 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-[-0.05em]">Create your AI-powered workspace.</h2>
              <p className="mt-5 text-sm font-medium leading-6 text-slate-300">We use these details to match your purchase, prepare your portal, and configure onboarding correctly.</p>

              <div className="mt-10 space-y-4">
                {STEPS.map((item, index) => {
                  const active = index === step;
                  const complete = index < step;
                  return (
                    <div key={item.id} className={`flex gap-3 rounded-2xl border p-4 transition ${active ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/[0.035]"}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${complete ? "bg-cyan-300 text-[#04102f]" : active ? "bg-cyan-300/15 text-cyan-300 ring-1 ring-cyan-300/25" : "bg-white/5 text-slate-500"}`}>{complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</div>
                      <div><p className="text-sm font-extrabold text-white">{item.title}</p><p className="mt-1 text-xs font-medium leading-5 text-slate-400">{item.description}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="relative px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="mb-8 pr-12">
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[linear-gradient(90deg,#16c7ff,#066ee8)] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-600">Step {step + 1} of {STEPS.length}</p>
              <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">{STEPS[step].title}</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">{STEPS[step].description}</p>
            </div>

            {errors.submit && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errors.submit}</div>}

            <form onSubmit={handleSubmit}>
              {step === 0 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field icon={User} label="Full name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Jane Smith" error={errors.full_name} />
                  <Field icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@business.com" error={errors.email} />
                  <div className="sm:col-span-2"><Field icon={Phone} label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" error={errors.phone} /></div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <Field icon={Building2} label="Business name" name="business_name" value={form.business_name} onChange={handleChange} placeholder="My Business" error={errors.business_name} />
                  <Field label="Website (optional)" name="website" value={form.website} onChange={handleChange} placeholder="https://yoursite.com" />
                  <div><label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-700">Business type</label><select name="business_type" value={form.business_type} onChange={handleChange} className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"><option value="">Select your industry...</option><option>Med Spas & Aesthetic Clinics</option><option>Dental & Orthodontics</option><option>Chiropractic & Physical Therapy</option><option>HVAC, Plumbing & Home Services</option><option>Roofing & Restoration</option><option>Contractors & Trades</option><option>Other Service Business</option></select></div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  {[['Name', form.full_name], ['Email', form.email], ['Phone', form.phone], ['Business', form.business_name], ['Industry', form.business_type || 'Not specified'], ['Website', form.website || 'Not provided']].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-6 border-b border-slate-200 py-3 last:border-0"><span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span><span className="text-right text-sm font-bold text-slate-950">{value}</span></div>)}
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <button type="button" onClick={() => step === 0 ? onSwitchToLogin() : setStep((current) => current - 1)} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />{step === 0 ? "Sign in" : "Back"}</button>
                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={handleNext} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#16c7ff,#066ee8)] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,166,255,0.3)] transition hover:-translate-y-0.5">Continue <ArrowRight className="h-4 w-4" /></button>
                ) : (
                  <button type="submit" disabled={loading} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#16c7ff,#066ee8)] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,166,255,0.3)] transition hover:-translate-y-0.5 disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="h-4 w-4" /></>}</button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>

      {success && <CSSuccessModal isOpen={success} onClose={onClose} title="Account Linked!" message="Check your inbox for an activation link. Once your account is active, you can log in to your client portal and track your system setup." responseTime="within 1 business day" nextSteps={["Check your email for an activation link", "Click the link to verify your account", "Log in to your client portal to track setup"]} primaryCTA={{ label: "Go to Client Portal", to: "/client-portal" }} />}
    </div>,
    document.body
  );
}

function Field({ icon: Icon, label, name, type = "text", value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-700">{label}</label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className={`h-13 w-full rounded-2xl border bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${Icon ? "pl-11" : ""} ${error ? "border-red-300 bg-red-50/40" : "border-slate-200"}`} />
      </div>
      {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}

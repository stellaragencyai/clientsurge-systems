import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "09:30", label: "9:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "11:30", label: "11:30 AM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "14:30", label: "2:30 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "15:30", label: "3:30 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "16:30", label: "4:30 PM" },
];

const INDUSTRIES = [
  "Med Spas & Aesthetic Clinics",
  "Dental & Orthodontics",
  "Chiropractic & Physical Therapy",
  "HVAC, Plumbing & Home Services",
  "Roofing & Restoration",
  "Contractors & Trades",
  "Other",
];

export default function DemoBookingInline({ prefillIndustry = "" }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: "", last_name: "", business_name: "", email: "",
    phone: "", website: "", industry: prefillIndustry, biggest_issue: "", website_url: "",
  });
  const [scheduling, setScheduling] = useState({ date: "", time: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState(/** @type {Record<string, string | undefined>} */ ({}));
  const [submitWarnings, setSubmitWarnings] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => /^[\d\s\-()]+$/.test(v) && v.replace(/\D/g, "").length >= 10;

  const handleStep1 = (e) => {
    e.preventDefault();
    const errs = /** @type {Record<string, string | undefined>} */ ({});
    if (!form.first_name.trim()) errs.first_name = "Required";
    if (!form.last_name.trim()) errs.last_name = "Required";
    if (!form.business_name.trim()) errs.business_name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!validateEmail(form.email)) errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Required";
    else if (!validatePhone(form.phone)) errs.phone = "Invalid phone";
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  const handleDateChange = async (e) => {
    const value = e.target.value;
    setScheduling({ date: value, time: "" });
    if (!value) return;
    setLoadingSlots(true);
    try {
      const res = await base44.functions.invoke("getBookedDemoSlots", { date: value });
      setBookedSlots(res.data.booked_times || []);
    } catch { setBookedSlots([]); }
    finally { setLoadingSlots(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduling.date || !scheduling.time) {
      setErrors({ scheduling: "Please select both date and time" });
      return;
    }
    setSaving(true);
    setSubmitWarnings([]);
    try {
      const res = await base44.functions.invoke("scheduleDemoBooking", {
        full_name: `${form.first_name} ${form.last_name}`,
        first_name: form.first_name,
        last_name: form.last_name,
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        website: form.website,
        industry: form.industry,
        biggest_issue: form.biggest_issue,
        website_url: form.website_url,
        scheduled_date: scheduling.date,
        scheduled_time: scheduling.time,
      });
      if (res.data.success) {
        setSubmitWarnings(res.data.warnings || []);
        setSuccess(true);
      }
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally { setSaving(false); }
  };

  const inputCls = (key) =>
    `w-full h-10 rounded-xl border px-3 text-sm bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition ${errors[key] ? "border-red-500" : "border-white/10"}`;

  if (success) {
    return (
      <div className="py-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">You're all set.</h3>
        <p className="text-sm text-white/50">Nolan will confirm your demo within 24 hours.</p>
        {submitWarnings.length > 0 && (
          <p className="mt-3 text-xs text-amber-300 max-w-sm">
            Your booking was saved, but one or more follow-up actions still need review.
          </p>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <form onSubmit={handleStep1} className="space-y-3">
        <input
          type="text"
          name="website_url"
          value={form.website_url}
          onChange={set}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">First Name *</label>
            <input name="first_name" value={form.first_name} onChange={set} placeholder="Jane" className={inputCls("first_name")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Last Name *</label>
            <input name="last_name" value={form.last_name} onChange={set} placeholder="Smith" className={inputCls("last_name")} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Business Name *</label>
          <input name="business_name" value={form.business_name} onChange={set} placeholder="My Business" className={inputCls("business_name")} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Industry</label>
          <select name="industry" value={form.industry} onChange={set} className={`${inputCls("industry")} cursor-pointer`}>
            <option value="">Select...</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Email *</label>
            <input name="email" type="email" value={form.email} onChange={set} placeholder="jane@biz.com" className={inputCls("email")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={set} placeholder="(555) 000-0000" className={inputCls("phone")} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Website</label>
          <input name="website" value={form.website} onChange={set} placeholder="https://mybusiness.com" className={inputCls("website")} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Biggest challenge right now?</label>
          <select name="biggest_issue" value={form.biggest_issue} onChange={set} className={`${inputCls("biggest_issue")} cursor-pointer`}>
            <option value="">Select one...</option>
            <option value="Slow response time">Slow response time</option>
            <option value="Missed calls not being followed up">Missed calls not followed up</option>
            <option value="No follow-up system">No follow-up system</option>
            <option value="Low booking conversions">Low booking conversions</option>
          </select>
        </div>
        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-400">Please fill in all required fields.</p>
        )}
        <button
          type="submit"
          className="w-full h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-amber-100 transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}
        >
          Next: Choose Time <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-xs text-white/60">No spam. No pressure. Just a tailored walkthrough of your business.</p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errors.scheduling && <p className="text-xs text-red-400">{errors.scheduling}</p>}
      {errors.submit && <p className="text-xs text-red-400">{errors.submit}</p>}
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1">Select Date *</label>
        <input
          type="date"
          value={scheduling.date}
          min={new Date().toISOString().split("T")[0]}
          onChange={handleDateChange}
          className={inputCls("scheduling")}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1">
          Select Time * {loadingSlots && <span className="font-normal text-white/30 ml-1">Loading...</span>}
        </label>
        <select
          value={scheduling.time}
          onChange={(e) => setScheduling((s) => ({ ...s, time: e.target.value }))}
          disabled={!scheduling.date || loadingSlots}
          className={`${inputCls("scheduling")} disabled:opacity-40 cursor-pointer`}
        >
          <option value="">{!scheduling.date ? "Select a date first..." : "Choose a time..."}</option>
          {TIME_SLOTS.map(({ value, label }) => {
            const booked = bookedSlots.includes(value);
            return <option key={value} value={value} disabled={booked}>{label}{booked ? " - Booked" : ""}</option>;
          })}
        </select>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={() => { setStep(1); setErrors({}); }} className="flex-1 h-11 rounded-full border border-white/10 text-white/60 font-semibold hover:bg-white/5 transition">
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</> : <>Schedule Demo <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
      <p className="text-center text-xs text-white/60">No spam. No pressure. Just a tailored walkthrough of your business.</p>
    </form>
  );
}



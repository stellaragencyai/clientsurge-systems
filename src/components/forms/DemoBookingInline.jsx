import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackDemoBooked } from "@/lib/analytics";

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
  const [errors, setErrors] = useState({});
  const [submitWarnings, setSubmitWarnings] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => /^[\d\s\-()]+$/.test(v) && v.replace(/\D/g, "").length >= 10;

  const handleStep1 = (e) => {
    e.preventDefault();
    const errs = {};
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
        trackDemoBooked("demo_booking_inline", {
          industry: form.industry || "Other",
          scheduled_date: scheduling.date,
          scheduled_time: scheduling.time,
          warning_count: res.data.warnings?.length || 0,
        });
        setSubmitWarnings(res.data.warnings || []);
        setSuccess(true);
      }
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally { setSaving(false); }
  };

  const inputCls = (key) =>
    `w-full h-10 rounded-xl border px-3 text-sm bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition ${errors[key] ? "border-red-500" : "border-white/10"}`;
  const fieldMotion = (key) => ({
    animate: {
      scale: focusedField === key ? 1.012 : 1,
      boxShadow: focusedField === key ? "0 0 0 1px rgba(0,174,239,0.28), 0 10px 28px rgba(0,174,239,0.12)" : "0 0 0 0 rgba(0,0,0,0)",
    },
    transition: { duration: 0.22, ease: "easeOut" },
    style: { borderRadius: "14px" },
  });
  const focusProps = (key) => ({
    onFocus: () => setFocusedField(key),
    onBlur: () => setFocusedField(""),
  });

  if (success) {
    return (
      <motion.div
        className="py-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4"
          initial={{ scale: 0.75 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">You're all set.</h3>
        <p className="text-sm text-white/50">Nolan will confirm your demo within 24 hours.</p>
        <AnimatePresence>
          {submitWarnings.length > 0 && (
            <motion.p
              className="mt-3 text-xs text-blue-300 max-w-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Your booking was saved, but one or more follow-up actions still need review.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (step === 1) {
    return (
      <motion.form
        onSubmit={handleStep1}
        className="space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
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
          <motion.div {...fieldMotion("first_name")}>
            <label className="block text-xs font-semibold text-white/60 mb-1">First Name *</label>
            <input name="first_name" value={form.first_name} onChange={set} placeholder="Jane" className={inputCls("first_name")} {...focusProps("first_name")} />
          </motion.div>
          <motion.div {...fieldMotion("last_name")}>
            <label className="block text-xs font-semibold text-white/60 mb-1">Last Name *</label>
            <input name="last_name" value={form.last_name} onChange={set} placeholder="Smith" className={inputCls("last_name")} {...focusProps("last_name")} />
          </motion.div>
        </div>
        <motion.div {...fieldMotion("business_name")}>
          <label className="block text-xs font-semibold text-white/60 mb-1">Business Name *</label>
          <input name="business_name" value={form.business_name} onChange={set} placeholder="My Business" className={inputCls("business_name")} {...focusProps("business_name")} />
        </motion.div>
        <motion.div {...fieldMotion("industry")}>
          <label className="block text-xs font-semibold text-white/60 mb-1">Industry</label>
          <select name="industry" value={form.industry} onChange={set} className={`${inputCls("industry")} cursor-pointer`} {...focusProps("industry")}>
            <option value="">Select...</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          <motion.div {...fieldMotion("email")}>
            <label className="block text-xs font-semibold text-white/60 mb-1">Email *</label>
            <input name="email" type="email" value={form.email} onChange={set} placeholder="jane@biz.com" className={inputCls("email")} {...focusProps("email")} />
          </motion.div>
          <motion.div {...fieldMotion("phone")}>
            <label className="block text-xs font-semibold text-white/60 mb-1">Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={set} placeholder="(555) 000-0000" className={inputCls("phone")} {...focusProps("phone")} />
          </motion.div>
        </div>
        <motion.div {...fieldMotion("website")}>
          <label className="block text-xs font-semibold text-white/60 mb-1">Website</label>
          <input name="website" value={form.website} onChange={set} placeholder="https://mybusiness.com" className={inputCls("website")} {...focusProps("website")} />
        </motion.div>
        <motion.div {...fieldMotion("biggest_issue")}>
          <label className="block text-xs font-semibold text-white/60 mb-1">Biggest challenge right now?</label>
          <select name="biggest_issue" value={form.biggest_issue} onChange={set} className={`${inputCls("biggest_issue")} cursor-pointer`} {...focusProps("biggest_issue")}>
            <option value="">Select one...</option>
            <option value="Slow response time">Slow response time</option>
            <option value="Missed calls not being followed up">Missed calls not followed up</option>
            <option value="No follow-up system">No follow-up system</option>
            <option value="Low booking conversions">Low booking conversions</option>
          </select>
        </motion.div>
        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-400">Please fill in all required fields.</p>
        )}
        <motion.button
          type="submit"
          className="relative w-full h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-blue-100 transition hover:opacity-90 overflow-hidden"
          style={{ background: "linear-gradient(135deg,#005B99 0%,#0077B6 40%,#005B99 100%)" }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="cinematic-pulse-rings" aria-hidden="true" />
          Next: Choose Time <ArrowRight className="w-4 h-4" />
        </motion.button>
        <p className="text-center text-xs text-white/60">No spam. No pressure. Just a tailored walkthrough of your business.</p>
      </motion.form>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {errors.scheduling && <p className="text-xs text-red-400">{errors.scheduling}</p>}
      {errors.submit && <p className="text-xs text-red-400">{errors.submit}</p>}
      <motion.div {...fieldMotion("date")}>
        <label className="block text-xs font-semibold text-white/60 mb-1">Select Date *</label>
        <input
          type="date"
          value={scheduling.date}
          min={new Date().toISOString().split("T")[0]}
          onChange={handleDateChange}
          className={inputCls("scheduling")}
          {...focusProps("date")}
        />
      </motion.div>
      <motion.div {...fieldMotion("time")}>
        <label className="block text-xs font-semibold text-white/60 mb-1">
          Select Time * {loadingSlots && <span className="font-normal text-white/30 ml-1">Loading...</span>}
        </label>
        <select
          value={scheduling.time}
          onChange={(e) => setScheduling((s) => ({ ...s, time: e.target.value }))}
          disabled={!scheduling.date || loadingSlots}
          className={`${inputCls("scheduling")} disabled:opacity-40 cursor-pointer`}
          {...focusProps("time")}
        >
          <option value="">{!scheduling.date ? "Select a date first..." : "Choose a time..."}</option>
          {TIME_SLOTS.map(({ value, label }) => {
            const booked = bookedSlots.includes(value);
            return <option key={value} value={value} disabled={booked}>{label}{booked ? " - Booked" : ""}</option>;
          })}
        </select>
      </motion.div>
      <div className="flex gap-3">
        <button type="button" onClick={() => { setStep(1); setErrors({}); }} className="flex-1 h-11 rounded-full border border-white/10 text-white/60 font-semibold hover:bg-white/5 transition">
          Back
        </button>
        <motion.button
          type="submit"
          disabled={saving}
          className="relative flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-blue-100 transition hover:opacity-90 disabled:opacity-50 overflow-hidden"
          style={{ background: "linear-gradient(135deg,#005B99 0%,#0077B6 40%,#005B99 100%)" }}
          whileHover={{ scale: saving ? 1 : 1.015 }}
          whileTap={{ scale: saving ? 1 : 0.98 }}
        >
          <span className="cinematic-pulse-rings" aria-hidden="true" />
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</> : <>Schedule Demo <ArrowRight className="w-4 h-4" /></>}
        </motion.button>
      </div>
      <p className="text-center text-xs text-white/60">No spam. No pressure. Just a tailored walkthrough of your business.</p>
    </motion.form>
  );
}



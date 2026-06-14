import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Phone, Globe, Clock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  { id: 1, label: "Business Essentials", icon: ShieldCheck },
  { id: 2, label: "Contact Details", icon: Phone },
  { id: 3, label: "Availability", icon: Clock },
];

export default function EssentialSetupFlow({ projectId, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    business_phone: "",
    business_website: "",
    after_hours_behavior: "send_after_hours_sms",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.business_phone.trim()) {
        setError("Business phone number is required.");
        return false;
      }
      if (!formData.business_website.trim()) {
        setError("Business website is required.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      await base44.functions.invoke("saveQuickStartConfig", {
        project_id: projectId,
        config: {
          twilio_business_phone: formData.business_phone,
          business_website: formData.business_website,
          after_hours_behavior: formData.after_hours_behavior,
        },
      });
      onComplete?.();
    } catch (err) {
      setError(err?.data?.error || err.message || "Failed to save configuration");
      setLoading(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header with gradient */}
        <div style={{ background: "linear-gradient(135deg, #003B8F 0%, #00AEEF 100%)" }} className="px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-blue-200/80 uppercase tracking-widest">Setup Complete Fast</p>
              <h2 className="text-white font-bold text-2xl mt-2">Essential Business Info</h2>
              <p className="text-blue-100/70 text-sm mt-1">Just 3 quick fields to get started</p>
            </div>
            <ShieldCheck className="w-12 h-12 text-blue-200/60 flex-shrink-0" />
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-300 to-white rounded-full"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8">
            <div className="flex gap-2 justify-between">
              {STEPS.map((s, idx) => {
                const isActive = s.id === step;
                const isDone = s.id < step;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="flex flex-col items-center flex-1">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isDone ? "#22c55e" : isActive ? "#00AEEF" : "#f3f4f6",
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                    >
                      {isDone ? (
                        <span className="text-white font-bold">✓</span>
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                      )}
                    </motion.div>
                    <span className={`text-xs font-semibold text-center ${isActive ? "text-primary" : isDone ? "text-green-600" : "text-gray-400"}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 min-h-48"
          >
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Business Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-primary/40" />
                    <input
                      type="tel"
                      value={formData.business_phone}
                      onChange={e => handleInputChange("business_phone", e.target.value)}
                      placeholder="(602) 555-0100"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/20 bg-primary/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Used for SMS and inbound call handling</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Business Website *</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3.5 w-5 h-5 text-primary/40" />
                    <input
                      type="url"
                      value={formData.business_website}
                      onChange={e => handleInputChange("business_website", e.target.value)}
                      placeholder="https://yourbusiness.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary/20 bg-primary/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">For lead verification and context</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">How should we handle messages outside your business hours?</p>
                <div className="space-y-3">
                  {[
                    { value: "send_after_hours_sms", label: "Send SMS immediately", desc: "Leads get a response text right away" },
                    { value: "hold_until_open", label: "Hold until business hours", desc: "Messages queue and send when you open" },
                  ].map(opt => (
                    <label key={opt.value} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.after_hours_behavior === opt.value
                        ? "border-primary bg-primary/8"
                        : "border-border hover:border-primary/30"
                    }`}>
                      <input
                        type="radio"
                        name="after_hours"
                        value={opt.value}
                        checked={formData.after_hours_behavior === opt.value}
                        onChange={e => handleInputChange("after_hours_behavior", e.target.value)}
                        className="w-4 h-4"
                      />
                      <p className="font-medium text-foreground mt-2">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-lg font-bold text-foreground">Ready to Launch!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your essential configuration is complete. The implementation team will handle the rest during setup.
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <p className="text-xs text-blue-900">
                    <span className="font-semibold">💡 Next:</span> You'll receive setup confirmation and timeline via email.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="px-5 py-2 rounded-lg border border-border text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {step < STEPS.length ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #00AEEF, #003B8F)" }}
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup 🚀
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
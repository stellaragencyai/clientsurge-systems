import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";

const INDUSTRIES = [
  { id: "med_spa", name: "Med Spa & Aesthetic Clinics", icon: "✨" },
  { id: "dental", name: "Dental & Orthodontics", icon: "🦷" },
  { id: "hvac", name: "HVAC & Home Services", icon: "🔧" },
  { id: "chiropractic", name: "Chiropractic & Physical Therapy", icon: "💆" },
  { id: "roofing", name: "Roofing & Contractors", icon: "🏠" },
  { id: "contractors", name: "General Contractors", icon: "🏗️" },
];

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

const PACKAGE_MODE_MAP = {
  starter_system: "instant_response",
  growth_system: "instant_plus_nurture",
  elite_system: "full_automation",
};

const MODES = PACKAGE_OFFERS.map((offer) => ({
  id: PACKAGE_MODE_MAP[offer.package_key] || "full_automation",
  packageKey: offer.package_key,
  name: offer.name,
  price: `${formatMoney(offer.monthly_total)}/mo`,
  setup: formatMoney(offer.setup_total),
  description: offer.description,
  features: offer.included_services.map((service) => service.name),
  best_for: offer.fit,
  recommended: Boolean(offer.highlight),
}));

export default function QuickSetupWizard({ projectId, onComplete }) {
  const [step, setStep] = useState(1); // 1: Industry, 2: Mode, 3: Review, 4: Complete
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (step === 1 && !selectedIndustry) {
      setError("Please select an industry");
      return;
    }
    if (step === 2 && !selectedMode) {
      setError("Please select a mode");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");
    try {
      // Initialize business config with selected options
      const result = await base44.functions.invoke("initializeBusinessConfig", {
        project_id: projectId,
        industry: selectedIndustry,
        mode: selectedMode,
      });

      if (result.data?.success) {
        setStep(4);
        if (onComplete) {
          setTimeout(() => onComplete(), 1500);
        }
      } else {
        setError(result.data?.error || "Setup failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Industry Selection
  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Select Your Industry
          </h2>
          <p className="text-muted-foreground">
            We'll pre-configure everything for your business type
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {INDUSTRIES.map((industry) => (
            <button
              key={industry.id}
              onClick={() => {
                setSelectedIndustry(industry.id);
                setError("");
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedIndustry === industry.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <span className="text-3xl mb-2 block">{industry.icon}</span>
              <h3 className="font-semibold text-foreground">{industry.name}</h3>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <div></div>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
          >
            Next: Choose Mode
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: Mode Selection
  if (step === 2) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Choose Your Mode
          </h2>
          <p className="text-muted-foreground">
            Start simple and upgrade anytime
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode.id);
                setError("");
              }}
              className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                selectedMode === mode.id
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              {mode.recommended && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}

              <h3 className="font-bold text-lg text-foreground mb-2">
                {mode.name}
              </h3>

              <div className="mb-4">
                <p className="text-2xl font-bold text-foreground">{mode.price}</p>
                <p className="text-xs text-muted-foreground">
                  Setup: {mode.setup}
                </p>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {mode.description}
              </p>

              <ul className="space-y-2 mb-4">
                {mode.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs font-semibold text-primary">
                {mode.best_for}
              </p>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-2 border border-border rounded-lg font-semibold hover:bg-muted"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
          >
            Review Setup
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // STEP 3: Review
  if (step === 3) {
    const industry = INDUSTRIES.find((i) => i.id === selectedIndustry);
    const mode = MODES.find((m) => m.id === selectedMode);

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Review Your Setup
          </h2>
          <p className="text-muted-foreground">
            Everything looks good? Let's go live!
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6 mb-8">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="font-semibold text-foreground mb-3">Industry</h3>
            <p className="text-lg">
              {industry?.icon} {industry?.name}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="font-semibold text-foreground mb-3">Mode</h3>
            <p className="text-lg font-semibold text-foreground">{mode?.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {mode?.description}
            </p>
            <p className="text-lg font-bold text-primary mt-3">{mode?.price}</p>
            <p className="text-xs text-muted-foreground">
              Setup: {mode?.setup}
            </p>
          </div>

          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-3">
              ✅ What's Included
            </h3>
            <ul className="space-y-2">
              {mode?.features.map((feature) => (
                <li key={feature} className="text-sm text-green-800 flex gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-2 border border-border rounded-lg font-semibold hover:bg-muted"
          >
            Back
          </button>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Setting up..." : "Complete Setup"}
          </button>
        </div>
      </div>
    );
  }

  // STEP 4: Complete
  if (step === 4) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="mb-8">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">
            You're All Set! 🎉
          </h2>
          <p className="text-muted-foreground">
            Your automation system is live and ready to capture leads
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-green-900 mb-4">What's Running</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Lead scoring & qualification
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Instant response automation
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Intelligent team routing
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Real-time metrics & alerts
            </li>
          </ul>
        </div>

        <button
          onClick={() => onComplete?.()}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          View Your Dashboard →
        </button>
      </div>
    );
  }
}

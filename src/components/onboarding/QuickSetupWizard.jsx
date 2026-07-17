import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Rocket,
  Sparkles,
} from "lucide-react";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";

const INDUSTRIES = [
  { id: "med_spa", name: "Med Spa & Aesthetic Clinics", description: "Consultations, treatments and follow-up", glyph: "MS" },
  { id: "dental", name: "Dental & Orthodontics", description: "New-patient intake and appointment flow", glyph: "DE" },
  { id: "hvac", name: "HVAC & Home Services", description: "Urgent calls, estimates and dispatch", glyph: "HV" },
  { id: "chiropractic", name: "Chiropractic & Physical Therapy", description: "Patient qualification and booking", glyph: "CH" },
  { id: "roofing", name: "Roofing & Contractors", description: "Inspection requests and estimate follow-up", glyph: "RO" },
  { id: "contractors", name: "General Contractors", description: "Project inquiries and lead routing", glyph: "GC" },
];

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

const PACKAGE_MODE_MAP = {
  starter_system: "instant_response",
  growth_system: "instant_plus_nurture",
  pro_system: "full_automation",
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

const STEPS = ["Industry", "System", "Review"];

function Progress({ step }) {
  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-3">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const active = step === number;
          const complete = step > number;
          return (
            <div key={label} className="relative">
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black transition-all ${
                  complete
                    ? "border-cyan-300 bg-cyan-300 text-[#06132c]"
                    : active
                      ? "border-cyan-300 bg-cyan-300/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.26)]"
                      : "border-white/15 bg-white/5 text-white/45"
                }`}>
                  {complete ? <Check className="h-4 w-4" /> : number}
                </span>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${active || complete ? "text-cyan-200" : "text-white/35"}`}>
                    Step {number}
                  </p>
                  <p className={`text-sm font-bold ${active || complete ? "text-white" : "text-white/45"}`}>{label}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="absolute left-[calc(100%-10px)] top-4 hidden h-px w-[calc(100%-2.5rem)] bg-white/10 lg:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-6 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100">
      {message}
    </div>
  );
}

export default function QuickSetupWizard({ projectId, onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const industry = useMemo(() => INDUSTRIES.find((item) => item.id === selectedIndustry), [selectedIndustry]);
  const mode = useMemo(() => MODES.find((item) => item.id === selectedMode), [selectedMode]);

  const handleNext = () => {
    if (step === 1 && !selectedIndustry) {
      setError("Select the industry that most closely matches your business.");
      return;
    }
    if (step === 2 && !selectedMode) {
      setError("Select the system configuration you want to activate.");
      return;
    }
    setError("");
    setStep((current) => current + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await base44.functions.invoke("initializeBusinessConfig", {
        project_id: projectId,
        industry: selectedIndustry,
        mode: selectedMode,
      });

      if (result.data?.success) {
        setStep(4);
        if (onComplete) setTimeout(() => onComplete(), 1500);
      } else {
        setError(result.data?.error || "We could not initialize your setup.");
      }
    } catch (err) {
      setError(err?.message || "We could not initialize your setup.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-12">
        <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#07162f] shadow-[0_30px_90px_rgba(2,12,30,0.35)]">
          <div className="relative px-6 py-12 text-center sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_44%)]" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_42px_rgba(34,211,238,0.24)]">
                <Rocket className="h-8 w-8" />
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Configuration submitted</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Your ClientSurge system is being prepared.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Your configuration has been saved. We are returning you to the portal where you can track verification, installation and launch readiness.
              </p>
              <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                {["Business profile configured", "Automation mode selected", "Project records updated", "Portal status ready"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/85">
                    <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={() => onComplete?.()}
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 text-sm font-black text-[#06132c] shadow-[0_12px_34px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto"
              >
                Open setup progress <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-12">
      <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.14)] lg:grid-cols-[0.38fr_0.62fr]">
        <aside className="relative overflow-hidden bg-[#07162f] p-6 text-white sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_100%_90%,rgba(14,116,144,0.2),transparent_40%)]" />
          <div className="relative flex h-full flex-col">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" /> Client activation
            </div>
            <h1 className="mt-6 text-3xl font-black leading-[1.05] tracking-[-0.045em] sm:text-4xl">
              Configure the system around your business.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              We use these selections to determine the recommended automation routing, messaging patterns and operational setup for your project.
            </p>
            <div className="mt-8">
              <Progress step={step} />
            </div>
            <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Saved to your project</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Selections are committed only after final review. Existing paid-order setup is never modified here.</p>
            </div>
          </div>
        </aside>

        <section className="p-6 sm:p-8 lg:p-10">
          {step === 1 && (
            <>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Business profile</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">What type of business are we configuring?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Choose the closest match. This controls the starting automation playbook and can be refined later.</p>
              <ErrorBanner message={error} />
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {INDUSTRIES.map((item) => {
                  const selected = selectedIndustry === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setSelectedIndustry(item.id); setError(""); }}
                      className={`group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${selected ? "border-cyan-400 bg-cyan-50 shadow-[0_12px_30px_rgba(6,182,212,0.12)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg"}`}
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${selected ? "bg-cyan-500 text-white" : "bg-slate-950 text-cyan-200"}`}>{item.glyph}</span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-black text-slate-950">{item.name}{selected && <CheckCircle2 className="h-4 w-4 text-cyan-600" />}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Automation system</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Choose the operating mode.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Select the configuration that matches the package and operating depth you want for this project.</p>
              <ErrorBanner message={error} />
              <div className="mt-7 grid gap-4 xl:grid-cols-3">
                {MODES.map((item) => {
                  const selected = selectedMode === item.id;
                  return (
                    <button
                      key={item.packageKey}
                      type="button"
                      onClick={() => { setSelectedMode(item.id); setError(""); }}
                      className={`relative rounded-2xl border p-5 text-left transition-all ${selected ? "border-cyan-400 bg-cyan-50 shadow-[0_14px_34px_rgba(6,182,212,0.14)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg"}`}
                    >
                      {item.recommended && <span className="absolute right-4 top-4 rounded-full bg-slate-950 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">Recommended</span>}
                      <p className="pr-20 text-base font-black text-slate-950">{item.name}</p>
                      <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{item.price}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{item.setup} setup</p>
                      <p className="mt-4 text-xs leading-6 text-slate-500">{item.description}</p>
                      <div className="mt-5 space-y-2.5">
                        {item.features.slice(0, 4).map((feature) => (
                          <div key={feature} className="flex gap-2 text-xs font-semibold leading-5 text-slate-700"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />{feature}</div>
                        ))}
                      </div>
                      <p className="mt-5 border-t border-slate-200 pt-4 text-[11px] font-bold leading-5 text-cyan-700">{item.best_for}</p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Final verification</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Review before activation.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Confirm the configuration below. No changes are submitted until you activate the setup.</p>
              <ErrorBanner message={error} />
              <div className="mt-7 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Industry profile</p>
                  <div className="mt-3 flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-cyan-200">{industry?.glyph}</span>
                    <div><p className="font-black text-slate-950">{industry?.name}</p><p className="mt-1 text-xs text-slate-500">{industry?.description}</p></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Selected system</p><p className="mt-2 text-xl font-black text-slate-950">{mode?.name}</p><p className="mt-2 max-w-xl text-xs leading-6 text-slate-500">{mode?.description}</p></div>
                    <div className="text-left sm:text-right"><p className="text-2xl font-black text-slate-950">{mode?.price}</p><p className="text-xs font-semibold text-slate-400">{mode?.setup} setup</p></div>
                  </div>
                  <div className="mt-5 grid gap-2 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    {mode?.features.map((feature) => <div key={feature} className="flex gap-2 text-xs font-semibold text-slate-700"><Check className="h-3.5 w-3.5 shrink-0 text-cyan-600" />{feature}</div>)}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => { setError(""); setStep((current) => Math.max(1, current - 1)); }}
              disabled={step === 1 || loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={step === 3 ? handleComplete : handleNext}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-black text-[#06132c] shadow-[0_10px_28px_rgba(34,211,238,0.3)] transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Activating...</> : step === 3 ? <>Activate setup <Rocket className="h-4 w-4" /></> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

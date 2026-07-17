import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export default function CSWizardShell({
  title,
  subtitle,
  steps = [],
  currentStep = 0,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  loading = false,
  complete = false,
}) {
  const progress = steps.length ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-[#0A1628] via-[#003B8F] to-[#00AEEF] px-6 py-6 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80">
            ClientSurge Activation
          </p>
          <h1 className="mt-2 text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-blue-100">{subtitle}</p>}
        </div>
      </header>

      <div className="h-1 bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-[#00AEEF] to-[#003B8F] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {steps.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = index === currentStep;
              const completeStep = index < currentStep;

              return (
                <div
                  key={step.id || index}
                  className={`rounded-2xl border p-4 transition-all ${
                    active
                      ? "border-cyan-400 bg-white shadow-md"
                      : completeStep
                        ? "border-cyan-100 bg-cyan-50"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  {Icon && <Icon className="mb-2 h-5 w-5 text-[#00AEEF]" />}
                  <p className="text-xs font-bold text-slate-900">{step.title}</p>
                  {step.desc && <p className="mt-1 text-xs text-slate-500">{step.desc}</p>}
                </div>
              );
            })}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {children}
        </section>

        {!complete && (
          <div className="mt-6 flex justify-between gap-4">
            <button
              onClick={onBack}
              disabled={!onBack || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </button>

            <button
              onClick={onNext}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00AEEF] to-[#003B8F] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {nextLabel}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

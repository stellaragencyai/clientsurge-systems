const STEPS = [
  { id: "compare", number: "1", label: "Compare", detail: "Choose System" },
  { id: "review", number: "2", label: "Review", detail: "Package Fit" },
  { id: "checkout", number: "3", label: "Checkout", detail: "Secure Stripe" },
  { id: "intake", number: "4", label: "Setup", detail: "Guided Intake" },
];

export default function CheckoutProgress({ currentStep = "compare", className = "" }) {
  const activeIndex = Math.max(0, STEPS.findIndex((step) => step.id === currentStep));

  return (
    <div className={`mx-auto w-full max-w-5xl px-6 ${className}`} aria-label="Checkout progress">
      <div className="rounded-2xl border border-primary/15 bg-white/90 p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {STEPS.map((step, index) => {
            const state = index < activeIndex ? "complete" : index === activeIndex ? "active" : "upcoming";
            return (
              <div
                key={step.id}
                className={`rounded-xl border px-3 py-3 transition ${
                  state === "active"
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : state === "complete"
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                      state === "active"
                        ? "bg-white text-primary"
                        : state === "complete"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-muted-foreground"
                    }`}
                  >
                    {state === "complete" ? "✓" : step.number}
                  </span>
                  <div>
                    <p className="text-sm font-black leading-tight">{step.label}</p>
                    <p className={`text-[11px] font-semibold leading-tight ${state === "active" ? "text-white/80" : "text-muted-foreground"}`}>
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

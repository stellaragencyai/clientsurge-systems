import { Calculator, PhoneMissed, TrendingUp } from "lucide-react";

const scenarios = [
  {
    title: "Miss 3 leads a week",
    value: "$3,600/mo",
    detail: "At an average consultation value of $300, even a few missed opportunities add up fast.",
    icon: PhoneMissed,
  },
  {
    title: "Recover 1 extra booking a week",
    value: "$1,200+/mo",
    detail: "A small lift in response speed and follow-up can easily cover the system cost.",
    icon: TrendingUp,
  },
  {
    title: "Improve conversion consistency",
    value: "Less admin drag",
    detail: "The ROI is not only revenue. It is also fewer manual follow-up tasks for your front desk.",
    icon: Calculator,
  },
];

export default function MedSpaROIBlock() {
  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Recovered Revenue</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Small follow-up improvements create meaningful monthly lift
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Med spas do not need huge lead volume for automation to pay off. They need fewer missed opportunities.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon;
            return (
              <div key={scenario.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground/75 mb-2">{scenario.title}</p>
                <p className="font-display text-3xl font-semibold text-foreground mb-3">{scenario.value}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{scenario.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

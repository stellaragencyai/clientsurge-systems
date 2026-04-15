import { X, CheckCircle2 } from "lucide-react";

const comparisons = [
  {
    problem: "Lead submits a form at 9pm — no one sees it until morning",
    solution: "Instant personalized reply sent within 90 seconds, 24/7",
  },
  {
    problem: "Missed call → voicemail → lead books with competitor",
    solution: "Missed call triggers instant text-back, lead stays warm",
  },
  {
    problem: "Front desk manually chases leads between appointments",
    solution: "Automated follow-up runs for 14 days without any manual work",
  },
  {
    problem: "Old leads from last year sitting untouched in a spreadsheet",
    solution: "Reactivation campaign re-engages them with the right message",
  },
  {
    problem: "High no-show rate for consultations draining the calendar",
    solution: "Automated reminders at 24h and 1h — avg. 34% fewer no-shows",
  },
  {
    problem: "Booking requires back-and-forth emails or calls",
    solution: "Direct booking link sent at exactly the right moment",
  },
];

export default function MedSpaBeforeAfter() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Difference</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Without ApexFlow vs. With ApexFlow
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            The same leads. Completely different outcomes.
          </p>
        </div>

        {/* Column headers */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-destructive/8 border border-destructive/20">
            <X className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm font-bold text-destructive">Without ApexFlow</p>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-bold text-green-700">With ApexFlow</p>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {comparisons.map((item, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-5 bg-destructive/4 border border-destructive/12 rounded-xl hover:border-destructive/25 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/12 flex items-center justify-center mt-0.5">
                  <X className="w-3 h-3 text-destructive" />
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed">{item.problem}</p>
              </div>
              <div className="flex items-start gap-3 p-5 bg-green-50/60 border border-green-200/70 rounded-xl hover:border-green-300 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-sm font-medium text-foreground/85 leading-relaxed">{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
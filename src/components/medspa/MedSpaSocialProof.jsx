import { Star, CheckCircle2 } from "lucide-react";

const testimonials = [
  { name: "Sarah M.", clinic: "Glow Med Spa", text: "We're booking 3x more appointments since launch. Best investment we've made.", rating: 5 },
  { name: "James P.", clinic: "Elite Aesthetics", text: "Our front desk loves this. No more missed leads.", rating: 5 },
  { name: "Diana L.", clinic: "Zen Wellness", text: "Recovered $8k in old leads within the first month.", rating: 5 },
];

const metrics = [
  { label: "Med Spas Using System", value: "250+" },
  { label: "Avg Booking Increase", value: "2–3x" },
  { label: "ROI Timeline", value: "14–30 days" },
];

export default function MedSpaSocialProof() {
  return (
    <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-white to-primary/2">
      <div className="max-w-5xl mx-auto">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-6 md:gap-12 mb-16">
          {metrics.map((m, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-2xl md:text-3xl font-semibold text-primary mb-2">{m.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground/80 mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.clinic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
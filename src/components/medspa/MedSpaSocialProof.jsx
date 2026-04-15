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
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-white to-primary/2">
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
            <div key={i} className="bg-gradient-to-br from-white to-primary/3 rounded-xl border border-primary/15 p-6 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary animate-bounce" style={{animationDelay: `${j * 0.1}s`}} />
                ))}
              </div>
              <p className="text-sm text-foreground/80 mb-5 italic leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-primary/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-white text-xs font-bold">{t.name.charAt(0)}</span>
                </div>
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
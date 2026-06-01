import { Star } from "lucide-react";

const testimonials = [
  { name: "Consultation flow", clinic: "Phoenix, AZ", text: "Example workflow: a missed inquiry gets captured, answered, and routed toward a consult.", rating: 5 },
  { name: "Front-desk support", clinic: "Scottsdale, AZ", text: "Example workflow: repetitive follow-up runs automatically while sensitive questions stay human-reviewed.", rating: 5 },
  { name: "Reactivation path", clinic: "Gilbert, AZ", text: "Example workflow: older inquiries receive a respectful check-in with clear stop conditions.", rating: 5 },
];

const metrics = [
  { label: "Built for med spas and aesthetic clinics", value: "Niche" },
  { label: "Lead paths covered", value: "6" },
  { label: "Proof needed before live claims", value: "Provider QA" },
];

export default function MedSpaSocialProof() {
  return (
    <section className="py-24 md:py-32 px-6 bg-muted">
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
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
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

import { useDemoBooking } from "./DemoBookingContext";
import StardustOverlay from "./StardustOverlay";

const testimonials = [
  {
    name: "Jessica M.",
    businessType: "Med Spa",
    location: "Miami, FL",
    before: "Booking 2 consults/week from online leads",
    after: "10+ consults/week",
    result: "5x booking increase",
    quote: "The system just runs. I do not have to touch it.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=65&auto=format",
  },
  {
    name: "Carlos R.",
    businessType: "HVAC Contractor",
    location: "Phoenix, AZ",
    before: "$4k/month ad spend with low conversion",
    after: "Close rate doubled",
    result: "ROI in under 7 days",
    quote: "It paid for itself in the first week.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=65&auto=format",
  },
  {
    name: "Amanda T.",
    businessType: "Dental & Orthodontics",
    location: "Austin, TX",
    before: "Manual follow-up draining team time",
    after: "Consult requests answered same day",
    result: "Team freed for growth",
    quote: "Our front desk has breathing room again, and consults are getting booked faster.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=65&auto=format",
  },
];

export default function Testimonials() {
  const demoBooking = useDemoBooking();
  return (
    <section id="testimonials" className="nebula-testimonials py-24 md:py-32 px-6 relative overflow-hidden">
      <StardustOverlay seed={21} opacity={0.4} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Proven Results</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Real Results From Businesses Using Our System
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(135deg, rgba(255,252,247,0.72) 0%, rgba(252,240,220,0.55) 100%)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1.5px solid rgba(200,150,92,0.22)",
                boxShadow: "0 4px 24px rgba(154,92,46,0.07), inset 0 1px 0 rgba(255,255,255,0.75)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1.5px solid rgba(200,150,92,0.5)";
                e.currentTarget.style.boxShadow = "0 18px 48px rgba(154,92,46,0.16), 0 0 0 1px rgba(200,150,92,0.18), inset 0 1px 0 rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "1.5px solid rgba(200,150,92,0.22)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(154,92,46,0.07), inset 0 1px 0 rgba(255,255,255,0.75)";
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex text-xs font-semibold text-primary/90 bg-primary/10 px-3 py-1 rounded-full">
                  {testimonial.businessType}
                </span>
                <span className="text-xs text-muted-foreground">{testimonial.location}</span>
              </div>

              <div className="mb-5 space-y-3 pb-5 border-b border-border/80">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Before</p>
                  <p className="text-sm text-foreground/70">{testimonial.before}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">After</p>
                  <p className="text-sm font-semibold text-foreground">{testimonial.after}</p>
                </div>
              </div>

              <div className="mb-5 mt-5">
                <span className="inline-flex items-center text-sm font-bold text-white px-4 py-2 rounded-full bg-gradient-to-r from-amber-800 to-amber-700">
                  {testimonial.result}
                </span>
              </div>

              <p className="text-sm text-foreground/75 leading-relaxed flex-1 mb-6">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={`${testimonial.name}, ${testimonial.businessType} client testimonial`}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.businessType} client</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-16 pt-10 border-t border-border">
          <p className="text-lg font-semibold text-foreground mb-4">
            Want results like this for your business?
          </p>
          {demoBooking ? (
            <button
              type="button"
              onClick={demoBooking.openDemoBooking}
              className="inline-flex items-center justify-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Book Your Free Demo
            </button>
          ) : (
            <a
              href="/book"
              className="inline-flex items-center justify-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Book Your Free Demo
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
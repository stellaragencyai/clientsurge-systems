import { useState } from "react";
import MedSpaDemoModal from "./MedSpaDemoModal";

const testimonials = [
  {
    name: "Jessica M.",
    businessType: "Med Spa",
    location: "Phoenix, AZ",
    before: "Missing 60% of after-hours inquiries",
    after: "10+ consultations booked/week",
    result: "5× booking increase",
    quote: "We went from missing leads to booking consultations same-day. The system just runs.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=65&auto=format",
  },
  {
    name: "Sarah K.",
    businessType: "Aesthetic Clinic",
    location: "Scottsdale, AZ",
    before: "Front desk overwhelmed, leads slipping",
    after: "Fully automated follow-up",
    result: "Zero leads dropped",
    quote: "Our front desk was overwhelmed. Now follow-up is fully automated and nothing slips through.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=65&auto=format",
  },
  {
    name: "Amanda T.",
    businessType: "Wellness Studio",
    location: "Gilbert, AZ",
    before: "Spending on ads, not converting",
    after: "ROI recovered in first month",
    result: "Paid for itself in 30 days",
    quote: "Paid for itself in the first month. Recovered revenue we thought was gone.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=65&auto=format",
  },
];

export default function MedSpaTestimonials() {
  const [showModal, setShowModal] = useState(false);

  return (
    <section className="py-24 md:py-32 px-6 bg-muted">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Proven Results</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Real Results From Med Spas Using Our System
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group relative flex flex-col p-8 rounded-2xl backdrop-blur-md transition-all duration-500 cursor-default"
              style={{
                background: "rgba(255, 255, 255, 0.75)",
                border: "1px solid rgba(154,92,46,0.25)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
                transition: "all 0.4s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
                e.currentTarget.style.border = "1px solid rgba(200,150,92,0.6)";
                e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 40px rgba(200, 150, 92, 0.15)";
                e.currentTarget.style.transform = "translateY(-8px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.75)";
                e.currentTarget.style.border = "1px solid rgba(154,92,46,0.25)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Business Type Badge */}
              <div className="mb-4">
                <span className="inline-block text-xs font-bold text-foreground/60 bg-foreground/5 px-3 py-1 rounded-full">
                  {t.businessType} — {t.location}
                </span>
              </div>

              {/* Star Rating */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#c8965c", fontSize: "14px" }}>★</span>
                ))}
              </div>

              {/* Before/After */}
              <div className="mb-6 space-y-3 pb-6 border-b border-primary/10">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Before</p>
                  <p className="text-sm text-foreground/70">{t.before}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">After</p>
                  <p className="text-sm font-semibold text-foreground">{t.after}</p>
                </div>
              </div>

              {/* Result Highlight */}
              <div className="mb-6">
                <span className="inline-block text-sm font-bold text-white px-4 py-2 rounded-full" style={{background: "linear-gradient(135deg, #9a5c2e 0%, #7a4825 100%)"}}>
                  {t.result}
                </span>
              </div>

              {/* Quote */}
              <p className="text-sm text-foreground/75 leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 pt-12 border-t border-border">
          <p className="text-lg font-semibold text-foreground mb-6">
            Want results like this for your med spa?
          </p>
          <button onClick={() => setShowModal(true)} style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.5s ease, transform 0.3s ease",border:"none",cursor:"pointer"}} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
          }}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book a Demo
            </span>
          </button>
          {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
        </div>
      </div>
    </section>
  );
}
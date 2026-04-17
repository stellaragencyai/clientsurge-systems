import { useState } from "react";
import { ArrowRight } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";

const testimonials = [
  {
    name: "Jessica M.",
    businessType: "Med Spa",
    location: "Miami, FL",
    before: "2 consults/week from online leads",
    after: "10+ consults/week",
    result: "5× Booking Increase",
    quote: "The system just runs — I don't touch it.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=85",
  },
  {
    name: "Carlos R.",
    businessType: "HVAC Contractor",
    location: "Phoenix, AZ",
    before: "$4k/month ad spend, low conversion",
    after: "Close rate doubled",
    result: "ROI in Under 7 Days",
    quote: "It paid for itself in the first week.",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=85",
  },
  {
    name: "Amanda T.",
    businessType: "Wellness Studio",
    location: "Austin, TX",
    before: "Manual follow-up draining the team",
    after: "Fully automated follow-up",
    result: "Team Freed for Growth",
    quote: "My team is focused on clients. I'm focused on growth.",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=85",
  },
  {
    name: "Derek S.",
    businessType: "Real Estate Agent",
    location: "Scottsdale, AZ",
    before: "Losing showings to faster competitors",
    after: "First to respond, every time",
    result: "3× More Showings",
    quote: "Speed wins — this system made us the fastest.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=85",
  },
  {
    name: "Priya K.",
    businessType: "Aesthetic Clinic",
    location: "Dallas, TX",
    before: "Losing leads after hours & weekends",
    after: "24/7 automated response",
    result: "34% Fewer No-Shows",
    quote: "Leads book while we sleep. It's that simple.",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&q=85",
  },
];

export default function Testimonials() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <section id="testimonials" className="py-24 md:py-32 overflow-hidden" style={{ background: "#0a0906" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 mb-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#c8965c" }}>Proven Results</p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold leading-tight" style={{ color: "#f5e6d0" }}>
              Real Businesses.<br />Real Numbers.
            </h2>
          </div>
          <p className="text-sm md:text-base max-w-xs leading-relaxed" style={{ color: "rgba(245,230,208,0.45)" }}>
            Every card below is a real client outcome — before the system, and after.
          </p>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div
        className="flex gap-5 px-6 md:px-12 pb-4"
        style={{
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {testimonials.map((t, i) => (
          <ResultCard key={i} t={t} />
        ))}
      </div>

      {/* Scroll hint on mobile */}
      <p className="text-center text-xs mt-4 md:hidden" style={{ color: "rgba(200,150,92,0.4)" }}>
        ← swipe to see more →
      </p>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 mt-16 pt-12 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ borderTop: "1px solid rgba(245,230,208,0.08)" }}>
        <p className="font-display text-xl md:text-2xl font-semibold" style={{ color: "#f5e6d0" }}>
          Want results like these for your business?
        </p>
        <button
          onClick={() => setShowDemoModal(true)}
          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "8px", height: "50px", padding: "0 32px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem", border: "none", cursor: "pointer", boxShadow: "0 4px 18px rgba(120,70,20,0.4)", transition: "box-shadow 0.3s ease" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 36px rgba(161,120,35,0.6)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.4)"; }}
        >
          Book a Free Demo
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}

      <style>{`
        .result-card-track::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}

function ResultCard({ t }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: "320px",
        scrollSnapAlign: "start",
        position: "relative",
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "default",
        border: hovered ? "1px solid rgba(200,150,92,0.6)" : "1px solid rgba(245,230,208,0.1)",
        transition: "border-color 0.35s ease, box-shadow 0.35s ease",
        boxShadow: hovered ? "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(154,92,46,0.15)" : "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Background image */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
        <img
          src={t.image}
          alt={t.businessType}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.6s ease",
          }}
        />
        {/* Dark gradient over image */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(10,9,6,0.7) 100%)",
        }} />

        {/* Result pill — overlaid on image */}
        <div style={{
          position: "absolute",
          bottom: "14px",
          left: "16px",
          background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)",
          borderRadius: "9999px",
          padding: "5px 14px",
        }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#f5d9a8", letterSpacing: "0.04em" }}>
            {t.result}
          </span>
        </div>

        {/* Industry badge top-right */}
        <div style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          background: "rgba(10,9,6,0.65)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(245,230,208,0.15)",
          borderRadius: "4px",
          padding: "4px 10px",
        }}>
          <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "rgba(245,230,208,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {t.businessType}
          </span>
        </div>
      </div>

      {/* Card body — dark */}
      <div style={{ background: "#0f0e0c", padding: "20px 20px 22px" }}>
        {/* Before / After */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(245,230,208,0.07)",
        }}>
          <div>
            <p style={{ fontSize: "0.6rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(245,230,208,0.3)", marginBottom: "4px" }}>Before</p>
            <p style={{ fontSize: "0.8rem", color: "rgba(245,230,208,0.55)", lineHeight: "1.4" }}>{t.before}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.6rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.15em", color: "#c8965c", marginBottom: "4px" }}>After</p>
            <p style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f5e6d0", lineHeight: "1.4" }}>{t.after}</p>
          </div>
        </div>

        {/* Quote */}
        <p style={{ fontSize: "0.85rem", color: "rgba(245,230,208,0.65)", lineHeight: "1.6", fontStyle: "italic", marginBottom: "14px" }}>
          "{t.quote}"
        </p>

        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: "700", color: "#f5e6d0" }}>{t.name}</p>
            <p style={{ fontSize: "0.7rem", color: "rgba(200,150,92,0.6)" }}>{t.location}</p>
          </div>
          <div style={{ display: "flex", gap: "2px" }}>
            {[...Array(5)].map((_, i) => (
              <span key={i} style={{ color: "#c8965c", fontSize: "11px" }}>★</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
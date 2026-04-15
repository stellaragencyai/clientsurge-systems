import { useState, useEffect } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import MedSpaDemoModal from "./MedSpaDemoModal";

const TICKER_ITEMS = [
  "Botox inquiry answered in 47 seconds · Miami, FL",
  "Consultation booked from missed call · Scottsdale, AZ",
  "3 filler leads reactivated this morning · Austin, TX",
  "New consultation booked at 11:42pm · Dallas, TX",
  "Follow-up sequence triggered for 8 leads · Chicago, IL",
  "No-show reminder sent · Appointment confirmed · Denver, CO",
];

function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % TICKER_ITEMS.length);
        setVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2.5 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
      <span
        className="text-xs font-medium text-white/90 transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {TICKER_ITEMS[index]}
      </span>
    </div>
  );
}

export default function MedSpaHero() {
  const [showModal, setShowModal] = useState(false);

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (!el) return;
    const start = window.scrollY;
    const target = el.getBoundingClientRect().top + window.scrollY - 64;
    const distance = target - start;
    const duration = 900;
    let startTime = null;
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1920&q=90"
            alt="Luxury med spa treatment"
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.65) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-40 pb-32 md:pt-52 md:pb-40">
          <LiveTicker />

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-white mb-6" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
            Your Med Spa Is Getting Leads.
            <br />
            <span style={{ color: "#f5d9a8" }}>Most of Them Are Being Lost.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed mb-4">
            We build done-for-you automation systems that respond to every inquiry instantly, follow up automatically, and book more consultations — without touching your front desk.
          </p>

          {/* Social proof line */}
          <p className="text-sm font-semibold text-white/55 mb-10">
            Avg. 2.4× more consultations booked · 34% fewer no-shows · Live in 7 days
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={() => setShowModal(true)}
              style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 6px 28px rgba(120,70,20,0.55)", border: "none", cursor: "pointer" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "56px", padding: "0 36px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1.05rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                Book a Free Demo
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={() => scrollTo("#how-it-works-medspa")}
              className="flex items-center gap-2 px-8 h-[56px] rounded-full border border-white/30 text-white font-semibold hover:bg-white/15 backdrop-blur-sm transition-colors text-base"
            >
              See How It Works
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/45">
            {["Free 30-min demo call", "No commitment required", "Built in 5–7 days", "Done-for-you setup"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-white/40" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
    </>
  );
}
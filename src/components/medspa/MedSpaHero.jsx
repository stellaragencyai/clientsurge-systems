import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import MedSpaDemoModal from "./MedSpaDemoModal";

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
        {/* Background wallpaper image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1920&q=90"
            alt="Luxury med spa treatment"
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-40 pb-32 md:pt-52 md:pb-40">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Every missed lead is a lost appointment.</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-white mb-6" style={{textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>
            Stop Losing Med Spa Leads — <span className="text-primary">Turn Every Inquiry Into a Booked Client</span>
          </h1>

          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed mb-4" style={{textShadow:"0 1px 6px rgba(0,0,0,0.4)"}}>
            If your med spa is getting inquiries but not turning them into bookings, this system fixes that instantly.
          </p>

          <p className="text-sm text-primary/90 max-w-xl mx-auto mb-8 font-medium">
            Designed to capture leads before competitors respond.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            {/* Primary CTA — opens modal */}
            <button
              onClick={() => setShowModal(true)}
              style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 6px 24px rgba(120,70,20,0.4)",border:"none",cursor:"pointer"}}
            >
              <span style={{display:"flex",alignItems:"center",gap:"8px",height:"52px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
                Book a 10-Min Demo
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => scrollTo("#how-it-works-medspa")}
              className="flex items-center gap-2 px-8 h-[52px] rounded-full border border-white/40 text-white font-semibold hover:bg-white/20 backdrop-blur-sm transition-colors text-base"
            >
              See It In Action
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-white/70 mb-3" style={{textShadow:"0 1px 4px rgba(0,0,0,0.3)"}}>
            Built for med spas that want faster response, better follow-up, and more booked consultations.
          </p>

          <p className="text-xs text-white/60 font-medium" style={{textShadow:"0 1px 4px rgba(0,0,0,0.3)"}}>
            ↓ See exactly how this works below
          </p>
        </div>
      </section>

      {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
    </>
  );
}
import { ArrowRight, ChevronDown } from "lucide-react";

export default function MedSpaHero() {
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
    <section className="relative pt-28 pb-0 overflow-hidden bg-white">
      {/* Top content */}
      <div className="max-w-5xl mx-auto px-6 text-center pt-16 pb-16 md:pt-24 md:pb-20">
        <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-primary tracking-wide uppercase">Exclusively for Med Spas</span>
        </div>

        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-foreground mb-6">
          Stop Losing Med Spa Leads —<br />
          <span className="text-primary">Book More Appointments</span> Automatically
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
          We install systems that instantly respond to inquiries, follow up automatically, and turn more leads into paying clients.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"52px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>
          <button
            onClick={() => scrollTo("#how-it-works-medspa")}
            className="flex items-center gap-2 px-8 h-[52px] rounded-full border border-border text-foreground font-semibold hover:bg-secondary/50 transition-colors text-base"
          >
            See How It Works
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Built for med spas that want faster response, better follow-up, and more booked consultations.
        </p>
      </div>

      {/* Full-width hero image */}
      <div className="relative w-full overflow-hidden" style={{ height: "480px" }}>
        <img
          src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1600&q=85"
          alt="Luxury med spa treatment room"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" style={{ background: "linear-gradient(to top, white 0%, rgba(255,255,255,0.2) 40%, transparent 100%)" }} />
      </div>
    </section>
  );
}
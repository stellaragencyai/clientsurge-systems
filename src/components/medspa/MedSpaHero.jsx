import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
          Turn More Med Spa Leads Into Booked Appointments
          <br />
          <span className="text-primary">Automatically</span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
          Instant responses. Automated follow-up. More bookings. No extra front desk work.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="rounded-lg px-8 h-12 text-base font-semibold gap-2">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <button
            onClick={() => scrollTo("#how-it-works")}
            className="px-8 h-12 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
          >
            See How It Works
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          No long-term contracts. Live in under 7 days.
        </p>
      </div>
    </section>
  );
}
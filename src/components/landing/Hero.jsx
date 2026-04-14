import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatCounter from "./StatCounter";
import ConversationModal from "./ConversationModal";
import LeadCaptureModal from "../forms/LeadCaptureModal";

const TICKER_EVENTS = [
  "🟢 New lead captured — Austin, TX",
  "📅 Appointment booked — Miami, FL",
  "💬 Follow-up sent automatically — Denver, CO",
  "📞 Missed call recovered — Phoenix, AZ",
  "🟢 New lead captured — Nashville, TN",
  "📅 Consultation booked — Los Angeles, CA",
  "💬 Lead re-engaged — Chicago, IL",
  "📞 Missed call recovered — Atlanta, GA",
];

function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TICKER_EVENTS.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-card border border-border rounded-full shadow-sm overflow-hidden">
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span
        className="text-xs font-medium text-foreground/80 transition-all duration-400"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}
      >
        {TICKER_EVENTS[index]}
      </span>
    </div>
  );
}

const businessTypes = [
  "Med Spa / Aesthetic Clinic",
  "Real Estate Agency",
  "Home Services",
  "Dental / Medical Practice",
  "Salon / Wellness Studio",
  "Other Service Business",
];

export default function Hero() {
  const [showLeadModal, setShowLeadModal] = useState(false);

  return (
    <section className="relative pt-20 pb-20 md:pt-40 md:pb-32 px-4 md:px-6 bg-gradient-to-b from-background to-card overflow-hidden">
      {/* Gold ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none" style={{background: 'radial-gradient(ellipse, rgba(161,120,35,0.18) 0%, transparent 70%)'}} />

      <div className="max-w-4xl mx-auto text-center relative z-10">

        <h1 className="font-display text-6xl md:text-7xl lg:text-7xl font-semibold tracking-tight leading-[1.08] text-foreground">
          Stop Losing Leads.
          <br />
          <span className="text-primary" style={{textShadow: '0 0 40px rgba(161,120,35,0.45)'}}>Automate Follow-Up.</span>
          <br />
          Book More Customers.
        </h1>

        <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Done-for-you AI systems that capture leads, respond instantly, automate follow-up, recover missed calls, and increase booked customers.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => setShowLeadModal(true)}
            className="rounded-full px-8 h-12 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            Book a Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
          <button
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById("how-it-works");
              if (!target) return;
              const start = window.scrollY;
              const end = target.getBoundingClientRect().top + window.scrollY - 64;
              const distance = end - start;
              const duration = 1200;
              let startTime = null;
              const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
              const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                window.scrollTo(0, start + distance * easeInOutCubic(progress));
                if (progress < 1) requestAnimationFrame(step);
              };
              requestAnimationFrame(step);
            }}
          >
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 text-base font-semibold gap-2"
            >
              Learn More
            </Button>
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {["No long-term contracts", "Live in under 7 days", "Fully done-for-you"].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t}
            </span>
          ))}
        </div>

        {/* Animated stat counters */}
        <StatCounter />

        {/* Live-feeling activity ticker */}
        <div className="mt-10 flex items-center justify-center">
          <LiveTicker />
        </div>

      </div>

      <LeadCaptureModal 
        isOpen={showLeadModal} 
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => {
          setShowLeadModal(false);
          window.location.href = '/book';
        }}
      />
    </section>
  );
}
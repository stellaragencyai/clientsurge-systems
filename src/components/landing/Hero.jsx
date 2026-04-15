import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import HeroSection from "./HeroSection";
import StatCounter from "./StatCounter";
import LeadCaptureModal from "../forms/LeadCaptureModal";

const TICKER_EVENTS = [
  "📅 Consultation booked — Scottsdale, AZ",
  "📅 Appointment booked — Scottsdale, AZ",
  "💬 Follow-up sent automatically — Phoenix, AZ",
  "📞 Missed call recovered — Phoenix, AZ",
  "🟢 New lead captured — Scottsdale, AZ",
  "📅 Demo scheduled — Tempe, AZ",
  "💬 Lead re-engaged — Chandler, AZ",
  "📞 Booking confirmed — Scottsdale, AZ",
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

  const handleLearnMore = (e) => {
    e.preventDefault();
    const target = document.getElementById("how-it-works-section");
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
  };

  return (
    <>
      <HeroSection
        title="Stop Losing Leads."
        titleHighlight="Automate Follow-Up. Book More Customers."
        subtitle="Done-for-you AI systems that capture leads, respond instantly, automate follow-up, recover missed calls, and increase booked customers."
        backgroundGradient="linear-gradient(to bottom, hsl(40, 8%, 88%), hsl(0, 0%, 100%))"
        primaryCTA={{
          label: "Book a Demo",
          onClick: () => setShowLeadModal(true),
        }}
        secondaryCTA={{
          label: "See How It Works ↓",
          onClick: handleLearnMore,
        }}
        trustBadges={["No long-term contracts", "Live in under 7 days", "Fully done-for-you"]}
      >
        <StatCounter />
        <div className="mt-10 flex items-center justify-center">
          <LiveTicker />
        </div>
      </HeroSection>

      <LeadCaptureModal 
        isOpen={showLeadModal} 
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => {
          setShowLeadModal(false);
          window.location.href = '/book';
        }}
      />
    </>
  );
}
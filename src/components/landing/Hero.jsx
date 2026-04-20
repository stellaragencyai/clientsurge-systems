import { useState, useEffect } from "react";
import HeroSection from "./HeroSection";
import DemoBookingModal from "../forms/DemoBookingModal";

const TICKER_EVENTS = [
  "Consultation booked - Scottsdale, AZ",
  "Appointment booked - Scottsdale, AZ",
  "Follow-up sent automatically - Phoenix, AZ",
  "Missed call recovered - Phoenix, AZ",
  "New lead captured - Scottsdale, AZ",
  "Demo scheduled - Tempe, AZ",
  "Lead re-engaged - Chandler, AZ",
  "Booking confirmed - Scottsdale, AZ",
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

export default function Hero() {
  const [showDemoModal, setShowDemoModal] = useState(false);

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
        badge="Built for Med Spas and Appointment-Based Businesses"
        title="Turn More Leads Into"
        titleHighlight="Booked Appointments"
        subtitle="We install the follow-up system for you: instant lead response, missed-call text-back, automated nurture, and booking handoff in as little as 7 days."
        backgroundGradient="linear-gradient(to bottom, hsl(40, 8%, 88%), hsl(0, 0%, 100%))"
        primaryCTA={{
          label: "Book Your Free Demo",
          onClick: () => setShowDemoModal(true),
        }}
        secondaryCTA={{
          label: "See How It Works",
          onClick: handleLearnMore,
        }}
        trustBadges={["Live in 5-7 days", "Month-to-month", "Fully done-for-you"]}
      >
        <div className="mt-10 flex items-center justify-center">
          <LiveTicker />
        </div>
      </HeroSection>

      {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
    </>
  );
}

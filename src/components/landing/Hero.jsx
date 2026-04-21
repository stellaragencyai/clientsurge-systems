import { useState } from "react";
import HeroSection from "./HeroSection";
import { trackCTA } from "@/lib/analytics";
import DemoBookingModal from "@/components/forms/DemoBookingModal";

export default function Hero() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleLearnMore = (e) => {
    e.preventDefault();
    trackCTA("see_the_4_step_system", "hero");
    const target = document.getElementById("how-it-works-section");
    if (!target) {
      window.location.href = "/#how-it-works-section";
      return;
    }
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
        badge="Built for Med Spas and Lead-Driven Service Businesses"
        title="Turn More Leads Into"
        titleHighlight="Booked Appointments"
        subtitle="We install the follow-up system for you: instant lead response, missed-call text-back, automated nurture, and booking handoff for med spas and local service teams in as little as 7 days."
        backgroundGradient="linear-gradient(to bottom, hsl(40, 8%, 88%), hsl(0, 0%, 100%))"
        primaryCTA={{
          label: "Book Your Free Demo",
          onClick: () => {
            trackCTA("book_your_free_demo", "hero");
            setShowBookingModal(true);
          },
        }}
        secondaryCTA={{
          label: "See The 4-Step System",
          onClick: handleLearnMore,
        }}
        trustBadges={["Live in 5-7 days", "Month-to-month", "Fully done-for-you"]}
      >
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {[
            "Missed-call text-back included",
            "Lead follow-up handled automatically",
            "Booking handoff built into the system",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-xs font-medium text-foreground/80 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {item}
            </span>
          ))}
        </div>
      </HeroSection>
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </>
  );
}

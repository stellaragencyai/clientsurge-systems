import { useState } from "react";
import { ChevronDown } from "lucide-react";
import HeroSection from "../landing/HeroSection";
import MedSpaDemoModal from "./MedSpaDemoModal";

export default function MedSpaHero() {
  const [showModal, setShowModal] = useState(false);

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (!el) return;
    const start = window.scrollY;
    const target = el.getBoundingClientRect().top + window.scrollY - 64;
    const distance = target - start;
    const duration = 1200;
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
      <HeroSection
        badge="Every missed lead is a lost appointment."
        title="Stop Losing Med Spa Leads —"
        titleHighlight="Turn Every Inquiry Into a Booked Client"
        subtitle="If your med spa is getting inquiries but not turning them into bookings, this system fixes that instantly."
        description="Designed to capture leads before competitors respond."
        backgroundType="image"
        backgroundImage="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1280&q=75&auto=format"
        primaryCTA={{
          label: "Book a 10-Min Demo",
          onClick: () => setShowModal(true),
        }}
        secondaryCTA={{
          label: "See It In Action",
          onClick: () => scrollTo("#how-it-works-medspa"),
          icon: ChevronDown,
        }}
      >
        <p className="text-sm text-white/70 mb-3 mt-8" style={{textShadow:"0 1px 4px rgba(0,0,0,0.3)"}}>
          Built for med spas that want faster response, better follow-up, and more booked consultations.
        </p>
        <p className="text-xs text-white/60 font-medium" style={{textShadow:"0 1px 4px rgba(0,0,0,0.3)"}}>
          ↓ See exactly how this works below
        </p>
      </HeroSection>

      {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
    </>
  );
}
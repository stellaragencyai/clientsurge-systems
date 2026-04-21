import { useState } from "react";
import HeroSection from "./HeroSection";
import { trackCTA } from "@/lib/analytics";
import DemoBookingModal from "@/components/forms/DemoBookingModal";

export default function Hero() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 35 });

  const handleLearnMore = (e) => {
    e.preventDefault();
    trackCTA("see_the_8_system_flow", "hero");
    const target = document.getElementById("services");
    if (!target) {
      window.location.href = "/#services";
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
      <div
        className="relative overflow-hidden"
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          setSpotlight({
            x: ((event.clientX - bounds.left) / bounds.width) * 100,
            y: ((event.clientY - bounds.top) / bounds.height) * 100,
          });
        }}
        onMouseLeave={() => setSpotlight({ x: 50, y: 35 })}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90 transition-all duration-500"
          style={{
            background: `
              radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(245, 217, 168, 0.34), transparent 28%),
              radial-gradient(circle at 15% 20%, rgba(154, 92, 46, 0.14), transparent 22%),
              radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.7), transparent 18%),
              linear-gradient(to bottom, hsl(40, 8%, 88%), hsl(0, 0%, 100%))
            `,
          }}
        />
        <div
          className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: "rgba(154, 92, 46, 0.14)",
            transform: `translate3d(${(spotlight.x - 50) * 0.18}px, ${(spotlight.y - 50) * 0.12}px, 0)`,
            transition: "transform 300ms ease-out",
          }}
        />
        <div
          className="pointer-events-none absolute right-[-5rem] top-16 h-80 w-80 rounded-full blur-3xl"
          style={{
            background: "rgba(245, 217, 168, 0.22)",
            transform: `translate3d(${(50 - spotlight.x) * 0.16}px, ${(spotlight.y - 40) * 0.1}px, 0)`,
            transition: "transform 320ms ease-out",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/55 to-transparent" />

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
            label: "See The 8-System Flow",
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
                className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/72 px-4 py-2 text-xs font-medium text-foreground/80 shadow-[0_10px_32px_rgba(15,23,42,0.08)] backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </span>
            ))}
          </div>
        </HeroSection>
      </div>
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </>
  );
}

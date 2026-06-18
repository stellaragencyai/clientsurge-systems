/**
 * TrustedStackCarousel
 * Shows the infrastructure/tool stack ClientSurge is built on.
 * Uses clean text-based logo placeholders ready for image swaps.
 * Scrolls on mobile; static grid on desktop.
 */
import { useRef } from "react";

const STACK = [
  {
    name: "ElevenLabs",
    abbr: "11L",
    accentColor: "#a855f7",
    // swap src to real asset when available:
    // logoSrc: "/logos/elevenlabs.svg",
  },
  {
    name: "Twilio",
    abbr: "Tw",
    accentColor: "#F22F46",
    // logoSrc: "/logos/twilio.svg",
  },
  {
    name: "Resend",
    abbr: "Re",
    accentColor: "#000000",
    // logoSrc: "/logos/resend.svg",
  },
  {
    name: "Stripe",
    abbr: "St",
    accentColor: "#635BFF",
    // logoSrc: "/logos/stripe.svg",
  },
  {
    name: "Cloudflare",
    abbr: "CF",
    accentColor: "#F6821F",
    // logoSrc: "/logos/cloudflare.svg",
  },
  {
    name: "Zapier",
    abbr: "Za",
    accentColor: "#FF4A00",
    // logoSrc: "/logos/zapier.svg",
  },
  {
    name: "Asana",
    abbr: "As",
    accentColor: "#F06A6A",
    // logoSrc: "/logos/asana.svg",
  },
];

function LogoItem({ tool }) {
  return (
    <div
      className="group flex flex-col items-center gap-2.5 flex-shrink-0 select-none cursor-default"
      style={{ minWidth: "96px" }}
    >
      {/* Logo badge — replace inner content with <img> when asset is ready */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
        style={{
          background: "rgba(255,255,255,0.9)",
          borderColor: "rgba(0,0,0,0.07)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = tool.accentColor + "55";
          e.currentTarget.style.boxShadow = `0 4px 18px ${tool.accentColor}22`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
        }}
      >
        {/* ── Swap this <span> for <img src={tool.logoSrc} … /> when assets are ready ── */}
        <span
          className="text-sm font-black tracking-tight"
          style={{ color: tool.accentColor }}
        >
          {tool.abbr}
        </span>
      </div>

      {/* Tool name */}
      <span
        className="text-xs font-semibold transition-colors duration-200"
        style={{ color: "rgba(10,22,40,0.45)" }}
      >
        {tool.name}
      </span>
    </div>
  );
}

export default function TrustedStackCarousel() {
  const trackRef = useRef(null);

  return (
    <section
      aria-label="Technology infrastructure"
      className="bg-white border-t border-b"
      style={{ borderColor: "rgba(0,0,0,0.07)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Label */}
        <p
          className="text-center text-xs font-bold uppercase tracking-[0.22em] mb-8"
          style={{ color: "rgba(10,22,40,0.38)" }}
        >
          Built With Trusted Automation Infrastructure
        </p>

        {/* Desktop: static centered row */}
        <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12">
          {STACK.map((tool) => (
            <LogoItem key={tool.name} tool={tool} />
          ))}
        </div>

        {/* Mobile: horizontal scroll carousel */}
        <div
          className="md:hidden overflow-x-auto pb-2 -mx-6 px-6"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          <style>{`.ts-track::-webkit-scrollbar { display: none; }`}</style>
          <div
            ref={trackRef}
            className="ts-track flex items-center gap-6 w-max"
          >
            {STACK.map((tool) => (
              <LogoItem key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
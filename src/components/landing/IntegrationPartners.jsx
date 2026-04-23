import { useRef, useState } from "react";

const INTEGRATIONS = [
  {
    name: "Google Calendar",
    logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/38f003d6f_558c46a6-da27-4e63-9f22-6c0de6240428.png",
    href: "https://calendar.google.com",
    description: "Calendar sync",
  },
  {
    name: "HubSpot",
    logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/53f5f9417_Hubspotlogonobackground.png",
    href: "https://hubspot.com",
    description: "CRM & leads",
  },
  {
    name: "Stripe",
    logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/01819ba25_stripenobackgroundlogo.png",
    href: "https://stripe.com",
    description: "Payments",
  },
  {
    name: "Twilio",
    logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/5d24a83dd_twilionobackgroundlogo.png",
    href: "https://twilio.com",
    description: "SMS & voice",
  },
  {
    name: "Zapier",
    logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/2d655fab4_zapiernobackgroundlogo.png",
    href: "https://zapier.com",
    description: "Workflow automation",
  },
];

// Triple for extra-seamless loop with no gap on faster screens
const TRIPLED = [...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS];

export default function IntegrationPartners() {
  const [paused, setPaused] = useState(false);

  return (
    // FIX 3: Tighter vertical padding — section was too tall with too much dead air
    <section className="py-14 px-6 relative overflow-hidden">

      {/* FIX 5a: Richer dual-nebula background behind logos */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(ellipse 75% 60% at 20% 60%, rgba(200,150,92,0.10) 0%, transparent 55%), " +
          "radial-gradient(ellipse 60% 50% at 80% 40%, rgba(154,92,46,0.08) 0%, transparent 55%), " +
          "radial-gradient(ellipse 100% 80% at 50% 50%, rgba(245,217,168,0.05) 0%, transparent 65%)",
      }} />

      {/* FIX 5b: Strengthened grid — more visible, still subtle */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage:
          "linear-gradient(rgba(154,92,46,0.09) 1px, transparent 1px), " +
          "linear-gradient(90deg, rgba(154,92,46,0.09) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)",
      }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        {/* FIX 3: Reduced mb-16 → mb-10 */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Integrations
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            We Easily{" "}
            {/* FIX 1: Matched exact site golden-brown #9a5c2e with glow — was #7a4825 (too dark) */}
            <span style={{
              color: "#9a5c2e",
              textShadow: "0 0 28px rgba(154,92,46,0.35)",
            }}>
              Integrate
            </span>{" "}
            With
          </h2>

          {/* FIX 6: Gold accent divider — consistent with rest of landing page */}
          <div className="flex items-center justify-center gap-3 mt-5 mb-5">
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to right, transparent, rgba(154,92,46,0.5))" }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9a5c2e" }} />
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to left, transparent, rgba(154,92,46,0.5))" }} />
          </div>

          {/* FIX 8: More punchy on-brand subtitle copy */}
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Every tool you already rely on — plugged in, synced, and firing automatically the moment a lead comes in.
          </p>
        </div>

        {/* ── Infinite scroll marquee ── */}
        {/* FIX 7: Pause on hover so users can actually click the logos */}
        <div
          className="relative overflow-hidden"
          style={{ padding: "28px 0 40px" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, hsl(var(--background)) 0%, transparent 100%)" }}
          />
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, hsl(var(--background)) 0%, transparent 100%)" }}
          />

          <div
            className="flex items-center"
            style={{
              width: "max-content",
              gap: "80px",
              // FIX 4: Slowed from 22s → 34s so logos are comfortably readable
              // FIX 7: Animation pauses on hover
              animation: `integrationScroll 34s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {TRIPLED.map((integration, idx) => (
              <a
                key={idx}
                href={integration.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visit ${integration.name}`}
                className="flex-shrink-0 group relative flex flex-col items-center"
                style={{ outline: "none" }}
              >
                {/* FIX 2: Increased logo height 64px → 90px for real visual weight */}
                <img
                  src={integration.logo}
                  alt={integration.name}
                  loading="lazy"
                  style={{
                    height: "90px",
                    width: "auto",
                    maxWidth: "200px",
                    objectFit: "contain",
                    transition: "transform 0.35s cubic-bezier(0.34,1.4,0.64,1), filter 0.35s ease",
                    filter: "drop-shadow(0 0 0px rgba(200,150,92,0))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.18) translateY(-6px)";
                    e.currentTarget.style.filter = "drop-shadow(0 10px 24px rgba(200,150,92,0.5))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) translateY(0)";
                    e.currentTarget.style.filter = "drop-shadow(0 0 0px rgba(200,150,92,0))";
                  }}
                />

                {/* Tooltip label on hover */}
                <span
                  className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest"
                >
                  {integration.description}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* FIX 9: Styled pill banner CTA — was a plain grey text line */}
        <div className="flex justify-center mt-2">
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full border"
            style={{
              background: "linear-gradient(135deg, rgba(154,92,46,0.07) 0%, rgba(200,150,92,0.05) 100%)",
              border: "1.5px solid rgba(154,92,46,0.2)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <span className="text-sm text-foreground/70">Don't see your tool?</span>
            <a
              href="/contact"
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Contact us →
            </a>
            <span className="text-sm text-foreground/50">We connect to virtually anything.</span>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes integrationScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes integrationScroll {
            0%, 100% { transform: translateX(0); }
          }
        }
      `}</style>
    </section>
  );
}
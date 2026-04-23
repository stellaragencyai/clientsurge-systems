import { useEffect, useRef } from "react";

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

// Duplicate for seamless infinite loop
const DOUBLED = [...INTEGRATIONS, ...INTEGRATIONS];

export default function IntegrationPartners() {
  const trackRef = useRef(null);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background via-card to-background relative overflow-hidden">
      {/* Futuristic grid background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(154,92,46,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(154,92,46,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "70%",
          height: "60%",
          background:
            "radial-gradient(ellipse, rgba(200,150,92,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">
            Integrations
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
            We Easily{" "}
            <span style={{ color: "#7a4825" }}>Integrate</span>{" "}
            With
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Connect your favorite tools directly. Our system works seamlessly
            with the platforms your business already uses.
          </p>
        </div>

        {/* ── Infinite scroll marquee ── */}
        <div className="relative overflow-hidden" style={{ padding: "20px 0" }}>
          {/* Left fade */}
          <div
            className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, hsl(var(--background)), transparent)",
            }}
          />
          {/* Right fade */}
          <div
            className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to left, hsl(var(--background)), transparent)",
            }}
          />

          <div
            ref={trackRef}
            className="flex gap-16 items-center"
            style={{
              width: "max-content",
              animation: "integrationScroll 22s linear infinite",
            }}
          >
            {DOUBLED.map((integration, idx) => (
              <a
                key={idx}
                href={integration.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visit ${integration.name}`}
                className="flex-shrink-0 group relative flex flex-col items-center gap-3"
                style={{ outline: "none" }}
              >
                {/* Logo — no container */}
                <img
                  src={integration.logo}
                  alt={integration.name}
                  loading="lazy"
                  style={{
                    height: "64px",
                    width: "auto",
                    maxWidth: "160px",
                    objectFit: "contain",
                    transition:
                      "transform 0.35s cubic-bezier(0.34,1.4,0.64,1), filter 0.35s ease",
                    filter: "drop-shadow(0 0 0px rgba(200,150,92,0))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.22) translateY(-4px)";
                    e.currentTarget.style.filter =
                      "drop-shadow(0 8px 20px rgba(200,150,92,0.45))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) translateY(0)";
                    e.currentTarget.style.filter =
                      "drop-shadow(0 0 0px rgba(200,150,92,0))";
                  }}
                />

                {/* Tooltip on hover */}
                <span
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {integration.description}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* ✦ Visual enhancement suggestion */}
        <p className="text-center text-xs text-muted-foreground mt-16 max-w-2xl mx-auto">
          Don't see your tool?{" "}
          <a href="/contact" className="text-primary font-semibold hover:underline">
            Contact us
          </a>{" "}
          — we can integrate with almost any platform through custom APIs and webhooks.
        </p>
      </div>

      <style>{`
        @keyframes integrationScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
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
import { useState, useEffect } from "react";

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
  {
    name: "Calendly",
    logo: "https://asset.brandfetch.io/idZFtKcrFb/idF1j3M28n.png",
    href: "https://calendly.com",
    description: "Booking",
  },
  {
    name: "Facebook Ads",
    logo: "https://asset.brandfetch.io/idFdo8ulhr/idMNSwbv-X.png",
    href: "https://facebook.com/ads",
    description: "Lead ads",
  },
  {
    name: "ActiveCampaign",
    logo: "https://asset.brandfetch.io/idpJKJvfE9/id7BH9t9D0.png",
    href: "https://activecampaign.com",
    description: "Email automation",
  },
  {
    name: "GoHighLevel",
    logo: "https://asset.brandfetch.io/idmEBJvJIq/idBi3b2U7f.png",
    href: "https://gohighlevel.com",
    description: "CRM platform",
  },
];

// Track scroll position for dynamic enhancement
const ScrollTrackIntegrationContext = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return children(scrollY);
};

// Triple for extra-seamless loop
const TRIPLED = [...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS];

export default function IntegrationPartners() {
  const [paused, setPaused] = useState(false);

  return (
    <section
      className="py-14 px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(245,246,248,0.98) 0%, rgba(238,240,244,0.97) 100%)",
      }}
    >
      {/* Subtle top/bottom border lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Integrations
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Works With{" "}
            <span style={{ color: "#9a5c2e", textShadow: "0 0 28px rgba(154,92,46,0.35)" }}>
              50+ Tools
            </span>
          </h2>

          <div className="flex items-center justify-center gap-3 mt-5 mb-5">
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to right, transparent, rgba(154,92,46,0.5))" }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9a5c2e" }} />
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to left, transparent, rgba(154,92,46,0.5))" }} />
          </div>

          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            Every tool you already rely on — plugged in, synced, and firing automatically the moment a lead comes in. Seamless integrations that work behind the scenes.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mt-6">
            <span aria-hidden="true">🔗</span>
            Scroll to see all integrations in action
          </div>
        </div>

        {/* Infinite scroll marquee */}
        <div
          className="relative overflow-hidden"
          style={{ padding: "28px 0 40px" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Left fade */}
          <div
            className="absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(245,246,248,1) 0%, transparent 100%)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(245,246,248,1) 0%, transparent 100%)" }}
          />

          <div
            className="flex items-center"
            style={{
              width: "max-content",
              gap: "80px",
              animation: `integrationScroll 24s linear infinite`,
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
                className="flex-shrink-0 group relative flex flex-col items-center transition-opacity duration-300 hover:opacity-100"
                style={{ outline: "none", opacity: 0.85 }}
              >
                <img
                   src={integration.logo}
                   alt={integration.name}
                   loading="lazy"
                   style={{
                     height: "130px",
                     width: "auto",
                     maxWidth: "280px",
                     objectFit: "contain",
                     transition: "transform 0.35s cubic-bezier(0.34,1.4,0.64,1), filter 0.35s ease, opacity 0.35s ease",
                     filter: "drop-shadow(0 0 0px rgba(200,150,92,0)) brightness(1) contrast(1.05)",
                     opacity: 0.9,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = "scale(1.22) translateY(-8px)";
                     e.currentTarget.style.filter = "drop-shadow(0 12px 32px rgba(200,150,92,0.6)) brightness(1.08) contrast(1.15)";
                     e.currentTarget.style.opacity = "1";
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = "scale(1) translateY(0)";
                     e.currentTarget.style.filter = "drop-shadow(0 0 0px rgba(200,150,92,0)) brightness(1) contrast(1.05)";
                     e.currentTarget.style.opacity = "0.9";
                   }}
                 />
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
                  {integration.description}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom CTA pill */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-10 pt-10 border-t border-border/30">
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full border"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1.5px solid rgba(180,185,195,0.6)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 12px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <span className="text-sm text-foreground/70 font-medium">Don't see your tool?</span>
            <a
              href="/contact"
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Contact us →
            </a>
            <span className="text-sm text-foreground/50">We connect to virtually anything.</span>
          </div>
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border"
            style={{
              background: "rgba(154,92,46,0.08)",
              border: "1.5px solid rgba(154,92,46,0.25)",
              boxShadow: "0 2px 8px rgba(154,92,46,0.12)",
            }}
          >
            <span className="text-xs font-bold text-primary uppercase tracking-widest">✓ Pre-built integrations available</span>
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
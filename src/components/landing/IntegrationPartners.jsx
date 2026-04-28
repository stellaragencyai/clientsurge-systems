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
  return (
    <section
      className="py-14 px-6 relative overflow-hidden"
      style={{
        background: "#ffffff",
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


        </div>

        {/* Infinite scroll marquee */}
        <div
          className="relative overflow-hidden"
          style={{ padding: "28px 0 40px" }}

        >
          {/* Left fade */}
          <div
            className="absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(255,255,255,1) 0%, transparent 100%)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(255,255,255,1) 0%, transparent 100%)" }}
          />

          <div
            className="flex items-center"
            style={{
              width: "max-content",
              gap: "clamp(40px, 6vw, 80px)",
              animation: `integrationScroll 28s linear infinite`,
              willChange: "transform",
            }}
          >
            {TRIPLED.map((integration, idx) => (
              <a
                key={idx}
                href={integration.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visit ${integration.name}`}
                className="flex-shrink-0 group relative flex flex-col items-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-2"
                style={{ cursor: "pointer" }}
              >
                <img
                   src={integration.logo}
                   alt={integration.name}
                   loading="lazy"
                   style={{
                     height: "120px",
                     width: "auto",
                     maxWidth: "260px",
                     objectFit: "contain",
                     transition: "transform 0.35s cubic-bezier(0.34,1.4,0.64,1), filter 0.35s ease",
                     filter: "brightness(1) contrast(1.1) saturate(1.1)",
                     opacity: 1,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = "scale(1.2) translateY(-8px)";
                     e.currentTarget.style.filter = "brightness(1.1) contrast(1.15) saturate(1.2) drop-shadow(0 8px 24px rgba(154,92,46,0.35))";
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = "scale(1) translateY(0)";
                     e.currentTarget.style.filter = "brightness(1) contrast(1.1) saturate(1.1)";
                   }}
                 />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
                  {integration.description}
                </span>
              </a>
            ))}
          </div>
        </div>



      </div>

      <style>{`
        @keyframes integrationScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
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
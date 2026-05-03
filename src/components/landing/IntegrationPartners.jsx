import { useState, useEffect } from "react";

const INTEGRATIONS = [
{
  name: "Google Calendar",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/38f003d6f_558c46a6-da27-4e63-9f22-6c0de6240428.png",
  href: "https://calendar.google.com",
  description: "Calendar sync"
},
{
  name: "HubSpot",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/53f5f9417_Hubspotlogonobackground.png",
  href: "https://hubspot.com",
  description: "CRM & leads"
},
{
  name: "Stripe",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/01819ba25_stripenobackgroundlogo.png",
  href: "https://stripe.com",
  description: "Payments"
},
{
  name: "Twilio",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/5d24a83dd_twilionobackgroundlogo.png",
  href: "https://twilio.com",
  description: "SMS & voice"
},
{
  name: "Zapier",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/2d655fab4_zapiernobackgroundlogo.png",
  href: "https://zapier.com",
  description: "Workflow automation"
},
{
  name: "Calendly",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/4f0f85e13_7493f3ba-6389-437c-b4cc-50b5c2baa75a.png",
  href: "https://calendly.com",
  description: "Booking"
},
{
  name: "Facebook Ads",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/40001c42d_ChatGPTImageApr28202605_59_43AM.png",
  href: "https://facebook.com/ads",
  description: "Lead ads"
},
{
  name: "HighLevel",
  logo: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/eec622a96_effc8d6b-84de-4143-b7f8-fad489dba492.png",
  href: "https://gohighlevel.com",
  description: "CRM platform"
}];


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

// Double is enough — animation translates exactly one set width
const DOUBLED = [...INTEGRATIONS, ...INTEGRATIONS];

// Gap between items in px — must match the inline style below
const ITEM_GAP = 72;
const ITEM_WIDTH = 180;

export default function IntegrationPartners() {
  // Total width of one set = N items * (width + gap)
  const oneSetWidth = INTEGRATIONS.length * (ITEM_WIDTH + ITEM_GAP);

  return (
    <section
      className="pt-10 pb-14 px-6 relative overflow-hidden"
      style={{ background: "#ffffff" }}>
      
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center pt-10 mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
            Integrations
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Works With{" "}
            <span style={{ color: "#00AEEF", textShadow: "0 0 28px rgba(0,174,239,0.35)" }}>
              50+ Tools
            </span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-5 mb-5">
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to right, transparent, rgba(154,92,46,0.5))" }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9a5c2e" }} />
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to left, transparent, rgba(154,92,46,0.5))" }} />
          </div>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            Every tool you already rely on — plugged in, synced, and firing automatically the moment a lead comes in.
          </p>
        </div>

        {/* Infinite scroll marquee — proper pixel-based loop */}
        <div className="relative overflow-hidden" style={{ padding: "28px 0 40px" }}>
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #ffffff 0%, transparent 100%)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #ffffff 0%, transparent 100%)" }} />

          <div
            className="flex items-center"
            style={{
              width: "max-content",
              gap: `${ITEM_GAP}px`,
              animation: `integrationScroll 26s linear infinite`,
              willChange: "transform"
            }}>
            
            {DOUBLED.map((integration, idx) =>
            <a
              key={idx}
              href={integration.href}
              target="_blank"
              rel="noopener noreferrer"
              title={integration.name}
              className="flex-shrink-0 group relative flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
              style={{ width: `${ITEM_WIDTH}px` }}>
              
                <img
                src={integration.logo}
                alt={integration.name}
                loading="eager"
                decoding="async"
                style={{
                  height: "72px",
                  width: `${ITEM_WIDTH}px`,
                  objectFit: "contain",
                  objectPosition: "center",
                  imageRendering: "auto",
                  transition: "transform 0.35s cubic-bezier(0.34,1.4,0.64,1), filter 0.35s ease",
                  filter: "contrast(1.05) saturate(1.05)",
                  display: "block"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.15) translateY(-6px)";
                  e.currentTarget.style.filter = "contrast(1.1) saturate(1.15) drop-shadow(0 8px 20px rgba(154,92,46,0.3))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1) translateY(0)";
                  e.currentTarget.style.filter = "contrast(1.05) saturate(1.05)";
                }} />
              
                

              
              </a>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes integrationScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${oneSetWidth}px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes integrationScroll { 0%, 100% { transform: translateX(0); } }
        }
      `}</style>
    </section>);

}
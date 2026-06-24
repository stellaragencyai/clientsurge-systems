import { useState } from "react";
import { useReducedMotion } from "framer-motion";

const INTEGRATIONS = [
  { name: "Twilio", logoUrl: null },
  { name: "Stripe", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/7b21d4fcd_6a982f4b4_291f0920-0064-4718-862c-ed781a664620.png" },
  { name: "ElevenLabs", logoUrl: null },
  { name: "OpenAI", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/09317eed9_Chatgpt-logo-1672775463-logotic-brandsvg.png" },
  { name: "Google Calendar", logoUrl: null },
  { name: "Resend", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/edd28679a_resend-logo-png_seeklogo-623015.png" },
  { name: "Cloudflare", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/abfbc3e2a_a80a9600-ac24-4b94-879a-160cac31059a.png" },
  { name: "Base44", logoUrl: null },
  { name: "Google Analytics", logoUrl: null },
  { name: "Microsoft Clarity", logoUrl: null },
];

function LogoBadge({ item }) {
  const [imgError, setImgError] = useState(false);
  const showImage = item.logoUrl && !imgError;

  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        height: "48px",
        minWidth: "130px",
        padding: "0 20px",
        borderRadius: "10px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(0, 174, 239, 0.12)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {showImage ? (
        <div style={{ height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={item.logoUrl}
            alt={item.name}
            style={{ maxHeight: "28px", maxWidth: "110px", width: "auto", height: "auto", objectFit: "contain" }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>
          {item.name}
        </span>
      )}
    </div>
  );
}

export default function IntegrationCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const items = [...INTEGRATIONS, ...INTEGRATIONS];

  return (
    <section className="py-12 md:py-16 relative overflow-hidden" style={{ background: "#0A1628" }}>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <p className="text-center text-sm md:text-base text-white/70 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
          Built to connect with the tools modern businesses already use.
        </p>

        {shouldReduceMotion ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 justify-items-center">
            {INTEGRATIONS.map((item) => (
              <LogoBadge key={item.name} item={item} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden">
            {/* Edge fade masks */}
            <div
              className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, #0A1628, transparent)" }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to left, #0A1628, transparent)" }}
            />

            {/* Marquee track */}
            <style>{`
              @keyframes cs-marquee-dark {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .cs-marquee-track-dark {
                animation: cs-marquee-dark 40s linear infinite;
                width: max-content;
              }
              .cs-marquee-track-dark:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="cs-marquee-track-dark flex items-center gap-3">
              {items.map((item, i) => (
                <LogoBadge key={`${item.name}-${i}`} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom fade to white for smooth transition to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, #ffffff)" }}
      />
    </section>
  );
}
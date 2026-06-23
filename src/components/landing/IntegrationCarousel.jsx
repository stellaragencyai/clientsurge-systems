import { useReducedMotion } from "framer-motion";

const INTEGRATIONS = [
  { name: "Stripe", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/7b21d4fcd_6a982f4b4_291f0920-0064-4718-862c-ed781a664620.png" },
  { name: "Cloudflare", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/abfbc3e2a_a80a9600-ac24-4b94-879a-160cac31059a.png" },
  { name: "OpenAI", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/09317eed9_Chatgpt-logo-1672775463-logotic-brandsvg.png" },
  { name: "Resend", logoUrl: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/edd28679a_resend-logo-png_seeklogo-623015.png" },
  { name: "Twilio", logoUrl: null },
  { name: "ElevenLabs", logoUrl: null },
  { name: "Google Calendar", logoUrl: null },
  { name: "Base44", logoUrl: null },
  { name: "Google Analytics", logoUrl: null },
  { name: "Microsoft Clarity", logoUrl: null },
];

function LogoImg({ item }) {
  return (
    <div className="flex items-center justify-center h-8 w-28">
      <img src={item.logoUrl} alt={item.name} className="max-h-8 max-w-28 w-auto h-auto object-contain" loading="lazy" />
    </div>
  );
}

function Badge({ item }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0 px-6 py-3">
      {item.logoUrl ? (
        <LogoImg item={item} />
      ) : (
        <span className="text-base md:text-lg font-bold text-white/40 whitespace-nowrap">{item.name}</span>
      )}
    </div>
  );
}

export default function IntegrationCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const items = [...INTEGRATIONS, ...INTEGRATIONS];

  return (
    <section className="py-12 md:py-16 relative overflow-hidden" style={{ background: "#0A0E27" }}>
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm md:text-base text-white/50 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
          Built to connect with the tools modern businesses already use.
        </p>

        {shouldReduceMotion ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-center px-4 py-4 rounded-xl border border-white/10"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {item.logoUrl ? (
                  <LogoImg item={item} />
                ) : (
                  <span className="text-sm md:text-base font-bold text-white/40 text-center">{item.name}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden">
            {/* Edge fades */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #0A0E27, transparent)" }} />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #0A0E27, transparent)" }} />

            {/* Marquee track */}
            <style>{`
              @keyframes cs-marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .cs-marquee-track {
                animation: cs-marquee 35s linear infinite;
                width: max-content;
              }
              .cs-marquee-track:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="cs-marquee-track flex items-center">
              {items.map((item, i) => (
                <Badge key={`${item.name}-${i}`} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
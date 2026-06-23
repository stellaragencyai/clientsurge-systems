import { useReducedMotion } from "framer-motion";

const INTEGRATIONS = [
  { name: "Twilio", logoUrl: null },
  { name: "Stripe", logoUrl: null },
  { name: "ElevenLabs", logoUrl: null },
  { name: "OpenAI", logoUrl: null },
  { name: "Google Calendar", logoUrl: null },
  { name: "Resend", logoUrl: null },
  { name: "Cloudflare", logoUrl: null },
  { name: "Base44", logoUrl: null },
  { name: "Google Analytics", logoUrl: null },
  { name: "Microsoft Clarity", logoUrl: null },
];

function Badge({ item }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0 px-6 py-3">
      {item.logoUrl ? (
        <img src={item.logoUrl} alt={item.name} className="h-6 w-auto opacity-70" />
      ) : (
        <span className="text-base md:text-lg font-bold text-slate-400 whitespace-nowrap">{item.name}</span>
      )}
    </div>
  );
}

export default function IntegrationCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const items = [...INTEGRATIONS, ...INTEGRATIONS];

  return (
    <section className="py-12 md:py-16 bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm md:text-base text-muted-foreground font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
          Built to connect with the tools modern businesses already use.
        </p>

        {shouldReduceMotion ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-center px-4 py-4 rounded-xl border border-border bg-card"
              >
                {item.logoUrl ? (
                  <img src={item.logoUrl} alt={item.name} className="h-6 w-auto opacity-70" />
                ) : (
                  <span className="text-sm md:text-base font-bold text-muted-foreground text-center">{item.name}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden">
            {/* Edge fades */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

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
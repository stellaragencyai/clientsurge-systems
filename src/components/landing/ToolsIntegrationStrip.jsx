import { motion, useReducedMotion } from "framer-motion";

const TOOLS = [
  { name: "Twilio", url: "https://cdn.worldvectorlogo.com/logos/twilio-2.svg", width: 135 },
  { name: "Stripe", url: "https://cdn.worldvectorlogo.com/logos/stripe-2.svg", width: 120 },
  { name: "OpenAI", url: "https://cdn.worldvectorlogo.com/logos/openai-2.svg", width: 150 },
  { name: "Zapier", url: "https://cdn.worldvectorlogo.com/logos/zapier-2.svg", width: 120 },
  { name: "Resend", url: "https://resend.com/favicon.ico", width: 120 },
  { name: "Calendly", url: "https://cdn.worldvectorlogo.com/logos/calendly.svg", width: 120 },
];

export default function ToolsIntegrationStrip() {
  const shouldReduceMotion = useReducedMotion();

  // Duplicate the list for seamless infinite scroll
  const marqueeTools = [...TOOLS, ...TOOLS];

  return (
    <section
      className="relative bg-white"
      style={{
        borderBottom: "1px solid rgba(0,174,239,0.1)",
        paddingTop: "clamp(2.5rem, 5vw, 4rem)",
        paddingBottom: "clamp(2.5rem, 5vw, 4rem)",
      }}
    >
      {/* Subtle top gradient to transition from dark hero */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "80px",
          background: "linear-gradient(to bottom, rgba(6,16,37,0.04), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-bold uppercase tracking-[0.22em] mb-8 md:mb-10"
          style={{ color: "rgba(10,22,40,0.65)" }}
        >
          Works With Your Favorite Tools
        </motion.p>
      </div>

      {/* Carousel marquee */}
      <div
        className="relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <motion.div
          className="flex items-center"
          style={{ gap: "5rem", width: "max-content" }}
          animate={shouldReduceMotion ? {} : { x: ["0%", "-50%"] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {marqueeTools.map(({ name, url, width }, idx) => (
            <div
              key={`${name}-${idx}`}
              className="flex items-center justify-center flex-shrink-0"
              style={{ opacity: 0.6, transition: "opacity 0.25s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
            >
              <img
                src={url}
                alt={`${name} integration`}
                loading="lazy"
                decoding="async"
                className="object-contain"
                style={{ height: "clamp(36px, 4.5vw, 52px)", width: "auto", maxWidth: `${width}px` }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
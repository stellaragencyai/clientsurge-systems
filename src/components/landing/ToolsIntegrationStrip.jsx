import { motion, useReducedMotion } from "framer-motion";

const TOOLS = [
  { name: "Twilio", url: "https://cdn.worldvectorlogo.com/logos/twilio-2.svg", width: 90 },
  { name: "Stripe", url: "https://cdn.worldvectorlogo.com/logos/stripe-2.svg", width: 80 },
  { name: "Google", url: "https://cdn.worldvectorlogo.com/logos/google-2015.svg", width: 80 },
  { name: "Zapier", url: "https://cdn.worldvectorlogo.com/logos/zapier-2.svg", width: 80 },
  { name: "OpenAI", url: "https://cdn.worldvectorlogo.com/logos/openai-2.svg", width: 100 },
];

export default function ToolsIntegrationStrip() {
  const shouldReduceMotion = useReducedMotion();

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

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-bold uppercase tracking-[0.22em] mb-8 md:mb-10"
          style={{ color: "rgba(10,22,40,0.42)" }}
        >
          Works With Your Favorite Tools
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 lg:gap-16">
          {TOOLS.map(({ name, url, width }, idx) => (
            <motion.div
              key={name}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.07, duration: 0.5 }}
              whileHover={shouldReduceMotion ? {} : { y: -2, opacity: 1 }}
              style={{ opacity: 0.5, transition: "opacity 0.25s ease, transform 0.25s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
            >
              <img
                src={url}
                alt={`${name} integration`}
                loading="lazy"
                decoding="async"
                className="h-7 md:h-9 object-contain"
                style={{ width: "auto", maxWidth: `${width}px` }}
              />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-8 text-xs"
          style={{ color: "rgba(10,22,40,0.38)" }}
        >
          Connects to the tools you already use — no tech stack change required
        </motion.p>
      </div>
    </section>
  );
}
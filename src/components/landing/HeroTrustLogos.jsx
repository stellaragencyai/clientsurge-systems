import { motion, useReducedMotion } from "framer-motion";

const LOGOS = [
  { name: "Twilio", url: "https://cdn.worldvectorlogo.com/logos/twilio-2.svg", width: 80 },
  { name: "Stripe", url: "https://cdn.worldvectorlogo.com/logos/stripe-2.svg", width: 80 },
  { name: "Google", url: "https://cdn.worldvectorlogo.com/logos/google-2015.svg", width: 80 },
  { name: "Zapier", url: "https://cdn.worldvectorlogo.com/logos/zapier-2.svg", width: 80 },
];

export default function HeroTrustLogos() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mt-14 sm:mt-20 w-full max-w-5xl"
    >
      {/* Label — keep minimal in hero */}
      <p
        className="text-xs md:text-sm font-semibold uppercase tracking-wider text-center mb-6 md:mb-8"
        style={{ color: "#5A6577", fontSize: "0.7rem" }}
      >
        Works with your favorite tools
      </p>

      {/* Logos Grid */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        {LOGOS.map(({ name, url, width }) => (
          <motion.div
            key={name}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            className="flex items-center"
            style={{ minHeight: "48px" }}
          >
            <img
              src={url}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-6 md:h-8 object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
              style={{ width: "auto", maxWidth: `${width}px` }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
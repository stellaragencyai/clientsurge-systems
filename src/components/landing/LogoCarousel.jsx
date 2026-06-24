import { motion } from "framer-motion";

const LOGOS = [
  { id: 1, name: "Roofing", badge: "Roofing" },
  { id: 2, name: "HVAC", badge: "HVAC" },
  { id: 3, name: "Dental", badge: "Dental" },
  { id: 4, name: "Med Spa", badge: "Med Spa" },
  { id: 5, name: "Plumbing", badge: "Plumbing" },
  { id: 6, name: "Chiropractic", badge: "Chiro" },
];

export default function LogoCarousel() {
  return (
    <section className="w-full py-12 md:py-16 px-6 bg-black/20 backdrop-blur-sm border-t border-b border-cyan-900/20">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold uppercase tracking-wider mb-8"
          style={{ color: "rgba(0,174,239,0.6)" }}
        >
          Trusted by 10,000+ Businesses Across Industries
        </motion.p>

        {/* Desktop: Horizontal scroll */}
        <div className="hidden md:flex gap-4 justify-center flex-wrap">
          {LOGOS.map((logo, idx) => (
            <motion.div
              key={logo.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="px-4 py-3 rounded-lg border transition-all duration-300 hover:border-cyan-400/50 hover:bg-cyan-900/20 cursor-default"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(0, 174, 239, 0.2)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="text-sm font-semibold text-white">{logo.badge}</div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: 2-3 col grid, prevent overflow */}
        <div className="md:hidden grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {LOGOS.slice(0, 4).map((logo, idx) => (
            <motion.div
              key={logo.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="px-3 py-2.5 rounded-lg border transition-all duration-300 hover:border-cyan-400/50 hover:bg-cyan-900/20 cursor-default text-center"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(0, 174, 239, 0.2)",
              }}
            >
              <div className="text-xs font-semibold text-white">{logo.badge}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
import { motion } from "framer-motion";

const PARTNERS = [
  { name: "DentalPro", color: "#0ea5e9" },
  { name: "HeatFlow HVAC", color: "#0284c7" },
  { name: "RoofMaster", color: "#075985" },
  { name: "PlumbRight", color: "#0891b2" },
  { name: "ClearView Med", color: "#38bdf8" },
  { name: "BuildRight Co", color: "#1d4ed8" },
];

export default function TrustedBySection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-10">
            Trusted by service businesses across the US
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-12 gap-y-8 items-center justify-items-center w-full">
            {PARTNERS.map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                <span
                  className="font-titles text-lg md:text-xl font-bold tracking-tight transition-all duration-300 cursor-default select-none"
                  style={{
                    color: "rgba(148,163,184,0.45)",
                    filter: "grayscale(1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = partner.color;
                    e.currentTarget.style.filter = "grayscale(0)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(148,163,184,0.45)";
                    e.currentTarget.style.filter = "grayscale(1)";
                  }}
                >
                  {partner.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
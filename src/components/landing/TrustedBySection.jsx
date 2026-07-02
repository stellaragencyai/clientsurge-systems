import { motion } from "framer-motion";

const PROOF_REQUIREMENTS = [
  "Source",
  "Timestamp",
  "Definition",
  "Test-data filter",
  "Approval status",
  "Fallback state",
];

export default function TrustedBySection() {
  return (
    <section className="py-20 md:py-28 bg-white" data-proof-status="needs-instrumentation">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Public proof standards
          </p>
          <h2 className="font-titles text-[#001B44] text-3xl md:text-4xl font-bold mb-4">
            Trust Claims Stay Hidden Until They Are Verified
          </h2>
          <p className="max-w-3xl text-muted-foreground text-lg mb-10">
            ClientSurge does not publish client logos, testimonial claims, revenue numbers, satisfaction scores, or live-looking metrics unless the proof has a documented source, timestamp, and definition.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-5 items-stretch justify-items-stretch w-full">
            {PROOF_REQUIREMENTS.map((requirement, idx) => (
              <motion.div
                key={requirement}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.06, ease: "easeOut" }}
                className="flex min-h-[92px] items-center justify-center rounded-xl border border-primary/15 bg-primary/5 px-4 py-5 text-center"
              >
                <span className="font-titles text-sm md:text-base font-bold tracking-tight text-[#001B44]">
                  {requirement}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

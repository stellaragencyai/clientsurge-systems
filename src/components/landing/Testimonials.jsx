import { motion } from "framer-motion";
import { useDemoBooking } from "./DemoBookingContext";
import StardustOverlay from "./StardustOverlay";

const testimonials = [
  {
    name: "Med spa lead flow",
    businessType: "Med Spa",
    location: "Scottsdale, AZ",
    before: "Online consult requests wait for manual follow-up",
    after: "New inquiries get an immediate response and booking path",
    result: "Target outcome: faster consult capture",
    quote: "Workflow preview: lead captured, SMS sent, booking handoff started.",
    initials: "MS",
    color: "#00AEEF",
  },
  {
    name: "HVAC missed-call flow",
    businessType: "HVAC Contractor",
    location: "Phoenix, AZ",
    before: "Missed calls end without a callback or text thread",
    after: "Missed callers receive a prompt text-back and routing step",
    result: "Target outcome: fewer dropped calls",
    quote: "Workflow preview: missed call logged, reply captured, next step assigned.",
    initials: "HV",
    color: "#003B8F",
  },
  {
    name: "Dental follow-up flow",
    businessType: "Dental & Orthodontics",
    location: "Tempe, AZ",
    before: "Manual follow-up depends on front desk availability",
    after: "Follow-up sequence keeps qualified patients moving",
    result: "Target outcome: cleaner follow-up queue",
    quote: "Workflow preview: inquiry qualified, nurture started, booking prompt sent.",
    initials: "DE",
    color: "#009DFF",
  },
];

export default function Testimonials() {
  const demoBooking = useDemoBooking();
  return (
    <section id="testimonials" className="nebula-testimonials py-32 md:py-44 px-6 relative overflow-hidden">
      <StardustOverlay seed={21} opacity={0.4} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Launch Scenarios</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Launch Outcomes This System Is Built to Create
          </h2>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Illustrative examples based on the installed workflows. Verified customer case studies can replace these after launch proof.
          </p>
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-6"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {testimonials.map((testimonial) => (
            <motion.article
              key={testimonial.name}
              className="flex flex-col rounded-2xl p-6"
              variants={{
                hidden: { opacity: 0, y: 36 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{
                y: -4,
                boxShadow: "0 12px 32px rgba(0,174,239,0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: "linear-gradient(135deg, rgba(240,249,255,0.72) 0%, rgba(224,242,254,0.55) 100%)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1.5px solid rgba(0,174,239,0.22)",
                boxShadow: "0 4px 24px rgba(0,174,239,0.07), inset 0 1px 0 rgba(255,255,255,0.75)",
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex text-xs font-semibold text-primary/90 bg-primary/10 px-3 py-1 rounded-full">
                  {testimonial.businessType}
                </span>
                <span className="text-xs text-muted-foreground">{testimonial.location}</span>
              </div>

              <div className="mb-5 space-y-3 pb-5 border-b border-border/80">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Before</p>
                  <p className="text-sm text-foreground/70">{testimonial.before}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">After</p>
                  <p className="text-sm font-semibold text-foreground">{testimonial.after}</p>
                </div>
              </div>

              <div className="mb-5 mt-5">
                <span className="inline-flex items-center text-sm font-bold text-white px-4 py-2 rounded-full bg-gradient-to-r from-[#0088CC] to-[#00AEEF]">
                  {testimonial.result}
                </span>
              </div>

              <div className="text-sm text-foreground/75 leading-relaxed flex-1 mb-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary/80">Workflow preview</p>
                &ldquo;{testimonial.quote}&rdquo;
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20 shadow-md text-white text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${testimonial.color} 0%, ${testimonial.color}cc 100%)` }}
                  aria-label={`${testimonial.name} scenario`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.businessType}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <div className="text-center mt-16 pt-10 border-t border-border">
          <p className="text-lg font-semibold text-foreground mb-4">
            Want a workflow like this for your business?
          </p>
          {demoBooking ? (
            <button
              type="button"
              onClick={demoBooking.openDemoBooking}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", boxShadow: "0 4px 18px rgba(0,174,239,0.4)" }}
            >
              Plan My System
            </button>
          ) : (
            <a
              href="/book"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", boxShadow: "0 4px 18px rgba(0,174,239,0.4)" }}
            >
              Plan My System
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
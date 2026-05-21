import { useState } from "react";
import StardustOverlay from "./StardustOverlay";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import DemoBookingModal from "@/components/forms/DemoBookingModal";
import { CinematicButton, premiumEase, revealContainer, revealItem } from "./PremiumHomepageMotion";

export default function FinalCTA() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <>
      <section id="book-demo" className="nebula-cta pt-10 pb-24 md:pb-32 px-6 relative overflow-hidden">
        <StardustOverlay seed={13} opacity={0.6} />

        <motion.div
          className="relative z-10 max-w-3xl mx-auto text-center"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.p variants={revealItem} className="text-xs font-semibold text-primary tracking-widest uppercase mb-6">
            Ready to Start?
          </motion.p>
          <motion.h2 variants={revealItem} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
            You&apos;re Already Getting Leads. <span className="text-primary">Let&apos;s Make Sure You&apos;re Converting Them.</span>
          </motion.h2>
          <motion.p variants={revealItem} className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Schedule a free 15-minute strategy call. We will map out exactly where your business is leaking bookings and show you what an AI lead conversion system would look like for your specific situation — no obligation.
          </motion.p>

          {/* Projection stats — clearly framed as targets not guarantees */}
          <motion.div variants={revealContainer} className="mt-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
            { value: "3x", label: "typical booking rate lift" },
            { value: "< 90s", label: "target first response time" },
            { value: "30 days", label: "typical time to see ROI" }].
            map((stat) =>
            <motion.div key={stat.label} variants={revealItem} className="flex flex-col items-center">
                <span className="font-display text-3xl font-black text-foreground">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</span>
              </motion.div>
            )}
          </motion.div>
          <motion.p variants={revealItem} className="mt-3 text-xs text-muted-foreground/60 italic">
            Based on system capabilities — results vary by business volume and industry.
          </motion.p>


          {/* How the demo works — 3 steps */}
          <motion.div variants={revealContainer} className="mt-12 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-left">
            {[
              { step: "01", title: "Book a 15-min slot", body: "Pick a time that works. No sales pressure, no fluff." },
              { step: "02", title: "We map your lead flow", body: "We show you exactly where bookings are leaking in your current setup." },
              { step: "03", title: "See your system live", body: "We demo the full AI system built for your industry — ready to launch." },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={revealItem}
                whileHover={{ y: -4 }}
                className="relative flex flex-col gap-2"
              >
                <motion.span
                  aria-hidden="true"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, ease: premiumEase }}
                  style={{
                    position: "absolute",
                    top: "18px",
                    left: "0",
                    right: "0",
                    height: "1px",
                    background: "linear-gradient(90deg, rgba(0,174,239,0.42), transparent)",
                    transformOrigin: "left",
                  }}
                />
                <span className="font-display text-4xl font-black" style={{ color: "rgba(0,174,239,0.25)", lineHeight: 1 }}>{item.step}</span>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={revealItem} className="mt-6 text-xs text-muted-foreground/60">
            Free 15-minute call · no commitment required · live in 24–48 hours
          </motion.p>
        </motion.div>

        <div className="max-w-3xl mx-auto text-center mt-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <CinematicButton
              onClick={() => {
                trackCTA("book_your_free_demo", "final_cta");
                setShowBookingModal(true);
              }}
              innerClassName="h-14 px-10 text-base"
            >
              Book Your Free Automation Audit
              <ArrowRight className="w-5 h-5" />
            </CinematicButton>
            <a
              href="/book"
              onClick={() => trackCTA("lead_leakage_audit", "final_cta")}
              className="inline-flex items-center justify-center h-14 px-6 rounded-full border-2 border-primary/30 bg-background/80 text-sm font-semibold text-primary hover:bg-primary/8 hover:border-primary/50 transition-all duration-200">
              
              Get a Free Lead Leakage Audit
            </a>
          </div>
        </div>
      </section>
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </>);

}

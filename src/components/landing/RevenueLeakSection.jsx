import { motion, useReducedMotion } from "framer-motion";
import { PhoneOff, Clock, FileText, Users, ShoppingCart } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";
import CSButton from "@/components/design-system/CSButton";

const LEAKS = [
  { icon: PhoneOff, title: "Missed Calls = Lost Revenue", desc: "Every unanswered call is a prospect with buying intent walking away. Our AI texts them back instantly — before they call your competitor.", severity: "Critical", impactValue: "$500+/mo", impactLabel: "per missed call batch" },
  { icon: Clock, title: "Slow Replies Kill Deals", desc: "Lead interest drops 80% within 5 minutes. Our automated follow-up keeps every lead warm until they reply, book, or opt out.", severity: "High", impactValue: "80% drop", impactLabel: "interest after 5 min" },
  { icon: FileText, title: "Quotes Stall Without Follow-Up", desc: "Quotes and estimates die when nobody has a structured follow-up path. Our nurture sequences keep them moving automatically.", severity: "High", impactValue: "60% stall", impactLabel: "quotes without follow-up" },
  { icon: Users, title: "Old Leads Still Have Intent", desc: "Past inquiries, no-shows, and dormant contacts still have buying intent. Our reactivation engine brings them back to life.", severity: "Medium", impactValue: "30-90 days", impactLabel: "dormant but revivable" },
];

export default function RevenueLeakSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#ffffff" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(0,174,239,0.04) 0%, transparent 50%), radial-gradient(ellipse at 85% 50%, rgba(0,174,239,0.04) 0%, transparent 50%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <CSSectionHeader
          eyebrow="Revenue Leaks"
          title="Your Business Is Losing Bookings Every Hour"
          subtitle="You don't need another dashboard. You need the first response, follow-up, booking handoff, review request, and reactivation path to stop depending on memory. Pick a system, add to cart, and we fix it."
          align="center"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {LEAKS.map((leak, i) => {
            const Icon = leak.icon;
            return (
              <motion.div
                key={leak.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="cs-glow-card p-6 relative overflow-hidden"
              >
                {/* Severity indicator — top-right corner */}
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-wider" style={{ background: `rgba(0, 174, 239, ${0.08 + i * 0.04})`, color: "#006BB0" }}>
                  {leak.severity}
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2" style={{ fontSize: "1.05rem", lineHeight: 1.3, color: "#111318" }}>{leak.title}</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "#3a3d47" }}>{leak.desc}</p>
                {/* Impact stat — makes the loss tangible */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="font-titles font-black text-[#006BB0]" style={{ fontSize: "1.3rem", lineHeight: 1 }}>{leak.impactValue}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{leak.impactLabel}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Cumulative loss bar — visual progression of total damage */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 rounded-2xl p-6 md:p-8"
          style={{ background: "linear-gradient(135deg, #EEF9FF 0%, #F8FBFE 100%)", border: "1px solid rgba(0, 174, 239, 0.22)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#006BB0] mb-1">Cumulative Revenue Leak</p>
              <p className="font-titles font-black text-[#003B8F]" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: 1 }}>
                $2,000 – $15,000+
              </p>
              <p className="text-sm text-slate-500 mt-1">per month for a typical service business with 50+ leads</p>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-end gap-1 h-12">
                {[20, 40, 60, 80, 100].map((h, i) => (
                  <div key={i} className="rounded-t" style={{ width: "8px", height: `${h}%`, background: `rgba(0, 107, 176, ${0.3 + i * 0.12})` }} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Growing every hour</p>
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-10">
          <CSButton
            to="/pricing"
            variant="primary"
            size="md"
            icon={ShoppingCart}
            onClick={() => trackCTA("revenue_leak_browse_store", "revenue_leak")}
          >
            Compare Packages to Fix This
          </CSButton>
        </div>
      </div>
    </section>
  );
}

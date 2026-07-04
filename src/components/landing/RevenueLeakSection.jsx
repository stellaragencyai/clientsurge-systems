import { motion, useReducedMotion } from "framer-motion";
import { PhoneOff, Clock, FileText, Users, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import SectionHeader from "@/components/design-system/SectionHeader";

const LEAKS = [
  { icon: PhoneOff, title: "Missed Calls = Lost Revenue", desc: "Every unanswered call is a prospect with buying intent walking away. Our AI texts them back instantly — before they call your competitor." },
  { icon: Clock, title: "Slow Replies Kill Deals", desc: "Lead interest drops 80% within 5 minutes. Our automated follow-up keeps every lead warm until they reply, book, or opt out." },
  { icon: FileText, title: "Quotes Stall Without Follow-Up", desc: "Quotes and estimates die when nobody has a structured follow-up path. Our nurture sequences keep them moving automatically." },
  { icon: Users, title: "Old Leads Still Have Intent", desc: "Past inquiries, no-shows, and dormant contacts still have buying intent. Our reactivation engine brings them back to life." },
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
        <SectionHeader
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
                className="rounded-2xl p-6 cs-card-shadow"
                style={{ background: "#ffffff", border: "1px solid rgba(0,174,239,0.20)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2" style={{ fontSize: "1.05rem", lineHeight: 1.3, color: "#111318" }}>{leak.title}</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "#3a3d47" }}>{leak.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/store"
            onClick={() => trackCTA("revenue_leak_browse_store", "revenue_leak")}
            className="cs-btn-primary inline-flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Browse AI Systems to Fix This
          </Link>
        </div>
      </div>
    </section>
  );
}
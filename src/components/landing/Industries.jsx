import { useState } from "react";
import { Sparkles, Heart, Building2, Home, MapPin, Wrench, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DemoBookingModal from "../forms/DemoBookingModal";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    problem: "Missing consultations, no-shows costing revenue.",
    desc: "Capture aesthetic & injectable inquiries instantly. Confirm appointments and reduce no-shows with automated follow-up sequences.",
    result: "2.4× more consultations booked • 34% fewer no-shows",
    href: "/med-spa",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=85",
    bullets: [
      "Instant SMS/email response to every new inquiry",
      "Automated consultation reminders 24h & 1h before",
      "Missed call text-back so no lead goes unanswered",
      "Reactivate old leads who never booked",
      "Booking link sent automatically after first contact",
    ],
    detail: "Med spas lose an average of $12,000/month in missed consultations. Our system responds to every lead within 90 seconds — even at 2am — and handles the entire booking flow so your front desk can focus on in-clinic guests.",
  },
  {
    icon: Heart,
    name: "Wellness Studios",
    problem: "Leads dropping off before membership conversion.",
    desc: "Instantly follow up with trial class inquiries. Reactivate dormant members and convert more paid leads without extra ad spend.",
    result: "58% higher conversion rates • 3× faster response time",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=85",
    bullets: [
      "Auto-respond to trial class & membership inquiries",
      "Smart nurture sequences for non-converters",
      "Win-back campaigns for cancelled members",
      "Follow-up after every trial class attendance",
      "Pipeline dashboard to track every prospect",
    ],
    detail: "Most studios spend heavily on ads but lose leads in the follow-up gap. We bridge that gap with personalized, automated touchpoints that feel human — turning trial visitors into long-term paying members.",
  },
  {
    icon: Building2,
    name: "Real Estate Agents & Brokers",
    problem: "Slow response time loses showings to competitors.",
    desc: "Respond to property inquiries within minutes. Automate showing scheduling, follow-ups, and buyer nurturing from first contact to closing.",
    result: "5× more showings scheduled • 42% faster lead response",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=85",
    bullets: [
      "Instant lead response under 90 seconds, 24/7",
      "Auto-qualify buyers with smart SMS sequences",
      "Showing scheduling sent with calendar link",
      "Long-term nurture for leads not ready yet",
      "Automated post-showing follow-up & feedback",
    ],
    detail: "87% of buyers choose the agent who responds first. Our system keeps you ahead of every competitor by responding instantly, qualifying the lead, and scheduling the showing — all before you pick up your phone.",
  },
  {
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    problem: "Can't respond to service calls while on the job.",
    desc: "Field teams stay focused while automated systems capture estimate requests, book appointments, and follow up on pending quotes.",
    result: "65% more jobs booked • 24/7 lead capture & response",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=85",
    bullets: [
      "Never miss a service call — auto-response 24/7",
      "Estimate follow-ups sent automatically",
      "Appointment reminders reduce no-shows",
      "Upsell existing customers on maintenance plans",
      "Review requests sent after every completed job",
    ],
    detail: "When you're under a sink or on a roof, you can't answer every call. Our system captures every lead, schedules estimates, and follows up on pending quotes — so you close more jobs without lifting a finger.",
  },
  {
    icon: Home,
    name: "Contractors, Electricians & Trades",
    problem: "Losing bids to whoever responds first.",
    desc: "Instant quote request responses keep you top-of-mind when crews are on-site. Win more contracts with intelligent bid tracking.",
    result: "3.2× more quotes accepted • Higher win rates on bids",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=85",
    bullets: [
      "Instant acknowledgement on every quote request",
      "Automated follow-up on submitted bids",
      "Reminder sequences for undecided prospects",
      "Re-engage past clients for repeat projects",
      "Job completion follow-ups to generate referrals",
    ],
    detail: "In contracting, speed wins bids. We make sure you're the first to respond every single time — and then keep following up until the prospect decides. Most contractors see a 3× increase in accepted quotes within 60 days.",
  },
  {
    icon: MapPin,
    name: "Local Service Businesses",
    problem: "Paying for leads but not converting them.",
    desc: "Capture leads across all channels. Automated follow-up, appointment reminders, and reactivation campaigns turn paid traffic into bookings.",
    result: "2–3× ROAS on marketing spend • 40% more appointments",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=85",
    bullets: [
      "Capture leads from Google, Facebook, Instagram & web",
      "Instant multi-channel follow-up (SMS + email)",
      "Appointment booking without manual scheduling",
      "Reactivate cold leads from your existing database",
      "ROI tracking to see exactly what's working",
    ],
    detail: "If you're running ads and not following up within 5 minutes, you're wasting your budget. Our system connects to every lead source and turns clicks into confirmed appointments — automatically, around the clock.",
  },
];

export default function Industries() {
  const [selected, setSelected] = useState(null);
  const [demoIndustry, setDemoIndustry] = useState(null);

  return (
    <section id="industries" className="bg-gradient-to-b from-card via-background to-card">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center pt-24 pb-14 px-6">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Who We Work With</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
          <span className="text-foreground">Built for </span>
          <span className="text-primary">Businesses</span>
          <span className="text-foreground"> That Run on </span>
          <span className="text-primary">Bookings</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          Click your industry — we'll show you exactly how it works for you.
        </p>
      </div>

      {/* Full-bleed 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {industries.map((ind, i) => {
          const Icon = ind.icon;
          return (
            <button
              key={i}
              onClick={() => setSelected(ind)}
              className="group relative overflow-hidden cursor-pointer text-left focus:outline-none"
              style={{ minHeight: "358px" }}
            >
              {/* Full image — no zoom */}
              <img
                src={ind.image}
                alt={`${ind.name} - ${ind.problem}`}
                loading="lazy"
                className="w-full h-full object-cover absolute inset-0"
                style={{ minHeight: "358px" }}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)" }} />

              {/* Animated gold shimmer border on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 0 2px rgba(200,150,92,0.7)",
                  background: "linear-gradient(135deg, rgba(200,150,92,0.08) 0%, transparent 50%, rgba(200,150,92,0.06) 100%)",
                }}
              />

              {/* Title at bottom — scrolls up with the drawer */}
              <div
                className="absolute bottom-0 left-0 right-0 transition-transform duration-800 ease-out group-hover:-translate-y-[100px]"
                style={{ padding: "0 24px 16px", transitionDuration: "800ms" }}
              >
                <h3 className="text-base font-bold text-white leading-snug drop-shadow-lg">
                  {ind.name}
                </h3>
              </div>

              {/* Glass drawer — slides up from below, title is part of it */}
              <div
                className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform ease-out"
                style={{
                  transitionDuration: "800ms",
                  background: "rgba(15,14,12,0.72)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  borderTop: "1px solid rgba(200,150,92,0.35)",
                  padding: "16px 24px 20px",
                }}
              >
                <p className="text-xs text-white/60 leading-relaxed mb-3">{ind.problem}</p>
                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "#f5d9a8" }}>
                  Click to see the full solution →
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pb-0" />

      {/* Expanded overlay */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.55)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setSelected(null)}
            />

            {/* Expanded modal — doubled size */}
            <motion.div
              className="fixed z-50 overflow-hidden rounded-3xl shadow-2xl"
              style={{ background: "#0f0e0c" }}
              initial={{ width: "31vw", height: "480px", top: "50%", left: "50%", x: "-50%", y: "-50%", opacity: 0.4, scale: 0.5 }}
              animate={{ width: "min(1400px, 96vw)", height: "auto", top: "50%", left: "50%", x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
              exit={{ width: "31vw", height: "480px", opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
            >
              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-white focus:outline-none hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
                aria-label="Close industry details"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Main layout: top image, bottom content */}
              <div className="flex flex-col lg:grid lg:grid-cols-[58%_42%]" style={{ minHeight: "700px" }}>

                {/* LEFT — Full image panel */}
                <div className="relative overflow-hidden" style={{ minHeight: "500px" }}>
                  <img
                    src={selected.image}
                    alt={`${selected.name} - Industry solution for lead conversion`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{ minHeight: "700px" }}
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 60%, rgba(15,14,12,0.92) 100%)" }} />

                  {/* Icon + industry tag */}
                  <div className="absolute top-8 left-8 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                      {(() => { const Icon = selected.icon; return <Icon className="w-6 h-6 text-white" />; })()}
                    </div>
                    <span className="font-inter text-xs font-bold uppercase tracking-widest text-white/70">Industry Solution</span>
                  </div>

                  {/* Result stat overlaid at bottom of image */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: "rgba(161,120,35,0.2)", backdropFilter: "blur(16px)", border: "1px solid rgba(161,120,35,0.4)" }}>
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#c8965c" }} />
                      <span className="font-inter text-sm font-bold text-white">{selected.result}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Content panel */}
                <div className="flex flex-col justify-between overflow-y-auto" style={{ padding: "48px 44px", maxHeight: "90vh", background: "#0f0e0c" }}>
                  
                  {/* Header */}
                  <div>
                    <h2 className="font-display" style={{ fontSize: "2.25rem", fontWeight: "700", color: "#f5e6d0", lineHeight: "1.15", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                      {selected.name}
                    </h2>
                    <p className="font-inter" style={{ fontSize: "0.75rem", color: "#c8965c", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "28px" }}>
                      {selected.problem}
                    </p>

                    {/* Divider */}
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", marginBottom: "28px" }} />

                    {/* Detail paragraph */}
                    <p className="font-inter" style={{ fontSize: "1rem", color: "rgba(245,230,208,0.72)", lineHeight: "1.85", marginBottom: "32px" }}>
                      {selected.detail}
                    </p>

                    {/* What You Get */}
                    <p className="font-inter" style={{ fontSize: "0.7rem", color: "rgba(200,150,92,0.7)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>
                      What's Included
                    </p>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "36px" }}>
                      {selected.bullets.map((b, idx) => (
                        <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8965c", flexShrink: 0, marginTop: "8px" }} />
                          <span className="font-inter" style={{ fontSize: "0.95rem", color: "rgba(245,230,208,0.8)", lineHeight: "1.6" }}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div>
                    <button
                      onClick={() => { const name = selected.name; setSelected(null); setDemoIndustry(name); }}
                       style={{ display: "block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 24px rgba(120,70,20,0.45)", border: "none", cursor: "pointer", width: "100%", marginBottom: "12px" }}
                       onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 48px rgba(161,120,35,0.65), 0 4px 18px rgba(120,70,20,0.4)"; }}
                       onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(120,70,20,0.45)"; }}
                       className="focus:ring-2 focus:ring-white focus:outline-none"
                     >
                      <span className="font-inter" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", height: "56px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1.05rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                        Book a Free Demo
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </button>
                    <p className="font-inter" style={{ fontSize: "0.7rem", color: "rgba(245,230,208,0.35)", textAlign: "center", letterSpacing: "0.08em" }}>
                     Free 15-min call • No commitment • Live in 5–7 days
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {demoIndustry && (
        <DemoBookingModal
          onClose={() => setDemoIndustry(null)}
          prefillIndustry={demoIndustry}
        />
      )}
    </section>
  );
}
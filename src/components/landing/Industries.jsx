import { useState } from "react";
import { Sparkles, Heart, Building2, Home, MapPin, Wrench, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LeadCaptureModal from "../forms/LeadCaptureModal";

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
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85",
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
    image: "https://images.unsplash.com/photo-1504801990592-bef489c9b9a8?w=900&q=85",
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
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=85",
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
  const [showLeadModal, setShowLeadModal] = useState(false);

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
              className="group relative flex flex-col overflow-hidden cursor-pointer text-left focus:outline-none border-2 border-transparent transition-colors duration-300 hover:border-[#a0714f]"
              style={{ minHeight: "480px" }}
            >
              {/* Image — 70% */}
              <div className="relative overflow-hidden" style={{ flex: "0 0 70%" }}>
                <img
                  src={ind.image}
                  alt={ind.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ minHeight: "320px" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/55" />
                <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content — 30% */}
              <div className="relative flex-1 bg-white px-6 py-5 flex flex-col justify-between border-t border-border group-hover:bg-primary/5 transition-colors duration-300">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-snug">
                    {ind.name}
                  </h3>
                  <p className="text-xs font-medium text-primary/80 mb-2">{ind.problem}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{ind.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                   <p className="text-[10px] font-semibold text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity">{ind.result}</p>
                   <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
                 </div>
              </div>

              {i % 3 !== 2 && (
                <div className="absolute top-0 right-0 w-px h-full bg-border/40 hidden md:block" />
              )}
            </button>
          );
        })}
      </div>

      <div className="pb-24" />

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

            {/* Expanding card — 50% bigger */}
            <motion.div
              className="fixed z-50 overflow-hidden rounded-2xl shadow-2xl bg-white"
              initial={{ width: "31vw", height: "480px", top: "50%", left: "50%", x: "-50%", y: "-50%", opacity: 0.4, scale: 0.5 }}
              animate={{ width: "min(1100px, 95vw)", height: "auto", top: "50%", left: "50%", x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
              exit={{ width: "31vw", height: "480px", opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            >
              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-lg transition-all border border-border"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>

              {/* Main Grid: Image Left (55%), Content Right (45%) */}
              <div className="grid lg:grid-cols-[55%_45%] gap-0">
                {/* Image Section — Large and prominent */}
                <div className="relative overflow-hidden order-1 lg:order-none" style={{ minHeight: "500px" }}>
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Icon badge in corner */}
                  <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    {(() => { const Icon = selected.icon; return <Icon className="w-6 h-6 text-white" />; })()}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 lg:p-10 flex flex-col justify-between overflow-y-auto max-h-[90vh] lg:max-h-[600px]">
                  {/* Header */}
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Industry Solution</p>
                    <h2 className="font-display text-2xl lg:text-3xl font-semibold text-foreground mb-2 leading-tight">
                      {selected.name}
                    </h2>
                    <p className="text-sm font-bold text-primary mb-6">{selected.result}</p>

                    {/* Challenge & Solution */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2">The Challenge</p>
                      <p className="text-sm font-semibold text-foreground mb-4">{selected.problem}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.detail}</p>
                    </div>

                    {/* Bullets */}
                    <div>
                      <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">What You Get</p>
                      <ul className="space-y-2">
                        {selected.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-foreground">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button — Golden Brown */}
                  <button
                    onClick={() => {
                      setSelected(null);
                      setShowLeadModal(true);
                    }}
                    style={{display:"block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.3s ease, transform 0.2s ease",border:"none",cursor:"pointer",width:"100%",marginTop:"24px"}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
                    }}
                  >
                    <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",height:"48px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
                      Book a Free Demo
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Free 30-min call • No commitment • Live in 5–7 days
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lead Capture Modal */}
      <LeadCaptureModal 
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => {
          setShowLeadModal(false);
          window.location.href = '/book';
        }}
      />
    </section>
  );
}
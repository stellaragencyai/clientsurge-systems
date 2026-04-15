import { useEffect, useRef, useState } from "react";
import { MessageSquare, Zap, Send, CalendarCheck, CheckCircle2, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "Step 1",
    icon: MessageSquare,
    title: "Lead Comes In",
    timeframe: "Day 0 — Instantly",
    desc: "A prospect fills out your website form, sends an Instagram DM, calls your number, or clicks a Google ad. Every channel is captured automatically — nothing is missed.",
    bullets: [
      "Website, Facebook, Instagram, Google & phone all connected",
      "Lead is logged, tagged, and scored in real-time",
      "Your team gets notified — but the system already responded",
    ],
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=700&q=80",
  },
  {
    step: "Step 2",
    icon: Zap,
    title: "Instant Response Sent",
    timeframe: "Within 90 Seconds",
    desc: "A personalized SMS or email goes out immediately — using their name and referencing their specific inquiry. No generic blasts. Feels human. Reads professional.",
    bullets: [
      "Personalized using their name and inquiry type (Botox, fillers, laser, etc.)",
      "Sent via SMS and/or email simultaneously",
      "Proven message templates optimized for med spa conversions",
    ],
    image: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=700&q=80",
  },
  {
    step: "Step 3",
    icon: Send,
    title: "Smart Follow-Up Sequence",
    timeframe: "Days 1–14",
    desc: "If they don't book immediately, the system follows up across multiple days and channels. Each message is timed and crafted to move them one step closer — never pushy, always relevant.",
    bullets: [
      "Multi-touch sequences: Day 1, Day 3, Day 7, Day 14",
      "Stops automatically the moment they reply or book",
      "Different messages for cold, warm, and near-ready leads",
    ],
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&q=80",
  },
  {
    step: "Step 4",
    icon: CalendarCheck,
    title: "Consultation Booked",
    timeframe: "Day 1–7 on Average",
    desc: "When the lead is warm, a direct booking link goes to your calendar. No phone tag, no back-and-forth. They pick a time, it's confirmed, and automated reminders reduce no-shows.",
    bullets: [
      "Direct integration with Calendly, Acuity, Jane, Mindbody, Vagaro",
      "Confirmation sent instantly via SMS + email",
      "Reminder at 24h and 1h before — avg. 34% fewer no-shows",
    ],
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=700&q=80",
  },
  {
    step: "Step 5",
    icon: CheckCircle2,
    title: "Client Arrives — System Keeps Working",
    timeframe: "Ongoing & Repeating",
    desc: "After the visit, the system asks for a review, logs the outcome, and begins a long-term nurture sequence to drive repeat bookings and referrals — completely automatically.",
    bullets: [
      "Post-visit review request sent automatically",
      "Re-engagement sequence for repeat treatment bookings",
      "Old lead reactivation for past inquiries never converted",
    ],
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=700&q=80",
  },
];

function StepCard({ step, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className={`group flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} rounded-2xl overflow-hidden border border-border bg-white hover:shadow-lg hover:border-primary/25 transition-all duration-300`} style={{ minHeight: "340px" }}>
        {/* Image */}
        <div className="md:w-80 lg:w-96 h-56 md:h-auto flex-shrink-0 overflow-hidden">
          <img src={step.image} alt={step.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        {/* Content */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{step.step}</span>
            <span className="text-xs font-semibold text-primary bg-primary/8 border border-primary/15 px-3 py-1 rounded-full">{step.timeframe}</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground">{step.title}</h3>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed mb-5">{step.desc}</p>
          <ul className="space-y-2">
            {step.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                <span className="text-sm text-foreground/60">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function MedSpaDetailedFlow() {
  return (
    <section id="how-it-works-medspa" className="py-24 md:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Process</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-5">
            How Every Lead Becomes a Booked Consultation
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Five steps. Fully automated. Runs 24/7 without your team lifting a finger.
          </p>
        </div>

        {/* Summary flow */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center max-w-[80px] leading-snug">{s.title}</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-primary/40 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="space-y-8">
          {steps.map((step, i) => <StepCard key={i} step={step} index={i} />)}
        </div>
      </div>
    </section>
  );
}
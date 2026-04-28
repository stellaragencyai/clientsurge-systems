import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, Zap, Send, CalendarCheck, CheckCircle2, ChevronDown, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "Step 1",
    icon: MessageSquare,
    title: "Lead Comes In",
    timeframe: "Day 0 — Instantly",
    desc: "A prospect fills out a form, calls your number, sends a DM, or clicks an ad. No matter the channel — the system captures them immediately and logs them into your pipeline.",
    bullets: [
      "Works across web forms, Facebook, Instagram, Google & phone",
      "Every lead is tagged, timestamped, and scored automatically",
      "Zero manual entry — your CRM is updated in real time",
    ],
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80",
  },
  {
    step: "Step 2",
    icon: Zap,
    title: "Instant Response Sent",
    timeframe: "Within 90 Seconds",
    desc: "Before your competitor even sees the notification, your lead receives a personalized SMS and/or email response. Speed is the single biggest driver of conversion — we give you an unfair advantage.",
    bullets: [
      "Personalized message using the lead's name & inquiry details",
      "SMS + email sent simultaneously for maximum reach",
      "Proven message templates optimized for your niche",
    ],
    image: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=600&q=80",
  },
  {
    step: "Step 3",
    icon: Send,
    title: "Smart Follow-Up Sequence",
    timeframe: "Days 1–14",
    desc: "If they don't book right away, a carefully timed sequence of follow-up messages keeps you top-of-mind. Each message is crafted to move them one step closer to booking — without being pushy.",
    bullets: [
      "Multi-touch sequences across SMS, email, and voicemail",
      "Timing optimized based on industry response data",
      "Stops automatically once they reply or book",
    ],
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
  },
  {
    step: "Step 4",
    icon: CalendarCheck,
    title: "Appointment Booked",
    timeframe: "Day 1–7 on Average",
    desc: "Once they're ready, a booking link goes straight to your calendar. No phone tag. No back-and-forth. They pick a time, it's confirmed, and both parties get a reminder automatically.",
    bullets: [
      "Direct calendar integration — no scheduling friction",
      "Automated confirmation & reminder sequence",
      "Smart rescheduling if they need to change",
    ],
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
  },
  {
    step: "Step 5",
    icon: CheckCircle2,
    title: "Customer Arrives & You Get Paid",
    timeframe: "Ongoing & Repeating",
    desc: "They show up ready. You deliver your service. The system automatically asks for a review, logs the win, and re-enters them into a long-term nurture sequence for repeat business and referrals.",
    bullets: [
      "Post-visit review request sent automatically",
      "Re-engagement sequence for repeat bookings",
      "Pipeline analytics show you exactly what's working",
    ],
    image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&q=80",
  },
];

function StepCard({ step, index, isLast }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const Icon = step.icon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 relative ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Vertical timeline line */}
      {!isLast && (
        <div className="absolute left-6 top-20 w-0.5 h-32 bg-gradient-to-b from-primary/60 to-primary/20" style={{ background: "linear-gradient(180deg, rgba(161,120,35,0.6) 0%, rgba(161,120,35,0.2) 100%)" }} />
      )}

      <div className="relative flex gap-8 md:gap-0 md:grid md:grid-cols-[80px_1fr_400px]">
        {/* Left — Step Badge & Timeline Dot */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 font-bold text-white text-sm uppercase tracking-wider" style={{ background: "linear-gradient(135deg, rgba(161,120,35,1) 0%, rgba(139,91,52,1) 100%)" }}>
            {index + 1}
          </div>
          {!isLast && <div className="w-0.5 flex-1 min-h-24" style={{ background: "linear-gradient(180deg, rgba(161,120,35,0.4) 0%, rgba(161,120,35,0.1) 100%)" }} />}
        </div>

        {/* Middle — Content */}
        <div className="flex-1 p-8 rounded-2xl border-2 bg-white" style={{ borderColor: "rgba(209,182,155,0.4)", boxShadow: "0 8px 24px rgba(107,63,31,0.08)" }}>
          {/* Title & Timeframe */}
          <div className="mb-4">
            <h3 className="font-display text-2xl font-semibold text-black mb-2">{step.title}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(161,120,35,1)" }}>{step.timeframe}</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {step.desc}
          </p>

          {/* Checkmark Bullets */}
          <ul className="space-y-3">
            {step.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(161,120,35,0.15)", border: "1.5px solid rgba(161,120,35,0.4)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "rgba(161,120,35,1)" }} />
                </div>
                <span className="text-sm text-slate-700 font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Image */}
        <div className="hidden md:block h-80 rounded-2xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: "rgba(209,182,155,0.4)", boxShadow: "0 8px 24px rgba(107,63,31,0.08)" }}>
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          />
        </div>
      </div>
    </div>
  );
}



export default function DetailedProcess() {
  return (
    <section className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-background via-background to-card border-t-2 border-border">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-5xl font-semibold tracking-tight" style={{color: "rgba(161,120,35,1)", textShadow: "0 0 50px rgba(161,120,35,0.8), 0 0 100px rgba(161,120,35,0.4)"}}>
            How You Turn Leads Into Booked Appointments
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            From first contact to confirmed booking. Five clear steps. All automated.
          </p>
        </div>

        {/* Summarized flow */}
        <div className="mb-20 flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all" style={{background: "rgba(161,120,35,0.15)", border: "2px solid rgba(161,120,35,0.3)", boxShadow: "0 0 30px rgba(161,120,35,0.25)"}}>
                    <Icon className="w-7 h-7" style={{color: "rgba(161,120,35,1)"}} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{color: "rgba(161,120,35,1)"}}>{step.step}</p>
                  <p className="text-xs font-semibold text-foreground mt-1 text-center">{step.title}</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="w-5 h-5 text-muted-foreground hidden md:block" style={{color: "rgba(161,120,35,0.6)"}} />}
              </div>
            );
          })}
        </div>

        {/* Detailed steps */}
        <h3 className="font-display text-3xl md:text-4xl font-semibold text-center mb-12" style={{color: "rgba(161,120,35,1)", textShadow: "0 0 40px rgba(161,120,35,0.7), 0 0 80px rgba(161,120,35,0.35)"}}>
          Our Detailed Process
        </h3>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} isLast={i === steps.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
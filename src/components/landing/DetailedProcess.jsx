import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, Zap, Send, CalendarCheck, CheckCircle2, ChevronDown } from "lucide-react";

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

function StepCard({ step, index }) {
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
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${index * 80}ms`, height: "420px" }}
    >
      <div
        className="group relative flex flex-col md:flex-row rounded-2xl overflow-hidden border border-border bg-white transition-all duration-300 h-full"
        style={{
          boxShadow: "0 4px 20px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "#000000";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "hsl(var(--border))";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)";
        }}
      >
        {/* Left — content */}
        <div className="flex-1 p-10 md:p-12">
          {/* Step badge */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold text-black/80 uppercase tracking-widest">{step.step}</span>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
              {step.timeframe}
            </span>
          </div>

          {/* Icon + Title */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-black">{step.title}</h3>
          </div>

          <p className="text-sm text-black/70 leading-relaxed mb-6 font-medium">
            {step.desc}
          </p>

          <ul className="space-y-3">
            {step.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                <span className="text-sm text-black/60 font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — image */}
        <div className="md:w-80 lg:w-96 h-60 md:h-auto overflow-hidden flex-shrink-0">
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
}



export default function DetailedProcess() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-amber-50/20 via-background to-card">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Under The Hood</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Our Detailed <span className="relative inline-block" style={{color: "rgba(161,120,35,1)", textShadow: "0 0 30px rgba(161,120,35,0.6), 0 0 60px rgba(161,120,35,0.35)"}}>Automation</span> Process
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            A step-by-step look at exactly how every lead is handled — from first touch to confirmed booking.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
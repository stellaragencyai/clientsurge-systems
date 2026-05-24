import { useEffect, useRef, useState } from "react";
import { MessageSquare, Zap, Send, CalendarCheck, CheckCircle2 } from "lucide-react";

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
  const innerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(0);
  const Icon = step.icon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (innerRef.current) {
      setHeight(innerRef.current.scrollHeight);
    }
  }, []);

  const delay = index * 120;

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        maxHeight: visible ? `${height + 40}px` : "0px",
        transform: visible ? "translateY(0) scaleY(1)" : "translateY(24px) scaleY(0.92)",
        transformOrigin: "top center",
        transition: `opacity 0.6s ease ${delay}ms, max-height 0.65s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.6s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
    <div ref={innerRef}>
      {/* Vertical timeline line */}
      {!isLast && (
        <div className="absolute left-8 top-24 w-1 h-40 rounded-full" style={{ background: "linear-gradient(180deg, rgba(161,120,35,0.8) 0%, rgba(161,120,35,0.2) 100%)" }} />
      )}

      <div className="relative grid grid-cols-1 md:grid-cols-[120px_1fr_380px] gap-8 md:gap-6">
        {/* Left — Step Badge & Timeline Dot */}
        <div className="flex md:flex-col items-start md:items-center justify-start md:justify-start gap-4 md:gap-0">
          <div className="w-16 h-16 md:w-14 md:h-14 flex items-center justify-center font-bold text-white text-sm uppercase tracking-wider rounded-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(161,120,35,1) 0%, rgba(139,91,52,1) 100%)" }}>
            STEP {index + 1}
          </div>
        </div>

        {/* Middle — Content */}
        <div className="p-6 md:p-7 rounded-3xl border-2 bg-white h-fit" style={{ borderColor: "rgba(209,182,155,0.5)" }}>
          {/* Title */}
          <h3 className="font-display text-2xl md:text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
          
          {/* Timeframe */}
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "rgba(161,120,35,1)" }}>{step.timeframe}</p>

          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            {step.desc}
          </p>

          {/* Checkmark Bullets */}
          <ul className="space-y-2.5">
            {step.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(161,120,35,0.15)", border: "2px solid rgba(161,120,35,0.5)" }}>
                  <CheckCircle2 className="w-3 h-3" style={{ color: "rgba(161,120,35,1)" }} />
                </div>
                <span className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Image */}
        <div className="hidden md:block h-72 rounded-3xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: "rgba(209,182,155,0.5)" }}>
          <img
            src={step.image}
            alt={step.title}
            width="640"
            height="480"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          />
        </div>
      </div>
    </div>
    </div>
  );
}



export default function DetailedProcess() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
            Our Detailed Process
          </h2>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
            A deep dive into each step of your project journey.
          </p>
        </div>

        {/* Detailed steps */}
        <div className="space-y-12">
          {steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} isLast={i === steps.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

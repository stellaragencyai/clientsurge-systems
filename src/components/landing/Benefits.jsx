import { ArrowRight, Timer, CalendarCheck, ShieldCheck, UsersRound, TrendingUp, BadgeDollarSign } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const benefits = [
  {
    icon: Timer,
    title: "Respond Before Your Competitor Does",
    desc: "First to respond wins the booking. Our systems reply in under 60 seconds — day, night, weekends.",
  },
  {
    icon: CalendarCheck,
    title: "A Fuller Calendar, Without More Effort",
    desc: "Automated booking flows mean more appointments confirmed and fewer no-shows draining your day.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Leads Slipping Through",
    desc: "Every inquiry gets a response. Every follow-up gets sent. Nothing depends on someone remembering.",
  },
  {
    icon: UsersRound,
    title: "Your Team Focuses on What Matters",
    desc: "When follow-up is automated, your staff focuses on clients in front of them — not chasing cold leads.",
  },
  {
    icon: TrendingUp,
    title: "Higher Conversions From the Same Traffic",
    desc: "You're already paying for leads. We help you convert more of them — without spending a dollar more on ads.",
  },
  {
    icon: BadgeDollarSign,
    title: "Revenue You Were Already Leaving on the Table",
    desc: "Missed calls, slow replies, forgotten leads. Our systems recover that revenue and turn it into bookings.",
  },
];

function AnimatedText({ text }) {
  const [displayedText, setDisplayedText] = useState("");
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [isVisible, text]);

  return <span ref={ref} className="inline">{displayedText}</span>;
}

function BenefitCard({ benefit, index, isVisible }) {
  const ref = useRef(null);
  const [showBorder, setShowBorder] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const delay = index * 150;
    const timeout = setTimeout(() => {
      setShowBorder(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isVisible, index]);

  return (
    <div
      ref={ref}
      className={`flex gap-4 p-6 bg-white rounded-2xl transition-all duration-500 ${
        showBorder ? "opacity-100 translate-y-0 border-black" : "opacity-0 translate-y-4 border-border"
      }`}
      style={{
        borderWidth: "1px",
        borderStyle: "solid",
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
        <benefit.icon className="w-4 h-4 text-primary" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">{benefit.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
      </div>
    </div>
  );
}

export default function Benefits() {
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSectionVisible(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-card to-background border-t-2 border-border">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-foreground/70 tracking-widest uppercase mb-4">The Outcomes</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-5xl font-semibold tracking-tight text-foreground">
            What Changes When You <span style={{color: "rgba(161,120,35,1)", textShadow: "0 0 30px rgba(161,120,35,0.6), 0 0 60px rgba(161,120,35,0.35)"}}><AnimatedText text="Automate" /></span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <BenefitCard key={i} benefit={b} index={i} isVisible={sectionVisible} />
          ))}
        </div>

        <div className="text-center mt-14">
          <button onClick={() => window.location.href = '/book'} style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.5s ease, transform 0.3s ease", cursor:"pointer",border:"none"}} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
          }}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
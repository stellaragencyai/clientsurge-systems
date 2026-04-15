import { useState } from 'react';
import { ArrowRight, Zap, MessageSquare, PhoneCall, CalendarCheck, RotateCcw, LayoutDashboard, HeadphonesIcon, TrendingUp } from "lucide-react";
import LeadCaptureModal from "../forms/LeadCaptureModal";

const includes = [
  { icon: Zap, step: "01", title: "Instantly respond to every lead", desc: "Before your competitors do — personalized replies within seconds." },
  { icon: MessageSquare, step: "02", title: "Turn inquiries into booked appointments", desc: "Guided booking flow that converts more leads into confirmed bookings." },
  { icon: PhoneCall, step: "03", title: "Recover bookings from missed calls", desc: "Every missed call gets an immediate text-back — zero leads disappear." },
  { icon: ArrowRight, step: "04", title: "Automate follow-up so nothing slips through", desc: "Multi-step sequences keep leads warm and moving toward booking." },
  { icon: RotateCcw, step: "05", title: "Reactivate old leads into new revenue", desc: "Turn dormant contacts into fresh opportunities with proven campaigns." },
  { icon: CalendarCheck, step: "06", title: "Booking Flow", desc: "Leads guided directly to your calendar. No phone tag, no friction." },
  { icon: LayoutDashboard, step: "07", title: "CRM Pipeline Automation", desc: "Auto-tagging, status updates, and task creation — your pipeline runs itself." },
  { icon: HeadphonesIcon, step: "08", title: "Ongoing Support", desc: "Continuous optimization and priority support from our team post-launch." },
];

export default function CoreOffer() {
  const [showLeadModal, setShowLeadModal] = useState(false);
  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-card via-white to-background">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Package</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            A Done-For-You System That Turns Leads Into Booked Clients
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            We build, install, and run the system — so you get more bookings without doing the work.
          </p>
        </div>

        {/* ROI Callout — lightweight pill */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/25 bg-primary/6">
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm font-semibold text-foreground">Most clients recover their investment within the first 30 days — often sooner.</p>
          </div>
        </div>

        {/* Feature grid intro */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest px-3 py-1.5 bg-primary/8 border border-primary/20 rounded-full">What's Included</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Feature grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {includes.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group flex items-start gap-4 p-5 rounded-2xl border bg-white transition-all duration-300 cursor-default hover:shadow-md hover:border-primary/40"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                {/* Step number */}
                <span className="text-xs font-bold text-primary/40 group-hover:text-primary/70 transition-colors mt-0.5 w-6 flex-shrink-0">{item.step}</span>
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors duration-300">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {/* Text */}
                <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-foreground/70 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Setup timeline bar */}
        <div className="mb-8 rounded-2xl border border-primary/15 overflow-hidden">
          {/* Two equal cols */}
          <div className="grid sm:grid-cols-2 bg-primary/5">
            {[
              { label: "Setup Timeline", value: "Live in 5–7 days — no complex setup on your end" },
              { label: "What You Do", value: "One onboarding call" },
            ].map((item, i) => (
              <div key={i} className={`px-6 py-4 text-center ${i === 0 ? "sm:border-r border-primary/15" : ""}`}>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          {/* Highlighted payoff row */}
          <div className="px-6 py-5 text-center border-t border-primary/15" style={{background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)"}}>
            <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest mb-1">Everything Else</p>
            <p className="text-lg font-bold text-amber-100">Automated Entirely</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-border text-center">
          <p className="text-foreground text-sm font-semibold mb-6">
            If you're getting leads but not converting them, this is the fix.
          </p>
          <button onClick={(e) => {
            e.preventDefault();
            const start = window.scrollY;
            const end = document.body.scrollHeight - window.innerHeight;
            const distance = end - start;
            const duration = 1200;
            let startTime = null;
            const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const step = (timestamp) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              window.scrollTo(0, start + distance * easeInOutCubic(progress));
              if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }} style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",border:"none",cursor:"pointer",transition:"box-shadow 0.5s ease"}} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
          }}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"52px",padding:"0 36px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book a 10-Min Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
        <LeadCaptureModal 
          isOpen={showLeadModal} 
          onClose={() => setShowLeadModal(false)}
          onSuccess={() => {
            setShowLeadModal(false);
            window.location.href = '/book';
          }}
        />
      </div>
    </section>
  );
}
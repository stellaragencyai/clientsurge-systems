import { useState } from 'react';
import { ArrowRight, Zap, MessageSquare, PhoneCall, CalendarCheck, RotateCcw, LayoutDashboard, HeadphonesIcon, TrendingUp } from "lucide-react";
import LeadCaptureModal from "../forms/LeadCaptureModal";

const includes = [
  { icon: Zap, step: "01", title: "Instant Lead Capture", desc: "Every inquiry captured and logged automatically — from any channel, 24/7." },
  { icon: MessageSquare, step: "02", title: "SMS & Chat Response", desc: "Personalized instant replies sent within seconds of every new lead." },
  { icon: ArrowRight, step: "03", title: "Follow-Up Sequences", desc: "Multi-step, timed sequences written and scheduled — no manual work." },
  { icon: PhoneCall, step: "04", title: "Missed Call Text-Back", desc: "Every missed call triggers an immediate text so no lead disappears." },
  { icon: RotateCcw, step: "05", title: "Lead Reactivation", desc: "Old leads re-engaged with proven campaigns. Dormant = money left on the table." },
  { icon: CalendarCheck, step: "06", title: "Booking Flow", desc: "Leads guided directly to your calendar. No phone tag, no friction." },
  { icon: LayoutDashboard, step: "07", title: "CRM Pipeline Automation", desc: "Auto-tagging, status updates, and task creation — your pipeline runs itself." },
  { icon: HeadphonesIcon, step: "08", title: "Ongoing Support", desc: "Continuous optimization and priority support from our team post-launch." },
];

export default function CoreOffer() {
  const [showLeadModal, setShowLeadModal] = useState(false);
  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Package</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            A <span className="text-primary">Complete</span> System,<br /><span style={{color: "rgba(161,120,35,1)", textShadow: "0 0 20px rgba(161,120,35,0.5)"}}>Automated</span> for You
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            This isn't software you figure out. We build, install, and manage the entire system — your only job is showing up for the appointments it generates.
          </p>
        </div>

        {/* ROI Callout Banner */}
        <div className="mb-10 rounded-2xl overflow-hidden" style={{background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 50%,#7a4825 100%)",boxShadow:"0 8px 32px rgba(120,70,20,0.25)"}}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-amber-300 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-100">Most clients recover their investment within the first 30 days.</p>
            </div>
            <span className="text-xs font-bold text-amber-300/70 uppercase tracking-widest whitespace-nowrap">Revenue-first, always</span>
          </div>
        </div>

        {/* Feature grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {includes.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-default"
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
        <div className="mb-8 p-5 bg-primary/5 border border-primary/15 rounded-2xl grid sm:grid-cols-3 gap-4 text-center">
          {[
            { label: "Setup Timeline", value: "Live in 5–7 days" },
            { label: "What You Do", value: "One onboarding call" },
            { label: "Everything Else", value: "Automated Entirely", highlight: true },
          ].map((item, i) => (
            <div key={i} className={`${i < 2 ? "sm:border-r sm:border-border" : ""} px-4`}>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-foreground">
                {item.highlight ? (
                  <>
                    <span style={{color: "rgba(161,120,35,1)", textShadow: "0 0 15px rgba(161,120,35,0.5)"}}>Automated</span> Entirely
                  </>
                ) : (
                  item.value
                )}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-border text-center">
          <p className="text-muted-foreground text-sm mb-6">
            Fully tailored to your business. Designed to generate revenue from day one.
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
              Book a Demo
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
import { Check, ArrowRight, Zap, MessageSquare, PhoneCall, CalendarCheck, RotateCcw, LayoutDashboard } from "lucide-react";

const includes = [
  { icon: Zap, text: "Full lead capture system — built and integrated for you" },
  { icon: MessageSquare, text: "Instant response automation via SMS and chat" },
  { icon: ArrowRight, text: "Multi-step follow-up sequences, written and scheduled" },
  { icon: PhoneCall, text: "Missed call text-back system" },
  { icon: RotateCcw, text: "Lead reactivation campaigns for your existing database" },
  { icon: CalendarCheck, text: "Booking flow connected to your calendar" },
  { icon: LayoutDashboard, text: "CRM pipeline automation — tagging, tasks, status updates" },
  { icon: Check, text: "Ongoing support and optimization included" },
];

export default function CoreOffer() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-background via-card to-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Package</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            A <span className="text-primary">Complete</span> System, Implemented for You
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            This isn't software you have to figure out. We build, install, and manage the entire system — so your only job is showing up for the appointments it generates.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border-2 border-foreground">
          {/* Icon grid of included items */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {includes.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/4 transition-colors">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground leading-relaxed">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Setup timeline bar */}
          <div className="mb-8 p-4 bg-primary/5 border border-primary/15 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">Setup Timeline</p>
              <p className="text-sm font-semibold text-foreground">Live in 5–7 business days</p>
            </div>
            <div className="h-px sm:h-8 w-full sm:w-px bg-border" />
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">What You Do</p>
              <p className="text-sm font-semibold text-foreground">Show up to one onboarding call</p>
            </div>
            <div className="h-px sm:h-8 w-full sm:w-px bg-border" />
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">Everything Else</p>
              <p className="text-sm font-semibold text-foreground">We handle it entirely</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-sm mb-6">
              Fully tailored to your business. Designed to generate revenue from day one.
            </p>
            <a href="#book-demo" style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)"}}>
              <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
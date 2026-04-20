import { useState } from 'react';
import { ArrowRight } from "lucide-react";
import DemoBookingInline from "../forms/DemoBookingInline";

export default function FinalCTA() {
  const [showForm, setShowForm] = useState(false);

  return (
    <section id="book-demo" className="py-24 md:py-32 px-6 bg-gradient-to-b from-card/80 via-background to-background">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-6">Ready to Start?</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
          You're Already Getting Leads.
          <br />
          <span className="text-primary">Let's Make Sure You're Converting Them.</span>
        </h2>
        <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Book a free 15-minute demo. We'll map out exactly where you're losing bookings and show you what an automated system would look like for your business — no obligation.
        </p>
      </div>

      {!showForm ? (
        <div className="max-w-3xl mx-auto text-center mt-10">
          <button
            onClick={() => setShowForm(true)}
            className="inline-block focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
            style={{borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",border:"none",cursor:"pointer"}}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)"}
          >
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"56px",padding:"0 40px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book Your Free Demo
              <ArrowRight className="w-5 h-5" />
            </span>
          </button>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            {["Free 15-min call", "No commitment required", "Live in 5–7 days"].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto mt-12 rounded-3xl overflow-hidden" style={{background:"linear-gradient(135deg,rgba(26,21,16,0.97) 0%,rgba(40,30,18,0.97) 100%)",border:"1px solid rgba(200,150,92,0.15)",boxShadow:"0 8px 40px rgba(0,0,0,0.4)"}}>
          <div className="px-8 pt-8 pb-4 border-b border-white/5 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Free 15-Min Demo</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-white">Tell us about your business</h3>
            <p className="text-sm text-white/40 mt-1">We'll tailor the demo to your exact situation.</p>
          </div>
          <div className="px-8 py-6">
            <DemoBookingInline />
          </div>
        </div>
      )}
    </section>
  );
}
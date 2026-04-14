import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
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
          Book a free 30-minute demo. We'll map out exactly where you're losing bookings and show you what an automated system would look like for your business — no obligation.
        </p>

        <div className="mt-10">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="shiny-brown-btn-fc inline-block" style={{borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.3s ease, transform 0.3s ease"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"56px",padding:"0 40px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book Your Free Demo
              <ArrowRight className="w-5 h-5" />
            </span>
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          {["Free 30-min call", "No commitment required", "Live in 5–7 days"].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
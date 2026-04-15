import { ArrowRight, CheckCircle2 } from "lucide-react";

const includes = [
  "Instant lead response system",
  "Automated follow-up sequences",
  "Missed call text-back",
  "Booking flow automation",
  "Old lead reactivation",
  "Pipeline dashboard",
  "Full setup and launch support",
];

export default function MedSpaPricingPreview() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Offer</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-5">
            Done-for-You <span className="text-primary">Automation</span> Systems for Med Spas
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Faster response. Better follow-up. More booked consultations. We build and install the system — you focus on your clients.
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-primary/30 p-8 md:p-12 shadow-md" style={{boxShadow:"0 8px 40px rgba(120,70,20,0.10), 0 2px 8px rgba(0,0,0,0.06)"}}>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
               <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">⚡ LIMITED OFFER</div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-6">Every system includes:</p>
              <ul className="space-y-3">
                {includes.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-block bg-primary/5 border border-primary/15 rounded-xl px-5 py-3 mb-6">
                <p className="text-xs font-semibold text-primary">Customized for your med spa</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Plans are tailored based on your lead volume and growth stage. No two systems are the same.
              </p>
              <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)"}}>
                <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 28px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"0.9rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
                  Book a Demo
                  <ArrowRight className="w-4 h-4" />
                </span>
              </a>
              <p className="text-xs text-muted-foreground mt-4">Free 30-min call · No commitment · Live in 5–7 days</p>
            </div>
          </div>
        </div>

        {/* ROI line */}
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto italic">
          If this system helps you capture even a few extra bookings per month, it usually pays for itself quickly.
        </p>

        {/* Post-pricing CTA */}
        <div className="mt-8 text-center bg-white rounded-2xl border border-border p-8 shadow-sm">
          <p className="text-base font-semibold text-foreground mb-2">
            Not sure which option fits your med spa?
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Book a quick 10-minute demo and we'll recommend the best setup for your business.
          </p>
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 28px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"0.9rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book Your Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
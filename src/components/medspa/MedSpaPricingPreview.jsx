import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import MedSpaDemoModal from "./MedSpaDemoModal";

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
  const [showModal, setShowModal] = useState(false);
  return (
    <section className="py-24 md:py-32 px-6 bg-muted">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Offer</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-5">
            Done-for-You <span className="text-primary">Automation</span> Systems for Med Spas
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Faster response. Better follow-up. More booked consultations. We build and install the system - you focus on your clients.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg" style={{background:"linear-gradient(135deg, #ffffff 0%, #fefdfb 100%)", boxShadow:"0 20px 60px -20px rgba(0,92,153,0.15), 0 0 1px rgba(0,92,153,0.2)", border:"2px solid transparent", backgroundImage:"linear-gradient(135deg, #ffffff 0%, #fefdfb 100%), linear-gradient(135deg, rgba(160,113,79,0.3) 0%, rgba(0,174,239,0.1) 100%)", backgroundOrigin:"border-box", backgroundClip:"padding-box, border-box"}}>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>

              <p className="text-sm font-semibold text-foreground mb-4">Starting from $497/mo � One-time setup fee � No long-term contracts � Cancel anytime</p>
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
              <button onClick={() => setShowModal(true)} style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#0088CC 0%,#00AEEF 30%,#DDF4FF 50%,#00AEEF 70%,#005B99 100%)",boxShadow:"0 4px 18px rgba(0,92,153,0.35)",border:"none",cursor:"pointer"}}>
                <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 28px",borderRadius:"9999px",background:"linear-gradient(135deg,#005B99 0%,#0077B6 40%,#005B99 100%)",color:"#EAF8FF",fontWeight:"700",fontSize:"0.9rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
                  Book Your Free Demo
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <p className="text-xs text-muted-foreground mt-4">Free 15-min call � No commitment � Live in 5-7 days</p>
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
          <button onClick={() => setShowModal(true)} style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#0088CC 0%,#00AEEF 30%,#DDF4FF 50%,#00AEEF 70%,#005B99 100%)",boxShadow:"0 4px 18px rgba(0,92,153,0.35)",border:"none",cursor:"pointer"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 28px",borderRadius:"9999px",background:"linear-gradient(135deg,#005B99 0%,#0077B6 40%,#005B99 100%)",color:"#EAF8FF",fontWeight:"700",fontSize:"0.9rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              Book Your Free Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
        {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
      </div>
    </section>
  );
}

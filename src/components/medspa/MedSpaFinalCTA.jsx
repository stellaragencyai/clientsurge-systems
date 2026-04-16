import { useState } from "react";
import { ArrowRight } from "lucide-react";
import MedSpaDemoModal from "./MedSpaDemoModal";

export default function MedSpaFinalCTA() {
  const [showModal, setShowModal] = useState(false);
  return (
    <section className="py-24 md:py-32 px-6 bg-muted relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1552693673-1bf958298935?w=1600&q=80"
          alt="Med spa ambiance"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-muted via-primary/5 to-muted" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-6">Ready to Start?</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight mb-6">
          If your med spa is already getting leads, you should be converting more of them.
        </h2>
        <p className="text-base font-semibold text-foreground/70 mb-4">
          Most med spas lose leads simply because they don't respond fast enough. This system fixes that immediately.
        </p>
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10">
          Book a quick demo and we'll show you exactly where bookings are being lost — and how to fix it.
        </p>

        <button onClick={() => setShowModal(true)} style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 6px 24px rgba(120,70,20,0.4)",border:"none",cursor:"pointer"}}>
          <span style={{display:"flex",alignItems:"center",gap:"10px",height:"58px",padding:"0 44px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1.05rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
            Book Your Free Demo
            <ArrowRight className="w-5 h-5" />
          </span>
        </button>
        {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          {["Free 15-min call", "No commitment required", "Live in 5–7 days"].map((t, i) => (
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
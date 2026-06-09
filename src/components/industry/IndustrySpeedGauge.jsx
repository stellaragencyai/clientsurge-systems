import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

export default function IndustrySpeedGauge({ industry }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const [needleAngle, setNeedleAngle] = useState(0);

  const configs = {
    hvac: { bad: "18 min", good: "< 60 sec", badLabel: "Avg voicemail callback", goodLabel: "ClientSurge AI text-back", stat: "73% of emergency calls go to first responder" },
    roofing: { bad: "4–6 hrs", good: "< 5 min", badLabel: "Manual storm callback time", goodLabel: "ClientSurge AI response", stat: "60% of storm estimates signed by fastest responder" },
    contractors: { bad: "24+ hrs", good: "< 2 min", badLabel: "Manual bid follow-up", goodLabel: "ClientSurge AI text-back", stat: "80% bid win increase with instant response" },
    "med-spa": { bad: "3–5 hrs", good: "< 60 sec", badLabel: "Manual front desk callback", goodLabel: "ClientSurge AI response", stat: "75% consult conversion lift with instant reply" },
    dental: { bad: "2–4 hrs", good: "< 60 sec", badLabel: "Manual callback time", goodLabel: "ClientSurge AI text-back", stat: "68% of inquiries need a same-day response" },
    chiropractic: { bad: "1–3 hrs", good: "< 60 sec", badLabel: "Manual intake callback", goodLabel: "ClientSurge AI response", stat: "4x better conversion with instant pricing & availability" },
  };

  const cfg = configs[industry] || configs.hvac;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStarted(true);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame;
    const target = 165;
    let current = 0;
    const animate = () => {
      current = Math.min(current + 2.5, target);
      setNeedleAngle(current);
      if (current < target) frame = requestAnimationFrame(animate);
    };
    const t = setTimeout(() => { frame = requestAnimationFrame(animate); }, 400);
    return () => { clearTimeout(t); cancelAnimationFrame(frame); };
  }, [started]);

  const radius = 90;
  const cx = 110;
  const cy = 110;
  const needleRad = ((needleAngle - 90) * Math.PI) / 180;
  const needleX = cx + (radius - 20) * Math.cos(needleRad);
  const needleY = cy + (radius - 20) * Math.sin(needleRad);

  return (
    <section ref={ref} className="px-4 py-14 md:px-6 md:py-20" style={{ background: "linear-gradient(180deg, #f7fbff 0%, #ffffff 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Speed to Lead</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            First to Respond Wins the Job
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">{cfg.stat}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Gauge */}
          <div className="flex justify-center">
            <div className="relative" style={{ width: 220, height: 140 }}>
              <svg width="220" height="140" viewBox="0 0 220 140">
                {/* Track */}
                <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(0,136,204,0.12)" strokeWidth="16" strokeLinecap="round" />
                {/* Red zone */}
                <path d="M 20 110 A 90 90 0 0 1 80 32" fill="none" stroke="#fca5a5" strokeWidth="16" strokeLinecap="round" />
                {/* Green zone */}
                <path d="M 140 32 A 90 90 0 0 1 200 110" fill="none" stroke="#86efac" strokeWidth="16" strokeLinecap="round" />
                {/* Needle */}
                <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#0088CC" strokeWidth="3.5" strokeLinecap="round"
                  style={{ transition: "none" }} />
                <circle cx={cx} cy={cy} r="7" fill="#003B8F" />
              </svg>
              <p className="absolute bottom-0 left-0 text-xs font-bold" style={{ color: "#b91c1c" }}>{cfg.bad}</p>
              <p className="absolute bottom-0 right-0 text-xs font-bold text-green-600">{cfg.good}</p>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-xl px-5 py-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: "#ef4444" }} />
              <div>
                <p className="font-black text-xl" style={{ color: "#b91c1c" }}>{cfg.bad}</p>
                <p className="text-sm text-foreground/70">{cfg.badLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl px-5 py-4" style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <Zap style={{ width: "16px", height: "16px", color: "#16a34a", flexShrink: 0, marginTop: "4px" }} />
              <div>
                <p className="font-black text-xl" style={{ color: "#16a34a" }}>{cfg.good}</p>
                <p className="text-sm text-foreground/70">{cfg.goodLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
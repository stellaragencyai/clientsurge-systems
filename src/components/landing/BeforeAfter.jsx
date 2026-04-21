import { useState, useRef } from "react";
import {
  PhoneMissed,
  Clock,
  TrendingDown,
  CalendarX,
  Zap,
  CalendarCheck,
  TrendingUp,
  PhoneCall,
} from "lucide-react";

const beforeItems = [
  { icon: Clock, text: "47-hour average response time" },
  { icon: PhoneMissed, text: "Missed calls go unanswered" },
  { icon: TrendingDown, text: "12% lead-to-booking rate" },
  { icon: CalendarX, text: "Calendar half-empty, team stressed" },
];

const afterItems = [
  { icon: Zap, text: "Under 60-second response, every time" },
  { icon: PhoneCall, text: "Instant text-back on every missed call" },
  { icon: TrendingUp, text: "61% lead-to-booking rate achieved" },
  { icon: CalendarCheck, text: "Calendar fully booked, team relaxed" },
];

export default function BeforeAfter() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const getPos = (clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return Math.round((x / rect.width) * 100);
  };

  const onMouseDown = () => {
    dragging.current = true;
  };
  const onMouseMove = (e) => {
    if (dragging.current) setSliderPos(getPos(e.clientX));
  };
  const onMouseUp = () => {
    dragging.current = false;
  };
  const onTouchMove = (e) => {
    setSliderPos(getPos(e.touches[0].clientX));
  };

  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Difference</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Drag to See <span className="text-primary">Your Transformation</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Slide to compare life before and after ClientSurge Systems automation.
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative rounded-3xl overflow-hidden border border-border select-none cursor-col-resize shadow-2xl"
          style={{ minHeight: 340 }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center px-10 py-12">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" /> Without ClientSurge Systems
            </p>
            <div className="space-y-5">
              {beforeItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 opacity-90">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-sm text-slate-300 line-through decoration-red-400/60">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-xs text-slate-500 italic">Revenue leaking every day you wait.</div>
          </div>

          <div
            className="absolute inset-0 flex flex-col justify-center px-10 py-12"
            style={{
              clipPath: `inset(0 0 0 ${sliderPos}%)`,
              background: "linear-gradient(135deg, hsl(40,20%,97%) 0%, hsl(42,30%,94%) 100%)",
            }}
          >
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" /> With ClientSurge Systems
            </p>
            <div className="space-y-5">
              {afterItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-xs text-primary/60 italic font-medium">
              Results clients see in the first 30 days.
            </div>
          </div>

          <div
            className="absolute top-0 bottom-0 flex items-center justify-center z-20"
            style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
          >
            <div className="w-0.5 h-full bg-white/40 absolute" />
            <div className="relative w-10 h-10 rounded-full bg-white shadow-xl border border-border flex items-center justify-center cursor-col-resize z-10">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
                <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">Drag the handle to compare both sides.</p>
      </div>
    </section>
  );
}

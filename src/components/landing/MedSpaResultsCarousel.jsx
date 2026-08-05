import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, TrendingDown, PhoneMissed, Sparkles } from "lucide-react";
import medSpaImage from "@/assets/industry-medspa.webp";

const RESULTS = [
  {
    id: "response-time",
    category: "Response Speed",
    icon: Clock,
    title: "Lead Response Time",
    before: { value: "45 min", subtext: "Manual follow-up delay" },
    after: { value: "12 sec", subtext: "AI instant SMS reply" },
    improvement: "97% faster",
  },
  {
    id: "no-show",
    category: "Retention",
    icon: TrendingDown,
    title: "No-Show Rate",
    before: { value: "32%", subtext: "Lost consults to no-shows" },
    after: { value: "9%", subtext: "Automated reminders" },
    improvement: "72% reduction",
  },
  {
    id: "missed-calls",
    category: "Lead Recovery",
    icon: PhoneMissed,
    title: "Missed Call Recovery",
    before: { value: "40%", subtext: "Voicemails never returned" },
    after: { value: "98%", subtext: "Instant text-back capture" },
    improvement: "58% more leads",
  },
];

export default function MedSpaResultsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const goTo = useCallback((idx) => {
    setActiveIndex(idx);
    setIsPaused(true);
  }, []);

  const next = useCallback(() => setActiveIndex((p) => (p + 1) % RESULTS.length), []);
  const prev = useCallback(() => setActiveIndex((p) => (p - 1 + RESULTS.length) % RESULTS.length), []);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  const handlePointerMove = useCallback((clientX) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(2, Math.min(98, pct)));
  }, []);

  const handlePointerDown = useCallback((e) => {
    isDragging.current = true;
    setIsPaused(true);
    handlePointerMove(e.clientX);
  }, [handlePointerMove]);

  useEffect(() => {
    const move = (e) => handlePointerMove(e.clientX);
    const up = () => { isDragging.current = false; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [handlePointerMove]);

  const current = RESULTS[activeIndex];
  const CurrentIcon = current.icon;

  return (
    <div className="mt-16 max-w-5xl mx-auto px-6">
      <div className="text-center mb-8">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"
          style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)", color: "#0047AB" }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Med Spa Before &amp; After
        </span>
        <h3 className="mt-4 font-black text-black" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
          Real Results for Aesthetic Clinics
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Drag the slider to see how ClientSurge transforms key metrics for med spas and aesthetic clinics.
        </p>
      </div>

      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,212,255,0.12)" }}
      >
        <div
          ref={containerRef}
          className="relative aspect-[16/10] md:aspect-[16/8] select-none"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
        >
          {/* BEFORE layer — full width, dark/red tint */}
          <div className="absolute inset-0">
            <img
              src={medSpaImage}
              alt="Med spa before ClientSurge"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              style={{ filter: "grayscale(0.5) brightness(0.45)" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(160,30,30,0.55) 0%, rgba(30,10,10,0.72) 100%)" }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-red-200/90 mb-3">
                {current.category}
              </span>
              <p className="text-sm font-bold text-white/70 mb-2">{current.title}</p>
              <p
                className="font-black text-white"
                style={{ fontSize: "clamp(2.5rem, 6vw, 3.75rem)", textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
              >
                {current.before.value}
              </p>
              <p className="mt-2 text-sm text-white/60">{current.before.subtext}</p>
              <span
                className="mt-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Before ClientSurge
              </span>
            </div>
          </div>

          {/* AFTER layer — clipped from left based on slider position */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
          >
            <img
              src={medSpaImage}
              alt="Med spa after ClientSurge"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(0,71,171,0.40) 0%, rgba(0,45,98,0.55) 100%)" }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <CurrentIcon className="w-8 h-8 text-cyan-300 mb-3" aria-hidden="true" />
              <p className="text-sm font-bold text-white/70 mb-2">{current.title}</p>
              <p
                className="font-black text-white"
                style={{ fontSize: "clamp(2.5rem, 6vw, 3.75rem)", textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
              >
                {current.after.value}
              </p>
              <p className="mt-2 text-sm text-white/60">{current.after.subtext}</p>
              <span
                className="mt-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: "rgba(0,212,255,0.20)", border: "1px solid rgba(0,212,255,0.4)" }}
              >
                After ClientSurge
              </span>
            </div>
          </div>

          {/* Slider handle line + grip */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${sliderPos}%`,
              transform: "translateX(-50%)",
              width: "4px",
              background: "linear-gradient(180deg, #00D4FF, #0047AB)",
              boxShadow: "0 0 16px rgba(0,212,255,0.6)",
            }}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0047AB, #002D62)",
                border: "3px solid #fff",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
              }}
            >
              <ChevronLeft className="w-4 h-4 text-white" style={{ marginRight: -2 }} />
              <ChevronRight className="w-4 h-4 text-white" style={{ marginLeft: -2 }} />
            </div>
          </div>
        </div>

        {/* Improvement badge */}
        <div className="absolute top-4 right-4 z-10">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
            style={{
              background: "rgba(5,150,105,0.18)",
              border: "1px solid rgba(5,150,105,0.35)",
              color: "#059669",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <TrendingDown className="w-3.5 h-3.5" /> {current.improvement}
          </span>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
          aria-label="Previous result"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
          aria-label="Next result"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {RESULTS.map((result, idx) => (
          <button
            key={result.id}
            onClick={() => goTo(idx)}
            aria-label={`Go to ${result.title}`}
            className="transition-all duration-300"
            style={{
              width: idx === activeIndex ? "32px" : "8px",
              height: "8px",
              borderRadius: "999px",
              background: idx === activeIndex ? "#00D4FF" : "rgba(0,212,255,0.25)",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* Category tabs */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {RESULTS.map((result, idx) => {
          const TabIcon = result.icon;
          const isActive = idx === activeIndex;
          return (
            <button
              key={result.id}
              onClick={() => goTo(idx)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(0,71,171,0.10), rgba(0,212,255,0.06))"
                  : "transparent",
                border: `1px solid ${isActive ? "rgba(0,212,255,0.3)" : "rgba(0,0,0,0.08)"}`,
                color: isActive ? "#0047AB" : "#64748b",
                cursor: "pointer",
              }}
            >
              <TabIcon className="w-3.5 h-3.5" /> {result.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
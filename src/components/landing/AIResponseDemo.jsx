import { useState, useEffect, useRef } from "react";
import { Zap, ArrowRight, Sparkles, User, Bot } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DemoBookingModal from "../forms/DemoBookingModal";

const INDUSTRIES = [
  "Med Spa / Aesthetic Clinic",
  "HVAC / Plumbing",
  "Wellness Studio",
  "Real Estate",
  "Contractor / Trades",
  "Local Service Business",
];

const SAMPLE_LEADS = {
  "Med Spa / Aesthetic Clinic": "Hi, I saw your ad for lip filler. How much does it cost and do you have anything available this week?",
  "HVAC / Plumbing": "My AC stopped working and it's 107 degrees. Do you have same-day service? How much does a repair usually run?",
  "Wellness Studio": "Interested in joining your studio. Do you offer trial classes? What are your membership options?",
  "Real Estate": "I saw the listing on Zillow for the house on Oak Street. Is it still available? Can I schedule a showing this weekend?",
  "Contractor / Trades": "Looking to get a quote on a kitchen remodel. When can someone come out to take a look?",
  "Local Service Business": "I need your services ASAP. What's your availability this week and what are your rates?",
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-amber-700/40" style={{ animation: `typingBounce 1s ease infinite ${i * 0.2}s` }} />
      ))}
    </div>
  );
}

export default function AIResponseDemo() {
  const [industry, setIndustry] = useState("Med Spa / Aesthetic Clinic");
  const [customLead, setCustomLead] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | typing | response
  const [aiResponse, setAiResponse] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [error, setError] = useState("");
  const charRef = useRef(0);
  const timerRef = useRef(null);

  const leadMessage = customLead.trim() || SAMPLE_LEADS[industry];

  const handleGenerate = async () => {
    setPhase("typing");
    setAiResponse("");
    setDisplayedResponse("");
    setError("");
    charRef.current = 0;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AI follow-up assistant for a "${industry}" business. 
A new lead just sent this message: "${leadMessage}"

Write a friendly, professional, conversion-focused SMS/text response (max 3 sentences) that:
1. Acknowledges their specific inquiry
2. Provides a short helpful answer or builds trust
3. Ends with a clear, soft call-to-action to book or continue the conversation

Keep it under 160 characters ideally, natural and warm — not robotic. No placeholders like [Name] or [Business]. Just write the actual message.`,
      });

      const response = typeof result === "string" ? result : result?.response || result?.text || JSON.stringify(result);
      setAiResponse(response);
      setPhase("response");
    } catch (e) {
      setError("Couldn't generate a response. Please try again.");
      setPhase("idle");
    }
  };

  // Typewriter effect
  useEffect(() => {
    if (phase !== "response" || !aiResponse) return;
    setDisplayedResponse("");
    charRef.current = 0;
    timerRef.current = setInterval(() => {
      charRef.current++;
      setDisplayedResponse(aiResponse.slice(0, charRef.current));
      if (charRef.current >= aiResponse.length) clearInterval(timerRef.current);
    }, 18);
    return () => clearInterval(timerRef.current);
  }, [phase, aiResponse]);

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">AI Response Engine</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            See Our AI Respond to a Real Lead — Right Now
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Pick your industry, customize the lead message if you want, then watch what your business would send in under 60 seconds.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(154,92,46,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.09)" }}>
          {/* Config panel */}
          <div className="bg-white px-8 py-7 border-b border-border/50">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/50 mb-2">Your Industry</label>
                <select
                  value={industry}
                  onChange={e => { setIndustry(e.target.value); setPhase("idle"); setCustomLead(""); }}
                  className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/50 mb-2">Lead Message (or use sample ↓)</label>
                <input
                  type="text"
                  placeholder="Type a custom lead message…"
                  value={customLead}
                  onChange={e => { setCustomLead(e.target.value); setPhase("idle"); }}
                  className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Conversation panel */}
          <div className="bg-slate-50 px-8 py-7 min-h-[220px] flex flex-col gap-4">
            {/* Lead message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-200">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm border border-border/50">
                <p className="text-sm text-foreground/80 leading-relaxed">{leadMessage}</p>
                <p className="text-[10px] text-foreground/30 mt-1">Lead — just now</p>
              </div>
            </div>

            {/* AI response */}
            {phase === "idle" && (
              <div className="flex items-start gap-3 opacity-30">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)" }}>
                  <Zap className="w-4 h-4 text-amber-100" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-border/50 shadow-sm">
                  <p className="text-sm text-foreground/40 italic">AI response will appear here…</p>
                </div>
              </div>
            )}

            {phase === "typing" && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)" }}>
                  <Zap className="w-4 h-4 text-amber-100" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm border border-amber-200 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            {phase === "response" && displayedResponse && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)" }}>
                  <Bot className="w-4 h-4 text-amber-100" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm" style={{ background: "linear-gradient(135deg, rgba(154,92,46,0.08), rgba(154,92,46,0.04))", border: "1px solid rgba(154,92,46,0.25)" }}>
                  <p className="text-sm text-foreground/85 leading-relaxed">{displayedResponse}<span className="animate-pulse">|</span></p>
                  <p className="text-[10px] mt-1.5 font-semibold" style={{ color: "rgba(154,92,46,0.6)" }}>⚡ ClientSurge AI — responded in &lt;60s</p>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500 pl-11">{error}</p>}
          </div>

          {/* Action bar */}
          <div className="bg-white px-8 py-6 border-t border-border/50 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={phase === "typing"}
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "8px", height: "46px", padding: "0 28px", borderRadius: "9999px", background: phase === "typing" ? "#ccc" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.875rem", border: "none", cursor: phase === "typing" ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(120,70,20,0.35)", transition: "box-shadow 0.3s" }}
              onMouseEnter={e => { if (phase !== "typing") e.currentTarget.style.boxShadow = "0 6px 24px rgba(120,70,20,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(120,70,20,0.35)"; }}
            >
              <Sparkles className="w-4 h-4" />
              {phase === "typing" ? "Generating…" : phase === "response" ? "Generate Again" : "Generate AI Response"}
            </button>
            {phase === "response" && (
              <button
                onClick={() => setShowDemoModal(true)}
                className="text-sm font-semibold flex items-center gap-1.5 hover:underline focus:outline-none"
                style={{ color: "#9a5c2e" }}
              >
                Get this for my business
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {phase === "idle" && (
              <p className="text-xs text-foreground/40">This is the same AI that responds to your leads 24/7 — fully automated.</p>
            )}
          </div>
        </div>
      </div>
      {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </section>
  );
}
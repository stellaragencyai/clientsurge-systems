import { useState, useRef } from "react";
import { Zap, ArrowRight, Sparkles, User, Bot, Send, Target, TrendingUp, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DemoBookingModal from "../forms/DemoBookingModal";

const INDUSTRIES = [
  "Med Spas & Aesthetic Clinics",
  "Dental & Orthodontics",
  "Chiropractic & Physical Therapy",
  "HVAC, Plumbing & Home Services",
  "Roofing & Restoration",
  "Contractors & Trades",
];

const SAMPLE_LEADS = {
  "Med Spas & Aesthetic Clinics": "Hi, I saw your ad for lip filler. How much does it cost and do you have anything available this week?",
  "Dental & Orthodontics": "I am looking into Invisalign. Do you offer consultations this week, and what does pricing usually look like?",
  "Chiropractic & Physical Therapy": "My back has been flaring up again. Do you have any evaluation openings this week, and do you take new patients?",
  "HVAC, Plumbing & Home Services": "My AC stopped working and it's 107 degrees. Do you have same-day service? How much does a repair usually run?",
  "Roofing & Restoration": "We had storm damage and need someone to inspect the roof. How quickly can you come out and what is the process?",
  "Contractors & Trades": "Looking to get a quote on a kitchen remodel. When can someone come out to take a look?",
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

const URGENCY_CONFIG = {
  High: { color: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)" },
  Medium: { color: "#d97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.25)" },
  Low: { color: "#16a34a", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.25)" },
};

function IntentScorePanel({ score }) {
  if (!score) return null;
  const urgency = URGENCY_CONFIG[score.urgency] || URGENCY_CONFIG.Medium;
  return (
    <div className="mt-5 rounded-2xl border p-5 space-y-4" style={{ background: "rgba(154,92,46,0.03)", border: "1px solid rgba(154,92,46,0.18)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Lead Intelligence</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {/* Intent */}
        <div className="bg-white rounded-xl p-3 border border-border/50 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1.5">Intent</p>
          <p className="text-xs font-semibold text-foreground leading-snug">{score.intent}</p>
        </div>
        {/* Urgency */}
        <div className="rounded-xl p-3 text-center border" style={{ background: urgency.bg, borderColor: urgency.border }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: urgency.color, opacity: 0.7 }}>Urgency</p>
          <p className="text-xs font-bold" style={{ color: urgency.color }}>{score.urgency}</p>
        </div>
        {/* Score */}
        <div className="bg-white rounded-xl p-3 border border-border/50 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1.5">Score</p>
          <p className="text-xs font-bold text-primary">{score.score}<span className="text-foreground/30 font-normal">/100</span></p>
        </div>
      </div>
      {/* Recommended Action */}
      <div className="flex items-start gap-2.5 bg-white rounded-xl p-3 border border-border/50">
        <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-0.5">Recommended Next Action</p>
          <p className="text-xs font-semibold text-foreground">{score.next_action}</p>
        </div>
      </div>
    </div>
  );
}

export default function AIResponseDemo() {
  const [industry, setIndustry] = useState("Med Spas & Aesthetic Clinics");
  const [customLead, setCustomLead] = useState("");
  const [messages, setMessages] = useState([]); // {role: 'lead'|'ai', text: string}
  const [phase, setPhase] = useState("idle"); // idle | typing | done
  const [followUpInput, setFollowUpInput] = useState("");
  const [followUpPhase, setFollowUpPhase] = useState("idle"); // idle | typing | done
  const [intentScore, setIntentScore] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  const leadMessage = customLead.trim() || SAMPLE_LEADS[industry];

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleGenerate = async () => {
    setPhase("typing");
    setMessages([]);
    setIntentScore(null);
    setFollowUpInput("");
    setFollowUpPhase("idle");
    setError("");

    try {
      // Generate AI response + intent score in parallel
      const [responseResult, scoreResult] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AI follow-up assistant for a "${industry}" business. 
A new lead just sent this message: "${leadMessage}"

Write a friendly, professional, conversion-focused SMS/text response (max 3 sentences) that:
1. Acknowledges their specific inquiry
2. Provides a short helpful answer or builds trust
3. Ends with a clear, soft call-to-action to book or continue the conversation

Keep it short, natural, warm, and non-robotic. No placeholders like [Name] or [Business]. Just write the actual message.`,
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this lead message for a "${industry}" business: "${leadMessage}"

Return a JSON object with:
- intent: a short label (e.g. "Booking Ready", "Price Shopping", "Just Browsing", "Urgent Need", "Information Seeking")
- urgency: exactly one of "High", "Medium", or "Low"
- score: a number 0-100 representing lead quality
- next_action: one short recommended action sentence (e.g. "Send booking link immediately", "Respond with pricing and availability")`,
          response_json_schema: {
            type: "object",
            properties: {
              intent: { type: "string" },
              urgency: { type: "string" },
              score: { type: "number" },
              next_action: { type: "string" },
            },
          },
        }),
      ]);

      const aiText = typeof responseResult === "string" ? responseResult : responseResult?.response || responseResult?.text || JSON.stringify(responseResult);

      setMessages([
        { role: "lead", text: leadMessage },
        { role: "ai", text: aiText },
      ]);
      setIntentScore(scoreResult);
      setPhase("done");
      scrollToBottom();
    } catch (e) {
      setError("Couldn't generate a response. Please try again.");
      setPhase("idle");
    }
  };

  const handleFollowUp = async () => {
    if (!followUpInput.trim()) return;
    const userMsg = followUpInput.trim();
    setFollowUpInput("");
    setFollowUpPhase("typing");
    setError("");

    const updatedMessages = [...messages, { role: "lead", text: userMsg }];
    setMessages(updatedMessages);
    scrollToBottom();

    try {
      // Build conversation history for context
      const history = updatedMessages.map(m => `${m.role === "lead" ? "Lead" : "AI"}: ${m.text}`).join("\n");

      const [responseResult, scoreResult] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AI follow-up assistant for a "${industry}" business.
Here is the conversation so far:
${history}

Write the next AI reply (max 3 sentences, warm, professional, conversion-focused). No placeholders. Just write the message.`,
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Analyze the latest lead message in this conversation for a "${industry}" business.
Full conversation: ${history}
Latest lead message: "${userMsg}"

Return a JSON object with:
- intent: a short label (e.g. "Booking Ready", "Price Shopping", "Just Browsing", "Urgent Need", "Information Seeking")
- urgency: exactly one of "High", "Medium", or "Low"
- score: a number 0-100 representing lead quality
- next_action: one short recommended action sentence`,
          response_json_schema: {
            type: "object",
            properties: {
              intent: { type: "string" },
              urgency: { type: "string" },
              score: { type: "number" },
              next_action: { type: "string" },
            },
          },
        }),
      ]);

      const aiText = typeof responseResult === "string" ? responseResult : responseResult?.response || responseResult?.text || JSON.stringify(responseResult);

      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
      setIntentScore(scoreResult);
      setFollowUpPhase("done");
      scrollToBottom();
    } catch (e) {
      setError("Couldn't generate a follow-up response. Please try again.");
      setFollowUpPhase("idle");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setMessages([]);
    setIntentScore(null);
    setFollowUpInput("");
    setFollowUpPhase("idle");
    setError("");
    setCustomLead("");
  };

  const isTyping = phase === "typing" || followUpPhase === "typing";

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">AI Response Engine</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            See Our AI Respond to a Real Lead Right Now
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Pick your industry, customize the lead message, then watch what your business would send in under 60 seconds and keep the conversation going.
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
                  onChange={e => { setIndustry(e.target.value); handleReset(); }}
                  className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/50 mb-2">Lead Message (or use sample below)</label>
                <input
                  type="text"
                  placeholder="Type a custom lead message..."
                  value={customLead}
                  onChange={e => { setCustomLead(e.target.value); if (phase !== "idle") handleReset(); }}
                  className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Conversation panel */}
          <div className="bg-slate-50 px-8 py-7 min-h-[220px] flex flex-col gap-4">
            {/* Initial lead message (shown always) */}
            {phase === "idle" && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-200">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm border border-border/50">
                    <p className="text-sm text-foreground/80 leading-relaxed">{leadMessage}</p>
                    <p className="text-[10px] text-foreground/30 mt-1">Lead — just now</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 opacity-30">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)" }}>
                    <Zap className="w-4 h-4 text-amber-100" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-border/50 shadow-sm">
                    <p className="text-sm text-foreground/40 italic">AI response will appear here...</p>
                  </div>
                </div>
              </>
            )}

            {/* Typing indicator for first response */}
            {phase === "typing" && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-200">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm border border-border/50">
                    <p className="text-sm text-foreground/80 leading-relaxed">{leadMessage}</p>
                    <p className="text-[10px] text-foreground/30 mt-1">Lead — just now</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)" }}>
                    <Zap className="w-4 h-4 text-amber-100" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm border border-amber-200 shadow-sm">
                    <TypingDots />
                  </div>
                </div>
              </>
            )}

            {/* Full conversation thread */}
            {(phase === "done") && messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-3 ${msg.role === "lead" ? "" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "lead" ? "bg-slate-200" : ""}`} style={msg.role === "ai" ? { background: "linear-gradient(135deg,#9a5c2e,#7a4825)" } : {}}>
                  {msg.role === "lead" ? <User className="w-4 h-4 text-slate-500" /> : <Bot className="w-4 h-4 text-amber-100" />}
                </div>
                {msg.role === "lead" ? (
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm border border-border/50">
                    <p className="text-sm text-foreground/80 leading-relaxed">{msg.text}</p>
                    <p className="text-[10px] text-foreground/30 mt-1">Lead</p>
                  </div>
                ) : (
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm shadow-sm" style={{ background: "linear-gradient(135deg, rgba(154,92,46,0.08), rgba(154,92,46,0.04))", border: "1px solid rgba(154,92,46,0.25)" }}>
                    <p className="text-sm text-foreground/85 leading-relaxed">{msg.text}</p>
                    <p className="text-[10px] mt-1.5 font-semibold" style={{ color: "rgba(154,92,46,0.6)" }}>ClientSurge AI responded in under 60 seconds</p>
                  </div>
                )}
              </div>
            ))}

            {/* Follow-up typing indicator */}
            {followUpPhase === "typing" && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)" }}>
                  <Zap className="w-4 h-4 text-amber-100" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm border border-amber-200 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 pl-11">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Follow-up input — shown after first response */}
          {phase === "done" && (
            <div className="bg-white px-8 py-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Continue the conversation. Type a follow-up message..."
                  value={followUpInput}
                  onChange={e => setFollowUpInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !isTyping) handleFollowUp(); }}
                  disabled={isTyping}
                  className="flex-1 h-10 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  onClick={handleFollowUp}
                  disabled={isTyping || !followUpInput.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", border: "none", cursor: isTyping || !followUpInput.trim() ? "not-allowed" : "pointer" }}
                >
                  <Send className="w-4 h-4 text-amber-100" />
                </button>
              </div>
              <p className="text-[10px] text-foreground/30 mt-2 pl-10">Press Enter or click send. The AI will respond just like in a real conversation.</p>
            </div>
          )}

          {/* Intent Score Panel */}
          {intentScore && (
            <div className="bg-white px-8 pb-6 border-t border-border/50 pt-5">
              <IntentScorePanel score={intentScore} />
            </div>
          )}

          {/* Action bar */}
          <div className="bg-white px-8 py-6 border-t border-border/50 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={isTyping}
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "8px", height: "46px", padding: "0 28px", borderRadius: "9999px", background: isTyping ? "#ccc" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.875rem", border: "none", cursor: isTyping ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(120,70,20,0.35)", transition: "box-shadow 0.3s" }}
              onMouseEnter={e => { if (!isTyping) e.currentTarget.style.boxShadow = "0 6px 24px rgba(120,70,20,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(120,70,20,0.35)"; }}
            >
              <Sparkles className="w-4 h-4" />
              {phase === "typing" ? "Generating..." : phase === "done" ? "Start Over" : "Generate AI Response"}
            </button>
            {phase === "done" && (
              <button
                onClick={() => setShowDemoModal(true)}
                className="text-sm font-semibold flex items-center gap-1.5 hover:underline focus:outline-none"
                style={{ color: "#9a5c2e" }}
              >
                Book Your Free Demo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {phase === "idle" && (
              <p className="text-xs text-foreground/40">This demo shows the response style used in our pilot-configured lead response flow. Final runtime depends on the service you buy and how it is installed.</p>
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


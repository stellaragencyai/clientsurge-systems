import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DemoBookingModal from "../forms/DemoBookingModal";

const QUICK_QUESTIONS = [
  "How fast does the AI respond?",
  "What's the pricing?",
  "What industries do you serve?",
  "How long does setup take?",
];

function getWelcomeMessage() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  if (path.includes("med-spa")) return "👋 Hey! Curious how ClientSurge works for med spas? I can walk you through exactly what we build — or set you up with a free demo!";
  if (path.includes("dental")) return "👋 Hey! I can show you how we help dental practices book more consults on autopilot. Ask me anything!";
  if (path.includes("store")) return "👋 Hey! Need help picking the right services for your business? I can help you build the right stack.";
  if (path.includes("pricing")) return "👋 Hey! Questions about pricing? I can break down which plan fits your situation best.";
  return "👋 Hey! I'm the ClientSurge AI assistant. Ask me anything about automating your lead follow-up — or I can get you set up with a free demo!";
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: getWelcomeMessage() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [pulsed, setPulsed] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Pulse the bubble after 6s to draw attention
  useEffect(() => {
    const t = setTimeout(() => setPulsed(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await base44.functions.invoke("chatBubbleAI", {
        messages: newMessages.slice(1), // skip welcome
      });

      const reply = res.data?.reply || "Sorry, I had trouble with that. Want to book a demo instead?";

      if (reply.includes("[TRIGGER_BOOKING]")) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Great! Let me pull up the booking form for you. 🗓️",
            isBookingTrigger: true,
          },
        ]);
        setTimeout(() => setShowBookingModal(true), 600);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        if (!open) setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Hmm, I hit a snag. You can always book a free demo and we'll answer everything live!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-32 right-5 sm:right-8 z-[9990] w-[calc(100vw-2.5rem)] sm:w-96 flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{
            maxHeight: "min(580px, calc(100dvh - 120px))",
            border: "2px solid transparent",
            background:
              "linear-gradient(white, white) padding-box, linear-gradient(135deg,#a0714f,#c8965c,#f5d9a8,#c8965c,#7a4f2e) border-box",
            boxShadow: "0 20px 60px rgba(100,60,20,0.25), 0 4px 16px rgba(100,60,20,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#c8965c 100%)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-white font-black text-sm">CS</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">ClientSurge AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-amber-200/80 text-[11px]">Online · Typically replies instantly</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "hsl(40,30%,98%)" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <span className="text-primary font-black text-[9px]">CS</span>
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "text-foreground rounded-bl-sm"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }
                      : { background: "white", border: "1px solid rgba(154,92,46,0.15)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
                  }
                >
                  {msg.content}
                  {msg.isBookingTrigger && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="mt-2 block w-full text-center text-xs font-bold py-1.5 rounded-xl text-white"
                      style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
                    >
                      Open Booking Form →
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                  <span className="text-primary font-black text-[9px]">CS</span>
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ background: "white", border: "1px solid rgba(154,92,46,0.15)" }}
                >
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions (only at start) */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2" style={{ background: "hsl(40,30%,98%)" }}>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all disabled:opacity-50"
                  style={{
                    borderColor: "rgba(154,92,46,0.3)",
                    color: "#7a4825",
                    background: "rgba(154,92,46,0.06)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(154,92,46,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(154,92,46,0.06)")}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-t flex-shrink-0"
            style={{ borderColor: "rgba(154,92,46,0.15)", background: "white" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>

          {/* Book demo CTA footer */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ background: "rgba(154,92,46,0.05)", borderTop: "1px solid rgba(154,92,46,0.1)" }}
          >
            <p className="text-[11px] text-muted-foreground">Free 15-min demo · No commitment</p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="text-[11px] font-bold px-3 py-1 rounded-full text-white"
              style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
            >
              Book Demo →
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        className="fixed bottom-5 right-5 sm:right-8 z-[9991] h-14 px-4 rounded-full flex items-center gap-2.5 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: open
            ? "linear-gradient(135deg,#3a2010,#6b3f1f)"
            : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#c8965c 100%)",
          boxShadow: pulsed && !open
            ? "0 0 0 0 rgba(154,92,46,0.5), 0 8px 24px rgba(100,60,20,0.35)"
            : "0 8px 24px rgba(100,60,20,0.35)",
          animation: pulsed && !open ? "chatPulse 2.5s ease-in-out 3" : "none",
        }}
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-5 h-5 text-white flex-shrink-0" />
            <span className="text-sm font-semibold text-white hidden sm:inline">Chat with me</span>
          </>
        )}
        {hasUnread && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white text-white text-[9px] font-bold flex items-center justify-center">
            1
          </span>
        )}
      </button>

      <style>{`
        @keyframes chatPulse {
          0%   { box-shadow: 0 0 0 0 rgba(154,92,46,0.55), 0 8px 24px rgba(100,60,20,0.35); }
          50%  { box-shadow: 0 0 0 12px rgba(154,92,46,0), 0 8px 24px rgba(100,60,20,0.35); }
          100% { box-shadow: 0 0 0 0 rgba(154,92,46,0), 0 8px 24px rgba(100,60,20,0.35); }
        }
      `}</style>

      {showBookingModal && (
        <DemoBookingModal onClose={() => setShowBookingModal(false)} />
      )}
    </>
  );
}
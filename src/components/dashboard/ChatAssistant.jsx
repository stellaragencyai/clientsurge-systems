import { useState, useRef, useEffect } from "react";
import { X, MessageCircle, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ChatAssistant({ installStatus, services = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! 👋 I\'m here to help with questions about your installation. What can I help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const serviceNames = services.map(s => s.name || s.service_key).join(", ") || "unknown services";
      const systemContext = `You are a helpful, concise support assistant for ClientSurge Systems. 
The client\'s current install status is: "${installStatus || "Unknown"}".
Their purchased services are: ${serviceNames}.
Answer questions about their installation progress, what each stage means, and how to get support.
Keep answers to 2-4 sentences. Be warm but efficient.
If they need urgent help, direct them to call (602) 587-4608 or email support@clientsurgesystems.com.
Do NOT make up specific dates or promises about delivery times.`;

      const history = messages.slice(-8).map(m => `${m.role === "user" ? "Client" : "Support"}: ${m.text}`).join("\n");
      const prompt = `${systemContext}\n\nConversation so far:\n${history}\nClient: ${text}\nSupport:`;

      const reply = await base44.functions.invoke("chatBubbleAI", {
        messages: [{ role: "user", content: prompt }],
      });

      const replyText = reply?.data?.reply || "I\'m having trouble connecting right now. For urgent support, call (602) 587-4608.";
      setMessages(prev => [...prev, { role: "assistant", text: replyText }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection issue. For urgent help, email support@clientsurgesystems.com or call (602) 587-4608." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Bubble button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, #9a5c2e, #c8965c)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(154,92,46,0.4)",
          zIndex: 999, transition: "all 0.3s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        title="Chat with support"
      >
        <MessageCircle style={{ width: "24px", height: "24px", color: "#fff" }} />
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: "88px", right: "24px",
          width: "min(360px, calc(100vw - 32px))",
          background: "#ffffff", borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(154,92,46,0.1)",
          zIndex: 998, display: "flex", flexDirection: "column",
          maxHeight: "480px", overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px",
            background: "linear-gradient(135deg, #7a4825, #c8965c)",
            borderRadius: "20px 20px 0 0",
          }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#fff8ee", margin: 0 }}>Installation Support</p>
              <p style={{ fontSize: "11px", color: "rgba(255,248,238,0.7)", margin: 0 }}>ClientSurge Systems</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,248,238,0.8)", display: "flex" }}>
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "9px 13px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #7a4825, #c8965c)" : "#f4ede4",
                  color: msg.role === "user" ? "#fff8ee" : "#1b140d",
                  fontSize: "13px", lineHeight: "1.45",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#f4ede4", borderRadius: "16px 16px 16px 4px", padding: "10px 14px", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9a5c2e", opacity: 0.5, animation: `typingDot 1.2s ease-in-out ${d*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(154,92,46,0.1)", display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your installation..."
              style={{
                flex: 1, border: "1.5px solid rgba(154,92,46,0.2)", borderRadius: "999px",
                padding: "8px 14px", fontSize: "13px", outline: "none",
                background: "#fdfaf6", color: "#1b140d",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                background: input.trim() ? "linear-gradient(135deg, #7a4825, #c8965c)" : "rgba(154,92,46,0.15)",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
              }}
            >
              {loading ? <Loader2 style={{ width: "15px", height: "15px", color: "#9a5c2e", animation: "spin 1s linear infinite" }} />
                       : <Send style={{ width: "15px", height: "15px", color: input.trim() ? "#fff8ee" : "#9a5c2e" }} />}
            </button>
          </div>
        </div>
      )}

      <style>{\`
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      \`}</style>
    </>
  );
}

import { useState, useRef, useEffect } from "react";
import { X, MessageCircle, Send, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";

export default function ChatAssistant({ installStatus, services = [], portalState }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! 👋 I\'m here to help with questions about your installation. What can I help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasUnread(false);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Phase A.6: Proof-safe context — never tell the LLM the system is live/healthy/complete
  // unless PortalStateEngine has validated proof.
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const proofSafeStatus = isProofLive
    ? "Live and verified"
    : installStatus === "Error"
      ? "Experiencing an issue"
      : "Being set up — not yet live";

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
The client\'s current system status is: "${proofSafeStatus}".
Their purchased services are: ${serviceNames}.
Answer questions about their installation progress, what each stage means, and how to get support.
Keep answers to 2-4 sentences. Be warm but efficient.
IMPORTANT: Do NOT state or imply that the system is live, installed, healthy, completed, or ready unless the status above explicitly says "Live and verified". If the status says "Being set up", reassure the client that setup is in progress and direct them to support for timelines.
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
      {/* Floating bubble button — blue with pulse ring */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, #0088CC, #003B8F)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,136,204,0.45), 0 0 0 0 rgba(0,174,239,0.4)",
          zIndex: 999, transition: "all 0.3s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,136,204,0.6), 0 0 0 6px rgba(0,174,239,0.15)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,136,204,0.45), 0 0 0 0 rgba(0,174,239,0.4)";
        }}
        title="Chat with support"
        aria-label="Open support chat"
      >
        {open
          ? <X style={{ width: "22px", height: "22px", color: "#fff" }} />
          : <MessageCircle style={{ width: "24px", height: "24px", color: "#fff" }} />
        }
        {/* Unread badge */}
        {hasUnread && !open && (
          <span style={{
            position: "absolute", top: "2px", right: "2px",
            width: "14px", height: "14px", borderRadius: "50%",
            background: "#ef4444", border: "2px solid #ffffff",
            fontSize: "8px", color: "#fff", fontWeight: "800",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>1</span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: "92px", right: "24px",
          width: "min(380px, calc(100vw - 32px))",
          background: "#ffffff", borderRadius: "24px",
          boxShadow: "0 24px 70px rgba(0,59,143,0.18), 0 0 0 1px rgba(0,174,239,0.12)",
          zIndex: 998, display: "flex", flexDirection: "column",
          maxHeight: "500px", overflow: "hidden",
          fontFamily: "Inter, sans-serif",
          animation: "chatSlideUp 0.25s cubic-bezier(0.16,1,0.3,1) both",
        }}>

          {/* Header — blue gradient with subtle mesh */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px",
            background: "linear-gradient(135deg, #003B8F 0%, #0069C0 55%, #00AEEF 100%)",
            borderRadius: "24px 24px 0 0",
            position: "relative", overflow: "hidden",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: "-20px", right: "-10px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-30px", left: "60px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(0,174,239,0.1)", pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative", zIndex: 1 }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px",
                background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}>
                <Sparkles style={{ width: "16px", height: "16px", color: "#ffffff" }} />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", margin: 0, lineHeight: 1.2 }}>Installation Support</p>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px #4ade80" }} />
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", margin: 0 }}>Online · ClientSurge Systems</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px", cursor: "pointer", color: "rgba(255,255,255,0.9)",
              display: "flex", padding: "5px", transition: "background 0.2s", zIndex: 1,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              <X style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px 14px 8px",
            display: "flex", flexDirection: "column", gap: "10px",
            background: "#f8fafd",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "6px" }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "8px", flexShrink: 0,
                    background: "linear-gradient(135deg,#003B8F,#00AEEF)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles style={{ width: "12px", height: "12px", color: "#fff" }} />
                  </div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #0069C0, #003B8F)"
                    : "#ffffff",
                  color: msg.role === "user" ? "#ffffff" : "#0A1628",
                  fontSize: "13px", lineHeight: "1.5",
                  boxShadow: msg.role === "user"
                    ? "0 2px 10px rgba(0,105,192,0.35)"
                    : "0 1px 6px rgba(0,0,0,0.07)",
                  border: msg.role === "assistant" ? "1px solid rgba(0,174,239,0.1)" : "none",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: "6px" }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "8px", flexShrink: 0,
                  background: "linear-gradient(135deg,#003B8F,#00AEEF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles style={{ width: "12px", height: "12px", color: "#fff" }} />
                </div>
                <div style={{ background: "#ffffff", borderRadius: "18px 18px 18px 4px", padding: "11px 16px", display: "flex", gap: "4px", alignItems: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid rgba(0,174,239,0.1)" }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0088CC", opacity: 0.5, animation: `typingDot 1.2s ease-in-out ${d*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px 14px", borderTop: "1px solid rgba(0,174,239,0.1)",
            display: "flex", gap: "8px", alignItems: "center",
            background: "#ffffff",
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your installation…"
              style={{
                flex: 1, border: "1.5px solid rgba(0,174,239,0.2)", borderRadius: "999px",
                padding: "9px 16px", fontSize: "13px", outline: "none",
                background: "#f4f8ff", color: "#0A1628",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(0,174,239,0.55)"}
              onBlur={e => e.target.style.borderColor = "rgba(0,174,239,0.2)"}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                background: input.trim()
                  ? "linear-gradient(135deg, #0069C0, #003B8F)"
                  : "rgba(0,174,239,0.12)",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, transform 0.15s",
                boxShadow: input.trim() ? "0 2px 10px rgba(0,105,192,0.35)" : "none",
              }}
              onMouseEnter={e => input.trim() && (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {loading
                ? <Loader2 style={{ width: "15px", height: "15px", color: "#0088CC", animation: "spin 1s linear infinite" }} />
                : <Send style={{ width: "15px", height: "15px", color: input.trim() ? "#ffffff" : "#0088CC" }} />
              }
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-4px);opacity:1} }
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes chatSlideUp{from{opacity:0;transform:translateY(16px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      ` }} />
    </>
  );
}
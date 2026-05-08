/**
 * ClientPortalAIAssistant — #482
 * Persistent AI chat sidebar in client portal.
 * Client asks "why aren't I getting leads?" → AI answers from their real data.
 */
import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send } from "lucide-react";

export default function ClientPortalAIAssistant({ order_id }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I can answer questions about your system — leads, automations, performance. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("clientPortalAIChat", { order_id, question: text });
      setMessages(prev => [...prev, { role: "ai", text: res?.answer || "I don't have that info right now — try asking Nolan directly." }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Something went wrong. Try again or email nolan@clientsurgesystems.com." }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        width: 52, height: 52, borderRadius: "50%",
        background: "linear-gradient(135deg,#00D4FF,#00FFB3)",
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 28px rgba(0,212,255,0.4)",
      }}>
        {open ? <X style={{ width: 20, height: 20, color: "#0A0F1E" }} /> : <MessageCircle style={{ width: 20, height: 20, color: "#0A0F1E" }} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 999,
          width: 340, height: 440, borderRadius: 16,
          background: "#0D1B2E", border: "1px solid rgba(0,212,255,0.18)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>AI Assistant</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>Ask anything about your system</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  background: m.role === "user" ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${m.role === "user" ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10, padding: "8px 12px", maxWidth: "82%",
                }}>
                  <p style={{ color: "#fff", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{m.text}</p>
                </div>
              </div>
            ))}
            {loading && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Thinking...</div>}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask me anything..."
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", border: "none", borderRadius: 8, padding: "0 12px", cursor: "pointer" }}>
              <Send style={{ width: 14, height: 14, color: "#0A0F1E" }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

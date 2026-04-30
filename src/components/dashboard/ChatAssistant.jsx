import { useState } from "react";
import { X, MessageCircle, Send } from "lucide-react";

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! 👋 I'm here to help with any questions about your installation. What can I help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate AI response (in production, call your backend)
    setTimeout(() => {
      const responses = [
        "Great question! Your system is currently in the configuration stage. We're building your automation flows now.",
        "You can enable email and SMS notifications in the 'Status Notifications' section above.",
        "Your estimated go-live date is based on your current installation stage. Each stage typically takes 1–3 business days.",
        "If you need urgent support, you can call us or email support@clientsurgesystems.com.",
        "Feel free to reach out anytime — our team is here to help! Is there anything else I can clarify?",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: "assistant", text: response }]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #9a5c2e, #c8965c)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(154,92,46,0.4)",
          zIndex: 999,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(154,92,46,0.5)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(154,92,46,0.4)";
        }}
        title="Chat with AI Assistant"
      >
        <MessageCircle style={{ width: "24px", height: "24px", color: "white" }} />
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          right: "24px",
          width: "360px",
          maxHeight: "500px",
          borderRadius: "16px",
          background: "white",
          border: "1px solid rgba(154,92,46,0.15)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 998,
          animation: "slideUp 0.3s ease",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #9a5c2e, #c8965c)",
            color: "white",
            padding: "16px",
            borderRadius: "16px 16px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>Installation Assistant</p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.9 }}>Always here to help</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                cursor: "pointer",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minHeight: "300px",
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                  background: msg.role === "user" ? "linear-gradient(135deg,#9a5c2e,#c8965c)" : "rgba(154,92,46,0.08)",
                  color: msg.role === "user" ? "white" : "#1b140d",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#9a5c2e", animation: "pulse 1.4s infinite" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#9a5c2e", animation: "pulse 1.4s infinite 0.2s" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#9a5c2e", animation: "pulse 1.4s infinite 0.4s" }} />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "12px",
            borderTop: "1px solid rgba(154,92,46,0.1)",
            display: "flex",
            gap: "8px",
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSend()}
              placeholder="Ask something..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(154,92,46,0.15)",
                fontSize: "13px",
                fontFamily: "inherit",
                outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(154,92,46,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(154,92,46,0.15)"}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: input.trim() && !loading ? "linear-gradient(135deg,#9a5c2e,#c8965c)" : "rgba(154,92,46,0.2)",
                border: "none",
                color: "white",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                if (input.trim() && !loading) {
                  e.currentTarget.style.background = "linear-gradient(135deg,#7a4825,#b8855c)";
                }
              }}
              onMouseLeave={e => {
                if (input.trim() && !loading) {
                  e.currentTarget.style.background = "linear-gradient(135deg,#9a5c2e,#c8965c)";
                }
              }}
            >
              <Send style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
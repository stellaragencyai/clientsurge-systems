/**
 * TypingIndicator.jsx — #73
 * Animated "..." typing indicator for chatBubbleAI while LLM processes.
 */
export default function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(0,212,255,0.7); display: inline-block; animation: typing-bounce 1.2s ease-in-out infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
      <div style={{
        display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-start",
        padding: "10px 14px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px 10px 10px 2px",
        width: "fit-content", maxWidth: 70,
      }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </>
  );
}

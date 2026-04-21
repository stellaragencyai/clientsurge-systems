import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2 } from "lucide-react";

export default function SupportChat({ project, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const loadMessages = async () => {
    const msgs = await base44.entities.SupportMessage.filter({ project_id: project.id }, "created_date", 100);
    setMessages(msgs);
    setLoading(false);

    msgs
      .filter((m) => m.role === "admin" && !m.read)
      .forEach((m) => base44.entities.SupportMessage.update(m.id, { read: true }));
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 6000);
    return () => clearInterval(interval);
  }, [project.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    await base44.entities.SupportMessage.create({
      project_id: project.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      role: "client",
      message: text,
      read: false,
    });

    setSending(false);
    loadMessages();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col" style={{ height: "460px" }}>
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-display text-xl font-semibold text-foreground">Support & Messaging</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Message the ClientSurge Systems team directly. We reply within a few hours.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">No messages yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send us a message below - we typically reply within a few hours.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "client" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={
                msg.role === "client"
                  ? {
                      background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)",
                      color: "#f5e6d0",
                      borderBottomRightRadius: "4px",
                    }
                  : {
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--foreground))",
                      borderBottomLeftRadius: "4px",
                    }
              }
            >
              {msg.role === "admin" && (
                <p className="text-xs font-bold mb-1 opacity-60">ClientSurge Systems</p>
              )}
              {msg.message}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          style={{ maxHeight: "100px" }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

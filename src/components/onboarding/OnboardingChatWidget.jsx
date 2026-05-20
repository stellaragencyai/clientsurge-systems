import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function OnboardingChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Open chat and init conversation
  const handleOpen = async () => {
    setOpen(true);
    if (!conversation) {
      const conv = await base44.agents.createConversation({
        agent_name: "onboarding_assistant",
        metadata: { name: "Onboarding Help" },
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isThinking = messages.length > 0 && messages[messages.length - 1]?.role === "user";

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-xl transition-colors hover:bg-foreground/90 sm:bottom-6 sm:right-6"
        >
          <MessageCircle className="h-4 w-4" />
          Need help?
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-lg border border-border bg-white shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:w-[390px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Onboarding Assistant</p>
                <p className="text-xs text-muted-foreground">Setup details for your website and automations</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4">
            {messages.length === 0 && !conversation && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {messages.filter(m => m.role === "user" || m.role === "assistant").map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-border bg-white text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-border bg-white px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-border bg-white px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the setup form..."
              rows={1}
              className="max-h-[100px] min-w-0 flex-1 resize-none rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ maxHeight: "100px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-foreground transition-colors hover:bg-foreground/90 disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

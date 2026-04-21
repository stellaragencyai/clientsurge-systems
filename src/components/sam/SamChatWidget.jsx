import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { trackCTA } from "@/lib/analytics";

const quickPrompts = [
  "Which industries are the best fit?",
  "What happens after I book a demo?",
  "How does your lead follow-up automation work?",
];

export default function SamChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [leadProfile, setLeadProfile] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem("clientsurge-chat-profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [leadForm, setLeadForm] = useState(() => ({
    full_name: leadProfile?.full_name || "",
    email: leadProfile?.email || "",
    industry: leadProfile?.industry || "Med Spas & Aesthetic Clinics",
  }));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && !conversation) {
      void initConversation();
    }
  }, [open, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [conversation]);

  const initConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "sam",
      metadata: { name: "AI Concierge Chat" },
    });
    setConversation(conv);
    setMessages(conv.messages || []);
    return conv;
  };

  const ensureConversation = async () => {
    if (conversation) return conversation;
    return initConversation();
  };

  const sendMessage = async (text) => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const activeConversation = await ensureConversation();
      if (!activeConversation) return;
      await base44.agents.addMessage(activeConversation, { role: "user", content: text.trim() });
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const visibleMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  const handleCapture = async (event) => {
    event.preventDefault();
    setCaptureLoading(true);
    setCaptureError("");

    try {
      const result = await base44.functions.invoke("submitContactInquiry", {
        full_name: leadForm.full_name,
        email: leadForm.email,
        phone: "",
        business_type: leadForm.industry,
        message: `AI concierge chat request. Industry: ${leadForm.industry}.`,
        website_url: "",
      });

      if (!result.data?.success) {
        throw new Error(result.data?.error || "Unable to start chat");
      }

      const profile = { ...leadForm, captured_at: new Date().toISOString() };
      setLeadProfile(profile);
      window.localStorage.setItem("clientsurge-chat-profile", JSON.stringify(profile));
      trackCTA("ai_concierge_start", "chat_widget", { industry: leadForm.industry });
      await ensureConversation();
    } catch (error) {
      setCaptureError("We couldn't start the concierge right now. Please try again.");
    } finally {
      setCaptureLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full shadow-xl hover:bg-foreground/90 transition-all font-semibold text-sm mb-14 sm:mb-0"
        >
          <Sparkles className="w-4 h-4" />
          AI Concierge
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[560px] flex flex-col bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-foreground text-background">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">AI</div>
              <div>
                <p className="text-sm font-semibold">ClientSurge AI Concierge</p>
                <p className="text-xs opacity-60">Pricing, industries, booking, and automation help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20 min-h-[300px] max-h-[380px]">
            {!leadProfile ? (
              <form onSubmit={handleCapture} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Start with your email so we can follow up usefully.</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Every concierge conversation becomes a qualified lead instead of disappearing anonymously.
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    value={leadForm.full_name}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    required
                    placeholder="Your name"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="you@business.com"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <select
                    value={leadForm.industry}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, industry: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option>Med Spas & Aesthetic Clinics</option>
                    <option>Dental & Orthodontics</option>
                    <option>Chiropractic & Physical Therapy</option>
                    <option>HVAC, Plumbing & Home Services</option>
                    <option>Roofing & Restoration</option>
                    <option>Contractors & Trades</option>
                    <option>Other</option>
                  </select>
                </div>
                {captureError && <p className="mt-3 text-xs text-red-600">{captureError}</p>}
                <button
                  type="submit"
                  disabled={captureLoading}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {captureLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Start AI Concierge
                </button>
              </form>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-primary">AI</span>
                </div>
                <p className="text-sm font-semibold text-foreground">Ask the AI concierge anything</p>
                <p className="text-xs text-muted-foreground mt-1">Use it to find the right page, understand the offer, or decide whether to book now.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        trackCTA("ai_concierge_prompt", "chat_widget", { prompt });
                        void sendMessage(prompt);
                      }}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {visibleMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background rounded-br-sm'
                    : 'bg-white border border-border text-foreground rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-border px-3 py-2 rounded-xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={!leadProfile}
              placeholder="Ask about pricing, industries, demos, or integrations..."
              className="flex-1 text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="icon" onClick={() => void handleSend()} disabled={!leadProfile || !input.trim() || sending} className="rounded-lg h-9 w-9">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

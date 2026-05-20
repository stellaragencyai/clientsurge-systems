import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, CheckCircle2, Loader2, MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { trackCTA } from "@/lib/analytics";

const quickPrompts = [
  "What is included in the basic package?",
  "What information do you need to activate it?",
  "How do the two automations work?",
];

const starterFields = [
  "Business phone",
  "Website domain",
  "Booking link",
  "Business hours",
  "Services",
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
    business_name: leadProfile?.business_name || "",
    email: leadProfile?.email || "",
    phone: leadProfile?.phone || "",
    website_url: leadProfile?.website_url || "",
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
      metadata: {
        name: "AI Concierge Chat",
        lead_profile: leadProfile || leadForm,
        focus: "basic_package_activation",
      },
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
        phone: leadForm.phone,
        business_type: leadForm.industry,
        message: `AI concierge chat request for basic package activation. Business: ${leadForm.business_name || "Not provided"}. Industry: ${leadForm.industry}.`,
        website_url: leadForm.website_url,
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
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-xl transition-colors hover:bg-foreground/90 sm:bottom-6 sm:right-6"
        >
          <MessageSquareText className="h-4 w-4" />
          AI Concierge
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-lg border border-border bg-white shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[620px] sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">ClientSurge AI Concierge</p>
                <p className="text-xs text-muted-foreground">Package fit, setup details, automation handoff</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4">
            {!leadProfile ? (
              <form onSubmit={handleCapture} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Start your automation setup</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      A few basics let Sam qualify the package and collect the details needed for activation.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sam will collect next</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {starterFields.map((field) => (
                      <span key={field} className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    value={leadForm.full_name}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    required
                    placeholder="Your name"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={leadForm.business_name}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, business_name: e.target.value }))}
                    required
                    placeholder="Business name"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder="you@business.com"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Business phone"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={leadForm.website_url}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, website_url: e.target.value }))}
                    placeholder="Website URL"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <select
                    value={leadForm.industry}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, industry: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
                >
                  {captureLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Start AI Concierge
                </button>
              </form>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">Ask Sam about setup</p>
                <p className="mt-1 max-w-[260px] text-xs leading-5 text-muted-foreground">Sam can explain the offer and gather the fields needed to activate the first two automations.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        trackCTA("ai_concierge_prompt", "chat_widget", { prompt });
                        void sendMessage(prompt);
                      }}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {visibleMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[84%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background'
                    : 'bg-white border border-border text-foreground'
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
                <div className="rounded-lg border border-border bg-white px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t border-border bg-white px-3 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={!leadProfile}
              placeholder="Ask about setup, pricing, or automations..."
              className="min-w-0 flex-1 rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="icon" onClick={() => void handleSend()} disabled={!leadProfile || !input.trim() || sending} className="h-9 w-9 rounded-lg">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

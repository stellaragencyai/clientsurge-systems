/**
 * AdminInbox — unified support message center across all client projects.
 * BUILD #10
 */
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, MessageSquare, RefreshCw, CheckCheck, Sparkles } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminInbox() {
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDraftMeta, setAiDraftMeta] = useState(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const projs = await base44.entities.ClientProject.list("-created_date", 100);
      // Load all messages for all projects
      const allMsgs = await base44.entities.SupportMessage.list("-created_date", 500);
      const byProject = {};
      allMsgs.forEach(m => {
        if (!byProject[m.project_id]) byProject[m.project_id] = [];
        byProject[m.project_id].push(m);
      });
      // Sort each project's messages oldest-first
      Object.keys(byProject).forEach(pid => {
        byProject[pid].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      });
      setMessages(byProject);
      // Sort projects: unread first, then by latest message
      const sorted = projs.sort((a, b) => {
        const aUnread = (byProject[a.id] || []).filter(m => m.role === "client" && !m.read).length;
        const bUnread = (byProject[b.id] || []).filter(m => m.role === "client" && !m.read).length;
        if (bUnread !== aUnread) return bUnread - aUnread;
        const aLast = byProject[a.id]?.at(-1)?.created_date || a.created_date;
        const bLast = byProject[b.id]?.at(-1)?.created_date || b.created_date;
        return new Date(bLast) - new Date(aLast);
      });
      setProjects(sorted);
      if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const markRead = async (projectId) => {
    const unread = (messages[projectId] || []).filter(m => m.role === "client" && !m.read);
    if (!unread.length) return;
    await Promise.all(unread.map(m => base44.entities.SupportMessage.update(m.id, { read: true })));
    setMessages(prev => ({
      ...prev,
      [projectId]: prev[projectId].map(m =>
        m.role === "client" && !m.read ? { ...m, read: true } : m
      ),
    }));
  };

  const handleSelect = (projectId) => {
    setSelectedId(projectId);
    markRead(projectId);
    setInput("");
    setAiError("");
    setAiDraftMeta(null);
  };

  const inferIntentFromMessage = (message = "") => {
    const text = message.toLowerCase();
    if (/\bstop\b|unsubscribe|remove me|do not contact/.test(text)) return "stop";
    if (/price|pricing|cost|how much|payment|invoice|bill/.test(text)) return "pricing_interest";
    if (/book|schedule|appointment|calendar|available|availability/.test(text)) return "booking_ready";
    if (/question|how do|what does|can you|why|when|where|\?/.test(text)) return "question";
    if (/not interested|no thanks|cancel/.test(text)) return "not_interested";
    if (/unsure|maybe|thinking|not sure/.test(text)) return "unsure";
    return "question";
  };

  const handleSuggestReply = async () => {
    if (!selectedProject || aiSuggesting) return;

    const latestClientMessage = [...threadMessages].reverse().find(msg => msg.role === "client");
    if (!latestClientMessage) {
      setAiError("No client message to respond to yet.");
      return;
    }

    setAiSuggesting(true);
    setAiError("");
    setAiDraftMeta(null);

    try {
      const recentHistory = threadMessages.slice(-8).map(msg => ({
        role: msg.role,
        message: msg.message,
        created_date: msg.created_date,
      }));
      const leadContext = {
        full_name: selectedProject.client_name || latestClientMessage.sender_name || "Client",
        business_name: selectedProject.business_name,
        email: selectedProject.client_email || selectedProject.contact_email || latestClientMessage.sender_email,
        business_type: selectedProject.industry || selectedProject.plan || "ClientSurge client",
        status: selectedProject.step_live === "complete" ? "Live Client" : "Onboarding Client",
        booking_link: selectedProject.booking_link || "",
        plan: selectedProject.plan,
      };
      const intent = inferIntentFromMessage(latestClientMessage.message);
      const res = await base44.functions.invoke("generateAIReply", {
        intent,
        lead: leadContext,
        inboundMessage: latestClientMessage.message,
        conversation_history: recentHistory,
        source: "admin_inbox_suggest_reply",
      });
      const draft = res.data?.message || res.message || "";
      if (!draft) throw new Error("AI reply came back empty.");
      setInput(draft);
      setAiDraftMeta({ intent, sourceMessageId: latestClientMessage.id });
    } catch (error) {
      setAiError(error?.response?.data?.error || error.message || "AI suggestion failed.");
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedId || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const newMsg = await base44.entities.SupportMessage.create({
      project_id: selectedId,
      sender_email: "system@clientsurgesystems.com",
      sender_name: "ClientSurge Systems",
      role: "admin",
      message: text,
      read: false,
    });
    setMessages(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg],
    }));
    setSending(false);
  };

  const selectedProject = projects.find(p => p.id === selectedId);
  const threadMessages = messages[selectedId] || [];
  const totalUnread = projects.reduce((sum, p) =>
    sum + (messages[p.id] || []).filter(m => m.role === "client" && !m.read).length, 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            Inbox
            {totalUnread > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5">
                {totalUnread}
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">All client support messages in one place.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No client projects yet</p>
        </div>
      ) : (
        <div className="flex rounded-xl border border-border overflow-hidden bg-white" style={{ height: "600px" }}>
          {/* Left: project list */}
          <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {projects.map(project => {
                const projectMsgs = messages[project.id] || [];
                const unread = projectMsgs.filter(m => m.role === "client" && !m.read).length;
                const last = projectMsgs.at(-1);
                const isSelected = project.id === selectedId;
                return (
                  <button
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                      isSelected ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {project.business_name}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {unread > 0 && (
                          <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">{unread}</span>
                        )}
                      </div>
                    </div>
                    {last && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {last.role === "admin" ? "You: " : ""}{last.message}
                      </p>
                    )}
                    {last && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(last.created_date)}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: chat thread */}
          <div className="flex-1 flex flex-col">
            {selectedProject ? (
              <>
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedProject.business_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedProject.client_email} · {selectedProject.plan}</p>
                  </div>
                  <button
                    onClick={() => markRead(selectedId)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark read
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {threadMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
                  ) : (
                    threadMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
                          style={
                            msg.role === "admin"
                              ? { background: "linear-gradient(135deg,#005B99,#0077B6)", color: "#EAF8FF", borderBottomRightRadius: "4px" }
                              : { background: "hsl(var(--muted))", borderBottomLeftRadius: "4px" }
                          }
                        >
                          {msg.role === "client" && (
                            <p className="text-[10px] font-bold opacity-60 mb-0.5">{msg.sender_name}</p>
                          )}
                          <p>{msg.message}</p>
                          <p className="text-[10px] mt-1 opacity-50">{timeAgo(msg.created_date)}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-border px-4 py-3">
                  {aiError && (
                    <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {aiError}
                    </div>
                  )}
                  {aiDraftMeta && (
                    <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      AI draft loaded as editable text. Intent: {aiDraftMeta.intent.replaceAll("_", " ")}.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSuggestReply}
                      disabled={aiSuggesting || !threadMessages.some(msg => msg.role === "client")}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      {aiSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      AI Draft
                    </button>
                    <input
                      value={input}
                      onChange={e => {
                        setInput(e.target.value);
                        setAiDraftMeta(null);
                      }}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Reply to client..."
                      className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#005B99,#0077B6)" }}
                    >
                      {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

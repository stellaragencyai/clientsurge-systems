/**
 * AdminInbox — unified support message center across all client projects.
 * BUILD #10
 */
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, MessageSquare, RefreshCw, CheckCheck } from "lucide-react";

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

function toTimestamp(value) {
  return value ? new Date(value).getTime() : 0;
}

export default function AdminInbox() {
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
        byProject[pid].sort((a, b) => toTimestamp(a.created_date) - toTimestamp(b.created_date));
      });
      setMessages(byProject);
      // Sort projects: unread first, then by latest message
      const sorted = projs.sort((a, b) => {
        const aUnread = (byProject[a.id] || []).filter(m => m.role === "client" && !m.read).length;
        const bUnread = (byProject[b.id] || []).filter(m => m.role === "client" && !m.read).length;
        if (bUnread !== aUnread) return bUnread - aUnread;
        const aLast = byProject[a.id]?.at(-1)?.created_date || a.created_date;
        const bLast = byProject[b.id]?.at(-1)?.created_date || b.created_date;
        return toTimestamp(bLast) - toTimestamp(aLast);
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
                              ? { background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)", color: "#f5e6d0", borderBottomRightRadius: "4px" }
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

                <div className="px-4 py-3 border-t border-border flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Reply to client..."
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
                  >
                    {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
                  </button>
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

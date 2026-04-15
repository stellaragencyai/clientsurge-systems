import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Clock, Loader2, MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react";

const STEP_KEYS = [
  "step_onboarding", "step_payment", "step_system_setup",
  "step_sms", "step_email", "step_booking", "step_followup", "step_live"
];
const STEP_LABELS = [
  "Onboarding", "Payment", "System Setup", "SMS", "Email", "Booking", "Follow-Up", "Go Live"
];
const STATUS_OPTIONS = ["pending", "in_progress", "complete"];

export default function ClientProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [messages, setMessages] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [saving, setSaving] = useState({});

  const loadProjects = async () => {
    const data = await base44.entities.ClientProject.list("-created_date", 50);
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, []);

  const loadMessages = async (projectId) => {
    const msgs = await base44.entities.SupportMessage.filter({ project_id: projectId }, "created_date", 100);
    setMessages(prev => ({ ...prev, [projectId]: msgs }));
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadMessages(id);
  };

  const updateStep = async (project, key, value) => {
    setSaving(prev => ({ ...prev, [project.id]: true }));
    await base44.entities.ClientProject.update(project.id, { [key]: value });
    await loadProjects();
    setSaving(prev => ({ ...prev, [project.id]: false }));
  };

  const sendReply = async (project) => {
    const text = (replyInputs[project.id] || "").trim();
    if (!text) return;
    setSaving(prev => ({ ...prev, [`reply_${project.id}`]: true }));
    await base44.entities.SupportMessage.create({
      project_id: project.id,
      sender_email: "admin@apexflow.com",
      sender_name: "ApexFlow Team",
      role: "admin",
      message: text,
      read: false,
    });
    setReplyInputs(prev => ({ ...prev, [project.id]: "" }));
    await loadMessages(project.id);
    setSaving(prev => ({ ...prev, [`reply_${project.id}`]: false }));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold text-foreground">Client Projects</h2>
        <span className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">No client projects yet.</div>
      )}

      {projects.map(project => {
        const completedSteps = STEP_KEYS.filter(k => project[k] === "complete").length;
        const isExpanded = expanded === project.id;
        const projectMessages = messages[project.id] || [];
        const unreadCount = projectMessages.filter(m => m.role === "client" && !m.read).length;

        return (
          <div key={project.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Project row */}
            <button
              onClick={() => toggleExpand(project.id)}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-foreground text-sm">{project.business_name}</p>
                  <p className="text-xs text-muted-foreground">{project.client_email} · {project.plan}</p>
                </div>
                {unreadCount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    <MessageSquare className="w-3 h-3" /> {unreadCount}
                  </span>
                )}
                {project.plan_change_request && project.plan_change_request !== "None" && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Plan change: {project.plan_change_request}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(completedSteps / 8) * 100}%`, background: "linear-gradient(90deg,#9a5c2e,#c8965c)" }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{completedSteps}/8</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border px-6 py-6 space-y-8">

                {/* Step controls */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Build Progress Controls</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STEP_KEYS.map((key, i) => (
                      <div key={key} className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-foreground">{i + 1}. {STEP_LABELS[i]}</p>
                        <select
                          value={project[key] || "pending"}
                          onChange={e => updateStep(project, key, e.target.value)}
                          className="text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                        >
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  {saving[project.id] && <p className="text-xs text-primary mt-2">Saving...</p>}
                </div>

                {/* Messages thread */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Support Messages</p>
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3 mb-3 max-h-64 overflow-y-auto">
                    {projectMessages.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No messages yet.</p>
                    )}
                    {projectMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[80%] px-4 py-2.5 rounded-xl text-xs"
                          style={
                            msg.role === "admin"
                              ? { background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)", color: "#f5e6d0" }
                              : { background: "#fff", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }
                          }
                        >
                          <p className="font-bold mb-0.5 opacity-60">{msg.role === "admin" ? "You" : msg.sender_name}</p>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={replyInputs[project.id] || ""}
                      onChange={e => setReplyInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && sendReply(project)}
                      placeholder="Reply to client..."
                      className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => sendReply(project)}
                      disabled={saving[`reply_${project.id}`]}
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
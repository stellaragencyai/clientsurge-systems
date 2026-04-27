import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock, MessageSquare, ChevronDown, ChevronUp, Send } from "lucide-react";
import InstallQueuePanel from "./InstallQueuePanel";

const STEP_KEYS = [
  "step_onboarding",
  "step_payment",
  "step_system_setup",
  "step_sms",
  "step_email",
  "step_booking",
  "step_followup",
  "step_live",
];

const STEP_LABELS = [
  "Onboarding",
  "Payment",
  "System Setup",
  "SMS",
  "Email",
  "Booking",
  "Follow-Up",
  "Go Live",
];

function MirrorStatusBadge({ value }) {
  const tone =
    value === "complete"
      ? "bg-green-50 text-green-700"
      : value === "in_progress"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>
      {value || "pending"}
    </span>
  );
}

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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadMessages = async (projectId) => {
    const msgs = await base44.entities.SupportMessage.filter({ project_id: projectId }, "created_date", 100);
    setMessages((prev) => ({ ...prev, [projectId]: msgs }));
  };

  const toggleExpand = (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }

    setExpanded(id);
    // Only fetch if not already loaded
    if (!messages[id]) {
      loadMessages(id);
    }
  };

  const sendReply = async (project) => {
    const text = (replyInputs[project.id] || "").trim();
    if (!text) return;

    setSaving((prev) => ({ ...prev, [`reply_${project.id}`]: true }));
    await base44.entities.SupportMessage.create({
      project_id: project.id,
      sender_email: "system@clientsurgesystems.com",
      sender_name: "ClientSurge Systems",
      role: "admin",
      message: text,
      read: false,
    });
    setReplyInputs((prev) => ({ ...prev, [project.id]: "" }));
    await loadMessages(project.id);
    setSaving((prev) => ({ ...prev, [`reply_${project.id}`]: false }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InstallQueuePanel />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Client Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Client-facing progress remains a mirrored view. Install truth stays on the paid order workflow above.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </span>
      </div>

      {projects.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">No client projects yet.</div>
      )}

      {projects.map((project) => {
        const completedSteps = STEP_KEYS.filter((key) => project[key] === "complete").length;
        const isExpanded = expanded === project.id;
        const projectMessages = messages[project.id] || [];
        const unreadCount = projectMessages.filter((message) => message.role === "client" && !message.read).length;

        return (
          <div key={project.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <button
              onClick={() => toggleExpand(project.id)}
              className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-muted/20"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{project.business_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.client_email} - {project.plan}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    <MessageSquare className="h-3 w-3" /> {unreadCount}
                  </span>
                )}
                {project.plan_change_request && project.plan_change_request !== "None" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    Plan change: {project.plan_change_request}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(completedSteps / 8) * 100}%`, background: "linear-gradient(90deg,#9a5c2e,#c8965c)" }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{completedSteps}/8</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-8 border-t border-border px-6 py-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Mirrored project progress</p>
                      <p className="mt-1 text-sm text-amber-800">
                        These project steps are supporting context for the client portal. They are synced from the canonical paid-order install workflow and are not editable here.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Mirrored Build Progress</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {STEP_KEYS.map((key, index) => (
                      <div key={key} className="rounded-xl border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold text-foreground">{index + 1}. {STEP_LABELS[index]}</p>
                        <div className="mt-2">
                          <MirrorStatusBadge value={project[key] || "pending"} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Support Messages</p>
                  <div className="mb-3 max-h-64 space-y-3 overflow-y-auto rounded-xl bg-muted/30 p-4">
                    {projectMessages.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">No messages yet.</p>
                    )}
                    {projectMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === "admin" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[80%] rounded-xl px-4 py-2.5 text-xs"
                          style={
                            message.role === "admin"
                              ? { background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)", color: "#f5e6d0" }
                              : { background: "#fff", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }
                          }
                        >
                          <p className="mb-0.5 font-bold opacity-60">{message.role === "admin" ? "You" : message.sender_name}</p>
                          {message.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={replyInputs[project.id] || ""}
                      onChange={(e) => setReplyInputs((prev) => ({ ...prev, [project.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && sendReply(project)}
                      placeholder="Reply to client..."
                      className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => sendReply(project)}
                      disabled={saving[`reply_${project.id}`]}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
                    >
                      <Send className="h-4 w-4 text-white" />
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
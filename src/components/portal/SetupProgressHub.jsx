import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Clock, Loader2, Zap, Upload, X, FileText,
  MessageCircle, Send, ImageIcon, Paperclip, ChevronDown, ChevronUp
} from "lucide-react";

// ─── STEP CONFIG ────────────────────────────────────────────────────────────
const STEPS = [
  { key: "step_onboarding",   label: "Onboarding Form",   icon: "📋", desc: "Your intake form has been received and is being reviewed." },
  { key: "step_payment",      label: "Payment Confirmed", icon: "💳", desc: "Payment processed and your account is active." },
  { key: "step_system_setup", label: "System Setup",      icon: "⚙️", desc: "Our team is configuring your full automation system." },
  { key: "step_sms",          label: "SMS Connected",     icon: "💬", desc: "Your dedicated SMS line is being activated and tested." },
  { key: "step_email",        label: "Email Connected",   icon: "📧", desc: "Your email automation sequences are being connected." },
  { key: "step_booking",      label: "Booking Flow",      icon: "📅", desc: "Your booking flow is being configured and verified." },
  { key: "step_followup",     label: "Follow-Up Active",  icon: "🔄", desc: "Your follow-up sequences are being loaded and checked." },
  { key: "step_live",         label: "System Live",       icon: "🚀", desc: "Your system has been verified and is live." },
];

const ASSET_CATEGORIES = [
  { value: "logo", label: "Logo / Brand Assets" },
  { value: "photo", label: "Business Photos" },
  { value: "credentials", label: "Access Credentials" },
  { value: "document", label: "Documents / Contracts" },
  { value: "other", label: "Other" },
];

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
function ProgressSection({ project }) {
  const steps = STEPS.map(s => ({ ...s, status: project[s.key] || "pending" }));
  const completed = steps.filter(s => s.status === "complete").length;
  const pct = Math.round((completed / steps.length) * 100);
  const allDone = completed === steps.length;
  const [expanded, setExpanded] = useState(false);

  const current = steps.find(s => s.status === "in_progress") || steps.find(s => s.status === "pending");

  return (
    <div style={{
      background: "#ffffff",
      border: "1.5px solid rgba(0,174,239,0.15)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,59,143,0.07)",
    }}>
      {/* Header bar */}
      <div style={{
        background: "linear-gradient(135deg,#003B8F 0%,#006BB0 60%,#00AEEF 100%)",
        padding: "20px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 4px" }}>
              Configuration Progress
            </p>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", margin: 0 }}>
              {allDone ? "🎉 Your System Is Live!" : `Step ${completed + 1} of ${steps.length}`}
            </h3>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: "700",
            background: allDone ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.15)",
            color: allDone ? "#4ade80" : "#ffffff",
            border: `1px solid ${allDone ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.2)"}`,
          }}>
            {completed}/{steps.length} complete
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: "8px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "9999px",
            width: `${pct}%`,
            background: "linear-gradient(90deg,#4ade80,#22c55e)",
            transition: "width 0.8s ease",
          }} />
        </div>

        {!allDone && current && (
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", margin: "8px 0 0" }}>
            {current.status === "in_progress" ? "Currently working on: " : "Up next: "}
            <strong style={{ color: "#ffffff" }}>{current.label}</strong>
          </p>
        )}
      </div>

      {/* Steps list */}
      <div style={{ padding: "20px 24px" }}>
        {/* Show first 3 always, rest behind expand */}
        {steps.slice(0, expanded ? steps.length : 4).map((step, idx) => {
          const isComplete = step.status === "complete";
          const isInProgress = step.status === "in_progress";
          const isLast = idx === (expanded ? steps.length - 1 : Math.min(3, steps.length - 1));

          return (
            <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: "14px", position: "relative", paddingBottom: isLast ? 0 : "16px" }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: "absolute", left: "17px", top: "36px",
                  width: "2px", height: "calc(100% - 16px)",
                  background: isComplete ? "rgba(0,174,239,0.35)" : "rgba(0,0,0,0.06)",
                  borderRadius: "2px",
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                background: isComplete ? "rgba(0,174,239,0.12)" : isInProgress ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.04)",
                border: `1.5px solid ${isComplete ? "rgba(0,174,239,0.4)" : isInProgress ? "rgba(245,158,11,0.4)" : "rgba(0,0,0,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1,
              }}>
                {isComplete
                  ? <CheckCircle2 style={{ width: "16px", height: "16px", color: "#0088CC" }} />
                  : isInProgress
                    ? <Loader2 style={{ width: "14px", height: "14px", color: "#f59e0b", animation: "spin 1.2s linear infinite" }} />
                    : <span style={{ fontSize: "14px" }}>{step.icon}</span>
                }
              </div>

              {/* Text */}
              <div style={{ flex: 1, opacity: step.status === "pending" ? 0.45 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: isComplete ? "#0A1628" : isInProgress ? "#d97706" : "rgba(10,22,40,0.6)" }}>
                    {step.label}
                  </span>
                  {isComplete && (
                    <span style={{ fontSize: "10px", fontWeight: "700", background: "rgba(0,174,239,0.1)", color: "#0088CC", padding: "2px 8px", borderRadius: "9999px" }}>
                      Done
                    </span>
                  )}
                  {isInProgress && (
                    <span style={{ fontSize: "10px", fontWeight: "700", background: "rgba(245,158,11,0.12)", color: "#d97706", padding: "2px 8px", borderRadius: "9999px" }}>
                      In Progress
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)", margin: "2px 0 0", lineHeight: 1.4 }}>{step.desc}</p>
              </div>
            </div>
          );
        })}

        {steps.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              marginTop: "14px", background: "none", border: "none",
              color: "#0088CC", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: 0,
            }}
          >
            {expanded ? <ChevronUp style={{ width: "14px", height: "14px" }} /> : <ChevronDown style={{ width: "14px", height: "14px" }} />}
            {expanded ? "Show less" : `Show ${steps.length - 4} more steps`}
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }` }} />
    </div>
  );
}

// ─── ASSET UPLOADER ──────────────────────────────────────────────────────────
function AssetUploader({ project, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("logo");
  const [note, setNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [recent, setRecent] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const newFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          file_url,
          file_type: file.type,
          category,
          uploaded_at: new Date().toISOString(),
          note: note.trim() || null,
        };
        const existing = project?.files || [];
        await base44.entities.ClientProject.update(project.id, {
          files: [...existing, newFile],
        });
        setRecent(r => [newFile, ...r].slice(0, 3));
      }
      setNote("");
      onUploaded?.();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      background: "#ffffff",
      border: "1.5px solid rgba(0,174,239,0.15)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,59,143,0.07)",
    }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
            background: "rgba(0,174,239,0.1)", border: "1.5px solid rgba(0,174,239,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Upload style={{ width: "16px", height: "16px", color: "#0088CC" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0A1628", margin: 0 }}>Upload Business Assets</h3>
            <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)", margin: 0 }}>
              Logos, photos, credentials, or documents for your setup
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Category selector */}
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "11px", fontWeight: "700", color: "rgba(10,22,40,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>
            Asset Type
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {ASSET_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: "6px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600",
                  border: `1.5px solid ${category === cat.value ? "#0088CC" : "rgba(0,0,0,0.1)"}`,
                  background: category === cat.value ? "rgba(0,136,204,0.08)" : "transparent",
                  color: category === cat.value ? "#0088CC" : "rgba(10,22,40,0.55)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note field */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ fontSize: "11px", fontWeight: "700", color: "rgba(10,22,40,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>
            Note (optional)
          </label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Primary logo, white background version"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: "12px",
              border: "1.5px solid rgba(0,0,0,0.1)", fontSize: "13px",
              color: "#0A1628", outline: "none", boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(0,136,204,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
          />
        </div>

        {/* Drop zone */}
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#0088CC" : "rgba(0,136,204,0.3)"}`,
            borderRadius: "16px",
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "rgba(0,136,204,0.04)" : "rgba(0,174,239,0.02)",
            transition: "all 0.2s",
          }}
        >
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <Loader2 style={{ width: "28px", height: "28px", color: "#0088CC", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: "13px", color: "#0088CC", fontWeight: "600", margin: 0 }}>Uploading…</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📎</div>
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628", margin: "0 0 4px" }}>
                Drop files here or click to browse
              </p>
              <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.45)", margin: 0 }}>
                Images, PDFs, Word docs — any format
              </p>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />

        {/* Recently uploaded */}
        {recent.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "rgba(10,22,40,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
              Just uploaded
            </p>
            {recent.map(f => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)",
                marginBottom: "6px",
              }}>
                <CheckCircle2 style={{ width: "14px", height: "14px", color: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#0A1628", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#0088CC", fontWeight: "600", textDecoration: "none", flexShrink: 0 }}>View</a>
              </div>
            ))}
          </div>
        )}

        {/* Existing files count */}
        {(project?.files?.length || 0) > 0 && (
          <p style={{ marginTop: "12px", fontSize: "12px", color: "rgba(10,22,40,0.4)", textAlign: "center" }}>
            {project.files.length} asset{project.files.length !== 1 ? "s" : ""} uploaded total · <a href="#" onClick={e => { e.preventDefault(); }} style={{ color: "#0088CC" }}>view in Files tab</a>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── INLINE CHAT ─────────────────────────────────────────────────────────────
function InlineChat({ project, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.SupportMessage.filter({ project_id: project.id }, "created_date", 50);
      setMessages(msgs);
      const newUnread = msgs.filter(m => m.role === "admin" && !m.read).length;
      setUnread(newUnread);
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [project.id]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      // mark admin messages read
      messages.filter(m => m.role === "admin" && !m.read).forEach(m =>
        base44.entities.SupportMessage.update(m.id, { read: true })
      );
      setUnread(0);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setInput("");
    setSending(true);
    await base44.entities.SupportMessage.create({
      project_id: project.id,
      sender_email: user?.email,
      sender_name: user?.full_name || user?.email,
      role: "client",
      message: content,
      read: false,
    });
    setSending(false);
    loadMessages();
  };

  return (
    <div style={{
      background: "#ffffff",
      border: "1.5px solid rgba(0,174,239,0.15)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,59,143,0.07)",
    }}>
      {/* Header — clickable to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "20px 24px", background: "none", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
          borderBottom: open ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
          background: "rgba(0,174,239,0.1)", border: "1.5px solid rgba(0,174,239,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
          <MessageCircle style={{ width: "16px", height: "16px", color: "#0088CC" }} />
          {unread > 0 && (
            <span style={{
              position: "absolute", top: "-5px", right: "-5px",
              width: "16px", height: "16px", borderRadius: "50%",
              background: "#ef4444", color: "#fff", fontSize: "9px", fontWeight: "800",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #fff",
            }}>{unread}</span>
          )}
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
            Message Implementation Team
          </h3>
          <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)", margin: 0 }}>
            {unread > 0 ? `${unread} new reply${unread > 1 ? "s" : ""} from our team` : "Ask questions · share context · track setup notes"}
          </p>
        </div>
        {open
          ? <ChevronUp style={{ width: "18px", height: "18px", color: "rgba(10,22,40,0.35)", flexShrink: 0 }} />
          : <ChevronDown style={{ width: "18px", height: "18px", color: "rgba(10,22,40,0.35)", flexShrink: 0 }} />
        }
      </button>

      {open && (
        <>
          {/* Messages */}
          <div style={{ height: "320px", overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px", background: "#fafcff" }}>
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <Loader2 style={{ width: "18px", height: "18px", color: "#0088CC", animation: "spin 1s linear infinite" }} />
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>👋</div>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628", margin: "0 0 4px" }}>No messages yet</p>
                <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.45)", margin: 0 }}>
                  Send us a message — we reply within a few hours.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "client" ? "flex-end" : "flex-start" }}>
                {msg.role === "admin" && (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end",
                    background: "linear-gradient(135deg,#003B8F,#00AEEF)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: "800", color: "#fff",
                  }}>CS</div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "10px 14px", fontSize: "13px", lineHeight: 1.5,
                  borderRadius: msg.role === "client" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "client"
                    ? "linear-gradient(135deg,#0069C0,#003B8F)"
                    : "#ffffff",
                  color: msg.role === "client" ? "#ffffff" : "#0A1628",
                  boxShadow: msg.role === "client"
                    ? "0 2px 8px rgba(0,105,192,0.3)"
                    : "0 1px 4px rgba(0,0,0,0.07)",
                  border: msg.role === "admin" ? "1px solid rgba(0,174,239,0.12)" : "none",
                }}>
                  {msg.role === "admin" && (
                    <p style={{ fontSize: "10px", fontWeight: "700", color: "#0088CC", margin: "0 0 4px" }}>ClientSurge Team</p>
                  )}
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px 16px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: "8px", alignItems: "flex-end", background: "#ffffff" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask a question or share context with our team…"
              rows={1}
              style={{
                flex: 1, resize: "none", borderRadius: "12px",
                border: "1.5px solid rgba(0,0,0,0.1)", padding: "10px 14px",
                fontSize: "13px", color: "#0A1628", outline: "none",
                maxHeight: "100px", transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(0,136,204,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              style={{
                width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
                background: input.trim() ? "linear-gradient(135deg,#0069C0,#003B8F)" : "rgba(0,0,0,0.06)",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {sending
                ? <Loader2 style={{ width: "15px", height: "15px", color: input.trim() ? "#fff" : "#999", animation: "spin 1s linear infinite" }} />
                : <Send style={{ width: "15px", height: "15px", color: input.trim() ? "#fff" : "#999" }} />
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function SetupProgressHub({ project, order, user }) {
  const [projectState, setProjectState] = useState(project);

  useEffect(() => {
    if (!project?.id) return;
    const unsub = base44.entities.ClientProject.subscribe(event => {
      if (event.id === project.id && event.type !== "delete") setProjectState(event.data);
    });
    return unsub;
  }, [project?.id]);

  if (!projectState) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <ProgressSection project={projectState} />
      <AssetUploader project={projectState} onUploaded={() => {}} />
      <InlineChat project={projectState} user={user} />
    </div>
  );
}
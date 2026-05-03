import { useState, useEffect } from "react";
import {
  X, Send, Save, CheckCircle, AlertCircle, Loader2, Trash2,
  MessageSquare, StickyNote, ChevronRight, PhoneCall, RotateCcw, Zap, MessageCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { saveLeadStatus, getLeadPipelineError } from "@/lib/leadPipelineApi";
import LeadScoreBadge from "./LeadScoreBadge";
import ActivityTimeline from "./ActivityTimeline";

const STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"];

const STATUS_COLORS = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  Contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Replied: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Qualified: "bg-green-100 text-green-700 border-green-200",
  "Booking Prompt Sent": "bg-amber-100 text-amber-700 border-amber-200",
  Booked: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Closed: "bg-gray-100 text-gray-700 border-gray-200",
};

const SEQUENCES = [
  { key: "instant_response", label: "Instant Response", icon: Zap, color: "text-blue-600 bg-blue-50 border-blue-200", desc: "Send the first-contact SMS template" },
  { key: "missed_call_recovery", label: "Missed Call Recovery", icon: PhoneCall, color: "text-amber-600 bg-amber-50 border-amber-200", desc: "Missed call text-back template" },
  { key: "day1_followup", label: "Day 1 Follow-Up", icon: MessageSquare, color: "text-purple-600 bg-purple-50 border-purple-200", desc: "24-hour follow-up SMS" },
  { key: "day3_followup", label: "Day 3 Follow-Up", icon: MessageSquare, color: "text-purple-600 bg-purple-50 border-purple-200", desc: "3-day nurture SMS" },
  { key: "day7_followup", label: "Day 7 Follow-Up", icon: MessageSquare, color: "text-purple-600 bg-purple-50 border-purple-200", desc: "7-day re-engagement SMS" },
  { key: "reactivation", label: "Reactivation", icon: RotateCcw, color: "text-rose-600 bg-rose-50 border-rose-200", desc: "Dormant lead reactivation SMS" },
];

const LEGACY_SEQUENCE_DISABLED_MESSAGE =
  "Legacy manual follow-up sends have been quarantined. Use the order-backed install workspace tests instead of the old lead-level sender.";

function Toast({ message, type }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium animate-fade-in ${
      type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
    }`}>
      {type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  );
}

export default function LeadCRMDrawer({ lead, onClose, onLeadUpdated }) {
  const [activeTab, setActiveTab] = useState("status");
  const [currentStatus, setCurrentStatus] = useState(lead.status);
  const [statusLoading, setStatusLoading] = useState(false);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [triggerLoading, setTriggerLoading] = useState(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (activeTab === "notes") loadNotes();
  }, [activeTab, lead.id]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Status ──────────────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || statusLoading) return;
    setStatusLoading(true);
    try {
      await saveLeadStatus({ lead_id: lead.id, status: newStatus });
      setCurrentStatus(newStatus);
      onLeadUpdated?.({ ...lead, status: newStatus });
      showToast(`Status updated to "${newStatus}"`);
    } catch (err) {
      showToast(getLeadPipelineError(err, "Failed to update status"), "error");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Notes ───────────────────────────────────────────────────────────────────

  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const data = await base44.entities.Events.filter(
        { lead_id: lead.id, event_type: "note" },
        "-created_date",
        50
      );
      setNotes(data || []);
    } catch (err) {
      console.error("load notes error", err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || noteSaving) return;
    setNoteSaving(true);
    try {
      const note = await base44.entities.Events.create({
        lead_id: lead.id,
        event_type: "note",
        data: { text: newNote.trim(), created_by: "admin" },
      });
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
      showToast("Note saved");
    } catch (err) {
      showToast("Failed to save note", "error");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await base44.entities.Events.delete(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      showToast("Failed to delete note", "error");
    }
  };

  // ── Sequences ────────────────────────────────────────────────────────────────

  const handleTriggerSequence = async (sequenceKey) => {
    showToast(LEGACY_SEQUENCE_DISABLED_MESSAGE, "error");
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    if (!whatsappMessage.trim() || whatsappSending) return;
    setWhatsappSending(true);
    try {
      const res = await base44.functions.invoke("sendWhatsAppMessage", {
        lead_id: lead.id,
        message: whatsappMessage.trim(),
      });
      showToast("WhatsApp message sent!");
      setWhatsappMessage("");
      onLeadUpdated?.({ ...lead, last_contacted_at: new Date().toISOString() });
    } catch (err) {
      showToast(err?.response?.data?.error || "Failed to send WhatsApp message", "error");
    } finally {
      setWhatsappSending(false);
    }
  };

  const tabs = [
    { key: "status", label: "Status" },
    { key: "sequences", label: "Sequences" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "notes", label: "Notes" },
    { key: "timeline", label: "Timeline" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-border">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-muted/20 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLORS[currentStatus] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                {currentStatus}
              </span>
              {lead.lead_score != null && <LeadScoreBadge score={lead.lead_score} />}
            </div>
            <p className="font-semibold text-foreground text-base">{lead.full_name}</p>
            <p className="text-xs text-muted-foreground">{lead.business_name} · {lead.phone || lead.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors mt-0.5">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex-1 min-w-[80px] py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── STATUS TAB ── */}
          {activeTab === "status" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((status) => {
                  const isActive = currentStatus === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={statusLoading}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? `${STATUS_COLORS[status]} border-current shadow-sm`
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      } ${statusLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span>{status}</span>
                      {isActive && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {statusLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </div>
              )}

              {/* Lead quick facts */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Lead Details</p>
                {[
                  ["Source", lead.source],
                  ["Problem", lead.problem],
                  ["Score", lead.lead_score != null ? `${lead.lead_score}/100` : null],
                  ["Last Contacted", lead.last_contacted_at ? formatDate(lead.last_contacted_at) : "Never"],
                  ["Created", formatDate(lead.created_date)],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
                    <span className="text-xs text-foreground font-medium">{value}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* ── SEQUENCES TAB ── */}
          {activeTab === "sequences" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manually Trigger a Sequence</p>
              <p className="text-xs text-muted-foreground">
                Legacy lead-level direct sends are quarantined. Use the order-backed install workspace tests for runtime verification.
              </p>
              <div className="space-y-2 pt-1">
                {SEQUENCES.map((seq) => {
                  const Icon = seq.icon;
                  const isLoading = triggerLoading === seq.key;
                  return (
                    <button
                      key={seq.key}
                      onClick={() => handleTriggerSequence(seq.key)}
                      disabled
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm disabled:opacity-50 ${seq.color}`}
                    >
                      <div className="flex-shrink-0">
                        {isLoading
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{seq.label}</p>
                        <p className="text-xs opacity-70">{seq.desc}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    </button>
                  );
                })}
              </div>
              {/* Enroll in Drip */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 mt-2">
                <p className="text-xs font-semibold text-blue-800 mb-1">Drip Campaign</p>
                <p className="text-xs text-blue-700 mb-2">Enroll this lead in the automated Day 1 → Day 3 → Day 7 follow-up sequence.</p>
                <button
                  onClick={async () => {
                    setTriggerLoading("drip_enroll");
                    try {
                      await base44.functions.invoke("startDripCampaign", { lead_id: lead.id });
                      showToast("Lead enrolled in drip campaign");
                    } catch (err) {
                      showToast(err?.response?.data?.error || "Failed to enroll in drip", "error");
                    } finally {
                      setTriggerLoading(null);
                    }
                  }}
                  disabled={!!triggerLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {triggerLoading === "drip_enroll" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Enroll in Drip
                </button>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <strong>Tip:</strong> Triggering a sequence logs a <code>CommunicationEvent</code> and updates <em>last_contacted_at</em>. You can review all events on the lead detail page.
              </div>
            </div>
          )}

          {/* ── WHATSAPP TAB ── */}
          {activeTab === "whatsapp" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-800">
                  <p className="font-semibold mb-0.5">WhatsApp via Twilio</p>
                  <p>Messages sent here use your WhatsApp Business sender configured in Settings. The lead's phone number must be WhatsApp-registered.</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sending to: <strong>{lead.phone || "No phone set"}</strong></p>
              </div>
              <form onSubmit={handleSendWhatsApp} className="space-y-2">
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={4}
                  placeholder="Type your WhatsApp message…"
                  disabled={whatsappSending}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={whatsappSending || !whatsappMessage.trim() || !lead.phone}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {whatsappSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  {whatsappSending ? "Sending…" : "Send WhatsApp Message"}
                </button>
              </form>
              {!lead.phone && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  This lead has no phone number — WhatsApp cannot be sent.
                </p>
              )}
            </div>
          )}

          {/* ── TIMELINE TAB ── */}
          {activeTab === "timeline" && (
            <ActivityTimeline leadId={lead.id} />
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNote(e); } }}
                  rows={2}
                  placeholder="Add an internal note… (Enter to save)"
                  disabled={noteSaving}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={noteSaving || !newNote.trim()}
                  className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {noteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </form>

              {notesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <StickyNote className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No notes yet for this lead</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-border bg-muted/20 px-4 py-3 group">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-foreground leading-relaxed flex-1">{note.data?.text}</p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded-lg transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">{formatDate(note.created_date)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/10 flex-shrink-0">
          <a
            href={`/admin/leads/${lead.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Open Full Lead Detail
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}

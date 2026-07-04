import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  StickyNote, Save, Trash2, Loader2, AlertCircle, Lock,
} from "lucide-react";

/**
 * Admin-only operator notes for a single capability.
 * Notes never override computed status or trust — they are purely manual observations.
 */
export default function OperatorNotesSection({ capabilityKey, capabilityLabel }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [author, setAuthor] = useState({ email: "", name: "" });

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await base44.auth.me();
      if (me) {
        setAuthor({ email: me.email || "", name: me.full_name || "" });
      }
      const res = await base44.entities.CapabilityOperatorNote.filter(
        { capability_key: capabilityKey },
        "-created_date",
        50
      );
      setNotes(res || []);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [capabilityKey]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSave = async () => {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    setError("");
    try {
      const created = await base44.entities.CapabilityOperatorNote.create({
        capability_key: capabilityKey,
        capability_label: capabilityLabel || capabilityKey,
        note_text: text,
        author_email: author.email,
        author_name: author.name,
        edited_at: new Date().toISOString(),
      });
      setNotes(prev => [created, ...prev]);
      setDraft("");
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await base44.entities.CapabilityOperatorNote.delete(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to delete note.");
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Operator Notes — Admin Only</p>
      </div>

      {/* Non-overriding disclaimer */}
      <div className="flex items-start gap-1.5 mb-2.5">
        <Lock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Manual notes do not override computed status and do not make a capability trusted. They are observations only.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-red-600">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add note */}
      <div className="mb-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an observation (e.g. 'Twilio credentials verified 2026-07-04, webhook 200 confirmed manually')…"
          rows={2}
          maxLength={2000}
          className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-amber-400 resize-none"
          disabled={saving}
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">{draft.length}/2000</span>
          <button
            onClick={handleSave}
            disabled={!draft.trim() || saving}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Note
          </button>
        </div>
      </div>

      {/* Existing notes */}
      {loading ? (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Loading notes…</span>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic">No operator notes yet.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} className="rounded-md border border-gray-200 bg-white p-2.5">
              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{note.note_text}</p>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  {note.author_name && <span className="font-medium text-gray-500">{note.author_name}</span>}
                  {note.author_email && <span>· {note.author_email}</span>}
                  <span>· {formatTimestamp(note.created_date)}</span>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Delete note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimestamp(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(val);
  }
}
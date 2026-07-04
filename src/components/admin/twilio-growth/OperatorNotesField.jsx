import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { StickyNote, Plus, Trash2, AlertCircle } from "lucide-react";

/**
 * Admin-only manual operator notes for a single capability row.
 *
 * Rules:
 * - Manual notes do not override computed status.
 * - Manual notes do not make a capability trusted.
 * - Shows note author and date.
 * - Admin-only entity (TwilioGrowthOperatorNote).
 */

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export default function OperatorNotesField({ capabilityKey, capabilityLabel }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.entities.TwilioGrowthOperatorNote.filter(
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

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    setError("");
    try {
      let authorName = "Admin";
      let authorEmail = "";
      try {
        const user = await base44.auth.me();
        authorName = user?.full_name || user?.email || "Admin";
        authorEmail = user?.email || "";
      } catch {
        // continue without auth info — admin-only panel already gates access
      }
      await base44.entities.TwilioGrowthOperatorNote.create({
        capability_key: capabilityKey,
        note_text: newNote.trim(),
        author_name: authorName,
        author_email: authorEmail,
      });
      setNewNote("");
      fetchNotes();
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    setError("");
    try {
      await base44.entities.TwilioGrowthOperatorNote.delete(noteId);
      fetchNotes();
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to delete note.");
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Operator Notes — Manual Observations
        </p>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed mb-2">
        Notes are manual observations only. They do not override computed status and do not make a capability trusted.
      </p>

      {/* Existing notes */}
      {loading ? (
        <p className="text-[11px] text-gray-400">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic">No operator notes yet.</p>
      ) : (
        <div className="space-y-2 mb-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded-md border border-gray-200 bg-white p-2.5">
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-gray-400">
                  {note.author_name || note.author_email || "Admin"} · {formatDate(note.created_date)}
                </p>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new note */}
      <div className="flex gap-2 items-start">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={`Add observation for ${capabilityLabel || capabilityKey}…`}
          rows={2}
          className="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400"
          disabled={saving}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newNote.trim()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-100 border border-amber-300 text-amber-700 text-[11px] font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Plus className="w-3 h-3" />
          {saving ? "Saving…" : "Add"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <p className="text-[10px] text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
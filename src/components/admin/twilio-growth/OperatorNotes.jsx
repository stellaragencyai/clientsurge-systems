import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { StickyNote, Save, Trash2, RefreshCw } from "lucide-react";

/**
 * Admin-only Operator Notes for a capability row.
 * Manual notes do NOT override computed status and do NOT make a capability trusted.
 * Notes are persisted to TwilioGrowthEngineOperatorNote entity.
 */
export default function OperatorNotes({ capabilityKey }) {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.entities.TwilioGrowthEngineOperatorNote.filter(
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
    if (!draft.trim()) return;
    setSaving(true);
    setError("");
    try {
      const user = await base44.auth.me();
      await base44.entities.TwilioGrowthEngineOperatorNote.create({
        capability_key: capabilityKey,
        note_text: draft.trim(),
        author_email: user?.email || "admin",
      });
      setDraft("");
      await fetchNotes();
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await base44.entities.TwilioGrowthEngineOperatorNote.delete(noteId);
      await fetchNotes();
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to delete note.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Operator Notes — Admin Only
        </p>
        <button
          onClick={fetchNotes}
          disabled={loading}
          className="ml-auto text-gray-400 hover:text-gray-600 disabled:opacity-40"
          title="Refresh notes"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mb-2 italic">
        Manual notes do not override computed status and do not make a capability trusted.
      </p>

      {/* Existing notes */}
      {notes.length > 0 && (
        <div className="space-y-2 mb-3">
          {notes.map(note => (
            <div key={note.id} className="rounded-md border border-gray-100 bg-gray-50/50 p-2">
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <p className="text-[10px] text-gray-400">
                  {note.author_email || "admin"} · {formatDate(note.created_date)}
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

      {/* New note input */}
      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an observation…"
          rows={2}
          className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          maxLength={2000}
        />
        <button
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-red-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
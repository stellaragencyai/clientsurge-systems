import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { StickyNote, Trash2, Loader2, Plus } from "lucide-react";

/**
 * Private admin-only manual observation field for a single capability row.
 * Notes do NOT override computed status and do NOT make a capability trusted.
 */
export default function OperatorNotesField({ capabilityKey, capabilityLabel }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadNotes = useCallback(async () => {
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
      setError(err?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [capabilityKey]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");
    try {
      let authorEmail = "";
      let authorName = "";
      try {
        const user = await base44.auth.me();
        authorEmail = user?.email || "";
        authorName = user?.full_name || "";
      } catch (_) {
        /* auth optional — note still saved */
      }
      await base44.entities.TwilioGrowthEngineOperatorNote.create({
        capability_key: capabilityKey,
        capability_label: capabilityLabel || capabilityKey,
        note_text: trimmed,
        author_email: authorEmail,
        author_name: authorName,
        is_observation_only: true,
      });
      setDraft("");
      await loadNotes();
    } catch (err) {
      setError(err?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await base44.entities.TwilioGrowthEngineOperatorNote.delete(noteId);
      await loadNotes();
    } catch (err) {
      setError(err?.message || "Failed to delete note");
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <StickyNote className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Operator Notes — Admin Only
        </p>
      </div>
      <p className="text-[10px] text-amber-600/80 mb-2 leading-relaxed">
        Manual observations only. Does not override computed status. Does not make this capability trusted.
      </p>

      {loading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading notes…
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {notes.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">No operator notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-md border border-amber-100 bg-white p-2.5">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-gray-400">
                    {note.author_name || note.author_email || "Unknown admin"}
                    {note.created_date && (
                      <span> · {new Date(note.created_date).toLocaleString()}</span>
                    )}
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
            ))
          )}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an observation (does not change status)…"
          rows={2}
          className="flex-1 rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Save
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
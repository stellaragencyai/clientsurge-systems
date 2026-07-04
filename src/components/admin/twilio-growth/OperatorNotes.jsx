import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { StickyNote, Save, Trash2 } from "lucide-react";

const STORAGE_PREFIX = "cs_tge_operator_notes_";

/**
 * Admin-only operator notes field for a capability row.
 * Notes are stored in localStorage and tagged with author + date.
 * Rules:
 *   - Manual notes do NOT override computed status.
 *   - Manual notes do NOT make a capability trusted.
 *   - Author/date shown if available.
 */
export default function OperatorNotes({ capKey }) {
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState(null);
  const [author, setAuthor] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storageKey = STORAGE_PREFIX + capKey;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedNote(parsed);
        setNote(parsed.text || "");
        setAuthor(parsed.author || "");
      }
    } catch {
      // ignore parse errors
    }
  }, [capKey]);

  const fetchAuthor = async () => {
    if (author) return author;
    try {
      const user = await base44.auth.me();
      if (user?.email) {
        setAuthor(user.email);
        return user.email;
      }
    } catch {
      // ignore — author will be blank
    }
    return "";
  };

  const handleSave = async () => {
    setSaving(true);
    const email = await fetchAuthor();
    const entry = {
      text: note.trim(),
      author: email || "admin",
      updated_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_PREFIX + capKey, JSON.stringify(entry));
      setSavedNote(entry);
      setEditing(false);
    } catch {
      // storage full or unavailable — silently ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + capKey);
    } catch {
      // ignore
    }
    setSavedNote(null);
    setNote("");
    setEditing(false);
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Operator Notes — Admin Only</p>
        {savedNote && !editing && (
          <span className="ml-auto text-[10px] text-gray-400">
            by {savedNote.author || "admin"} · {formatDate(savedNote.updated_at)}
          </span>
        )}
      </div>

      {savedNote && !editing ? (
        <div>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{savedNote.text}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => { setNote(savedNote.text || ""); setEditing(true); }}
              className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-[10px] font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-2.5 h-2.5" /> Delete
            </button>
          </div>
        </div>
      ) : (
        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an observation (does not override computed status or trust)…"
            rows={2}
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-md p-2 resize-y focus:outline-none focus:border-blue-400"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving || !note.trim()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-2.5 h-2.5" /> Save
            </button>
            {editing && (
              <button
                onClick={() => { setEditing(false); setNote(savedNote?.text || ""); }}
                className="px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 text-[10px] font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <span className="ml-auto text-[10px] text-gray-300">
              Notes do not override status or trust
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Trash2 } from "lucide-react";

export default function NotesSection({ leadId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [leadId]);

  const loadNotes = async () => {
    try {
      // For now, we'll store notes in the lead's problem field or a custom field
      // This is a simple implementation using the Events entity for notes
      const data = await base44.entities.Events.filter(
        { lead_id: leadId, event_type: "note" },
        "-created_date",
        100
      );
      setNotes(data);
    } catch (err) {
      console.error("Error loading notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const note = await base44.entities.Events.create({
        lead_id: leadId,
        event_type: "note",
        data: { text: newNote, created_by: "admin" },
      });

      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await base44.entities.Events.delete(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={saving || !newNote.trim()}
          className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No notes yet</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border border-border rounded-lg p-4 bg-muted/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {note.data?.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(note.created_date)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
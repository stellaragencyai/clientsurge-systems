import { useState } from "react";
import { Tag, ListChecks, X, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"];

export default function LeadBulkToolbar({ selectedIds, onClear, onDone }) {
  const [action, setAction] = useState(null); // 'status' | 'sequence' | 'blocked-delete'
  const [statusValue, setStatusValue] = useState("");
  const [sequenceValue, setSequenceValue] = useState("");
  const [loading, setLoading] = useState(false);

  const count = selectedIds.length;

  const handleChangeStatus = async () => {
    if (!statusValue) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => base44.entities.Leads.update(id, { status: statusValue })));
      onDone("status");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleAddToSequence = async () => {
    if (!sequenceValue) return;
    setLoading(true);
    try {
      // Tag the lead with the sequence name for now
      await Promise.all(selectedIds.map(id =>
        base44.entities.Leads.update(id, { ai_last_classification: sequenceValue })
      ));
      onDone("sequence");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border border-border bg-foreground text-background"
      style={{ minWidth: 320 }}
    >
      {/* Count badge */}
      <span className="flex-shrink-0 rounded-full bg-primary text-white text-xs font-bold px-2.5 py-0.5">
        {count}
      </span>
      <span className="text-sm font-semibold mr-2">selected</span>

      {/* Inline subform for status */}
      {action === "status" && (
        <div className="flex items-center gap-2 flex-1">
          <select
            value={statusValue}
            onChange={e => setStatusValue(e.target.value)}
            className="flex-1 text-xs rounded-lg border border-white/20 bg-white/10 text-background px-2 py-1.5 focus:outline-none"
          >
            <option value="">Pick status…</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleChangeStatus}
            disabled={!statusValue || loading}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          </button>
          <button onClick={() => setAction(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inline subform for sequence */}
      {action === "sequence" && (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={sequenceValue}
            onChange={e => setSequenceValue(e.target.value)}
            placeholder="Sequence name…"
            className="flex-1 text-xs rounded-lg border border-white/20 bg-white/10 text-background px-2 py-1.5 placeholder:text-white/40 focus:outline-none"
          />
          <button
            onClick={handleAddToSequence}
            disabled={!sequenceValue || loading}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          </button>
          <button onClick={() => setAction(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete is intentionally blocked outside guarded admin cleanup */}
      {action === "blocked-delete" && (
        <div className="flex items-center gap-2 flex-1">
          <ShieldAlert className="w-4 h-4 text-amber-300" />
          <span className="text-xs text-amber-200 font-semibold">Bulk delete is disabled here. Use Admin → Lead Quality Control → Delete Verified Junk.</span>
          <button onClick={() => setAction(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Default action buttons */}
      {!action && (
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => setAction("status")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" /> Status
          </button>
          <button
            onClick={() => setAction("sequence")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ListChecks className="w-3.5 h-3.5" /> Sequence
          </button>
          <button
            onClick={() => setAction("blocked-delete")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Delete Locked
          </button>
        </div>
      )}

      {/* Clear */}
      <button
        onClick={onClear}
        className="ml-1 flex-shrink-0 text-white/50 hover:text-white transition-colors"
        title="Deselect all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

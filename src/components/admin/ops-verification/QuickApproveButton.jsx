import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, Zap } from "lucide-react";

/**
 * QuickApproveButton — one-click admin approval for a manually-audited checklist.
 * Calls the `quickApproveChecklistItem` backend function.
 *
 * Props:
 *   checklistId  — AutomationChecklist entity ID
 *   disabled     — true if already approved/live
 *   onApproved   — callback after successful approval (typically refetch)
 *   compact      — render as a small icon-only button
 */
export default function QuickApproveButton({ checklistId, disabled, onApproved, compact }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleApprove = async () => {
    if (!checklistId || loading || disabled || done) return;
    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("quickApproveChecklistItem", {
        checklist_id: checklistId,
      });
      setDone(true);
      if (onApproved) onApproved();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Quick approve failed");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleApprove}
        disabled={disabled || loading || done}
        title={done ? "Approved" : "Quick Approve"}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-not-allowed"
        style={{
          background: done ? "rgba(34,197,94,0.08)" : "rgba(0,174,239,0.08)",
          borderColor: done ? "rgba(34,197,94,0.30)" : "rgba(0,174,239,0.25)",
          color: done ? "#15803d" : "#0369a1",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : done ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          <Zap className="w-3 h-3" />
        )}
        {done ? "Approved" : "Quick Approve"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleApprove}
        disabled={disabled || loading || done}
        className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed"
        style={{
          background: done ? "rgba(34,197,94,0.10)" : "linear-gradient(90deg, #0079c1, #005691)",
          color: done ? "#15803d" : "#ffffff",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : done ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <Zap className="w-3.5 h-3.5" />
        )}
        {done ? "Approved" : "Quick Approve"}
      </button>
      {error && (
        <p className="text-[10px] text-red-600 font-medium leading-tight">{error}</p>
      )}
    </div>
  );
}
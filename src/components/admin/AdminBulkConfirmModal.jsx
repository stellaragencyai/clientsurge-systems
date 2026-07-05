/**
 * Bulk Action Confirmation Modal
 * Fixes Audit Issue #49: No bulk action confirmation for destructive operations
 *
 * Usage:
 * <AdminBulkConfirmModal
 *   open={showConfirm}
 *   title="Delete Leads"
 *   count={selectedIds.length}
 *   onConfirm={() => handleBulkDelete()}
 *   onCancel={() => setShowConfirm(false)}
 *   requireTyping={true} // Require typing "DELETE" for 50+ records
 * />
 */

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function AdminBulkConfirmModal({
  open,
  title = "Confirm Action",
  count = 0,
  onConfirm,
  onCancel,
  requireTyping = false,
  confirmText = "DELETE",
  description = "This action cannot be undone.",
}) {
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (open) {
      setTypedValue("");
    }
  }, [open]);

  if (!open) return null;

  const needsTyping = requireTyping && count >= 50;
  const canConfirm = !needsTyping || typedValue === confirmText;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-confirm-title"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 id="bulk-confirm-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          You are about to {title.toLowerCase()} <strong className="text-foreground">{count}</strong> record{count !== 1 ? "s" : ""}. {description}
        </p>

        {needsTyping && (
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Type "{confirmText}" to confirm
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              placeholder={confirmText}
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {title} {count} {count !== 1 ? "records" : "record"}
          </button>
        </div>
      </div>
    </div>
  );
}
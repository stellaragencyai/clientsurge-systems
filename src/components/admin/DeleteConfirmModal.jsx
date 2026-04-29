/**
 * Reusable inline confirmation modal to replace all window.confirm() calls.
 * Fix #9
 */
export default function DeleteConfirmModal({ title, description, confirmLabel = "Confirm", onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-border max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold text-foreground text-base mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-5">{description}</p>}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
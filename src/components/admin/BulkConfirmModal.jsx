/**
 * Task 18 — Bulk action confirmation modal
 * Prevents accidental deletion/pausing of multiple leads
 */
import { AlertTriangle, X } from 'lucide-react';

export default function BulkConfirmModal({ action, count, onConfirm, onCancel }) {
  if (!action || count === 0) return null;

  const isDangerous = ['delete', 'archive'].includes(action?.toLowerCase());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${isDangerous ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Confirm Bulk Action</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You are about to <strong>{action}</strong> <strong>{count}</strong> lead{count !== 1 ? 's' : ''}. This cannot be easily undone.
            </p>
          </div>
          <button onClick={onCancel} className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
              isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            Yes, {action} {count} lead{count !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
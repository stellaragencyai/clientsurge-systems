/**
 * PortalLogoutConfirm — confirmation modal for portal sign-out.
 * Confirm → calls onConfirm (base44.auth.logout + redirect to /?logged_out=1)
 * Cancel → calls onCancel (keeps user in portal)
 */
import { AlertTriangle, X } from "lucide-react";

export default function PortalLogoutConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
          aria-label="Cancel sign out"
        >
          <X className="w-4 h-4" />
        </button>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h3 id="logout-confirm-title" className="text-lg font-bold text-gray-900 text-center mb-2 font-display">
          Sign out of your portal?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
          You'll be returned to the main website. You can sign back in anytime to continue managing your system.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            style={{ background: "linear-gradient(90deg,#0079c1,#005691)" }}
          >
            Yes, sign me out
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";

export default function LogoutSuccessModal({ onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-300"
        style={{ border: "1.5px solid rgba(200,150,92,0.3)" }}
      >
        {/* Gold header strip */}
        <div
          className="px-8 pt-7 pb-5"
          style={{
            background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(245,230,208,0.55)" }}>
                Account
              </p>
              <h2 className="font-display text-lg font-bold leading-snug" style={{ color: "#f5e6d0" }}>
                Successfully Logged Out
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            You have been securely signed out of your admin account. See you next time!
          </p>

          <button
            onClick={onClose}
            style={{
              display: "block",
              width: "100%",
              borderRadius: "9999px",
              padding: "2px",
              background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(120,70,20,0.5)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)")}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "44px",
                borderRadius: "9999px",
                background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#f5e6d0",
                fontWeight: "700",
                fontSize: "0.9rem",
              }}
            >
              OK
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
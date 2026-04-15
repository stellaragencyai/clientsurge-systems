import { useState } from "react";
import { X, LayoutDashboard, ArrowRight, Sparkles, Lock, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientLoginModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    base44.auth.redirectToLogin("/client-portal");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(10,8,5,0.72)", backdropFilter: "blur(12px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
          style={{ background: "#0f0e0c" }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          {/* Top gradient bar */}
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(90deg,#6b3f1f,#c8965c,#f5d9a8,#c8965c,#7a4825)" }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <X className="w-4 h-4 text-white/70" />
          </button>

          {/* Content */}
          <div className="px-10 pt-10 pb-10">
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
              style={{ background: "rgba(154,92,46,0.15)", border: "1px solid rgba(154,92,46,0.25)" }}
            >
              <LayoutDashboard className="w-7 h-7" style={{ color: "#c8965c" }} />
            </div>

            {/* Heading */}
            <h2
              className="font-display mb-2"
              style={{ fontSize: "1.75rem", fontWeight: "700", color: "#f5e6d0", lineHeight: "1.2" }}
            >
              Client Portal
            </h2>
            <p style={{ fontSize: "0.9rem", color: "rgba(245,230,208,0.55)", marginBottom: "32px", lineHeight: "1.6" }}>
              Track your system build, message our team, and manage your plan — all in one place.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-10">
              {[
                { icon: Sparkles, text: "Real-time build progress tracker" },
                { icon: Mail, text: "Direct messaging with the ApexFlow team" },
                { icon: Lock, text: "Secure access — invite-only portal" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(154,92,46,0.12)" }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: "#c8965c" }} />
                    </div>
                    <span style={{ fontSize: "0.875rem", color: "rgba(245,230,208,0.7)" }}>{item.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                display: "block",
                width: "100%",
                borderRadius: "9999px",
                padding: "2px",
                background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                boxShadow: "0 4px 24px rgba(120,70,20,0.45)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginBottom: "16px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "52px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                  color: "#f5e6d0",
                  fontWeight: "700",
                  fontSize: "1rem",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {loading ? "Redirecting..." : "Sign In to Your Portal"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </span>
            </button>

            <p style={{ fontSize: "0.72rem", color: "rgba(245,230,208,0.3)", textAlign: "center", lineHeight: "1.5" }}>
              Access is invite-only. If you haven't received an invitation,{" "}
              <a href="mailto:hello@apexflow.com" style={{ color: "rgba(200,150,92,0.7)", textDecoration: "underline" }}>
                contact us
              </a>
              .
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MedSpaDemoModal from "./MedSpaDemoModal";

export default function MedSpaNavBar() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-500 px-6 h-16 flex items-center justify-between ${
        scrolled
          ? "bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-lg"
          : "bg-white/15 backdrop-blur-md border-b border-white/20"
      }`}>
        {/* Back to main site */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to ClientSurge Systems</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-white font-black text-xs">CS</span>
          </div>
          <span className="font-black text-sm text-foreground hidden sm:inline">
            ClientSurge <span className="text-primary">Systems</span>
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            borderRadius: "9999px",
            padding: "2px",
            background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: "0 3px 12px rgba(120,70,20,0.3)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              height: "32px",
              padding: "0 16px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
              color: "#f5e6d0",
              fontWeight: "700",
              fontSize: "0.75rem",
            }}
          >
            Book Demo
          </span>
        </button>
      </nav>

      {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
    </>
  );
}
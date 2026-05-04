import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";

// Replace VIDEO_URL with your actual demo video embed URL
const DEMO_VIDEO_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0";

export default function DemoBookingModal({ onClose }) {
  useEffect(() => {
    const release = acquireBodyScrollLock("demo-video-modal");
    return () => release();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="Demo video"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl z-50">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close video"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video container — 16:9 */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={DEMO_VIDEO_URL}
            title="ClientSurge Systems Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
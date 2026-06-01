import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck2, X } from "lucide-react";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";
import DemoBookingInline from "./DemoBookingInline";

export default function DemoBookingModal({ onClose, prefillIndustry = "" }) {
  useEffect(() => {
    const release = acquireBodyScrollLock("demo-booking-modal");
    return () => release();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain p-4"
      style={{
        minHeight: "100svh",
        WebkitOverflowScrolling: "touch",
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="Book a free ClientSurge demo"
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-50 w-full max-w-xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close booking form"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Free Automation Audit
            </div>
            <h2 className="font-display text-2xl font-semibold text-white">
              Book your free ClientSurge walkthrough
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Tell us about your business, choose a time, and we will confirm the best next slot.
            </p>
          </div>
          <div className="max-h-[min(72vh,720px)] overflow-y-auto px-6 py-5">
            <DemoBookingInline prefillIndustry={prefillIndustry} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

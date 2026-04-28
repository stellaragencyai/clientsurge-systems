import { Clock3, MessageSquareMore } from "lucide-react";

export default function LiveLeadPulse() {
  return (
    <section className="px-6 -mt-4 relative z-20">
      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-full px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-center shadow-sm"
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1.5px solid rgba(154,92,46,0.28)",
            boxShadow: "0 20px 50px rgba(27,20,13,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            animation: "live-pulse 2s ease-in-out infinite",
          }}
        >
          <style>{`
            @keyframes live-pulse {
              0%, 100% { opacity: 1; box-shadow: 0 20px 50px rgba(27,20,13,0.12), inset 0 1px 0 rgba(255,255,255,0.8); }
              50% { opacity: 0.85; box-shadow: 0 24px 60px rgba(27,20,13,0.18), inset 0 1px 0 rgba(255,255,255,0.8); }
            }
          `}</style>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock3 className="w-4 h-4 text-primary" />
            Replying to new leads in seconds
          </span>
          <span
            aria-hidden="true"
            className="hidden md:block h-4 w-px"
            style={{ background: "rgba(154,92,46,0.18)" }}
          />
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquareMore className="w-4 h-4 text-primary" />
            Built for high-intent businesses that win on fast follow-up
          </span>
        </div>
      </div>
    </section>
  );
}
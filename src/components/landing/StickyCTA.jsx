import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 600 && !dismissed) setVisible(true);
      else if (window.scrollY <= 600) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-foreground border-t border-background/10 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
            <p className="text-sm font-semibold text-background/90">
              Stop losing leads while you read this.
            </p>
            <span className="hidden md:inline text-xs text-background/40">·</span>
            <p className="hidden md:inline text-xs text-background/50">Every hour of delay costs you bookings.</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="#book-demo">
              <Button className="rounded-full px-6 h-9 text-sm font-semibold gap-2">
                Book a Free Demo
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
            <button
              onClick={() => { setDismissed(true); setVisible(false); }}
              className="text-background/30 hover:text-background/60 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
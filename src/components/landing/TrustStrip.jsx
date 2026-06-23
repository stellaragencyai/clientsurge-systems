import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const POINTS = [
  "Package context preserved",
  "Guided intake",
  "Remote setup checklist",
  "Communication tracking",
  "Testing before launch",
];

/**
 * Compact horizontal trust strip for high-conversion pages.
 * Drop anywhere: <TrustStrip />
 */
export default function TrustStrip() {
  return (
    <div
      className="w-full border-t border-b border-border py-4 px-4 md:px-6"
      style={{ background: "rgba(0,174,239,0.03)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 justify-center">
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            Built With Honest Automation Infrastructure
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center">
          {POINTS.map((pt, i) => (
            <span key={pt} className="flex items-center gap-2 text-xs font-semibold text-foreground">
              {i > 0 && <span className="text-border">·</span>}
              {pt}
            </span>
          ))}
        </div>
        <Link
          to="/proof"
          className="text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors flex-shrink-0"
        >
          See proof →
        </Link>
      </div>
    </div>
  );
}
/**
 * Problem Video Button
 * Displays video action button for problem-solution pairs
 * Ready to accept video URLs you'll provide
 */

import { Play } from "lucide-react";
import { useState } from "react";

export default function ProblemVideoButton({ videoUrl, thumbnail, duration = "1:30" }) {
  const [isHovering, setIsHovering] = useState(false);

  if (!videoUrl && !thumbnail) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        onClick={() => {
          if (videoUrl) {
            window.open(videoUrl, "_blank");
          }
        }}
        disabled={!videoUrl}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="relative">
          <Play
            className={`w-4 h-4 transition-transform ${isHovering ? "scale-110" : "scale-100"}`}
            fill="currentColor"
          />
        </div>
        <span>See this in action ({duration})</span>
      </button>
    </div>
  );
}
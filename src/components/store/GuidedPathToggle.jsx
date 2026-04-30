import { Sparkles, Compass } from "lucide-react";

export default function GuidedPathToggle({ mode, onModeChange }) {
  return (
    <div className="flex gap-2 mb-6 bg-white/50 rounded-full p-1 w-fit border border-primary/20">
      <button
        onClick={() => onModeChange("guided")}
        className={`flex items-center gap-1.5 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
          mode === "guided"
            ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        Guided Path
      </button>
      <button
        onClick={() => onModeChange("explore")}
        className={`flex items-center gap-1.5 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
          mode === "explore"
            ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Compass className="w-4 h-4" />
        Explore All
      </button>
    </div>
  );
}
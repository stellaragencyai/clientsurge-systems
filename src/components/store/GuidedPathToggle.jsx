import { Sparkles, Compass } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MODE_HELP = {
  guided: "Guided Path highlights the best-fit services for your industry so you can choose faster.",
  explore: "Explore All shows the full catalog if you want to compare every available automation.",
};

export default function GuidedPathToggle({ mode, onModeChange }) {
  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex gap-2 mb-6 bg-white/50 rounded-full p-1 w-fit border border-primary/20 flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
            {MODE_HELP.guided}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
            {MODE_HELP.explore}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

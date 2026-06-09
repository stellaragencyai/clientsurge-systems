/**
 * OnboardingMissingAssetsBanner — sticky warning shown when critical onboarding
 * assets are missing (no logo, booking link, business hours, or credentials).
 * Prevents silent setup stalls by guiding clients to complete intake.
 */
import { AlertTriangle, ArrowRight } from "lucide-react";

function isMissingAssets(project) {
  if (!project) return false;
  const missingItems = [];

  // Check if key setup fields are absent
  if (!project.files?.some((f) => f.category === "logo")) missingItems.push("Business logo");
  if (project.step_onboarding !== "complete") missingItems.push("Onboarding form");
  if (!project.go_live_date) missingItems.push("Go-live target date");

  return missingItems.length >= 2 ? missingItems : false;
}

export default function OnboardingMissingAssetsBanner({ project, onNavigate }) {
  const missing = isMissingAssets(project);
  if (!missing) return null;

  return (
    <div
      className="rounded-xl border px-4 py-3 flex items-start gap-3"
      style={{
        background: "rgba(245,158,11,0.07)",
        borderColor: "rgba(245,158,11,0.3)",
      }}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-bold text-foreground">Setup Paused — Action Required</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Your system configuration is waiting on: <strong className="text-foreground">{missing.join(", ")}</strong>.
          Complete these to keep your setup on track.
        </p>
        {onNavigate && (
          <button
            onClick={() => onNavigate("quickstart")}
            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            Complete setup <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
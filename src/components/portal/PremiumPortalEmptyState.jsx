/**
 * PremiumPortalEmptyState — Phase 4.4 Phase 5
 * Premium empty state for major dashboard sections.
 * Uses centralized contextual copy from portalEmptyStateCopy.js.
 * Explains why empty, when it will populate, and next safe action.
 * No dead blank panels.
 */
import { Inbox, ArrowRight } from "lucide-react";
import { getEmptyStateCopy } from "@/lib/portalEmptyStateCopy";

export default function PremiumPortalEmptyState({
  icon: Icon = Inbox,
  contextKey = null,
  title,
  description,
  expectedTiming,
  actionLabel,
  actionTab,
  onAction,
  onNavigate,
}) {
  // If a contextKey is provided, use centralized copy as defaults
  const copy = contextKey ? getEmptyStateCopy(contextKey) : {};
  const finalTitle = title || copy.title || "No data yet";
  const finalDescription = description || copy.description || "This section will populate once your system is active.";
  const finalTiming = expectedTiming || copy.expectedTiming || "Data appears here after your system goes live.";
  const finalActionLabel = actionLabel || copy.actionLabel;
  const finalActionTab = actionTab || copy.actionTab;

  const canTakeAction = !!(onAction || (onNavigate && finalActionTab));

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (onNavigate && finalActionTab) {
      onNavigate(finalActionTab);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-8 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "#00AEEF08", border: "1px solid #00AEEF15" }}
      >
        <Icon className="w-7 h-7 text-[#00AEEF]" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2 font-display">{finalTitle}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-1 max-w-md mx-auto">{finalDescription}</p>
      <p className="text-xs text-gray-400 mb-4">{finalTiming}</p>
      {finalActionLabel && canTakeAction && (
        <button
          onClick={handleAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
          style={{ background: "linear-gradient(90deg,#0079c1,#005691)" }}
        >
          {finalActionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
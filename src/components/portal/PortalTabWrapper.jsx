/**
 * PortalTabWrapper — wraps every client portal tab with:
 * 1. PortalStateBoundary (prevents blank pages on errors)
 * 2. Normalized status banner (shows safe client-facing status)
 * 3. Admin diagnostics section (collapsible, for admin/preview users)
 * 4. Loading state while portal state is syncing
 *
 * This is the Phase A.2 universal wrapper for all non-dashboard portal tabs.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import PortalStateBoundary from "./PortalStateBoundary";
import PortalStatusBadge from "./PortalStatusBadge";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";

const BANNER_STYLES = {
  [CARD_STATUS.LIVE]: "border-green-200 bg-green-50/50",
  [CARD_STATUS.NEEDS_PROOF]: "border-blue-200 bg-blue-50/50",
  [CARD_STATUS.BLOCKED]: "border-red-200 bg-red-50/50",
  [CARD_STATUS.SETUP_REQUIRED]: "border-amber-200 bg-amber-50/50",
  [CARD_STATUS.SYNCING]: "border-gray-200 bg-gray-50/50",
};

export default function PortalTabWrapper({
  portalState,
  portalStateLoading,
  cardKey,
  isAdmin = false,
  onRetry,
  children,
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const card = getCardState(portalState, cardKey);

  // While portal state is loading, show a syncing banner
  const effectiveStatus = portalStateLoading ? CARD_STATUS.SYNCING : card.status;
  const effectiveText = portalStateLoading
    ? "Loading your data…"
    : card.display_text;

  const bannerClass = BANNER_STYLES[effectiveStatus] || BANNER_STYLES[CARD_STATUS.SYNCING];

  return (
    <PortalStateBoundary onRetry={onRetry}>
      {/* Status Banner */}
      <div className={`mb-4 rounded-xl border ${bannerClass} px-4 py-3 flex items-start justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <PortalStatusBadge status={effectiveStatus} />
          <p className="text-sm text-gray-600 truncate flex-1">{effectiveText}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Toggle admin diagnostics"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Admin Diagnostics (collapsible) */}
      {isAdmin && showDiagnostics && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Admin Diagnostics</p>
          <div className="space-y-1.5 text-xs text-gray-600 font-mono">
            <div><span className="text-gray-400">Card Key:</span> {card.card_key}</div>
            <div><span className="text-gray-400">Status:</span> {card.status}</div>
            <div><span className="text-gray-400">Diagnostics:</span> {card.admin_diagnostics || "—"}</div>
            <div><span className="text-gray-400">Proof:</span> {card.proof_metadata?.has_proof ? `Verified ${card.proof_metadata.last_verified || ""}` : "No proof found"}</div>
            <div><span className="text-gray-400">Environment:</span> {card.proof_metadata?.environment || "unknown"}</div>
            <div><span className="text-gray-400">Freshness:</span> {card.proof_metadata?.freshness || "none"}</div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {children}
    </PortalStateBoundary>
  );
}
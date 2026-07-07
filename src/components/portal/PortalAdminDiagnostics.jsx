/**
 * PortalAdminDiagnostics — reusable collapsible admin-only diagnostics panel.
 * Shows raw card state details (status, proof, environment) for admin/preview users.
 * Never visible to regular clients.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export default function PortalAdminDiagnostics({ card, isAdmin = false }) {
  const [show, setShow] = useState(false);
  if (!isAdmin || !card) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Admin Diagnostics
        {show ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {show && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 font-mono space-y-1">
          <div><span className="text-gray-400">Card Key:</span> {card.card_key}</div>
          <div><span className="text-gray-400">Status:</span> {card.status}</div>
          <div><span className="text-gray-400">Diagnostics:</span> {card.admin_diagnostics || "—"}</div>
          <div><span className="text-gray-400">Proof:</span> {card.proof_metadata?.has_proof ? `Verified ${card.proof_metadata.last_verified || ""}` : "No proof found"}</div>
          <div><span className="text-gray-400">Environment:</span> {card.proof_metadata?.environment || "unknown"}</div>
          <div><span className="text-gray-400">Freshness:</span> {card.proof_metadata?.freshness || "none"}</div>
        </div>
      )}
    </div>
  );
}
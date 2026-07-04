import { ShieldCheck } from "lucide-react";

/**
 * Admin-only "Definition of Trusted" banner.
 * Shown near the Capability Matrix and Proof Center to remind the operator
 * that "trusted" requires real evidence, completed readiness, and no blockers.
 * Read-only — does not modify public pages or trigger external systems.
 */
export default function DefinitionOfTrustedBanner() {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(5,150,105,0.05), rgba(5,150,105,0.01))",
        border: "1px solid rgba(5,150,105,0.18)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: "rgba(5,150,105,0.1)",
          border: "1px solid rgba(5,150,105,0.22)",
        }}
      >
        <ShieldCheck className="w-4 h-4 text-green-600" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-green-700 mb-0.5">
          Definition of Trusted — Admin Only
        </p>
        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          Trusted means this capability has real evidence, completed readiness requirements, and no active blocker. Anything less stays partial or missing.
        </p>
      </div>
    </div>
  );
}
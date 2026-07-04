import { ShieldCheck } from "lucide-react";

/**
 * Definition of Trusted banner — direct copy about what "trusted" means.
 * Shown near the capability matrix and Proof Center.
 */
export default function DefinitionOfTrustedBanner() {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(37,99,235,0.02))",
        border: "1px solid rgba(37,99,235,0.2)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: "rgba(37,99,235,0.1)",
          border: "1px solid rgba(37,99,235,0.25)",
        }}
      >
        <ShieldCheck className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-blue-700 mb-0.5">Definition of Trusted</p>
        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          Trusted means this capability has real evidence, completed readiness requirements, and no active blocker. Anything less stays partial or missing.
        </p>
      </div>
    </div>
  );
}
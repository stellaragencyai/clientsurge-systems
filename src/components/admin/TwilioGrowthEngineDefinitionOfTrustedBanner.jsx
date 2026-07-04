import { ShieldCheck } from "lucide-react";

export default function DefinitionOfTrustedBanner() {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(5,150,105,0.04), rgba(5,150,105,0.01))", border: "1px solid rgba(5,150,105,0.15)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)" }}>
        <ShieldCheck className="w-4 h-4 text-green-600" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">Definition of Trusted</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">
          Trusted means this capability has real evidence, completed readiness requirements, and no active blocker. Anything less stays partial or missing.
        </p>
      </div>
    </div>
  );
}
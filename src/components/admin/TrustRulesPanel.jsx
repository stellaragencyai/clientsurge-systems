import { ShieldCheck, Scale, Ban, Eye, FileCheck, Users, HelpCircle } from "lucide-react";

const TRUST_RULES = [
  { icon: ShieldCheck, rule: "Complete means real data proves it.", detail: "A capability is only marked complete when verifiable app records confirm the final outcome." },
  { icon: Scale, rule: "Partial means infrastructure exists but proof is incomplete.", detail: "Configuration or attempts may exist, but the system does not treat them as proven outcomes." },
  { icon: Ban, rule: "Missing means no usable implementation or evidence exists.", detail: "No records, no configuration, or only empty/schema-level entries found." },
  { icon: Eye, rule: "A provider attempt is not the same as a successful outcome.", detail: "An SMS marked 'sent' is not proof of delivery. Only 'delivered' with a provider_message_id counts." },
  { icon: FileCheck, rule: "Internal/test records may be useful for QA but must not count as production proof.", detail: "Test, smoke, and internal records are excluded from production metrics. They do not prove customer-facing readiness." },
  { icon: Users, rule: "Customer-facing trust requires evidence records, checklist readiness, and no active blockers.", detail: "All three conditions must be met before any public claim of capability is made." },
  { icon: HelpCircle, rule: "If proof is uncertain, the status must stay partial or missing.", detail: "Ambiguity is never rounded up to complete. When in doubt, the system errs toward caution." },
];

export default function TrustRulesPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Trust Rules — Admin Only</h3>
      <p className="text-xs text-gray-400 mb-4">
        The internal decision rules used by the Twilio Growth Engine status system. No public page references these rules.
      </p>
      <div className="space-y-3">
        {TRUST_RULES.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex gap-3 items-start rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{i + 1}. {item.rule}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
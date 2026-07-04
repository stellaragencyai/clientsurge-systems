import { ShieldAlert, BookOpen } from "lucide-react";

const RULES = [
  {
    rule: "Complete means real data proves it",
    detail: "A capability is only marked complete (green) when real database records — AutomationProofLog, CommunicationLog, CommunicationEvent, or AdminSettings — confirm it. No inference, no assumption.",
  },
  {
    rule: "Partial means infrastructure exists but proof is incomplete",
    detail: "Yellow status means configuration, schema, or attempt logs exist, but the final outcome has not been proven with a passed proof record or delivered evidence.",
  },
  {
    rule: "Missing means no usable implementation or evidence exists",
    detail: "Red status means no configuration, no logs, and no proof records are present. The capability has not been started or has no usable trace in the app.",
  },
  {
    rule: "A provider attempt is not the same as a successful outcome",
    detail: "An SMS with status 'sent' but no provider_message_id, or a call that rang but produced no transcript, is an attempt — not proof of a working outcome. Delivery_status=delivered or a passed proof log is required.",
  },
  {
    rule: "Internal/test records may be useful for QA but must not count as production proof",
    detail: "Records with test emails, smoke sources, or internal quality_reason_codes are excluded from production metrics. They are preserved in the database but never used to justify a green status.",
  },
  {
    rule: "Customer-facing trust requires evidence records, checklist readiness, and no active blockers",
    detail: "A capability is not safe for public claims unless: (1) AutomationProofLog passed, (2) AutomationChecklist flags are true and client approved, (3) no blockers in the capability's blocker list.",
  },
  {
    rule: "If proof is uncertain, the status must stay partial or missing",
    detail: "When evidence is ambiguous — logs exist but lack provider IDs, or a call happened but has no transcript — the capability stays yellow or red. It is never upgraded to green on the basis of 'probably working'.",
  },
];

export default function TwilioGrowthEngineTrustRules() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Trust Rules — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          These are the internal decision rules used by the Twilio Growth Engine status system. They govern how every capability is evaluated.
          No rule may be relaxed without a corresponding change to real app data.
        </p>
        <div className="space-y-3">
          {RULES.map((r, i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-500">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.rule}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          These rules are private to admins. Public-facing pages must not reference these internal criteria or expose status logic to clients.
        </p>
      </div>
    </div>
  );
}
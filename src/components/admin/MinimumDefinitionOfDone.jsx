import { CheckCircle2, Circle, ShieldCheck, Mic, Phone, Zap, Star, FileCheck } from "lucide-react";

const DEFINITIONS = [
  {
    workstream: "Audit & Truth Mapping",
    icon: ShieldCheck,
    definition: "The app shows capability status, evidence source, blocker, and next action for every capability in the matrix.",
    criteria: [
      "Every capability has a computed status (green/yellow/red)",
      "Every capability lists its evidence sources",
      "Every capability lists its blockers (if any)",
      "Every capability has a next admin action",
    ],
  },
  {
    workstream: "AI Receptionist / Voice Agent",
    icon: Mic,
    definition: "Configuration exists, inbound voice is enabled, required voice prerequisites exist, and a meaningful summary/transcript evidence record exists.",
    criteria: [
      "ElevenLabs agent IDs configured in AdminSettings",
      "ElevenLabs phone number IDs configured",
      "inbound_voice_enabled = true",
      "A real inbound call produced a transcript or meaningful call_summary",
      "AutomationProofLog pass record exists for ai_voice_receptionist",
    ],
  },
  {
    workstream: "Missed Call Recovery",
    icon: Phone,
    definition: "Route health is clean, a related recovery evidence record exists, and the result is not only a provider attempt.",
    criteria: [
      "Missed-call webhook returns 200 (no 404/405)",
      "At least one missed-call SMS attempt is logged in CommunicationLog",
      "The attempt resulted in a delivered status (not just sent/queued)",
      "provider_message_id is present on the recovery log",
      "AutomationProofLog pass record exists for missed_call_text_back",
    ],
  },
  {
    workstream: "Speed-to-Lead & Follow-Up",
    icon: Zap,
    definition: "A real eligible lead has first-response evidence and sequence readiness is proven.",
    criteria: [
      "A non-test lead triggered instant_lead_response",
      "First-response SMS or email is logged with provider_message_id",
      "Delivery status = delivered on at least one record",
      "Nurture sequence enrollment record exists with valid lead ID",
      "AutomationProofLog pass record exists for instant_lead_response and nurture_sequence_14d",
    ],
  },
  {
    workstream: "Review / Referral",
    icon: Star,
    definition: "Configured, evidence exists, and the workflow is not just a schema/service key.",
    criteria: [
      "review_link_set = true on at least one AutomationChecklist",
      "At least one outbound review request CommunicationLog exists",
      "lead_reactivation has a real reactivation workflow CommunicationEvent",
      "AutomationProofLog pass records exist for review_request and lead_reactivation",
    ],
  },
  {
    workstream: "Compliance / Reliability / QA",
    icon: FileCheck,
    definition: "Internal records are excluded, provider errors are surfaced, and incomplete proof stays blocked.",
    criteria: [
      "Test/smoke/internal leads are quarantined from production metrics",
      "Twilio 400 errors in CommunicationEvent are surfaced and count > 0 is visible",
      "Weak-proof SMS logs (no provider_message_id) are flagged",
      "No capability is marked green without AutomationProofLog pass records",
      "All AutomationChecklist records use canonical service keys",
    ],
  },
];

export default function MinimumDefinitionOfDone() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Minimum Definition of Done — Admin Only</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        Each workstream is "done" only when every criterion below is met by real app data. No workstream is complete based on configuration alone — proof records and delivered outcomes are required.
      </p>
      <div className="space-y-4">
        {DEFINITIONS.map((ws) => {
          const Icon = ws.icon;
          return (
            <div key={ws.workstream} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900">{ws.workstream}</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{ws.definition}</p>
              <ul className="space-y-1">
                {ws.criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                    <Circle className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 font-medium">
          If any criterion is unmet, the workstream status must stay partial or missing — never marked complete.
        </p>
      </div>
    </div>
  );
}
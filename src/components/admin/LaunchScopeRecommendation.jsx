import {
  Rocket, Clock, Calendar, AlertTriangle, CheckCircle2, ArrowRight,
} from "lucide-react";

const SCOPE_TIERS = [
  {
    tier: "First Launch Scope",
    icon: Rocket,
    color: "#059669",
    bg: "rgba(5,150,105,0.06)",
    border: "rgba(5,150,105,0.2)",
    description: "Foundational capabilities needed before any client goes live. These must be proven first.",
    items: [
      {
        name: "Website Speed-to-Lead",
        reason: "Every lead that enters the system needs an immediate response. This is the core value proposition.",
        riskIfEarly: "Without delivery proof, leads may not be getting responses at all — directly harms client outcomes.",
        evidenceRequired: "Delivered SMS (delivery_status=delivered) with provider_message_id on a real non-test lead, plus AutomationProofLog pass.",
      },
      {
        name: "Missed Call Recovery",
        reason: "Missed calls are the highest-intent leads. Recovery must be reliable before claiming the feature works.",
        riskIfEarly: "A 404/405 webhook means Twilio cannot reach the function — every missed call is lost.",
        evidenceRequired: "Webhook returning 200, at least one delivered missed-call SMS, and AutomationProofLog pass.",
      },
      {
        name: "Delivery / Proof Logging",
        reason: "Without CommunicationLog and AutomationProofLog records, no capability can be trusted or verified.",
        riskIfEarly: "If logging is incomplete, statuses become guesses. Operators cannot tell what actually happened.",
        evidenceRequired: "CommunicationLog entries with provider_message_id and CommunicationEvent records for all outbound actions.",
      },
      {
        name: "Internal Data Exclusion",
        reason: "Test/smoke data must be quarantined from production metrics so KPIs reflect reality.",
        riskIfEarly: "Test leads inflate counts and mask real delivery failures in the dashboard.",
        evidenceRequired: "Zero excluded test records in production metric views, quarantine rules enforced.",
      },
      {
        name: "Admin Repair Queue",
        reason: "Operators need a computed, prioritized list of what to fix before go-live.",
        riskIfEarly: "Without a repair queue, blockers are invisible and may ship to production unresolved.",
        evidenceRequired: "Repair queue panel renders from live data with severity-ranked items.",
      },
    ],
  },
  {
    tier: "Second Scope",
    icon: Clock,
    color: "#D97706",
    bg: "rgba(217,119,6,0.06)",
    border: "rgba(217,119,6,0.2)",
    description: "High-value capabilities that enhance the core but depend on first-scope foundations being solid.",
    items: [
      {
        name: "Sales Follow-Up / Nurture",
        reason: "Nurture sequences extend value beyond the first response, but only make sense if speed-to-lead is proven first.",
        riskIfEarly: "If instant response is broken, nurturing a lead who never got the first message wastes effort and looks unprofessional.",
        evidenceRequired: "Instant lead response proven green, nurture enrollment records with valid lead IDs, and AutomationProofLog pass for nurture_sequence_14d.",
      },
      {
        name: "AI Receptionist / Voice Agent",
        reason: "Voice adds significant value but requires ElevenLabs config, transcript proof, and webhook health.",
        riskIfEarly: "Enabling voice without agent IDs or transcripts produces broken calls that damage client trust.",
        evidenceRequired: "ElevenLabs agent IDs + phone number IDs configured, inbound_voice_enabled, real call transcript on WebsiteLead, AutomationProofLog pass.",
      },
      {
        name: "Client Status Updates",
        reason: "Automated client updates improve experience, but depend on SMS infrastructure being reliable.",
        riskIfEarly: "If SMS delivery is flaky, clients get missed updates — worse than no updates at all.",
        evidenceRequired: "Inbound SMS assistant proof record, CommunicationEvent records for inbound classification/response.",
      },
    ],
  },
  {
    tier: "Later Scope",
    icon: Calendar,
    color: "#6B7280",
    bg: "rgba(107,114,128,0.06)",
    border: "rgba(107,114,128,0.2)",
    description: "Valuable but non-critical features. Ship after core and second-scope capabilities are proven in production.",
    items: [
      {
        name: "Review Request",
        reason: "Review requests are a growth accelerator, not a foundational need. They require a working review link and outbound logging.",
        riskIfEarly: "Sending review requests before delivery is proven can trigger spam complaints and hurt sender reputation.",
        evidenceRequired: "review_link_set on AutomationChecklist, outbound CommunicationLog for review request, AutomationProofLog pass.",
      },
      {
        name: "Referral Engine",
        reason: "Referral/reactivation flows need a real workflow entity and evidence — not just a service_key on a checklist.",
        riskIfEarly: "Claiming referral capability without a real flow misrepresents the product to clients.",
        evidenceRequired: "Real reactivation CommunicationEvent tied to a dormant lead segment, AutomationProofLog pass for lead_reactivation.",
      },
      {
        name: "Voice Broadcasts / Promotional Calling",
        reason: "Promotional calling is the highest-risk feature from a compliance and deliverability standpoint. It should ship last.",
        riskIfEarly: "Promotional calls without proven voice infrastructure risk TCPA violations and carrier penalties.",
        evidenceRequired: "voice_calls_enabled, proven AI voice receptionist in production, AutomationProofLog pass for voice broadcasts.",
      },
    ],
  },
];

export default function LaunchScopeRecommendation({ data }) {
  const getStatusForItem = (itemName) => {
    if (!data?.capabilities) return null;
    const cap = data.capabilities.find(c => c.label === itemName || c.label.includes(itemName));
    return cap ? cap.status : null;
  };

  return (
    <div className="space-y-5">
      {/* Explanation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Launch Scope Recommendation — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Recommendations for what belongs in the first launch scope versus later scope. Based on dependency chains,
          risk levels, and evidence requirements. Do not ship a later-scope feature before its dependencies are proven.
        </p>
      </div>

      {/* Scope tiers */}
      {SCOPE_TIERS.map(tier => {
        const TierIcon = tier.icon;
        return (
          <div key={tier.tier} className="space-y-3">
            {/* Tier header */}
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: tier.bg, borderColor: tier.border }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${tier.border}` }}>
                <TierIcon className="w-4 h-4" style={{ color: tier.color }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{tier.tier}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
              </div>
            </div>

            {/* Items */}
            {tier.items.map(item => {
              const capStatus = getStatusForItem(item.name);
              return (
                <div key={item.name} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                    {capStatus && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0"
                        style={{
                          color: capStatus === "green" ? "#059669" : capStatus === "yellow" ? "#D97706" : "#DC2626",
                          background: capStatus === "green" ? "rgba(5,150,105,0.06)" : capStatus === "yellow" ? "rgba(217,119,6,0.06)" : "rgba(220,38,38,0.05)",
                          border: `1px solid ${capStatus === "green" ? "rgba(5,150,105,0.2)" : capStatus === "yellow" ? "rgba(217,119,6,0.2)" : "rgba(220,38,38,0.18)"}`,
                        }}
                      >
                        {capStatus === "green" ? "Proven" : capStatus === "yellow" ? "Partial" : "Not Done"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Reason for Scope Placement</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.reason}</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Risk If Launched Too Early</p>
                        <p className="text-xs text-red-700 leading-relaxed">{item.riskIfEarly}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-100 p-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-0.5">Evidence Required to Promote Scope</p>
                        <p className="text-xs text-green-700 leading-relaxed">{item.evidenceRequired}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Footer */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-2">
        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Scope placement is advisory and evidence-based. No feature should ship out of its recommended scope until the
          evidence required for promotion is present in the app data. When in doubt, keep the feature in a later scope.
        </p>
      </div>
    </div>
  );
}
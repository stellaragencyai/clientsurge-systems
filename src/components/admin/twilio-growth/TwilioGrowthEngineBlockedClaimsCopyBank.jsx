import { AlertTriangle, MessageSquare } from "lucide-react";

const COPY_BANK = [
  {
    capability: "AI Receptionist",
    unsafeClaim: "\"Our AI receptionist answers calls 24/7 and books appointments automatically.\"",
    saferWording: "\"We're building an AI voice receptionist. Inbound call handling is in setup and testing — contact us for current availability.\"",
    evidenceRequired: "inbound_voice_enabled=true, ElevenLabs agent IDs configured, live call transcript on WebsiteLead, and a passed AutomationProofLog for ai_voice_receptionist.",
  },
  {
    capability: "Instant Lead Response",
    unsafeClaim: "\"Leads get an instant SMS reply in under 60 seconds, guaranteed.\"",
    saferWording: "\"Our system is designed to respond to new leads quickly via SMS. Response time depends on configuration and carrier delivery.\"",
    evidenceRequired: "CommunicationLog with delivery_status=delivered and valid provider_message_id, tied to a real non-test lead, plus a passed AutomationProofLog for instant_lead_response.",
  },
  {
    capability: "Missed Call Recovery",
    unsafeClaim: "\"Never miss a lead again — every missed call gets an automatic text-back instantly.\"",
    saferWording: "\"Our missed-call text-back feature is being configured. We're verifying the webhook route and delivery before it goes live.\"",
    evidenceRequired: "No webhook 404/405, missed-call SMS attempts logged with successful delivery, and a passed AutomationProofLog for missed_call_text_back.",
  },
  {
    capability: "Automated Follow-Up",
    unsafeClaim: "\"Our 14-day nurture sequence keeps every lead engaged until they book.\"",
    saferWording: "\"We offer an automated follow-up sequence. Sequence enrollment, delivery, and stop-on-reply behavior are being validated.\"",
    evidenceRequired: "Sequence enrollment with valid lead ID, provider message IDs for each step, stop-on-reply proof, and a passed AutomationProofLog for nurture_sequence_14d.",
  },
  {
    capability: "Review Request Engine",
    unsafeClaim: "\"Automatically requests Google reviews from every satisfied customer.\"",
    saferWording: "\"Our review request automation is in setup. We're verifying review link configuration and outbound delivery before launch.\"",
    evidenceRequired: "review_link_set=true on AutomationChecklist, logged outbound review communication event, and a passed AutomationProofLog for review_request.",
  },
  {
    capability: "Referral Engine",
    unsafeClaim: "\"Our referral engine reactivates dormant leads and generates new referrals automatically.\"",
    saferWording: "\"We're developing a lead reactivation and referral system. It's not yet live — we'll announce when it's available.\"",
    evidenceRequired: "Dormant lead segment identified, logged reactivation CommunicationEvent or CommunicationLog, and a passed AutomationProofLog for lead_reactivation.",
  },
  {
    capability: "Client Status Updates",
    unsafeClaim: "\"Clients get real-time SMS updates on their onboarding and automation status automatically.\"",
    saferWording: "\"Our client status update feature is being tested. We're verifying inbound SMS classification and response accuracy before it goes live.\"",
    evidenceRequired: "Inbound SMS CommunicationEvent plus a classification/response record, and a passed AutomationProofLog for inbound_sms_assistant.",
  },
];

export default function TwilioGrowthEngineBlockedClaimsCopyBank({ data }) {
  const caps = data?.capabilities || [];

  function getStatus(key) {
    const cap = caps.find(c => c.key === key);
    return cap?.status || "unknown";
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">Blocked Claims Copy Bank — Admin Only</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Safer internal wording for capabilities that are not fully trusted yet. Admins may manually copy safer wording to public pages only after verifying the evidence requirements are met.
          This panel does not modify public pages.
        </p>
      </div>

      {COPY_BANK.map((item, i) => {
        const statusKey = {
          "AI Receptionist": "ai_voice_receptionist",
          "Instant Lead Response": "instant_lead_response",
          "Missed Call Recovery": "missed_call_text_back",
          "Automated Follow-Up": "nurture_sequence_14d",
          "Review Request Engine": "review_request",
          "Referral Engine": "lead_reactivation",
          "Client Status Updates": "inbound_sms_assistant",
        }[item.capability];
        const status = getStatus(statusKey);
        const isTrusted = status === "green";

        return (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-gray-900">{item.capability}</h4>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0 ${
                isTrusted ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {isTrusted ? "Trusted" : "Not Trusted"}
              </span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Unsafe Claim Example
                </p>
                <p className="text-red-700 italic leading-relaxed">{item.unsafeClaim}</p>
              </div>
              <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700 mb-1">Safer Wording</p>
                <p className="text-gray-700 leading-relaxed">{item.saferWording}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Evidence Required Before Stronger Wording</p>
                <p className="text-gray-600 leading-relaxed">{item.evidenceRequired}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
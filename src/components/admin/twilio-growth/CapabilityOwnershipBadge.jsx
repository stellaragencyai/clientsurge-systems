import { User, Wrench, Settings, FileText, ShieldCheck, ClipboardCheck } from "lucide-react";

/**
 * Admin-only ownership label for each capability row.
 * Maps capabilities to simple internal owner categories:
 * business owner, app build, configuration, copy, quality review, trust review.
 *
 * Manual labels — do not override computed status.
 */

const OWNERS = {
  business_owner: { label: "Business Owner", icon: User, color: "#7C3AED", bg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.2)" },
  app_build: { label: "App Build", icon: Wrench, color: "#2563EB", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.2)" },
  configuration: { label: "Configuration", icon: Settings, color: "#0891B2", bg: "rgba(8,145,178,0.06)", border: "rgba(8,145,178,0.2)" },
  copy: { label: "Copy", icon: FileText, color: "#D97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  quality_review: { label: "Quality Review", icon: ClipboardCheck, color: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.2)" },
  trust_review: { label: "Trust Review", icon: ShieldCheck, color: "#DC2626", bg: "rgba(220,38,38,0.05)", border: "rgba(220,38,38,0.18)" },
};

const CAPABILITY_OWNERSHIP = {
  instant_lead_response: {
    owner: "app_build",
    next_owner_action: "Verify a real non-test lead triggers a delivered SMS with provider_message_id, then create a passed AutomationProofLog.",
  },
  missed_call_text_back: {
    owner: "app_build",
    next_owner_action: "Repair missed-call webhook (no 404/405), trigger a real missed call, confirm follow-up SMS delivered, then pass proof log.",
  },
  nurture_sequence_14d: {
    owner: "app_build",
    next_owner_action: "Enroll a real lead, verify each sequence step has provider_message_id and stop-on-reply behavior, then pass proof log.",
  },
  ai_voice_receptionist: {
    owner: "configuration",
    next_owner_action: "Configure ElevenLabs agent IDs + phone number IDs, enable inbound_voice_enabled, run a real call test with transcript, then pass proof log.",
  },
  review_request: {
    owner: "configuration",
    next_owner_action: "Set review_link_set=true, trigger a review request to a real lead, confirm delivered SMS, then pass proof log.",
  },
  lead_reactivation: {
    owner: "app_build",
    next_owner_action: "Build the referral/reactivation entity or automation, identify dormant leads, log outreach, then pass proof log.",
  },
  inbound_sms_assistant: {
    owner: "app_build",
    next_owner_action: "Trigger a real inbound SMS, verify classification + response logged in CommunicationEvent, then pass proof log.",
  },
  ai_booking_agent: {
    owner: "app_build",
    next_owner_action: "Run a real inbound call to generate transcript/summary on WebsiteLead, then pass proof log.",
  },
  voice_broadcasts: {
    owner: "trust_review",
    next_owner_action: "Do not build yet — wait until core capabilities (Speed-to-Lead + Missed Call Recovery) reach Trusted status.",
  },
  automation_proof_logs: {
    owner: "trust_review",
    next_owner_action: "Create and pass AutomationProofLog records for every service key before claiming go-live.",
  },
};

export function getOwnership(capabilityKey) {
  return CAPABILITY_OWNERSHIP[capabilityKey] || {
    owner: "quality_review",
    next_owner_action: "Review this capability and assign an owner.",
  };
}

export default function CapabilityOwnershipBadge({ capabilityKey }) {
  const ownership = getOwnership(capabilityKey);
  const config = OWNERS[ownership.owner] || OWNERS.quality_review;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold flex-shrink-0"
        style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    </div>
  );
}
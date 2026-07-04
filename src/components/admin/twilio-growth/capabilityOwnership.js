/**
 * Capability Ownership Map — admin-only internal labels.
 * Maps each capability key to a simple internal owner category
 * and a next owner action. These labels are informational only —
 * they do NOT override computed status or trust.
 */

export const OWNER_CATEGORIES = {
  business_owner: {
    label: "Business Owner",
    color: "#7C3AED",
    description: "Owns the business outcome and go/no-go decision",
  },
  app_build: {
    label: "App Build",
    color: "#2563EB",
    description: "Responsible for implementing the feature in code",
  },
  configuration: {
    label: "Configuration",
    color: "#0891B2",
    description: "Responsible for provider/account settings",
  },
  copy: {
    label: "Copy",
    color: "#D97706",
    description: "Responsible for message templates and wording",
  },
  quality_review: {
    label: "Quality Review",
    color: "#059669",
    description: "Responsible for QA sign-off and testing",
  },
  trust_review: {
    label: "Trust Review",
    color: "#DC2626",
    description: "Responsible for final trust/trusted determination",
  },
};

export const CAPABILITY_OWNERS = {
  ai_voice_receptionist: {
    owner: "app_build",
    next_owner_action: "Connect ElevenLabs agent IDs and run a real inbound call test to generate transcript proof.",
  },
  missed_call_text_back: {
    owner: "configuration",
    next_owner_action: "Repair missed-call webhook URL in Twilio console so it returns 200, then retest with a real missed call.",
  },
  instant_lead_response: {
    owner: "app_build",
    next_owner_action: "Confirm delivered Twilio status callback on a new non-test lead with a valid provider_message_id.",
  },
  nurture_sequence_14d: {
    owner: "quality_review",
    next_owner_action: "Verify provider IDs, valid lead IDs, and stop-on-reply behavior across all sequence steps.",
  },
  review_request: {
    owner: "configuration",
    next_owner_action: "Set review_link in AdminSettings and create a passed AutomationProofLog for review_request.",
  },
  lead_reactivation: {
    owner: "app_build",
    next_owner_action: "Build a real referral/reactivation flow or entity before claiming it as active.",
  },
  inbound_sms_assistant: {
    owner: "copy",
    next_owner_action: "Write and approve SMS onboarding templates, then create a passed AutomationProofLog.",
  },
  ai_booking_agent: {
    owner: "app_build",
    next_owner_action: "Run a real inbound call to generate transcript proof on WebsiteLead, then pass AutomationProofLog.",
  },
  voice_broadcasts: {
    owner: "business_owner",
    next_owner_action: "Confirm promotional calling is approved for use, then enable voice_calls_enabled after ElevenLabs is configured.",
  },
  automation_proof_logs: {
    owner: "trust_review",
    next_owner_action: "Create and pass AutomationProofLog records for every service key before claiming go-live.",
  },
};

/**
 * Get ownership info for a capability key.
 * Returns a default if no mapping exists.
 */
export function getOwnership(capKey) {
  const mapping = CAPABILITY_OWNERS[capKey];
  if (!mapping) {
    return {
      owner: "trust_review",
      next_owner_action: "Review and assign an owner for this capability.",
    };
  }
  return mapping;
}
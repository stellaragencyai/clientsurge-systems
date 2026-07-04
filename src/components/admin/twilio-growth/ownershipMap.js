/**
 * Admin-only ownership labels for Twilio Growth Engine capabilities.
 * Simple internal categories — not stored, just a static mapping.
 */

export const OWNERSHIP_CATEGORIES = {
  business_owner: { label: "Business Owner", color: "#7C3AED" },
  app_build: { label: "App Build", color: "#2563EB" },
  configuration: { label: "Configuration", color: "#D97706" },
  copy: { label: "Copy", color: "#0891B2" },
  quality_review: { label: "Quality Review", color: "#059669" },
  trust_review: { label: "Trust Review", color: "#DC2626" },
};

export const OWNERSHIP_MAP = {
  instant_lead_response: {
    owner: "configuration",
    next_owner_action: "Confirm Twilio SMS webhook URL and status callback are set; verify delivered status on a real lead.",
  },
  missed_call_text_back: {
    owner: "configuration",
    next_owner_action: "Set missed_call_webhook_url in AdminSettings; verify no 404/405 from Twilio.",
  },
  nurture_sequence_14d: {
    owner: "copy",
    next_owner_action: "Define and load nurture SMS/email templates with stop-on-reply logic.",
  },
  ai_booking_agent: {
    owner: "app_build",
    next_owner_action: "Wire call transcription pipeline and store transcripts on WebsiteLead.",
  },
  inbound_sms_assistant: {
    owner: "app_build",
    next_owner_action: "Ensure inbound SMS reply handler classifies intent and responds.",
  },
  ai_voice_receptionist: {
    owner: "configuration",
    next_owner_action: "Set ElevenLabs agent IDs and phone number IDs; run real call test.",
  },
  review_request: {
    owner: "configuration",
    next_owner_action: "Set review_link on AutomationChecklist; log outbound review request.",
  },
  lead_reactivation: {
    owner: "business_owner",
    next_owner_action: "Define referral/dormant-lead reactivation flow; create proof record.",
  },
  voice_broadcasts: {
    owner: "trust_review",
    next_owner_action: "Obtain trust review approval before enabling promotional voice calls.",
  },
  automation_proof_logs: {
    owner: "quality_review",
    next_owner_action: "Create and pass AutomationProofLog records for every service key.",
  },
};

export function getOwnership(capabilityKey) {
  return OWNERSHIP_MAP[capabilityKey] || {
    owner: "quality_review",
    next_owner_action: "Review and assign ownership for this capability.",
  };
}
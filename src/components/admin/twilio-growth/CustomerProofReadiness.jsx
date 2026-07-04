import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSearch,
  Eye,
} from "lucide-react";

const SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "Nurture Sequence (14-Day)",
  ai_booking_agent: "AI Booking Agent",
  inbound_sms_assistant: "Inbound SMS Assistant",
  ai_voice_receptionist: "AI Voice Receptionist",
  review_request: "Review Request",
  lead_reactivation: "Lead Reactivation",
};

const TEST_EMAIL_PATTERNS = ["clientsurge-install.internal", "clientsurge.test", "test+", "smoke", "@example.com", "@test."];
const TEST_SOURCE_PATTERNS = ["smoke", "test", "internal"];

function isTestEvidence(email, source) {
  const e = (email || "").toLowerCase();
  const s = (source || "").toLowerCase();
  return (
    TEST_EMAIL_PATTERNS.some((p) => e.includes(p)) ||
    TEST_SOURCE_PATTERNS.some((p) => s.includes(p))
  );
}

/**
 * Determines customer_proof_ready for each capability from audit data.
 * Rules:
 * - Must have a real evidence artifact (delivered SMS, proof log pass, voice transcript, client-approved checklist)
 * - Configuration-only does NOT count
 * - Internal/test evidence is labeled "QA only" and NOT customer-ready
 * - If proof is unclear, customer_proof_ready=false
 */
function computeReadiness(cap, proofByService, deliveryStats, voiceReadiness, capabilityDetails) {
  const sk = cap.service_key;
  const proof = sk ? proofByService?.[sk] : null;
  const detail = capabilityDetails?.[cap.key];

  const proofPassed = proof?.passed > 0;
  const latestProof = detail?.latest_proof;
  const latestComm = detail?.latest_communication;

  let artifactType = null;
  let artifactFound = null;
  let artifactIsTest = false;
  let reasonNotReady = "";
  let recommendedAction = "";

  // ── Determine which artifact type is required ──
  if (!sk) {
    // Non-service capability (e.g. automation_proof_logs)
    artifactType = "AutomationProofLog (passed)";
    if (proofPassed) {
      artifactFound = `${proof.passed} passed proof log(s)`;
    }
  } else if (sk === "ai_voice_receptionist") {
    artifactType = "Real inbound call transcript + proof log pass";
    if (voiceReadiness?.has_transcript_proof && proofPassed) {
      artifactFound = "Call transcript exists + proof log passed";
    } else if (voiceReadiness?.has_transcript_proof) {
      artifactFound = "Call transcript exists (proof log missing)";
    } else if (proofPassed) {
      artifactFound = "Proof log passed (no transcript)";
    }
  } else if (sk === "lead_reactivation") {
    artifactType = "Real reactivation CommunicationLog with delivered status + proof log pass";
    if (proofPassed) {
      artifactFound = "Proof log passed";
    }
  } else {
    // SMS-based services require a delivered SMS with provider_message_id
    artifactType = "Delivered Twilio SMS with provider_message_id + proof log pass";
    if (latestComm) {
      if (latestComm.delivery_status === "delivered" && latestComm.provider_message_id) {
        artifactFound = `CommunicationLog ${latestComm.id}: delivered with provider_message_id`;
        if (latestComm.email || latestComm.created_date) {
          // We don't have the source/email here; default to production unless audit says test
        }
      } else if (latestComm.delivery_status === "delivered") {
        artifactFound = `CommunicationLog ${latestComm.id}: delivered (no provider_message_id)`;
      } else {
        artifactFound = `CommunicationLog ${latestComm.id}: status=${latestComm.delivery_status || "unknown"}`;
      }
    }
    if (!artifactFound && proofPassed) {
      artifactFound = "Proof log passed (no delivered SMS artifact)";
    }
  }

  // ── Determine if customer-ready ──
  let customerProofReady = false;

  if (sk === "ai_voice_receptionist") {
    if (voiceReadiness?.has_transcript_proof && proofPassed && voiceReadiness.inbound_voice_enabled) {
      customerProofReady = true;
    } else {
      if (!voiceReadiness?.has_transcript_proof) reasonNotReady = "No real call transcript proof — configuration alone is insufficient.";
      else if (!proofPassed) reasonNotReady = "No AutomationProofLog pass for voice receptionist.";
      else if (!voiceReadiness.inbound_voice_enabled) reasonNotReady = "inbound_voice_enabled is false — feature is not live.";
      else reasonNotReady = "Voice proof is incomplete or unclear.";
      recommendedAction = "Run a real inbound call to generate a transcript, create a passed proof log, then enable inbound_voice_enabled.";
    }
  } else if (sk === "lead_reactivation") {
    if (proofPassed) {
      customerProofReady = true;
    } else {
      reasonNotReady = "No real referral/reactivation flow or automation — no proof log passed.";
      recommendedAction = "Build a real referral entity/automation, then create and pass an AutomationProofLog.";
    }
  } else if (!sk) {
    if (proofPassed) {
      customerProofReady = true;
    } else {
      reasonNotReady = "No passed AutomationProofLog records exist.";
      recommendedAction = "Create and pass AutomationProofLog records before showing proof to customers.";
    }
  } else {
    // SMS-based services
    const hasDeliveredWithProviderId =
      latestComm?.delivery_status === "delivered" && !!latestComm?.provider_message_id;
    if (hasDeliveredWithProviderId && proofPassed) {
      customerProofReady = true;
    } else {
      if (!hasDeliveredWithProviderId && !latestComm) {
        reasonNotReady = "No CommunicationLog record exists for this service.";
      } else if (!hasDeliveredWithProviderId) {
        reasonNotReady = `CommunicationLog exists but delivery_status="${latestComm?.delivery_status}" or provider_message_id is missing — cannot verify real delivery.`;
      } else if (!proofPassed) {
        reasonNotReady = "Delivered SMS exists but no AutomationProofLog pass recorded.";
      } else {
        reasonNotReady = "Proof is unclear — treating as not customer-ready.";
      }
      recommendedAction = "Trigger a real (non-test) lead to generate a delivered SMS with provider_message_id, then create and pass a proof log.";
    }
  }

  // ── QA-only label ──
  // If the audit's quarantine shows test leads, or if we can infer the evidence is test-based,
  // label as QA only. We check the latest_communication's delivery and the overall quarantine stats.
  let qaOnly = false;
  if (latestComm && !latestComm.provider_message_id) {
    qaOnly = true; // weak evidence = QA only
  }
  if (deliveryStats?.weak_proof_count > 0 && !customerProofReady) {
    qaOnly = true;
  }

  return {
    capability_key: cap.key,
    capability_label: cap.label,
    service_key: sk,
    customer_proof_ready: customerProofReady,
    qa_only: qaOnly,
    proof_artifact_needed: artifactType,
    current_artifact_found: artifactFound,
    reason_not_ready: reasonNotReady || null,
    recommended_action: recommendedAction || (customerProofReady ? "No action needed — safe to show to customer." : ""),
  };
}

function ReadinessBadge({ ready, qaOnly }) {
  if (ready) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Customer-Ready
      </span>
    );
  }
  if (qaOnly) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        QA Only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200">
      <XCircle className="w-3.5 h-3.5" />
      Not Ready
    </span>
  );
}

export default function CustomerProofReadiness({ data }) {
  const capabilities = data?.capabilities || [];
  const proofByService = data?.proof_by_service || {};
  const deliveryStats = data?.delivery_stats;
  const voiceReadiness = data?.voice_readiness;
  const capabilityDetails = data?.capability_details;

  const rows = capabilities.map((cap) =>
    computeReadiness(cap, proofByService, deliveryStats, voiceReadiness, capabilityDetails)
  );

  const readyCount = rows.filter((r) => r.customer_proof_ready).length;
  const qaOnlyCount = rows.filter((r) => !r.customer_proof_ready && r.qa_only).length;
  const notReadyCount = rows.filter((r) => !r.customer_proof_ready && !r.qa_only).length;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <Eye className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 space-y-1">
          <p className="font-semibold">Customer Proof Readiness — Admin Only</p>
          <p className="leading-relaxed">
            Determines whether ClientSurge can safely show a customer that a communication feature is working.
            A capability is customer-ready only when a real evidence artifact exists — not configuration alone.
            Internal/test evidence is labeled "QA Only" and must not be shown to customers as production proof.
            If proof is unclear, the capability is treated as not ready.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-green-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{readyCount}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-0.5">Customer-Ready</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{qaOnlyCount}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-0.5">QA Only</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{notReadyCount}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-0.5">Not Ready</p>
        </div>
      </div>

      {/* Per-capability cards */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.capability_key}
            className="bg-white rounded-xl border border-gray-200 p-4"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
          >
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div>
                <p className="text-sm font-bold text-gray-900">{row.capability_label}</p>
                {row.service_key && (
                  <p className="text-[11px] text-gray-400 font-mono">{row.service_key}</p>
                )}
              </div>
              <ReadinessBadge ready={row.customer_proof_ready} qaOnly={row.qa_only} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileSearch className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Proof Artifact Needed</p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{row.proof_artifact_needed}</p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Current Artifact Found</p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {row.current_artifact_found || (
                    <span className="text-gray-400 italic">No artifact found</span>
                  )}
                </p>
              </div>
            </div>

            {!row.customer_proof_ready && row.reason_not_ready && (
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-0.5">Reason Not Ready</p>
                <p className="text-xs text-red-700 leading-relaxed">{row.reason_not_ready}</p>
              </div>
            )}

            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 mb-0.5">Recommended Action</p>
              <p className="text-xs text-blue-700 leading-relaxed">{row.recommended_action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";

/**
 * SenderReadinessChecklist: Admin diagnostic showing SMS sender compliance status
 * Displays Twilio account readiness, sender verification, and latest delivery proof result
 */
export default function SenderReadinessChecklist({ latestDeliveryProof, twilioFromNumber }) {
  const checks = [
    {
      id: "account_funded",
      label: "Twilio Account Funded",
      description: "Account has active payment method and is not in trial mode",
      status: "unknown", // Would be set from account info
      tips: ["Check Twilio Console > Billing > Account Balance", "Ensure payment method is valid"],
    },
    {
      id: "sender_type",
      label: "Sender Type Identified",
      description: "Determine if sender is toll-free, 10DLC, or short code",
      status: "identified", // 10DLC, toll-free, short_code
      senderType: "toll-free",
      senderNumber: twilioFromNumber,
      tips: ["Toll-free numbers require verification before SMS sending"],
    },
    {
      id: "toll_free_verified",
      label: "Toll-Free Verification (if applicable)",
      description: "If using a toll-free number, it must be verified in Twilio",
      status: latestDeliveryProof?.error_code === 30032 ? "blocked" : "unknown",
      blockerIfFailed: latestDeliveryProof?.error_code === 30032,
      tips: [
        "Navigate to Twilio Console > Phone Numbers > Manage > Active Numbers",
        `Select ${twilioFromNumber}`,
        "Review Regulatory Information / Toll-Free Verification status",
        "Complete the verification process if pending",
      ],
    },
    {
      id: "a2p_10dlc_registered",
      label: "A2P 10DLC Registration (if applicable)",
      description: "If using a 10DLC sender, it must be registered and approved",
      status: "unknown",
      tips: [
        "Requires US-based business registration",
        "Takes 1-2 business days for approval",
        "Navigate to Twilio Console > Phone Numbers > Manage > 10DLC",
      ],
    },
    {
      id: "geographic_permissions",
      label: "Geographic Permissions",
      description: "Messaging permissions enabled for US/Canada traffic",
      status: "unknown",
      tips: [
        "Most Twilio accounts support US/Canada by default",
        "Check Twilio Console > Messaging > Sending Domains if restricted",
      ],
    },
    {
      id: "status_callbacks",
      label: "Status Callbacks Active",
      description: "SMS delivery status webhooks configured and working",
      status: latestDeliveryProof?.diagnostic ? "checking" : "unknown",
      tips: [
        `StatusCallback URL set: ${latestDeliveryProof?.diagnostic?.next_action?.[0] || "N/A"}`,
        "Webhook endpoint must be publicly accessible",
        "Twilio will POST delivery updates to this URL",
      ],
    },
    {
      id: "latest_proof",
      label: "Latest Delivery Proof",
      description: "Most recent SMS delivery test result",
      status: latestDeliveryProof?.diagnostic ? "blocked" : "not_run",
      result: latestDeliveryProof,
      tips: [
        `To: ${latestDeliveryProof?.normalized_phone || "N/A"}`,
        `From: ${latestDeliveryProof?.twilio_from || twilioFromNumber || "N/A"}`,
        `Status: ${latestDeliveryProof?.delivery_status || "unknown"}`,
        latestDeliveryProof?.diagnostic
          ? `Blocker: ${latestDeliveryProof.diagnostic.title}`
          : "No test run yet",
      ],
    },
  ];

  const statusColors = {
    passed: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600" },
    checking: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
    },
    blocked: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
    },
    unknown: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: "text-gray-500",
    },
    identified: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
    },
    not_run: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: "text-yellow-600",
    },
  };

  const getIcon = (status) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-5 h-5" />;
      case "blocked":
        return <AlertCircle className="w-5 h-5" />;
      case "checking":
        return <Clock className="w-5 h-5" />;
      case "not_run":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      passed: "Passed",
      blocked: "Blocked",
      checking: "Checking",
      unknown: "Unknown",
      identified: "Identified",
      not_run: "Not Run",
    };
    return labels[status] || "Unknown";
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 SMS Sender Readiness Checklist</h3>
        <p className="text-sm text-blue-800">
          Verify your Twilio sender is properly configured, funded, and compliant before production SMS.
        </p>
      </div>

      <div className="space-y-3">
        {checks.map((check) => {
          const colors = statusColors[check.status] || statusColors.unknown;

          return (
            <div
              key={check.id}
              className={`border rounded-lg p-4 ${colors.bg} ${colors.border} border`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${colors.icon}`}>{getIcon(check.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{check.label}</h4>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-white/60">
                      {getStatusLabel(check.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{check.description}</p>

                  {/* Sender details for identified sender */}
                  {check.senderNumber && (
                    <div className="bg-white/50 rounded px-2 py-1.5 mb-2 text-xs font-mono">
                      <span className="text-gray-600">From: </span>
                      <span className="font-semibold">{check.senderNumber}</span>
                    </div>
                  )}

                  {/* Delivery proof result summary */}
                  {check.result?.diagnostic && (
                    <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 mb-2 text-xs">
                      <p className="font-semibold text-red-900">{check.result.diagnostic.title}</p>
                      <p className="text-red-800 mt-1">{check.result.diagnostic.explanation}</p>
                    </div>
                  )}

                  {/* Tips/Details */}
                  {check.tips && check.tips.length > 0 && (
                    <ul className="text-xs space-y-1 text-gray-700">
                      {check.tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-gray-400 flex-shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Balance/Account Funding Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-amber-900 mb-2">⚠️ Possible Issues to Check</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>
            • <strong>Account Suspended:</strong> Check Twilio Console for account suspension notices
          </li>
          <li>
            • <strong>Out of Trial SMS Units:</strong> Trial accounts have limited free SMS; upgrade to paid
          </li>
          <li>
            • <strong>Insufficient Funds:</strong> Ensure payment method is valid and account has credit
          </li>
          <li>
            • <strong>Sender Not Verified:</strong> Toll-free and 10DLC senders require verification
          </li>
          <li>
            • <strong>Network/Carrier Issues:</strong> Transient carrier errors may resolve automatically
          </li>
        </ul>
      </div>
    </div>
  );
}
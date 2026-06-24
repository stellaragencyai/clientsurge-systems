/**
 * Twilio Error Code Mapping
 * Maps Twilio error codes to ClientSurge diagnostic categories
 * This allows admin diagnostics to show truthful, actionable next steps
 */

export const TWILIO_ERROR_MAP = {
  30032: {
    code: 30032,
    title: "Toll-Free Verification Required",
    category: "sender_compliance_block",
    severity: "launch_blocker",
    class: "compliance",
    explanation:
      "The message was rejected because the toll-free sender number has not been verified or approved for US/Canada SMS traffic. Twilio requires explicit verification of toll-free numbers before they can send messages.",
    next_action: [
      "In Twilio Console, navigate to Phone Numbers > Manage > Active Numbers.",
      "Find and select the toll-free sender number (From field).",
      "Check the Regulatory Information / Toll-Free Verification status.",
      "If verification is pending, review and complete the verification process.",
      "If verification was rejected, review the rejection reason and correct it.",
      "Do not continue production SMS testing from this sender until verification is approved.",
      "Alternative: Switch to a verified A2P 10DLC sender or short code if available.",
    ],
    is_sender_problem: true,
    is_recipient_problem: false,
    is_balance_problem: false,
  },
  21211: {
    code: 21211,
    title: "Invalid To Phone Number",
    category: "recipient_format_error",
    severity: "medium",
    class: "validation",
    explanation: "The 'To' phone number is invalid, not in E.164 format, or does not exist.",
    next_action: [
      "Verify the recipient phone number is in E.164 format (e.g., +16025874608).",
      "Check that the country code is included.",
      "Confirm the number is not invalid or reserved.",
    ],
    is_sender_problem: false,
    is_recipient_problem: true,
    is_balance_problem: false,
  },
  21610: {
    code: 21610,
    title: "Account Suspended",
    category: "account_suspended",
    severity: "launch_blocker",
    class: "account",
    explanation: "The Twilio account has been suspended, likely due to unpaid invoices, ToS violations, or abuse.",
    next_action: [
      "Log into Twilio Console and check the account status.",
      "Review any suspension notifications in the account dashboard.",
      "Contact Twilio Support to resolve the suspension.",
      "Do not attempt further SMS sends until the account is active.",
    ],
    is_sender_problem: false,
    is_recipient_problem: false,
    is_balance_problem: true,
  },
  20005: {
    code: 20005,
    title: "Account Trial Out of SMS Units",
    category: "trial_limit_exhausted",
    severity: "launch_blocker",
    class: "balance",
    explanation: "Twilio trial account has exhausted its free SMS units. Trial accounts have limited message quotas.",
    next_action: [
      "In Twilio Console, check Billing > Account Balance or Billing > Usage.",
      "If trial, upgrade to a paid account to continue sending SMS.",
      "Add a payment method to enable production SMS sending.",
    ],
    is_sender_problem: false,
    is_recipient_problem: false,
    is_balance_problem: true,
  },
  20003: {
    code: 20003,
    title: "Account Out of Funds",
    category: "insufficient_funds",
    severity: "launch_blocker",
    class: "balance",
    explanation:
      "The Twilio account has insufficient credit or funds to send the message. This is common when a credit card expires or payment fails.",
    next_action: [
      "In Twilio Console, navigate to Billing > Account Balance.",
      "Check the current balance and payment method.",
      "Update or add a valid payment method.",
      "Ensure the account is not on a restricted payment plan.",
      "After adding funds, retry the SMS send.",
    ],
    is_sender_problem: false,
    is_recipient_problem: false,
    is_balance_problem: true,
  },
  30008: {
    code: 30008,
    title: "Carrier Temporarily Unavailable",
    category: "carrier_temporary_failure",
    severity: "low",
    class: "transient",
    explanation: "The carrier was temporarily unavailable. This is usually a transient issue that resolves on its own.",
    next_action: ["Retry the SMS send after a few minutes.", "If the issue persists, contact Twilio Support."],
    is_sender_problem: false,
    is_recipient_problem: false,
    is_balance_problem: false,
  },
  30007: {
    code: 30007,
    title: "Carrier Network Error",
    category: "carrier_network_error",
    severity: "low",
    class: "transient",
    explanation: "A network error occurred at the carrier level. This is usually transient.",
    next_action: ["Retry the SMS send.", "If persistent, contact Twilio Support."],
    is_sender_problem: false,
    is_recipient_problem: false,
    is_balance_problem: false,
  },
  30009: {
    code: 30009,
    title: "Unroutable Message",
    category: "unroutable_recipient",
    severity: "medium",
    class: "validation",
    explanation:
      "The message cannot be delivered to the recipient number. The number may not exist, be invalid, or not support SMS.",
    next_action: [
      "Verify the recipient number is correct and in E.164 format.",
      "Confirm the number is a mobile phone (not a landline).",
      "Check if the number is in an SMS-supported country.",
      "Retry with a different test number if available.",
    ],
    is_sender_problem: false,
    is_recipient_problem: true,
    is_balance_problem: false,
  },
};

/**
 * Parse Twilio error message and extract error code if present
 * @param {string} twilioErrorString - Error message from Twilio
 * @returns {number|null} - Error code if found, null otherwise
 */
export function extractTwilioErrorCode(twilioErrorString) {
  if (!twilioErrorString) return null;
  // Look for patterns like "30032" or "error_code=30032"
  const match = String(twilioErrorString).match(/\b(\d{5})\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get detailed diagnostic info for a Twilio error
 * @param {string|number} error - Error code or error message from Twilio
 * @returns {object} - Diagnostic object with title, category, explanation, next_action
 */
export function getTwilioErrorDiagnostic(error) {
  let errorCode = typeof error === "number" ? error : extractTwilioErrorCode(error);

  if (!errorCode) {
    return {
      code: null,
      title: "Unknown Twilio Error",
      category: "unknown",
      severity: "medium",
      class: "unknown",
      explanation: error || "An unknown Twilio error occurred.",
      next_action: [
        "Review the error message carefully.",
        "Check Twilio documentation for the error code.",
        "Contact Twilio Support with the error message and message SID.",
      ],
      is_sender_problem: false,
      is_recipient_problem: false,
      is_balance_problem: false,
    };
  }

  return TWILIO_ERROR_MAP[errorCode] || {
    code: errorCode,
    title: `Twilio Error ${errorCode}`,
    category: "unmapped",
    severity: "medium",
    class: "other",
    explanation: `Twilio returned error code ${errorCode}. Check Twilio docs for details.`,
    next_action: [
      `Search Twilio documentation for error code ${errorCode}.`,
      "Contact Twilio Support with the error code and message SID.",
    ],
    is_sender_problem: false,
    is_recipient_problem: false,
    is_balance_problem: false,
  };
}
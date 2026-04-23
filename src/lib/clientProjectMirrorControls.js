export const CLIENT_PROJECT_PROGRESS_STEPS = [
  {
    key: "step_onboarding",
    label: "Onboarding Form",
    desc: "Mirrors the controlled onboarding/signup completion path.",
  },
  {
    key: "step_payment",
    label: "Payment Confirmed",
    desc: "Mirrors canonical paid-order state.",
  },
  {
    key: "step_system_setup",
    label: "System Setup",
    desc: "Mirrors canonical install progress for active services.",
  },
  {
    key: "step_sms",
    label: "SMS Connected",
    desc: "Mirrors the canonical SMS service install path.",
  },
  {
    key: "step_email",
    label: "Email Connected",
    desc: "Mirrors project delivery progress and should not be toggled here.",
  },
  {
    key: "step_booking",
    label: "Booking Flow Setup",
    desc: "Mirrors canonical booking-flow setup progress and should not be toggled here.",
  },
  {
    key: "step_followup",
    label: "Follow-Up Setup",
    desc: "Mirrors canonical follow-up setup progress and should not be toggled here.",
  },
  {
    key: "step_live",
    label: "System Live",
    desc: "Mirrors canonical go-live state from the paid setup order.",
  },
];

export function getClientProjectCompletedProgressCount(project) {
  return CLIENT_PROJECT_PROGRESS_STEPS.filter(
    (step) => project?.[step.key] === "complete"
  ).length;
}

export function isClientProjectProgressFieldDerived(stepKey) {
  return CLIENT_PROJECT_PROGRESS_STEPS.some((step) => step.key === stepKey);
}

export const WEBSITE_LEAD_FOLLOW_UP_STEPS = [
  { step: 1, minutesAfter: 10, channel: "sms", key: "website_follow_sms_10min" },
  { step: 2, minutesAfter: 60, channel: "email", key: "website_follow_email_1hr" },
  { step: 3, minutesAfter: 1440, channel: "sms", key: "website_follow_sms_24hr" },
];

export function minutesSince(isoDate, now = Date.now()) {
  if (!isoDate) return 0;
  return (now - new Date(isoDate).getTime()) / (1000 * 60);
}

export function shouldStopWebsiteLeadFollowUp(lead) {
  if (!lead) return true;
  return (
    lead.automation_enabled === false ||
    lead.cadence_paused === true ||
    lead.status === "opted_out" ||
    lead.status === "Booked" ||
    lead.lead_status === "closed" ||
    lead.lead_status === "ignored" ||
    lead.lead_status === "booked" ||
    lead.reply_status !== "none" ||
    lead.booking_status !== "none"
  );
}

export function getDueWebsiteLeadFollowUpSteps(lead, now = Date.now()) {
  const elapsed = minutesSince(lead?.initial_response_sent_at, now);
  return WEBSITE_LEAD_FOLLOW_UP_STEPS.filter((step) => elapsed >= step.minutesAfter);
}

export function getNextDueWebsiteLeadFollowUpStep(lead, now = Date.now()) {
  const completedStep = Number(lead?.follow_up_step || 0);
  return getDueWebsiteLeadFollowUpSteps(lead, now).find((step) => step.step > completedStep) || null;
}

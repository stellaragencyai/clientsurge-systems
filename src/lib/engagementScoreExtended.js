/**
 * Task 19 — Extended engagement score with email open/click events (Task 16)
 * Builds on base engagementScore.js with email tracking signals
 */

export function calculateEngagementScore(lead) {
  let score = 0;

  if (lead.reply_status === 'responded') score += 40;
  if (lead.booking_status === 'clicked') score += 30;
  if (lead.booking_status === 'booked') score += 30;

  // Email engagement signals (Task 16)
  if (lead.email_opened_count > 0) score += Math.min(lead.email_opened_count * 5, 15);
  if (lead.email_clicked_count > 0) score += Math.min(lead.email_clicked_count * 8, 20);

  // Clamp 0-100
  return Math.max(0, Math.min(100, score));
}

export function getEngagementLevel(score) {
  if (score >= 75) return 'Hot';
  if (score >= 50) return 'Warm';
  if (score >= 25) return 'Lukewarm';
  return 'Cold';
}

/**
 * Applies email open/click boost — called from receiveResendWebhook
 */
export function getEmailEventBoost(eventType) {
  if (eventType === 'email.opened') return 5;
  if (eventType === 'email.clicked') return 8;
  return 0;
}
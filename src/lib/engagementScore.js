/**
 * Centralized engagement score calculation
 * Consistent across all functions
 */
export function calculateEngagementScore(lead) {
  let score = 0;
  
  // Reply engagement
  if (lead.reply_status === 'responded') {
    score += 40;
  }
  
  // Booking engagement
  if (lead.booking_status === 'clicked') {
    score += 30;
  }
  if (lead.booking_status === 'booked') {
    score += 30;
  }
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get engagement level name
 */
export function getEngagementLevel(score) {
  if (score >= 75) return 'Hot';
  if (score >= 50) return 'Warm';
  if (score >= 25) return 'Lukewarm';
  return 'Cold';
}
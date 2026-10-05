/**
 * Campaign Configuration
 * "Founder's Tier" pre-launch campaign settings
 */

export const CAMPAIGN_CONFIG = {
  isActive: false,
  name: "Founder's Tier",
  launchDate: new Date("2026-06-12T00:00:00Z"),
  endDate: new Date("2026-06-26T23:59:59Z"), // 14 days
  maxClients: 50,

  offers: {
    starter: {
      name: "Starter",
      standardSetupFee: 249,
      standardMonthly: 99,
      founderSetupFee: 0, // Waived
      founderMonthly: 99,
      savings: "$249 setup waived",
      icon: "🚀",
    },
    growth: {
      name: "Growth",
      standardSetupFee: 499,
      standardMonthly: 249,
      founderSetupFee: 499,
      founderMonthly: 125, // roughly 50% off first 3 months
      months: 3,
      savings: "50% off monthly for 3 months",
      icon: "⚡",
    },
    elite: {
      name: "Elite",
      standardSetupFee: 999,
      standardMonthly: 499,
      founderSetupFee: 999,
      founderMonthly: 499,
      freeMonth: true,
      prioritySupport: true,
      savings: "1 month free + lifetime priority support",
      icon: "👑",
    },
  },
};

/**
 * Check if campaign is currently active
 */
export function isCampaignActive() {
  if (!CAMPAIGN_CONFIG.isActive) return false;
  const now = new Date();
  return now >= CAMPAIGN_CONFIG.launchDate && now <= CAMPAIGN_CONFIG.endDate;
}

/**
 * Calculate days remaining in campaign
 */
export function getDaysRemaining() {
  const now = new Date();
  if (now > CAMPAIGN_CONFIG.endDate) return 0;
  const diff = CAMPAIGN_CONFIG.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate hours remaining in campaign
 */
export function getHoursRemaining() {
  const now = new Date();
  if (now > CAMPAIGN_CONFIG.endDate) return 0;
  const diff = CAMPAIGN_CONFIG.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60));
}

/**
 * Campaign Configuration
 * "Founder's Tier" pre-launch campaign settings
 */

export const CAMPAIGN_CONFIG = {
  isActive: true,
  name: "Founder's Tier",
  launchDate: new Date("2026-06-12T00:00:00Z"),
  endDate: new Date("2026-06-26T23:59:59Z"), // 14 days
  maxClients: 50,

  offers: {
    starter: {
      name: "Starter",
      standardSetupFee: 797,
      standardMonthly: 497,
      founderSetupFee: 0, // Waived
      founderMonthly: 497,
      savings: "$797 setup waived",
      icon: "🚀",
    },
    growth: {
      name: "Growth",
      standardSetupFee: 1297,
      standardMonthly: 997,
      founderSetupFee: 1297,
      founderMonthly: 499, // 50% off first 3 months
      months: 3,
      savings: "50% off monthly for 3 months",
      icon: "⚡",
    },
    elite: {
      name: "Elite",
      standardSetupFee: 2497,
      standardMonthly: 1997,
      founderSetupFee: 2497,
      founderMonthly: 1997,
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
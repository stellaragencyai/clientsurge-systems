/**
 * portalEmptyStateCopy — Phase 4.4 Phase 5
 *
 * Centralized contextual copy for portal empty states.
 * Instead of "No data", uses helpful, explanatory text that tells the client
 * when data will populate and what to do next.
 *
 * Each entry: { title, description, expectedTiming, actionLabel?, actionTab? }
 */

export const EMPTY_STATE_COPY = {
  leads: {
    title: "No Leads Yet",
    description:
      "Your first leads will appear here after your automation system begins capturing inquiries.",
    expectedTiming: "Leads show up automatically once your system goes live.",
    actionLabel: "View Setup Progress",
    actionTab: "progress",
  },
  reports: {
    title: "No Reports Available Yet",
    description:
      "Reports become available after your system has verified activity running for at least one week.",
    expectedTiming: "Your first weekly report generates 7 days after your system goes live.",
    actionLabel: "View System Status",
    actionTab: "overview",
  },
  tasks: {
    title: "No Automated Tasks Yet",
    description:
      "Tasks are created automatically when leads enter your pipeline. Nothing to show here yet.",
    expectedTiming: "Tasks appear once your system starts processing leads.",
  },
  activity: {
    title: "No Activity Yet",
    description:
      "Your activity log will populate as your automation system processes leads and sends messages.",
    expectedTiming: "Activity appears here after your first lead is captured.",
  },
  automations: {
    title: "No Automations Configured Yet",
    description:
      "Your automation modules will appear here once setup is complete and modules are verified.",
    expectedTiming: "Automations activate after your system goes through testing and verification.",
    actionLabel: "View Setup Progress",
    actionTab: "progress",
  },
  billing: {
    title: "No Billing History Yet",
    description:
      "Your billing history and invoices will appear here after your first payment cycle completes.",
    expectedTiming: "Invoices generate after each billing cycle.",
  },
  support: {
    title: "No Support Conversations Yet",
    description:
      "Send us a message and our team will reply within a few hours during business hours.",
    expectedTiming: "Replies typically arrive within 2–4 hours.",
  },
  notifications: {
    title: "No Notifications Yet",
    description:
      "You'll see updates here as your system progresses through setup, testing, and go-live.",
    expectedTiming: "Notifications appear as milestones are reached.",
  },
  timeline: {
    title: "No Timeline Events Yet",
    description:
      "Timeline events will appear here as your deployment progresses through setup and verification.",
    expectedTiming: "Events are recorded automatically from real system activity.",
  },
  files: {
    title: "No Files Uploaded Yet",
    description:
      "Upload your logo, business photos, or credentials to help us configure your system.",
    expectedTiming: "Files you upload appear here immediately.",
    actionLabel: "Upload Files",
    actionTab: "files",
  },
  performance: {
    title: "No Performance Data Yet",
    description:
      "Performance metrics appear here after your system goes live and starts processing leads.",
    expectedTiming: "Metrics populate within 24 hours of your system going live.",
    actionLabel: "View Setup Progress",
    actionTab: "progress",
  },
};

/**
 * Get empty state copy by key with optional custom override.
 * @param {string} key - one of the keys in EMPTY_STATE_COPY
 * @param {object} overrides - optional partial override
 * @returns {object} - { title, description, expectedTiming, actionLabel?, actionTab? }
 */
export function getEmptyStateCopy(key, overrides = {}) {
  const base = EMPTY_STATE_COPY[key] || EMPTY_STATE_COPY.activity;
  return { ...base, ...overrides };
}
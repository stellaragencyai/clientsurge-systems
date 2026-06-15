/**
 * Industry Page Configuration
 * Centralized config for 4-industry landing page system
 * Used by IndustryTemplate and industry-specific components
 */

export const INDUSTRY_CONFIG = {
  hvac: {
    slug: 'hvac',
    name: 'HVAC',
    title: 'HVAC Lead Automation | ClientSurge',
    description: 'Never miss an emergency service call. Automate lead response, missed call recovery, and appointment booking for HVAC contractors.',
    heroTitle: 'Never miss another HVAC service call again.',
    heroSubtitle: 'AI responds instantly 24/7, qualifies leads, and books appointments automatically so you never lose revenue from missed calls.',
    painStatement: 'Every missed emergency call is lost revenue—sometimes $1,000+ per call.',
    painCalculation: {
      avgJobValue: 3500,
      missedCallsPerMonth: 12,
      conversionRate: 0.35,
      monthlyRevenueLoss: function() {
        return this.avgJobValue * this.missedCallsPerMonth * this.conversionRate;
      },
    },
    problemTitle: 'The Real Cost of Missed HVAC Leads',
    problems: [
      {
        title: 'Emergency calls don\'t wait',
        description: 'A customer calling for emergency AC repair will call your competitor if you don\'t answer within 90 seconds.',
      },
      {
        title: 'After-hours chaos',
        description: 'Your team sleeps while emergencies happen. Lost revenue happens every night.',
      },
      {
        title: 'Scheduling delays cost money',
        description: 'Manual scheduling slows down booking. Every delayed appointment is customer frustration.',
      },
    ],
    solutionTitle: 'Automate Your Entire Lead Response',
    features: [
      {
        icon: 'MessageSquare',
        title: 'Instant AI Response',
        description: 'AI answers leads immediately—24/7—and qualifies them before your team sees them.',
      },
      {
        icon: 'Phone',
        title: 'Missed Call Recovery',
        description: 'Customer didn\'t answer? Automated SMS/email follow-up within 2 minutes.',
      },
      {
        icon: 'Calendar',
        title: 'Auto-Booking',
        description: 'Leads book appointments directly. No admin work needed.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Lead comes in',
        description: 'Call, text, or form submission—doesn\'t matter. AI sees it immediately.',
      },
      {
        number: '2',
        title: 'AI responds instantly',
        description: 'Smart response qualifies the lead and offers instant booking.',
      },
      {
        number: '3',
        title: 'Booking confirmed',
        description: 'Lead books directly or gets follow-up. Your team gets qualified leads only.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'HVAC Starter',
        price: '$497/month',
        features: [
          'AI Instant Response (SMS)',
          'Missed Call SMS Recovery',
        ],
      },
      growth: {
        label: 'HVAC Growth',
        price: '$997/month',
        features: [
          'AI Instant Response (SMS + Email)',
          'Missed Call SMS + Email Recovery',
          'Auto-Booking Link',
          'Lead Quality Scoring',
        ],
      },
      pro: {
        label: 'HVAC Pro',
        price: 'Custom',
        features: [
          'All Growth features',
          'Voice AI Agent (ElevenLabs)',
          'Advanced Lead Routing',
          'Custom Automation Rules',
        ],
      },
    },
    testimonialPlaceholder: 'HVAC contractor case study',
    cta: 'Get Free Automation Audit',
  },

  roofing: {
    slug: 'roofing',
    name: 'Roofing & Contractors',
    title: 'Contractor Lead Automation | ClientSurge',
    description: 'Stop losing $5K–$20K jobs to slow response times. Automate lead capture, qualification, and booking for roofing and construction contractors.',
    heroTitle: 'Every missed call can cost you a $5K–$20K job.',
    heroSubtitle: 'Respond in seconds. Book consultations automatically. Never lose high-ticket revenue again.',
    painStatement: 'High-ticket leads require fast response. A 2-hour delay = lost job.',
    painCalculation: {
      avgJobValue: 12000,
      missedCallsPerMonth: 8,
      conversionRate: 0.40,
      monthlyRevenueLoss: function() {
        return this.avgJobValue * this.missedCallsPerMonth * this.conversionRate;
      },
    },
    problemTitle: 'High-Ticket Leads Are Your Most Valuable—And Most Lost',
    problems: [
      {
        title: 'Competitors respond faster',
        description: 'Property owners call 3–5 contractors. Whoever responds first usually wins.',
      },
      {
        title: 'Manual scheduling = lost jobs',
        description: 'Your admin can\'t keep up. Leads wait hours. Customers move on.',
      },
      {
        title: 'No follow-up = no conversation',
        description: 'One missed call = one lost job. No second chances in contracting.',
      },
    ],
    solutionTitle: 'Instant Response. Instant Booking. Instant Revenue.',
    features: [
      {
        icon: 'Zap',
        title: '60-Second Response',
        description: 'AI responds to every inquiry before your phone stops ringing.',
      },
      {
        icon: 'TrendingUp',
        title: 'Smart Lead Qualification',
        description: 'AI asks the right questions. Your team gets only qualified leads.',
      },
      {
        icon: 'CheckCircle',
        title: 'Consultation Booking',
        description: 'Customers book consultations directly. Your calendar syncs automatically.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Contractor inquiry arrives',
        description: 'Phone, form, or text—any channel. AI sees it instantly.',
      },
      {
        number: '2',
        title: 'AI qualifies the lead',
        description: 'Smart questions surface the job scope, budget, timeline, and urgency.',
      },
      {
        number: '3',
        title: 'Customer books or gets follow-up',
        description: 'Consultation scheduled. Your team calls with full context.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'Contractor Starter',
        price: '$497/month',
        features: [
          'AI Instant Response (SMS)',
          'Missed Call Recovery',
        ],
      },
      growth: {
        label: 'Contractor Growth',
        price: '$997/month',
        features: [
          'AI Instant Response (SMS + Email)',
          'Missed Call + Email Recovery',
          'Consultation Booking Link',
          'Lead Qualification Scoring',
        ],
      },
      pro: {
        label: 'Contractor Pro',
        price: 'Custom',
        features: [
          'All Growth features',
          'Voice AI Receptionist',
          'Smart Lead Routing (by job type)',
          'Custom Workflows',
        ],
      },
    },
    testimonialPlaceholder: 'Roofing contractor case study',
    cta: 'Get Free Automation Audit',
  },

  dental: {
    slug: 'dental',
    name: 'Dental',
    title: 'Dental Practice Lead Automation | ClientSurge',
    description: 'Fill empty chair time automatically. Automate appointment scheduling, patient reactivation, and no-show recovery for dental practices.',
    heroTitle: 'Fill your empty chair time automatically.',
    heroSubtitle: 'AI schedules patients 24/7, automates reminders to reduce no-shows, and reactivates inactive patients—all without your team.',
    painStatement: 'Every empty chair is lost revenue. No-shows hurt your practice and your team\'s schedule.',
    painCalculation: {
      avgTreatmentValue: 500,
      emptyChairsPerDay: 3,
      daysPerMonth: 20,
      monthlyRevenueLoss: function() {
        return this.avgTreatmentValue * this.emptyChairsPerDay * this.daysPerMonth;
      },
    },
    problemTitle: 'Dental Practices Lose Revenue to Empty Schedules',
    problems: [
      {
        title: 'Patients forget appointments',
        description: 'No-shows are expensive. Manual reminders don\'t prevent them.',
      },
      {
        title: 'Inactive patients never return',
        description: 'Reactivation takes time your team doesn\'t have. Patients drift to competitors.',
      },
      {
        title: 'Slow appointment scheduling',
        description: 'Patients want instant confirmation. If you can\'t schedule them fast, they go elsewhere.',
      },
    ],
    solutionTitle: 'Automate Appointments, Reactivation, and Patient Retention',
    features: [
      {
        icon: 'Calendar',
        title: 'Instant Scheduling',
        description: 'Patients book appointments 24/7—directly into your calendar.',
      },
      {
        icon: 'RefreshCw',
        title: 'Patient Reactivation',
        description: 'Automated campaigns win back inactive patients. AI-personalized messaging.',
      },
      {
        icon: 'AlertCircle',
        title: 'Smart Reminders',
        description: 'Multi-channel reminders (SMS + email) reduce no-shows by 40%.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Patient reaches out',
        description: 'Call, text, or form. AI instantly responds with available appointment times.',
      },
      {
        number: '2',
        title: 'Patient books immediately',
        description: 'No waiting for your receptionist. Calendar syncs in real-time.',
      },
      {
        number: '3',
        title: 'Reminders reduce no-shows',
        description: 'Automated SMS + email reminders 24 hours before. Patients show up.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'Dental Starter',
        price: '$497/month',
        features: [
          'Instant Appointment Booking',
          'Missed Call SMS Response',
        ],
      },
      growth: {
        label: 'Dental Growth',
        price: '$997/month',
        features: [
          'Instant Appointment Booking',
          'Missed Call SMS + Email Response',
          'Patient Reactivation Campaigns',
          'Smart Appointment Reminders',
        ],
      },
      pro: {
        label: 'Dental Pro',
        price: 'Custom',
        features: [
          'All Growth features',
          'Voice AI Receptionist',
          'Insurance Pre-Authorization Assistance',
          'Advanced Patient Segmentation',
        ],
      },
    },
    testimonialPlaceholder: 'Dental practice case study',
    cta: 'Get Free Automation Audit',
  },

  chiropractic: {
    slug: 'chiropractic',
    name: 'Chiropractic',
    title: 'Chiropractic Practice Automation | ClientSurge',
    description: 'Automate patient follow-ups, reduce no-shows, and boost recurring visits with AI-powered practice automation for chiropractors.',
    heroTitle: 'Stop losing patients from missed follow-ups.',
    heroSubtitle: 'Automate appointment reminders, post-visit follow-ups, and patient reactivation to fill your schedule with recurring visits.',
    painStatement: 'Patient drop-off starts with missed appointments. Automate follow-ups to keep patients on track.',
    painCalculation: {
      avgVisitValue: 150,
      missedApptsPerMonth: 15,
      retentionRevenueLoss: function() {
        return this.avgVisitValue * this.missedApptsPerMonth * 4; // 4 visits per patient per month average
      },
    },
    problemTitle: 'Chiropractic Practices Struggle With Patient Retention',
    problems: [
      {
        title: 'Patients miss follow-up appointments',
        description: 'No-shows hurt treatment outcomes and destroy recurring revenue.',
      },
      {
        title: 'Inactive patients never return',
        description: 'One missed appt = patient falls off. Reactivation is hard without automation.',
      },
      {
        title: 'Manual reminders don\'t work',
        description: 'Your team can\'t call every patient. Generic emails get ignored.',
      },
    ],
    solutionTitle: 'Automate Patient Retention at Scale',
    features: [
      {
        icon: 'Clock',
        title: 'Smart Appointment Reminders',
        description: 'Multi-channel reminders (SMS + email) eliminate no-shows. Personalized per patient.',
      },
      {
        icon: 'MessageCircle',
        title: 'Auto Follow-Ups',
        description: 'After-visit follow-ups keep patients on track. Reduce appointment gaps automatically.',
      },
      {
        icon: 'RotateCcw',
        title: 'Patient Reactivation',
        description: 'Inactive patients get personalized re-engagement campaigns. Automatic.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Patient books or gets reminder',
        description: 'Schedule automated reminders 24 hours and 2 hours before each appointment.',
      },
      {
        number: '2',
        title: 'Post-visit follow-up',
        description: 'After each visit, AI sends care tips and next appointment reminders.',
      },
      {
        number: '3',
        title: 'Inactive patients reactivate',
        description: 'Automated campaigns win back patients who haven\'t visited in 30+ days.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'Chiropractic Starter',
        price: '$497/month',
        features: [
          'Appointment Reminders (SMS)',
          'Missed Call SMS Recovery',
        ],
      },
      growth: {
        label: 'Chiropractic Growth',
        price: '$997/month',
        features: [
          'Smart Appointment Reminders (SMS + Email)',
          'Post-Visit Follow-Up Automation',
          'Patient Reactivation Campaigns',
          'Lead Quality Scoring',
        ],
      },
      pro: {
        label: 'Chiropractic Pro',
        price: 'Custom',
        features: [
          'All Growth features',
          'Voice AI Patient Support',
          'Insurance Verification Automation',
          'Advanced Segmentation & Campaigns',
        ],
      },
    },
    testimonialPlaceholder: 'Chiropractic practice case study',
    cta: 'Get Free Automation Audit',
  },
};

/**
 * Get industry config by slug
 */
export function getIndustryConfig(slug) {
  return INDUSTRY_CONFIG[slug] || null;
}

/**
 * Get all industry slugs
 */
export function getAllIndustrySlugs() {
  return Object.keys(INDUSTRY_CONFIG);
}

/**
 * Calculate revenue loss for industry
 */
export function calculateRevenueLoss(slug) {
  const config = getIndustryConfig(slug);
  if (!config || !config.painCalculation) return 0;
  return config.painCalculation.monthlyRevenueLoss();
}
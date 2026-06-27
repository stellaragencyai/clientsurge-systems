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
    cta: 'Compare Packages',
  },

  plumbing: {
    slug: 'plumbing',
    name: 'Plumbing',
    title: 'Plumbing Dispatch Automation | ClientSurge',
    description: 'Capture urgent plumbing calls, recover missed after-hours leads, and route booked dispatches with AI-powered plumbing automation.',
    heroTitle: 'Turn urgent plumbing calls into booked dispatches faster.',
    heroSubtitle: 'AI responds to emergency leak, drain repair, and water heater inquiries before the customer calls the next plumber.',
    painStatement: 'Plumbing leads are urgent. If response is slow, the job usually goes to whoever answers first.',
    painCalculation: {
      avgJobValue: 900,
      missedCallsPerMonth: 20,
      conversionRate: 0.45,
      monthlyRevenueLoss: function() {
        return this.avgJobValue * this.missedCallsPerMonth * this.conversionRate;
      },
    },
    problemTitle: 'Plumbing Teams Lose Jobs When Urgent Calls Wait',
    problems: [
      {
        title: 'Emergency leaks need instant response',
        description: 'Leak and drain repair callers rarely wait. Slow callback windows send them to the next company.',
      },
      {
        title: 'After-hours calls fall through',
        description: 'Night and weekend calls need capture, triage, and follow-up even when dispatch is limited.',
      },
      {
        title: 'Dispatch details get missed',
        description: 'Job type, address, urgency, access notes, and preferred timing need to reach the team clearly.',
      },
    ],
    solutionTitle: 'Automate Intake, Recovery, and Dispatch Handoff',
    features: [
      {
        icon: 'Phone',
        title: 'Missed Call Recovery',
        description: 'Send fast text-back follow-up when urgent callers are missed.',
      },
      {
        icon: 'MessageSquare',
        title: 'Emergency Intake',
        description: 'Capture issue type, location, urgency, and customer details before the lead goes cold.',
      },
      {
        icon: 'Calendar',
        title: 'Dispatch Handoff',
        description: 'Move qualified plumbing inquiries toward booking or team follow-up with clear context.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Plumbing inquiry arrives',
        description: 'Call, form, or message comes in for a leak, drain repair, fixture, or water heater issue.',
      },
      {
        number: '2',
        title: 'AI captures the details',
        description: 'The workflow gathers urgency, service type, address, and next-step preference.',
      },
      {
        number: '3',
        title: 'Team gets a cleaner handoff',
        description: 'The customer is routed toward booking or callback while your team receives the job context.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'Plumbing Starter',
        price: '$497/month',
        features: ['Missed Call SMS Recovery', 'Emergency Inquiry Intake'],
      },
      growth: {
        label: 'Plumbing Growth',
        price: '$997/month',
        features: ['SMS + Email Follow-Up', 'Dispatch Detail Capture', 'Lead Quality Scoring', 'Booking Link Handoff'],
      },
      pro: {
        label: 'Plumbing Pro',
        price: 'Custom',
        features: ['All Growth features', 'Voice AI Receptionist', 'Priority Routing Rules', 'Custom Dispatch Workflows'],
      },
    },
    testimonialPlaceholder: 'Plumbing company case study',
    cta: 'Compare Packages',
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
    cta: 'Compare Packages',
  },

  contractors: {
    slug: 'contractors',
    name: 'Contractors',
    title: 'Contractor Lead Follow-Up Automation | ClientSurge',
    description: 'Automate project inquiry routing, quote follow-up, missed-call recovery, estimate nurturing, and old opportunity reactivation for contractors.',
    heroTitle: 'Get more contractor leads booked before competitors reply.',
    heroSubtitle: 'AI captures project details, follows up on estimates, and keeps high-value job opportunities moving.',
    painStatement: 'Project inquiries go cold when quote follow-up is slow, details are scattered, or estimates sit unanswered.',
    painCalculation: {
      avgJobValue: 6500,
      missedCallsPerMonth: 10,
      conversionRate: 0.30,
      monthlyRevenueLoss: function() {
        return this.avgJobValue * this.missedCallsPerMonth * this.conversionRate;
      },
    },
    problemTitle: 'Contractors Lose Revenue in the Follow-Up Gap',
    problems: [
      {
        title: 'Project details are incomplete',
        description: 'Teams waste time chasing scope, location, timeline, and budget context after the lead arrives.',
      },
      {
        title: 'Quotes need persistent follow-up',
        description: 'A good estimate can still die if nobody follows up at the right time with the right next step.',
      },
      {
        title: 'Old opportunities stay buried',
        description: 'Past inquiries and stalled estimates often sit in email or the CRM without a reactivation path.',
      },
    ],
    solutionTitle: 'Automate Inquiry Routing and Estimate Follow-Up',
    features: [
      {
        icon: 'MessageSquare',
        title: 'Project Intake',
        description: 'Capture service type, timeline, location, budget signals, and decision stage.',
      },
      {
        icon: 'TrendingUp',
        title: 'Estimate Nurture',
        description: 'Follow up with quote recipients and keep warm opportunities from disappearing.',
      },
      {
        icon: 'RefreshCw',
        title: 'Opportunity Reactivation',
        description: 'Bring older project inquiries back into motion with controlled campaigns.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Project inquiry arrives',
        description: 'A call, form, or message starts the workflow with job context capture.',
      },
      {
        number: '2',
        title: 'AI qualifies the opportunity',
        description: 'The system collects enough detail for your team to prioritize the next step.',
      },
      {
        number: '3',
        title: 'Follow-up keeps moving',
        description: 'Quote follow-up and reactivation workflows keep projects from going silent.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'Contractor Starter',
        price: '$497/month',
        features: ['Missed Call Recovery', 'Basic Project Intake'],
      },
      growth: {
        label: 'Contractor Growth',
        price: '$997/month',
        features: ['SMS + Email Follow-Up', 'Estimate Nurture', 'Project Qualification', 'Booking Link Handoff'],
      },
      pro: {
        label: 'Contractor Pro',
        price: 'Custom',
        features: ['All Growth features', 'Voice AI Receptionist', 'Advanced Routing', 'Custom Reactivation Workflows'],
      },
    },
    testimonialPlaceholder: 'Contractor lead follow-up case study',
    cta: 'Compare Packages',
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
    cta: 'Compare Packages',
  },

  'med-spa': {
    slug: 'med-spa',
    name: 'Med Spa',
    title: 'Med Spa Consultation Booking Automation | ClientSurge',
    description: 'Book more med spa consults with fast lead response, treatment inquiry follow-up, package nurture, no-show reduction, and old inquiry reactivation.',
    heroTitle: 'Book more med spa consults before leads go cold.',
    heroSubtitle: 'AI follows up on treatment inquiries, missed calls, DMs, and package leads so more prospects make it to consultation.',
    painStatement: 'Med spa leads compare options quickly. Slow response turns high-intent treatment inquiries into lost consults.',
    painCalculation: {
      avgConsultValue: 1200,
      missedInquiriesPerMonth: 18,
      conversionRate: 0.32,
      monthlyRevenueLoss: function() {
        return this.avgConsultValue * this.missedInquiriesPerMonth * this.conversionRate;
      },
    },
    problemTitle: 'Med Spas Lose Consults When Inquiry Follow-Up Slows Down',
    problems: [
      {
        title: 'Treatment inquiries need quick answers',
        description: 'Botox, filler, laser, body contouring, and membership leads lose momentum when nobody replies quickly.',
      },
      {
        title: 'Package leads need nurture',
        description: 'Higher-ticket services often require several touchpoints before a consultation is booked.',
      },
      {
        title: 'No-shows and old inquiries leak revenue',
        description: 'Missed consults and old DMs need structured reminders and reactivation.',
      },
    ],
    solutionTitle: 'Automate Consultation Booking and Package Nurture',
    features: [
      {
        icon: 'MessageSquare',
        title: 'Fast Inquiry Response',
        description: 'Respond to treatment questions and missed calls before the lead goes cold.',
      },
      {
        icon: 'Calendar',
        title: 'Consult Booking',
        description: 'Move high-intent prospects toward consultation with reminders and booking handoff.',
      },
      {
        icon: 'RefreshCw',
        title: 'Old Inquiry Reactivation',
        description: 'Bring past treatment inquiries and membership leads back into conversation.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Treatment inquiry arrives',
        description: 'A prospect asks about a service, package, price range, or appointment opening.',
      },
      {
        number: '2',
        title: 'AI follows up with context',
        description: 'The workflow captures service interest and keeps the prospect moving toward a consult.',
      },
      {
        number: '3',
        title: 'Consult is booked or nurtured',
        description: 'The lead gets reminders, answers, and next steps while your team gets cleaner context.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'Med Spa Starter',
        price: '$497/month',
        features: ['Missed Call Text-Back', 'Treatment Inquiry Capture'],
      },
      growth: {
        label: 'Med Spa Growth',
        price: '$997/month',
        features: ['SMS + Email Nurture', 'Consult Booking Handoff', 'No-Show Follow-Up', 'Package Lead Nurture'],
      },
      pro: {
        label: 'Med Spa Pro',
        price: 'Custom',
        features: ['All Growth features', 'Voice AI Receptionist', 'Membership Reactivation', 'Custom Treatment Workflows'],
      },
    },
    testimonialPlaceholder: 'Med spa consultation booking case study',
    cta: 'Compare Packages',
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
      monthlyRevenueLoss: function() {
        return this.retentionRevenueLoss();
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
    cta: 'Compare Packages',
  },

  veterinary: {
    slug: 'veterinary',
    name: 'Veterinary Clinics',
    title: 'Veterinary Clinic Automation | ClientSurge',
    description: 'Automate appointment requests, missed-call text-back, after-hours inquiry capture, reminders, and lead follow-up for veterinary practices.',
    heroTitle: 'Never miss an appointment request or after-hours inquiry.',
    heroSubtitle: 'AI responds to missed calls, captures after-hours appointment requests, sends automated reminders, and follows up with pet owners — automatically.',
    painStatement: 'Pet owners call when their animal is sick or needs an appointment. Missed calls and slow follow-up mean lost patients and lost revenue.',
    painCalculation: {
      avgVisitValue: 250,
      missedCallsPerMonth: 14,
      conversionRate: 0.35,
      monthlyRevenueLoss: function() {
        return this.avgVisitValue * this.missedCallsPerMonth * this.conversionRate;
      },
    },
    problemTitle: 'Veterinary Practices Lose Patients to Missed Calls and Slow Follow-Up',
    problems: [
      {
        title: 'After-hours calls go unanswered',
        description: 'Pet owners calling after hours about sick or injured animals often move on to the next clinic if nobody responds.',
      },
      {
        title: 'Missed calls mean missed appointments',
        description: 'Every missed call is a potential appointment that never gets booked. No text-back means no second chance.',
      },
      {
        title: 'Reminders and follow-up are manual',
        description: 'Your front desk can\'t call every patient for reminders and follow-ups. No-shows and drop-off hurt revenue.',
      },
    ],
    solutionTitle: 'Automate Missed Call Recovery, Reminders, and Lead Follow-Up',
    features: [
      {
        icon: 'Phone',
        title: 'Missed Call Text-Back',
        description: 'When a pet owner calls and nobody answers, an automatic SMS goes out within 60 seconds to capture the inquiry.',
      },
      {
        icon: 'Calendar',
        title: 'Appointment Reminders',
        description: 'Automated SMS and email reminders reduce no-shows and keep your schedule full.',
      },
      {
        icon: 'MessageSquare',
        title: 'Lead Follow-Up',
        description: 'New appointment inquiries get instant response and nurturing follow-up until booked.',
      },
    ],
    howItWorks: [
      {
        number: '1',
        title: 'Pet owner reaches out',
        description: 'A call, form, or message comes in for an appointment, after-hours inquiry, or follow-up.',
      },
      {
        number: '2',
        title: 'AI responds instantly',
        description: 'Missed calls get text-back, inquiries get instant response, and reminders go out automatically.',
      },
      {
        number: '3',
        title: 'Appointment booked',
        description: 'Pet owners book or get follow-up. Your team sees only qualified, ready-to-book patients.',
      },
    ],
    systemMapping: {
      starter: {
        label: 'Veterinary Starter',
        price: '$497/month',
        features: [
          'Missed Call Text-Back',
          'Appointment Inquiry Capture',
        ],
      },
      growth: {
        label: 'Veterinary Growth',
        price: '$997/month',
        features: [
          'SMS + Email Follow-Up',
          'Appointment Reminders',
          'After-Hours Inquiry Capture',
          'Booking Link Handoff',
        ],
      },
      pro: {
        label: 'Veterinary Pro',
        price: 'Custom',
        features: [
          'All Growth features',
          'Voice AI Receptionist',
          'Patient Reactivation Campaigns',
          'Custom Treatment Workflows',
        ],
      },
    },
    testimonialPlaceholder: 'Veterinary clinic case study',
    cta: 'Compare Packages',
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
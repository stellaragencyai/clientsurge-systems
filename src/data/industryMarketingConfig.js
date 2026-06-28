/**
 * INDUSTRY MARKETING CONFIGURATION
 * Drives all 9 industry-specific landing pages with tailored messaging, pain points, and ROI metrics.
 * Read-only configuration — integrates with saasProductizationConfig.js for feature mapping.
 */

export const INDUSTRY_MARKETING_DATA = {
  'med-spa': {
    slug: 'med-spa',
    industry_name: 'Medical Spa',
    display_name: 'Medical Spa Automation System',
    hero_headline: 'Turn More Consultations Into Booked Appointments',
    hero_subheadline: 'AI automation for med spas that capture every lead and book while competitors sleep.',
    hero_description:
      'Medical spas lose $15K-30K monthly to missed leads, no-shows, and late follow-ups. Our AI system texts missed callers within 60 seconds, books appointments 24/7, and recovers lost revenue automatically.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Missed Lead Window', desc: 'Leads disappear without instant response.' },
      { title: 'Manual Booking Friction', desc: 'Clients bounce when they can\'t book online instantly.' },
      { title: 'No-Show Waste', desc: 'Unconfirmed appointments cost $100–500 per slot.' },
      { title: 'Staff Overload', desc: 'Phone lines clogged; front desk drowning in callbacks.' },
    ],

    use_cases: [
      {
        title: 'Instant Lead Response',
        description: 'Texts missed callers: "Hi [Name]! We got your call. Book your consultation here → [link]"',
        icon: 'MessageSquare',
        metrics: '89% open rate | 34% booking rate',
      },
      {
        title: 'AI Booking Agent',
        description: 'Handles availability check, service selection, and calendar integration 24/7.',
        icon: 'Calendar',
        metrics: '67% of leads self-book | no staff overhead',
      },
      {
        title: 'Missed Call Recovery',
        description: 'Detects missed calls, sends SMS + email follow-up within 2 minutes.',
        icon: 'Phone',
        metrics: 'Recovers 22% of missed calls | $5K–10K MRR per location',
      },
      {
        title: 'Appointment Confirmations',
        description: 'Automated SMS confirmations 24h before reduce no-shows by 67%.',
        icon: 'CheckCircle',
        metrics: '67% fewer no-shows | $2K–4K monthly savings',
      },
    ],

    roi_metrics: {
      avg_lead_cost: '$12–18',
      avg_service_value: '$250–800',
      conversion_improvement: '+45% with automation',
      time_to_payoff: '3–4 weeks',
    },

    testimonials: [
      {
        name: 'Dr. Sarah Chen',
        business: 'Glow Med Spa, Phoenix',
        quote: 'We went from missing 40% of calls to capturing every single one. That\'s $18K extra revenue per month.',
        metric: '+$18K MRR',
      },
      {
        name: 'Maria Rodriguez',
        business: 'Radiance Aesthetics, Miami',
        quote: 'The AI booking agent is insane. Clients book themselves, we show up, they pay. Zero friction.',
        metric: '62% self-booking rate',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Instant SMS & Email Response',
      'AI Booking Agent (24/7)',
      'Missed Call Recovery',
      'Appointment Reminders',
      '14-Day Nurture Sequence',
      'Advanced Analytics',
    ],
  },

  dental: {
    slug: 'dental',
    industry_name: 'Dental Practice',
    display_name: 'Dental Practice Automation System',
    hero_headline: 'Stop Losing Teeth To Missed Calls And Slow Follow-Ups',
    hero_subheadline: 'Dental AI automation that responds to every lead instantly, books while you\'re in surgery.',
    hero_description:
      'Dental practices average 8–12 missed calls per day = $400–600 lost per day. Our AI responds within 60 seconds, books emergency slots, and reduces no-shows by 67%.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Ringing Phones', desc: 'Missed calls during procedures mean lost new patient revenue.' },
      { title: 'Booking Chaos', desc: 'Manual scheduling creates double-books and admin burden.' },
      { title: 'Emergency Abandonment', desc: 'Patients call competitors when they can\'t reach you fast.' },
      { title: 'No-Show Slots', desc: 'Unconfirmed emergencies waste high-value appointment slots.' },
    ],

    use_cases: [
      {
        title: 'Emergency Intake Automation',
        description: 'AI qualifies urgency, offers same-day slots, books or queues for callback.',
        icon: 'AlertCircle',
        metrics: '91% conversion | faster than staff',
      },
      {
        title: 'New Patient Response',
        description: 'Instant SMS: "Welcome! Complete your intake form here → [link]"',
        icon: 'Users',
        metrics: '78% form completion | pre-filled charts',
      },
      {
        title: 'Recall Reactivation',
        description: 'Automated SMS sequence wins back inactive patients every 6 months.',
        icon: 'RotateCw',
        metrics: '$8K–15K recovered patients MRR',
      },
      {
        title: 'Post-Procedure Follow-Up',
        description: 'Automated check-in SMS → reviews → referral request within 48h post-op.',
        icon: 'Smile',
        metrics: '44% review rate | 31% referral conversions',
      },
    ],

    roi_metrics: {
      avg_new_patient_value: '$600–1200',
      emergency_slot_value: '$200–400',
      no_show_cost: '$120–300 per slot',
      time_to_payoff: '2–3 weeks',
    },

    testimonials: [
      {
        name: 'Dr. Michael Torres',
        business: 'Smile Dental Group, Austin',
        quote: 'Never miss an emergency call again. We\'re capturing 95% of new patient inquiries now.',
        metric: '+$24K MRR (new patients)',
      },
      {
        name: 'Jennifer Lee',
        business: 'Dental Care Plus, LA',
        quote: 'No-shows dropped from 12% to 4%. That alone pays for the system 10x over.',
        metric: '-67% no-shows',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Instant Call Response',
      'Emergency Intake Automation',
      'New Patient Onboarding',
      'Smart Scheduling Integration',
      'Recall Automation',
      'Review Generation',
    ],
  },

  hvac: {
    slug: 'hvac',
    industry_name: 'HVAC',
    display_name: 'HVAC Service Automation System',
    hero_headline: 'Book More Service Calls Before Your Truck Rolls Out',
    hero_subheadline: 'HVAC teams miss 30% of calls during peak season. Capture them all with AI dispatch.',
    hero_description:
      'HVAC contractors lose $5K–15K monthly to missed calls, slow dispatch, and poor follow-up during peak season. Our AI books emergency service calls instantly, qualifies leads, and prioritizes high-ticket jobs.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Peak Season Chaos', desc: 'Phones ringing; leads calling competitors while you\'re on calls.' },
      { title: 'Manual Dispatch', desc: 'Slow scheduling wastes high-value service windows.' },
      { title: 'Missed Emergency Revenue', desc: 'After-hours emergency calls = competitor\'s revenue.' },
      { title: 'No Seasonal Scaling', desc: 'Staff can\'t handle 3x call volume in summer/winter.' },
    ],

    use_cases: [
      {
        title: 'Emergency Dispatch Automation',
        description: 'AI qualifies emergency calls, offers next-available slot, estimates $X service fee.',
        icon: 'Zap',
        metrics: '94% emergency booking rate | no staff',
      },
      {
        title: 'Maintenance Plan Enrollment',
        description: 'SMS after every service: "Lock in seasonal maintenance? Save $200/year → [link]"',
        icon: 'Shield',
        metrics: '$8K–20K recurring MRR',
      },
      {
        title: 'Lead Reactivation',
        description: 'Seasonal campaigns: "Winter coming—AC tuneup? $59 special → [book]"',
        icon: 'Thermometer',
        metrics: '$5K–12K per campaign',
      },
      {
        title: 'Job Site Confirmations',
        description: 'Automated confirmations + arrival alerts reduce no-shows and wasted trips.',
        icon: 'MapPin',
        metrics: '−35% no-shows | $500 saved per route',
      },
    ],

    roi_metrics: {
      avg_service_call: '$200–600',
      emergency_premium: '+$100–300 per call',
      time_to_payoff: '1–2 weeks',
      seasonal_peak_value: '+$50K peak season',
    },

    testimonials: [
      {
        name: 'Tony Rizzo',
        business: 'Rizzo HVAC, Chicago',
        quote: 'Summer we got slammed. This system handled 40% more calls without hiring. $25K extra revenue.',
        metric: '+$25K summer',
      },
      {
        name: 'Robert Chen',
        business: 'Cool Air Services, Denver',
        quote: 'Emergency dispatch automation alone books 5–7 jobs/day we\'d have missed. Insane ROI.',
        metric: '+$4.2K daily (seasonal)',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Emergency Dispatch Automation',
      'Smart Scheduling + Routing',
      'Maintenance Plan Upsells',
      'Seasonal Campaign Automation',
      'Job Confirmations & Alerts',
      'Revenue Analytics',
    ],
  },

  roofing: {
    slug: 'roofing',
    industry_name: 'Roofing',
    display_name: 'Roofing Company Automation System',
    hero_headline: 'Stop Losing Storm Damage Calls To Faster Competitors',
    hero_subheadline: 'Every storm creates a 72-hour window. Our AI locks it down while competitors are still hiring.',
    hero_description:
      'Roofing contractors miss 45% of incoming calls during storm season. Our AI responds within 30 seconds, books inspections, qualifies leads by insurance type, and prioritizes high-margin jobs.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Storm Season Rush', desc: '10x call volume in 72 hours. Phones are useless.' },
      { title: 'Lead Quality Waste', desc: 'Manual booking misses high-ticket insurance jobs.' },
      { title: 'Inspection Cancellations', desc: 'No-confirmation = 30% show-up failure rate.' },
      { title: 'Competitor Speed', desc: 'Faster response wins. Automated beats manual every time.' },
    ],

    use_cases: [
      {
        title: 'Storm Lead Capture',
        description: 'AI responds to every call in <30s: qualifies damage type, insurance, books inspection.',
        icon: 'Cloud',
        metrics: '96% conversion | handles 20+ calls/min',
      },
      {
        title: 'Insurance Claim Navigation',
        description: 'SMS guides homeowner through claim process, flags high-ticket jobs for priority.',
        icon: 'FileText',
        metrics: 'Prioritizes $50K+ jobs | +71% close rate',
      },
      {
        title: 'Crew Dispatch & Tracking',
        description: 'Automated routing to nearest available crew; real-time GPS + confirmation.',
        icon: 'TrendingUp',
        metrics: '+22% utilization | no scheduling errors',
      },
      {
        title: 'Post-Inspection Follow-Up',
        description: 'Automated quote delivery + payment options within 4h of inspection.',
        icon: 'FileCheck',
        metrics: '58% quote acceptance | 3.2x faster close',
      },
    ],

    roi_metrics: {
      avg_roofing_job: '$8K–25K',
      insurance_job_premium: '+$5K–15K margin',
      response_time_edge: '−45% when responding in <1 minute',
      time_to_payoff: '1 job = system paid for 3 months',
    },

    testimonials: [
      {
        name: 'Jason Miller',
        business: 'Miller Roofing, Texas',
        quote: 'Last hailstorm, got 127 calls in 18 hours. Booked 98 inspections. Competitors got maybe 40 each.',
        metric: '+$850K storm revenue',
      },
      {
        name: 'David Kim',
        business: 'Peak Roof Solutions, Florida',
        quote: 'Hurricane season is our money. AI handles volume we couldn\'t hire for. +$120K in 3 months.',
        metric: '+$120K per storm',
      },
    ],

    recommended_plan: 'elite_system',
    key_features: [
      'Storm Lead Capture (instant response)',
      'Insurance Claim Automation',
      'Smart Lead Qualification',
      'Crew Dispatch Integration',
      'Inspection Scheduling',
      'Quote Automation + Follow-Up',
    ],
  },

  contractors: {
    slug: 'contractors',
    industry_name: 'General Contractors',
    display_name: 'Contractor Automation System',
    hero_headline: 'Book More Jobs Before Your Quote Expires',
    hero_subheadline: 'General contractors waste 40% of quotes to slow follow-up. AI follows up instantly, every time.',
    hero_description:
      'GC firms leave $20K–50K on the table monthly when quotes go unanswered. Our AI follows up within 4 hours, books walk-throughs, sends reminder sequences, and recovers lost deals.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Dead Quotes', desc: '40% of quotes never close because follow-up stalls.' },
      { title: 'Lost Bid Competition', desc: 'Slow response means homeowner picks faster contractor.' },
      { title: 'Manual Estimate Workflow', desc: 'Days to send quote; more days to follow up.' },
      { title: 'Walk-Through No-Shows', desc: 'Unconfirmed walkthroughs = wasted crew time.' },
    ],

    use_cases: [
      {
        title: 'Lead Qualification Automation',
        description: 'AI qualifies scope, timeline, budget, then offers walk-through or estimate.',
        icon: 'ClipboardList',
        metrics: '71% qualify as viable leads | save unqualified time',
      },
      {
        title: 'Quote Follow-Up Sequence',
        description: 'Automated SMS + email on Day 1, 3, 7: "Ready to build? Questions? Call here →"',
        icon: 'Send',
        metrics: '+28% quote conversion | no staff time',
      },
      {
        title: 'Walk-Through Confirmations',
        description: 'Confirms appointment 48h in advance; reduces no-shows to <5%.',
        icon: 'Calendar',
        metrics: '−70% no-shows | saves crew overhead',
      },
      {
        title: 'Project Milestone Updates',
        description: 'Keeps homeowner updated during build: day-by-day photo + SMS updates.',
        icon: 'MessageSquare',
        metrics: '+34% 5-star reviews | referral boost',
      },
    ],

    roi_metrics: {
      avg_project_value: '$5K–50K',
      quote_recovery_rate: '+28% from automation',
      walk_through_no_show_cost: '$300–1000 per crew',
      time_to_payoff: '1–2 closed projects',
    },

    testimonials: [
      {
        name: 'Frank DeMarco',
        business: 'DeMarco Contracting, NJ',
        quote: 'Quote-to-close used to be 3 weeks. Now it\'s 6 days. AI follow-up is the difference. +$18K monthly.',
        metric: '+$18K MRR',
      },
      {
        name: 'Jessica Wong',
        business: 'BuildRight Solutions, CA',
        quote: 'We stopped losing deals to faster competitors. The system keeps the conversation going.',
        metric: '+31% close rate',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Lead Qualification Automation',
      'Quote Follow-Up Sequences',
      'Walk-Through Scheduling',
      'Project Communication Automation',
      'Photo + Update Reminders',
      'Review Generation Post-Project',
    ],
  },

  plumbing: {
    slug: 'plumbing',
    industry_name: 'Plumbing',
    display_name: 'Plumbing Business Automation System',
    hero_headline: 'Answer Every Leak Call Before It Floods Your Competition\'s Calendar',
    hero_subheadline: 'Plumbers that answer in <2 minutes book 60% more jobs. AI answers in <30 seconds.',
    hero_description:
      'Plumbing emergencies don\'t wait. Your AI must answer faster than your phone can ring. Our system responds to every call instantly, qualifies urgency, books same-day slots, and dispatches crews automatically.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Missed Emergency Calls', desc: 'Busiest hours = highest miss rate. Lost $200–500 per call.' },
      { title: 'Slow Dispatch', desc: 'Manual scheduling delays crew deployment; customer calls competitor.' },
      { title: 'Seasonal Volume Spikes', desc: 'Winter/spring overwhelm; can\'t hire/fire staff responsively.' },
      { title: 'Service Confirmation Waste', desc: '25% of booked calls don\'t show without confirmation.' },
    ],

    use_cases: [
      {
        title: 'Emergency Call Response',
        description: 'AI picks up every call: "Leak? We\'ll be there in [X] hours. Payment is [Y]. Confirm?"',
        icon: 'Phone',
        metrics: '98% answer rate | books in <90 seconds',
      },
      {
        title: 'Smart Dispatch to Nearest Crew',
        description: 'AI routes to closest available plumber; GPS + SMS confirmation to customer.',
        icon: 'MapPin',
        metrics: '+33% first-call close | crew utilization up',
      },
      {
        title: 'Maintenance Plan Upsells',
        description: 'After every service: "Avoid future emergencies? Maintenance plan → [link] saves $X"',
        icon: 'Zap',
        metrics: '$6K–18K recurring MRR',
      },
      {
        title: 'Service Confirmation & Reminders',
        description: '48h before appointment: "Ready for your plumber? [Confirm] or [Reschedule]"',
        icon: 'CheckSquare',
        metrics: '−25% no-shows | $150 saved per cancellation avoided',
      },
    ],

    roi_metrics: {
      avg_emergency_call: '$150–400',
      preventive_service_value: '$80–200',
      no_show_cost: '$120–300 per crew hour',
      time_to_payoff: '3–5 days (emergency calls)',
    },

    testimonials: [
      {
        name: 'Mike Sullivan',
        business: 'Sullivan Plumbing, Boston',
        quote: '3 AM burst pipe call — AI booked it, we were there 47 minutes later. Customer for life. $35K referral downstream.',
        metric: 'Emergency response edge',
      },
      {
        name: 'Carlos Fernandez',
        business: 'Expert Plumbing, Phoenix',
        quote: 'Never miss an emergency again. This thing answers calls while we\'re driving. +$12K monthly.',
        metric: '+$12K MRR',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Emergency Call Response (<30s)',
      'Smart Crew Dispatch',
      'Maintenance Plan Upsells',
      'Service Confirmations',
      'Preventive Scheduling',
      'Revenue Optimization Analytics',
    ],
  },

  chiropractic: {
    slug: 'chiropractic',
    industry_name: 'Chiropractic',
    display_name: 'Chiropractic Practice Automation System',
    hero_headline: 'Stop Losing New Patients To Chiropractors Who Answer Faster',
    hero_subheadline: 'Chiropractic practices that respond in <5 minutes convert 70% of leads. AI responds in 60 seconds.',
    hero_description:
      'Chiropractic clinics lose 35% of new patient calls to competitors with faster response times. Our AI qualifies pain type, offers same-day appointments, and books while you\'re with patients.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'New Patient Leakage', desc: 'Slow response = competitor gets the call and patient forever.' },
      { title: 'Scheduling Overload', desc: 'Front desk drowning in calls and bookings; care suffers.' },
      { title: 'No-Show Culture', desc: '20%+ no-show rate without automated confirmations.' },
      { title: 'Retention Crisis', desc: 'Patient goes passive; AI could re-engage them.' },
    ],

    use_cases: [
      {
        title: 'Instant New Patient Response',
        description: 'AI qualifies complaint, offers same-day or next-available slot with intake prep.',
        icon: 'MessageSquare',
        metrics: '84% new patient conversion | from AI lead',
      },
      {
        title: 'AI Appointment Booking',
        description: 'Handles availability, sends pre-appointment intake form, route directions.',
        icon: 'Calendar',
        metrics: '67% self-booking rate | no staff friction',
      },
      {
        title: 'Appointment Confirmations',
        description: '24h automated SMS reminder + form prep; eliminates no-shows and wait times.',
        icon: 'CheckCircle',
        metrics: '−72% no-shows | +$8K MRR (recovered appointments)',
      },
      {
        title: 'Patient Re-Engagement',
        description: 'Automated SMS every 3 months: "Time for your adjustment? Book here →"',
        icon: 'RotateCw',
        metrics: '+44% retention | $2K–4K MRR recovered',
      },
    ],

    roi_metrics: {
      avg_new_patient_value: '$300–800 (series)',
      retention_boost_value: '$150–300 per reactivated patient',
      no_show_recovery: '$150–250 per appointment saved',
      time_to_payoff: '10–14 new patients',
    },

    testimonials: [
      {
        name: 'Dr. Amanda Rodriguez',
        business: 'Rodriguez Chiropractic, Denver',
        quote: 'New patient response time dropped from 2 hours to 60 seconds. Booking rate jumped. +$16K MRR.',
        metric: '+$16K MRR',
      },
      {
        name: 'Dr. James Park',
        business: 'Peak Performance Chiropractic, LA',
        quote: 'AI booking handles 60% of new patient calls. Front desk now focuses on care. No-shows cut in half.',
        metric: '−72% no-shows',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Instant New Patient Response',
      'AI Appointment Booking',
      'Intake Form Automation',
      'Appointment Confirmations',
      'Patient Re-Engagement Sequences',
      'Retention Analytics',
    ],
  },

  'real-estate': {
    slug: 'real-estate',
    industry_name: 'Real Estate',
    display_name: 'Real Estate Agent Automation System',
    hero_headline: 'Never Miss A Buyer Lead Again. Ever.',
    hero_subheadline: 'Real estate agents who respond in <5 minutes win 60% of leads. Our AI responds in <60 seconds.',
    hero_description:
      'Real estate is a speed game. First agent to qualify the buyer wins the deal. Our AI answers calls instantly, qualifies urgency, books showings, and follows up automatically—while you\'re closing deals.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Buyer Lead Leakage', desc: 'Missed calls = another agent got the buyer.' },
      { title: 'Slow Showing Scheduling', desc: 'Manual booking delays showings; buyer goes cold.' },
      { title: 'Follow-Up Abandonment', desc: '70% of interested buyers gone because no follow-up.' },
      { title: 'Time Waste on Unqualified Leads', desc: 'Hours wasted with lowball browsers.' },
    ],

    use_cases: [
      {
        title: 'Buyer Lead Qualification',
        description: 'AI qualifies timeline, budget, location preferences, then offers suitable properties.',
        icon: 'Search',
        metrics: '73% qualified | no time wasted on browsers',
      },
      {
        title: 'Showing Automation',
        description: 'AI books property showing, sends directions, lockbox code; follows up same-day.',
        icon: 'MapPin',
        metrics: '+45% showing-to-offer conversion',
      },
      {
        title: 'Follow-Up Sequences',
        description: 'Automated SMS: "How did you like [property]? Questions? Call or view [next options]"',
        icon: 'Send',
        metrics: '+31% conversion from sequence',
      },
      {
        title: 'Seller Lead Nurture',
        description: 'Captures seller leads, offers valuation, schedules listing consultation.',
        icon: 'Home',
        metrics: 'Listing lead pipelines stay full',
      },
    ],

    roi_metrics: {
      avg_commission: '$5K–15K per deal',
      lead_response_edge: '+60% from sub-5-minute response',
      time_to_payoff: '1 deal = system paid for year',
      annual_agent_benefit: '+$80K–150K per agent',
    },

    testimonials: [
      {
        name: 'Jennifer Martinez',
        business: 'Martinez Real Estate, Austin',
        quote: 'Used to miss 30% of buyer calls. Now I catch them all, AI pre-qualifies. Doubled my closings in 6 months.',
        metric: '+$187K annual commission',
      },
      {
        name: 'Robert Thompson',
        business: 'Thompson Realty Group, Florida',
        quote: 'AI handles qualification and follow-up. I show properties. Couldn\'t run without it now.',
        metric: '+$240K team revenue',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Buyer Lead Qualification',
      'Showing Automation + Scheduling',
      'Property Recommendation Engine',
      'Follow-Up Sequences',
      'Seller Lead Capture',
      'Deal Pipeline Analytics',
    ],
  },

  'property-services': {
    slug: 'property-services',
    industry_name: 'Property Services',
    display_name: 'Property Services Automation System',
    hero_headline: 'Capture Every Property Inquiry Before Competitors Do',
    hero_subheadline: 'Property service businesses that respond in under 5 minutes win 70% of leads. Our AI responds in 60 seconds.',
    hero_description:
      'Property management, rental, and maintenance teams lose leads to slow response every day. Our AI captures every inquiry instantly, follows up automatically, schedules site visits, recovers missed calls, and reactivates old inquiries—so no opportunity slips through.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Inquiry Leakage', desc: 'Missed calls and slow email replies send prospects to the next property manager.' },
      { title: 'Manual Follow-Up Gaps', desc: 'Inquiries sit unanswered for hours or days while your team juggles tasks.' },
      { title: 'Scheduling Friction', desc: 'Back-and-forth to book site visits and tours slows down the pipeline.' },
      { title: 'Stale Lead Graveyard', desc: 'Past inquiries and old prospects are forgotten with no reactivation path.' },
    ],

    use_cases: [
      {
        title: 'Instant Lead Capture',
        description: 'AI responds to every call, form, or message within 60 seconds and captures the prospect\'s details.',
        icon: 'MessageSquare',
        metrics: '91% response rate | leads captured before competitors reply',
      },
      {
        title: 'Inquiry Follow-Up',
        description: 'Automated SMS + email sequences nurture every inquiry with answers, next steps, and availability.',
        icon: 'Send',
        metrics: '+34% inquiry-to-tour rate | no manual chasing',
      },
      {
        title: 'Scheduling Automation',
        description: 'Prospects self-book site visits and property tours directly into your calendar with reminders.',
        icon: 'Calendar',
        metrics: '62% self-booking | −70% scheduling back-and-forth',
      },
      {
        title: 'Missed Call Recovery',
        description: 'Missed calls trigger an instant text-back with booking options so no caller is lost.',
        icon: 'Phone',
        metrics: 'Recovers 22% of missed calls | $3K–8K MRR recovered',
      },
      {
        title: 'Old Lead Reactivation',
        description: 'Automated campaigns re-engage past inquiries and dormant prospects to bring them back into the pipeline.',
        icon: 'RotateCw',
        metrics: '+18% reactivation rate | $5K–15K recovered per campaign',
      },
    ],

    roi_metrics: {
      avg_inquiry_value: '$500–3,000',
      missed_call_recovery: '$3K–8K MRR',
      reactivation_revenue: '$5K–15K per campaign',
      time_to_payoff: '2–3 weeks',
    },

    testimonials: [
      {
        name: 'Daniel Foster',
        business: 'Foster Property Management, Dallas',
        quote: 'We were losing inquiries left and right. Now every call gets a text back instantly. Bookings are up 40%.',
        metric: '+40% site visits',
      },
      {
        name: 'Lisa Chang',
        business: 'Summit Rentals, Seattle',
        quote: 'Old inquiries we forgot about are coming back. The reactivation campaigns alone added $12K last quarter.',
        metric: '+$12K reactivation',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Instant Lead Capture (SMS + Email)',
      'Automated Inquiry Follow-Up Sequences',
      'Site Visit & Tour Scheduling',
      'Missed Call Text-Back Recovery',
      'Old Lead Reactivation Campaigns',
      'Pipeline Analytics Dashboard',
    ],
  },

  'personal-injury': {
    slug: 'personal-injury',
    industry_name: 'Personal Injury Law',
    display_name: 'Personal Injury Law Firm Automation System',
    hero_headline: 'Every PI Lead Needs Immediate Response. Your AI Handles It.',
    hero_subheadline: 'PI firms that call back in <2 hours sign 40% more cases. Our AI answers immediately.',
    hero_description:
      'Personal injury leads have a short shelf life. Every minute of delay = another lawyer talking to your client. Our AI answers instantly, qualifies case type, schedules consults, and follows up relentlessly.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Lead Abandonment Window', desc: 'PI leads shop multiple firms. First solid response wins.' },
      { title: 'Consultation No-Shows', desc: '30% of booked consultations don\'t show up.' },
      { title: 'Case Qualification Waste', desc: 'Time spent on low-value or non-viable cases.' },
      { title: 'Manual Follow-Up Gaps', desc: 'Interested prospects get lost in case overload.' },
    ],

    use_cases: [
      {
        title: 'Immediate Lead Response',
        description: 'AI picks up instantly: "Tell me about your accident. We\'ll evaluate your case."',
        icon: 'Phone',
        metrics: '92% immediate engagement',
      },
      {
        title: 'Case Type Routing',
        description: 'AI qualifies injury type, liability, damages; routes to appropriate attorney.',
        icon: 'FileText',
        metrics: 'Eliminates unqualified consultations | attorney time saved',
      },
      {
        title: 'Consultation Confirmation',
        description: '24h reminder SMS with location, parking, documents to bring.',
        icon: 'CheckSquare',
        metrics: '−30% no-shows | +$4K MRR (consultations held)',
      },
      {
        title: 'Win-Back Sequences',
        description: 'Automatic follow-up to interested leads who don\'t sign initially.',
        icon: 'TrendingUp',
        metrics: '+18% case sign rate from follow-up',
      },
    ],

    roi_metrics: {
      avg_case_value: '$15K–150K+',
      consultation_no_show_cost: '$500–2000 (lost opportunity)',
      response_time_edge: '+40% case sign from <5min response',
      time_to_payoff: '1 medium case = system paid for 18 months',
    },

    testimonials: [
      {
        name: 'Attorney David Kwon',
        business: 'Kwon Law Group, New York',
        quote: 'PI leads are spicy. Every second matters. AI answers before we finish the last call. Case volume up 35%.',
        metric: '+$340K annual revenue',
      },
      {
        name: 'Jessica Chen',
        business: 'Chen & Associates, Los Angeles',
        quote: 'Consultations are now pre-qualified, confirmed. No-shows gone. Firm is way more efficient.',
        metric: '+$180K annual',
      },
    ],

    recommended_plan: 'pro_system',
    key_features: [
      'Immediate Lead Response',
      'Case Type Qualification',
      'Attorney Routing',
      'Consultation Scheduling + Reminders',
      'Follow-Up Sequences',
      'Case Pipeline Analytics',
    ],
  },

  'veterinary': {
    slug: 'veterinary',
    industry_name: 'Veterinary & Vet Care',
    display_name: 'Veterinary & Vet Care Automation System',
    hero_headline: 'Recover Missed Calls and Help Pet Owners Get Fast Responses',
    hero_subheadline: 'AI automation for veterinary practices that captures every inquiry and books appointments automatically.',
    hero_description:
      'Veterinary practices lose clients to missed calls and slow follow-up. Our AI system texts missed callers within 60 seconds, books appointments 24/7, sends automated reminders, and keeps pet owners engaged.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Missed Calls', desc: 'Pet owners call the next vet when you do not answer.' },
      { title: 'After-Hours Inquiries', desc: 'Questions go unanswered when the clinic is closed.' },
      { title: 'No-Show Appointments', desc: 'Unconfirmed slots cost revenue and waste staff time.' },
      { title: 'Manual Reminders', desc: 'Staff spends hours calling to confirm appointments.' },
    ],

    use_cases: [
      {
        title: 'Missed Call Text-Back',
        description: 'Texts missed callers: "Hi! We got your call. Book your pet\'s appointment here → [link]"',
        icon: 'Phone',
      },
      {
        title: 'Appointment Reminders',
        description: 'Sends automated SMS and email reminders to reduce no-shows.',
        icon: 'Calendar',
      },
      {
        title: 'After-Hours Capture',
        description: 'Captures inquiries when the clinic is closed and follows up the next morning.',
        icon: 'MessageSquare',
      },
      {
        title: 'Lead Follow-Up',
        description: 'Keeps new inquiries warm with timed follow-up messages until booked.',
        icon: 'Zap',
      },
    ],

    roi_metrics: {
      monthly_revenue_at_risk: '$8K-20K',
      missed_calls_weekly: '25-40',
      response_time_before: '2-4 hours',
      response_time_after: 'Under 60 seconds',
    },

    testimonials: [
      {
        name: 'Dr. Sarah Mitchell',
        business: 'Pawsome Veterinary Clinic, Denver',
        quote: 'We stopped losing new clients to missed calls. Appointments are up, no-shows are down, and the front desk can breathe.',
        metric: '+34% booked appointments',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Missed Call Text-Back',
      'Appointment Reminders',
      'After-Hours Inquiry Capture',
      'Lead Follow-Up Sequences',
      'Automated Booking',
      'Review Requests',
    ],
  },

  'automotive': {
    slug: 'automotive',
    industry_name: 'Automotive Services',
    display_name: 'Automotive Services Automation System',
    hero_headline: 'Keep Your Bays Full with Faster Quote Follow-Up and Booking',
    hero_subheadline: 'AI automation for auto repair shops, dealerships, and mobile detailers that captures every lead.',
    hero_description:
      'Auto service businesses lose revenue to missed calls, slow quote follow-up, and no-shows. Our AI system texts missed callers instantly, follows up on quote requests, and books service appointments automatically.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Missed Calls', desc: 'Every missed call is a customer going to the shop down the street.' },
      { title: 'Slow Quote Follow-Up', desc: 'Quote requests sit in the inbox while competitors respond first.' },
      { title: 'No-Show Appointments', desc: 'Empty bays cost money and disrupt the schedule.' },
      { title: 'Seasonal Spikes', desc: 'Busy seasons overwhelm the front desk and leads slip through.' },
    ],

    use_cases: [
      {
        title: 'Missed Call Text-Back',
        description: 'Texts missed callers: "Hi! We got your call. Book your service appointment here → [link]"',
        icon: 'Phone',
      },
      {
        title: 'Quote Follow-Up',
        description: 'Automatically follows up on quote requests until the customer books or declines.',
        icon: 'Zap',
      },
      {
        title: 'Appointment Booking',
        description: 'Lets customers book service appointments online without phone tag.',
        icon: 'Calendar',
      },
      {
        title: 'Review Requests',
        description: 'Automatically requests reviews after completed service to build reputation.',
        icon: 'Smile',
      },
    ],

    roi_metrics: {
      monthly_revenue_at_risk: '$5K-15K',
      missed_calls_weekly: '20-35',
      response_time_before: '1-3 hours',
      response_time_after: 'Under 60 seconds',
    },

    testimonials: [
      {
        name: 'Mike Reynolds',
        business: 'Reynolds Auto Repair, Phoenix',
        quote: 'Missed calls used to mean lost customers. Now they get an instant text and most book right away. Bays are fuller.',
        metric: '+28% service bookings',
      },
    ],

    recommended_plan: 'growth_system',
    key_features: [
      'Missed Call Text-Back',
      'Quote Follow-Up Automation',
      'Online Appointment Booking',
      'Service Reminders',
      'Review Request Automation',
      'Lead Reactivation',
    ],
  },

  'landscaping': {
    slug: 'landscaping',
    industry_name: 'Landscaping & Lawn Care',
    display_name: 'Landscaping & Lawn Care Automation System',
    hero_headline: 'Capture More Leads and Keep Your Schedule Full',
    hero_subheadline: 'AI automation for landscaping and lawn care businesses that turns inquiries into booked jobs.',
    hero_description:
      'Landscaping businesses lose revenue to missed calls, slow quote follow-up, and seasonal lead gaps. Our AI system texts missed callers instantly, follows up on estimate requests, and books consultations automatically.',
    primary_cta: 'Book Demo',
    secondary_cta: 'See Pricing',

    pain_points: [
      { title: 'Missed Calls', desc: 'Homeowners call the next landscaper when you do not answer.' },
      { title: 'Slow Estimate Follow-Up', desc: 'Estimate requests go cold while you are out on job sites.' },
      { title: 'Seasonal Gaps', desc: 'Off-season leads disappear without follow-up.' },
      { title: 'Manual Scheduling', desc: 'Phone tag wastes time and loses jobs.' },
    ],

    use_cases: [
      {
        title: 'Missed Call Text-Back',
        description: 'Texts missed callers: "Hi! We got your call. Book your free estimate here → [link]"',
        icon: 'Phone',
      },
      {
        title: 'Estimate Follow-Up',
        description: 'Automatically follows up on estimate requests until the customer books.',
        icon: 'Zap',
      },
      {
        title: 'Seasonal Lead Capture',
        description: 'Captures and nurtures leads during peak and off-seasons.',
        icon: 'Calendar',
      },
      {
        title: 'Review Requests',
        description: 'Automatically requests reviews after completed jobs.',
        icon: 'Smile',
      },
    ],

    roi_metrics: {
      monthly_revenue_at_risk: '$4K-12K',
      missed_calls_weekly: '15-30',
      response_time_before: '2-6 hours',
      response_time_after: 'Under 60 seconds',
    },

    testimonials: [
      {
        name: 'Tom Gallagher',
        business: 'Gallagher Landscaping, Scottsdale',
        quote: 'We used to lose leads because we were out on job sites. Now every call gets a text back and estimates are up.',
        metric: '+31% estimate requests',
      },
    ],

    recommended_plan: 'starter_system',
    key_features: [
      'Missed Call Text-Back',
      'Estimate Follow-Up',
      'Online Booking',
      'Seasonal Lead Nurturing',
      'Review Requests',
      'Lead Reactivation',
    ],
  },
};

/**
 * Helper function to get industry by slug
 */
export function getIndustryBySlug(slug) {
  return INDUSTRY_MARKETING_DATA[slug] || null;
}

/**
 * Get all industries
 */
export function getAllIndustries() {
  return Object.values(INDUSTRY_MARKETING_DATA);
}

/**
 * Get list of industry slugs for routing
 */
export function getIndustrySlugs() {
  return Object.keys(INDUSTRY_MARKETING_DATA);
}
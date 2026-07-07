/**
 * Industry Content Enrichment Data
 * Contains hero images, automation tiers (2/4/6 per plan), case studies,
 * and testimonials for each industry — merged into industryMarketingConfig at render time.
 */

// ── Shared automation definition template ──
// Each industry customizes the description text but the 6 automations are consistent.
const AUTOMATION_KEYS = {
  instant_response: 'Instant Lead Response',
  missed_call: 'Missed Call Text-Back',
  booking_agent: 'Smart Booking Agent',
  nurture_sequence: '14-Day Nurture Sequence',
  review_request: 'Review Request Engine',
  voice_ai: 'AI Voice Receptionist',
};

// ── Helper: build automation tiers from industry-specific descriptions ──
function buildTiers(descriptions) {
  const allAutomations = [
    { key: 'instant_response', name: AUTOMATION_KEYS.instant_response, description: descriptions.instant_response, icon: 'Zap' },
    { key: 'missed_call', name: AUTOMATION_KEYS.missed_call, description: descriptions.missed_call, icon: 'Phone' },
    { key: 'booking_agent', name: AUTOMATION_KEYS.booking_agent, description: descriptions.booking_agent, icon: 'Calendar' },
    { key: 'nurture_sequence', name: AUTOMATION_KEYS.nurture_sequence, description: descriptions.nurture_sequence, icon: 'Send' },
    { key: 'review_request', name: AUTOMATION_KEYS.review_request, description: descriptions.review_request, icon: 'Star' },
    { key: 'voice_ai', name: AUTOMATION_KEYS.voice_ai, description: descriptions.voice_ai, icon: 'MessageSquare' },
  ];

  return {
    starter: {
      count: 2,
      label: 'Starter System',
      price: '$497/mo',
      setup: '$797 setup',
      automations: [allAutomations[0], allAutomations[1]],
    },
    growth: {
      count: 4,
      label: 'Growth System',
      price: '$997/mo',
      setup: '$1,297 setup',
      automations: [allAutomations[0], allAutomations[1], allAutomations[2], allAutomations[3]],
    },
    pro: {
      count: 6,
      label: 'Pro System',
      price: '$1,997/mo',
      setup: '$2,497 setup',
      automations: allAutomations,
    },
  };
}

// ── Industry enrichment data ──
export const INDUSTRY_CONTENT = {
  'med-spa': {
    hero_image: 'https://media.base44.com/images/public/69dc4a79656fdba136d413d3/741357982_Gemini_Generated_Image_hdkpn1hdkpn1hdkp.png',
    automation_tiers: buildTiers({
      instant_response: 'When a treatment inquiry comes in from your website or Instagram, AI responds in under 60 seconds with available consultation slots and service details.',
      missed_call: 'Missed calls from Botox, filler, or laser inquiries get an instant text-back with a booking link so the prospect doesn\'t call the next med spa.',
      booking_agent: 'Interested prospects book consultations directly through your AI booking agent — synced to your calendar with treatment type pre-filled.',
      nurture_sequence: 'Leads who aren\'t ready to book yet receive a 14-day nurture sequence featuring before/after photos, treatment FAQs, and limited-time consultation offers.',
      review_request: 'After each completed treatment, the system automatically sends a personalized Google review request via SMS at the optimal moment.',
      voice_ai: 'A branded AI voice receptionist answers calls 24/7, books consultations, answers pricing questions, and routes urgent skincare concerns.',
    }),
    case_study: {
      title: 'How a Phoenix Med Spa Recovered 28 Stalled Consultations in 30 Days',
      metric: '$33,600',
      metricLabel: 'Recovered Revenue',
      challenge: 'A 6-chair med spa in Phoenix was losing 15+ treatment inquiries per week to slow response times. Their front desk was overwhelmed with Botox, filler, and laser consultation requests coming in through calls, website forms, and Instagram DMs — often after hours.',
      solution: 'ClientSurge installed the Growth System with instant lead response, missed call text-back, and a 14-day nurture sequence. Within 14 days, every inquiry was being responded to in under 90 seconds, and stalled leads were receiving structured follow-up.',
      results: [
        '28 stalled consultations recovered in the first 30 days',
        'Average response time dropped from 4.2 hours to 72 seconds',
        'No-show rate decreased by 35% with automated reminders',
        'Google reviews increased from 47 to 89 in 60 days',
      ],
    },
    testimonials: [
      { metric: '28 consultations recovered', quote: 'We were losing Botox and filler inquiries every single day. ClientSurge caught them all and booked them automatically. It paid for itself in the first week.', name: 'Dr. Jennifer Lee', business: 'Glow Aesthetics, Phoenix AZ' },
      { metric: '72-second response time', quote: 'Our front desk used to take hours to reply to Instagram DMs. Now every inquiry gets a response before they even finish scrolling.', name: 'Marcus Chen', business: 'Radiance Med Spa, Scottsdale AZ' },
    ],
  },

  dental: {
    hero_image: 'https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a new patient inquiry comes in from your website or Google Business profile, AI responds in under 60 seconds with available appointment times and insurance questions answered.',
      missed_call: 'Missed calls from new patients get an instant text-back with a booking link — so they don\'t call the dentist down the street.',
      booking_agent: 'New patients book their first appointment directly through AI — synced to your operatory schedule with reason for visit pre-filled.',
      nurture_sequence: 'Unbooked new patient leads receive a 14-day nurture sequence featuring patient testimonials, insurance guides, and first-visit preparation tips.',
      review_request: 'After each completed cleaning or procedure, the system sends a Google review request via SMS — timed for maximum response rate.',
      voice_ai: 'A dental-trained AI voice receptionist answers calls 24/7, books appointments, answers insurance questions, and routes emergencies to the on-call dentist.',
    }),
    case_study: {
      title: 'How a 3-Dentist Practice Filled 41 Empty Chair Slots in 6 Weeks',
      metric: '$20,500',
      metricLabel: 'Recovered Revenue',
      challenge: 'A 3-operatory dental practice in Tucson was losing new patient inquiries during lunch hours and after close. Their front desk was overwhelmed, and manual reminder calls weren\'t reducing no-shows.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call recovery, smart booking, and review requests. The AI handled after-hours inquiries, booked patients directly into the schedule, and sent automated SMS reminders.',
      results: [
        '41 empty chair slots filled in 6 weeks',
        'No-show rate dropped from 18% to 7%',
        'Google reviews grew from 62 to 134 in 90 days',
        'After-hours inquiry capture recovered 12 new patients',
      ],
    },
    testimonials: [
      { metric: '41 chairs filled', quote: 'We had empty slots every single day. ClientSurge filled them automatically — new patients were booking themselves while we were at lunch.', name: 'Dr. Robert Kim', business: 'Desert Smile Dental, Tucson AZ' },
      { metric: '7% no-show rate', quote: 'Our no-show rate was killing us. The automated reminders cut it from 18% to 7% in the first month. That alone paid for the system.', name: 'Sarah Martinez', business: 'Canyon Family Dental, Mesa AZ' },
    ],
  },

  hvac: {
    hero_image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits an emergency AC repair form, AI responds in under 60 seconds confirming service area, asking for issue details, and offering the next available appointment.',
      missed_call: 'Missed emergency calls get an instant branded text-back — "Hi, we received your call about AC service. Are you available for a technician visit today?" — before they call the next HVAC company.',
      booking_agent: 'Qualified homeowners book service windows directly through AI — synced to your dispatch calendar with issue type and address pre-filled.',
      nurture_sequence: 'Unbooked service inquiries and past tune-up customers receive a 14-day nurture sequence with seasonal maintenance tips, filter change reminders, and tune-up offers.',
      review_request: 'After each completed service call, the system sends a Google review request via SMS — timed right after the homeowner experiences relief from the fix.',
      voice_ai: 'A 24/7 AI voice receptionist answers emergency calls, captures issue type and urgency, and routes true emergencies to the on-call technician.',
    }),
    case_study: {
      title: 'How an HVAC Company Captured 47 Emergency Calls They Were Missing After Hours',
      metric: '$164,500',
      metricLabel: 'Recovered Revenue',
      challenge: 'A 12-truck HVAC company in Phoenix was missing 30+ emergency calls per month after hours and during peak summer surges. Each missed call was a $3,500+ emergency repair going to a competitor.',
      solution: 'ClientSurge installed the Pro System with instant response, missed call text-back, smart booking, nurture sequences, review requests, and AI voice receptionist. The voice agent handled all after-hours calls, triaged emergencies, and booked non-urgent service for the next day.',
      results: [
        '47 after-hours emergency calls captured in 60 days',
        'Average response time dropped from "next morning" to 90 seconds',
        'Seasonal tune-up reactivation generated 23 maintenance plan sign-ups',
        'Google reviews went from 38 to 127 in 90 days',
      ],
    },
    testimonials: [
      { metric: '47 emergencies captured', quote: 'We were losing $3,500 emergency calls every night. The AI voice agent caught every single one. It paid for itself in the first week of summer.', name: 'Mike Thompson', business: 'Desert Cool HVAC, Phoenix AZ' },
      { metric: '90-second response', quote: 'During our summer surge, we couldn\'t answer fast enough. ClientSurge responded to every lead in under 90 seconds. We booked jobs we never would have gotten.', name: 'Carlos Rivera', business: 'Arctic Air Conditioning, Tucson AZ' },
    ],
  },

  plumbing: {
    hero_image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits a leak or drain repair form, AI responds in under 60 seconds asking for issue type, urgency, and address — collecting what dispatch needs before the callback.',
      missed_call: 'Missed urgent plumbing calls get an instant text-back — "We received your call about a plumbing issue. Is this an emergency? Reply YES for priority dispatch."',
      booking_agent: 'Qualified plumbing inquiries book service windows directly through AI — with issue type, address, and access notes collected and sent to dispatch.',
      nurture_sequence: 'Open water heater and repipe estimates receive a 14-day nurture sequence with financing options, before/after case studies, and limited-time offers.',
      review_request: 'After each completed repair, the system sends a Google review request via SMS — timed right after the homeowner sees the fix working.',
      voice_ai: 'A 24/7 AI voice receptionist answers emergency plumbing calls, captures issue type and urgency, and routes true emergencies (floods, no water) to the on-call plumber.',
    }),
    case_study: {
      title: 'How a Plumbing Company Stopped Losing $900 Jobs to the First Answerer',
      metric: '$52,200',
      metricLabel: 'Recovered Revenue',
      challenge: 'A 6-truck plumbing company in Mesa was losing 20+ urgent calls per month because techs were on-site and couldn\'t answer. Each missed call was a $900 average job going to whoever answered first.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Missed callers now received an instant text with service-area confirmation and a booking link.',
      results: [
        '20+ missed emergency calls recovered per month',
        'Open water heater estimates followed up automatically — 8 converted',
        'Average response time dropped to 72 seconds',
        'Google reviews doubled from 51 to 102 in 60 days',
      ],
    },
    testimonials: [
      { metric: '20 calls recovered/mo', quote: 'We were losing $900 jobs because our techs couldn\'t answer while on-site. ClientSurge caught every call and booked them automatically.', name: 'Tom Bradley', business: 'Bradley Plumbing, Mesa AZ' },
      { metric: '8 estimates converted', quote: 'Water heater estimates were sitting in my inbox. The nurture sequence followed up automatically and closed 8 of them in two weeks.', name: 'Lisa Garcia', business: 'Garcia Drain Services, Chandler AZ' },
    ],
  },

  roofing: {
    hero_image: 'https://media.base44.com/images/public/69dc4a79656fdba136d413d3/3fcc65c06_Screenshot2026-04-21185605.png',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits a storm damage or inspection form, AI responds in under 60 seconds asking for damage type, address, roof age, and insurance context — before the roofer calls back.',
      missed_call: 'Missed storm-damage calls get an instant text-back — "We received your call about roof damage. Is this from a recent storm? Reply with your address and we\'ll prioritize your inspection."',
      booking_agent: 'Qualified homeowners book roof inspections directly through AI — with address, damage type, and insurance status collected and sent to the sales team.',
      nurture_sequence: 'Open roof replacement estimates receive a 14-day nurture sequence with financing options, insurance claim guides, and before/after project photos.',
      review_request: 'After each completed roof replacement or repair, the system sends a Google review request via SMS — timed right after the homeowner sees their new roof.',
      voice_ai: 'A 24/7 AI voice receptionist answers storm-damage calls, captures urgency and address, and routes active leak emergencies to the on-call crew.',
    }),
    case_study: {
      title: 'How a Roofing Company Won 12 Storm Leads in One Weekend',
      metric: '$144,000',
      metricLabel: 'Recovered Revenue',
      challenge: 'A roofing company in Scottsdale was losing storm-damage leads to competitors who answered faster. After a hailstorm, homeowners call 3-5 roofers and hire the first one who responds. This company was missing calls during the evening surge.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. The AI captured storm leads after hours, collected damage details and address, and scheduled inspections for the next morning.',
      results: [
        '12 storm leads captured in one weekend that would have been lost',
        'Average response time during storm surge: 84 seconds',
        'Old storm-lead reactivation revived 9 dormant inquiries',
        'Google reviews increased from 29 to 78 in 60 days',
      ],
    },
    testimonials: [
      { metric: '12 storm leads captured', quote: 'After the hailstorm, we got 40 calls in 3 hours. ClientSurge caught every single one and booked inspections. We closed 12 of them — $144K we would have lost.', name: 'Dave Wilson', business: 'Desert Sky Roofing, Scottsdale AZ' },
      { metric: '84-second response', quote: 'During storm season, speed is everything. ClientSurge responded to every lead in under 90 seconds. We were the first roofer to reply, every time.', name: 'James Carter', business: 'Carter Roofing, Phoenix AZ' },
    ],
  },

  chiropractic: {
    hero_image: 'https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a new patient inquiry comes in, AI responds in under 60 seconds with available appointment times and a brief intake question about their primary concern.',
      missed_call: 'Missed calls from new patients get an instant text-back with a booking link — so they don\'t call the chiropractor down the street.',
      booking_agent: 'New patients book their first appointment directly through AI — synced to your adjustment schedule with reason for visit pre-filled.',
      nurture_sequence: 'Inactive patients who haven\'t visited in 30+ days receive a 14-day reactivation sequence with wellness tips, adjustment benefits, and a limited-time reactivation offer.',
      review_request: 'After each visit, the system sends a Google review request via SMS — timed for when the patient is feeling relief from their adjustment.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, books appointments, answers common questions about accepted insurance, and routes new-patient intake.',
    }),
    case_study: {
      title: 'How a Chiropractic Clinic Reactivated 34 Dormant Patients in 30 Days',
      metric: '$8,160',
      metricLabel: 'Recovered Revenue',
      challenge: 'A chiropractic clinic in Phoenix was losing patients to drop-off. Patients would miss one follow-up appointment and never return. Manual reactivation calls weren\'t happening consistently.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. The system automatically identified patients who hadn\'t visited in 30+ days and sent them structured reactivation messages.',
      results: [
        '34 dormant patients reactivated in 30 days',
        'No-show rate dropped from 22% to 8% with automated reminders',
        'New patient response time dropped from 3 hours to 68 seconds',
        'Google reviews grew from 41 to 89 in 60 days',
      ],
    },
    testimonials: [
      { metric: '34 patients reactivated', quote: 'Patients would miss one appointment and just never come back. ClientSurge\'s reactivation sequence brought 34 of them back in a month. That\'s $8K we would have lost.', name: 'Dr. Amanda Reed', business: 'Summit Chiropractic, Phoenix AZ' },
      { metric: '8% no-show rate', quote: 'Our no-show rate was destroying our schedule. The automated reminders cut it from 22% to 8%. My front desk actually has time to help patients now.', name: 'Dr. Kevin Park', business: 'Wellness Spine Center, Tempe AZ' },
    ],
  },

  contractors: {
    hero_image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a project inquiry comes in, AI responds in under 60 seconds asking for project type, location, timeline, and budget range — collecting what you need before the callback.',
      missed_call: 'Missed calls from project inquiries get an instant text-back — "We received your call about a project. What type of work are you looking for? We\'ll call you back with details."',
      booking_agent: 'Interested prospects book walkthroughs or consultations directly through AI — synced to your project calendar with scope pre-collected.',
      nurture_sequence: 'Open estimates and stalled quotes receive a 14-day nurture sequence with project timelines, material options, and before/after portfolio photos.',
      review_request: 'After each completed project, the system sends a Google review request via SMS — timed for right after project handoff when satisfaction is highest.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures project details, and routes high-value inquiries to the project manager for same-day callback.',
    }),
    case_study: {
      title: 'How a General Contractor Closed 6 Stalled Quotes in 2 Weeks',
      metric: '$78,000',
      metricLabel: 'Recovered Revenue',
      challenge: 'A general contractor in Phoenix was losing track of open estimates. Quotes would sit in email for weeks without follow-up, and prospects would hire whoever followed up first.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every open estimate was automatically followed up with structured touchpoints over 14 days.',
      results: [
        '6 stalled quotes converted in 2 weeks — $78K in recovered projects',
        'Average response time to new inquiries: 74 seconds',
        'Project intake details collected automatically — less back-and-forth',
        'Google reviews increased from 23 to 67 in 90 days',
      ],
    },
    testimonials: [
      { metric: '6 quotes closed', quote: 'I had $78K in quotes just sitting in my inbox. ClientSurge followed up automatically and closed 6 of them in two weeks. I didn\'t lift a finger.', name: 'Frank Delgado', business: 'Delgado Construction, Phoenix AZ' },
      { metric: '74-second response', quote: 'When someone submits a project inquiry, they get a response before they even close the browser. We\'re always the first contractor to reply.', name: 'Mike Stevens', business: 'Stevens Building Co, Gilbert AZ' },
    ],
  },

  'real-estate': {
    hero_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a buyer or seller inquiry comes in from Zillow, your website, or Instagram, AI responds in under 60 seconds with available showing times or a consultation link.',
      missed_call: 'Missed calls from interested buyers get an instant text-back — "Hi! I saw you called about a property. Are you looking to buy, sell, or both? I\'ll call you back shortly."',
      booking_agent: 'Interested buyers book showings directly through AI — synced to your showing calendar with property address pre-filled.',
      nurture_sequence: 'Quiet prospects and old seller leads receive a 14-day nurture sequence with market updates, new listings, and consultation offers.',
      review_request: 'After each closed transaction, the system sends a Google review request via SMS — timed for right after closing when client satisfaction is peak.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures buyer/seller intent, and routes hot leads to the agent for immediate callback.',
    }),
    case_study: {
      title: 'How a Real Estate Team Responded to 52 Buyer Leads Before Competitors',
      metric: '9 closed deals',
      metricLabel: 'From faster response alone',
      challenge: 'A 4-agent real estate team in Phoenix was losing buyer leads to slower response times. Inquiries from Zillow and their website would sit for hours before an agent responded — and the buyer would already be working with someone else.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every inquiry was responded to in under 90 seconds, and showings were booked automatically into agent calendars.',
      results: [
        '52 buyer leads responded to in under 90 seconds',
        '9 deals closed directly from faster response alone',
        'Old seller leads reactivated — 4 listings signed',
        'Google reviews grew from 31 to 84 in 90 days',
      ],
    },
    testimonials: [
      { metric: '9 deals closed', quote: 'Speed is everything in real estate. ClientSurge responded to every Zillow lead in under 90 seconds. We closed 9 deals just from being first to reply.', name: 'Rachel Bennett', business: 'Bennett Realty Group, Phoenix AZ' },
      { metric: '4 listings signed', quote: 'Old seller leads were sitting in my CRM untouched. The reactivation sequence brought 4 of them back and they all listed with us.', name: 'Tony Martinez', business: 'Desert Homes Realty, Scottsdale AZ' },
    ],
  },

  'law-firm': {
    hero_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a prospect submits a consultation request, AI responds in under 60 seconds with empathy, next steps, and a consultation booking link.',
      missed_call: 'Missed calls from prospective clients get an instant text-back — "We received your call. Please reply with your case type and we\'ll call you back immediately."',
      booking_agent: 'Prospects book free consultations directly through AI — synced to the attorney\'s calendar with case type pre-filled.',
      nurture_sequence: 'Leads who aren\'t ready to consult yet receive a 14-day nurture sequence with case evaluation guides, FAQ videos, and consultation reminders.',
      review_request: 'After each case resolution, the system sends a Google review request via SMS — timed for when the client has received their outcome.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures case type and urgency, and routes high-value cases to the attorney for immediate callback.',
    }),
    case_study: {
      title: 'How a Law Firm Captured 22 After-Hours Case Inquiries',
      metric: '$410,000',
      metricLabel: 'Case Value Captured',
      challenge: 'A 4-attorney law firm in Phoenix was missing intake calls after hours and on weekends. Prospects don\'t wait — they call the next attorney who answers. Each missed call was potentially a $20K-$100K case.',
      solution: 'ClientSurge installed the Pro System with instant response, missed call text-back, smart booking, nurture sequences, review requests, and AI voice receptionist. The voice agent handled all after-hours intake, captured case details, and booked consultations for the next morning.',
      results: [
        '22 after-hours case inquiries captured in 60 days',
        'Average response time dropped from "next morning" to 64 seconds',
        'Case intake details collected automatically — less back-and-forth',
        'Google reviews increased from 21 to 58 in 90 days',
      ],
    },
    testimonials: [
      { metric: '22 cases captured', quote: 'Prospects call at night and on weekends. Before ClientSurge, those calls went to voicemail. Now the AI catches every one and books the consultation.', name: 'Attorney James Walsh', business: 'Walsh Law Group, Phoenix AZ' },
      { metric: '64-second response', quote: 'When someone needs an attorney, they need help fast. ClientSurge responds in under 70 seconds with empathy and a consultation link. We\'ve never lost a lead to slow response.', name: 'Attorney Lisa Chen', business: 'Chen Legal Partners, Tucson AZ' },
    ],
  },

  'personal-injury': {
    hero_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When an injury victim submits a consultation request, AI responds in under 60 seconds with empathy, next steps, and a consultation booking link.',
      missed_call: 'Missed calls from potential clients get an instant text-back — "We received your call. We understand you may have been injured. Please reply with a brief description and we\'ll call you back immediately."',
      booking_agent: 'Injury victims book free consultations directly through AI — synced to the attorney\'s calendar with case type pre-filled.',
      nurture_sequence: 'Leads who aren\'t ready to consult yet receive a 14-day nurture sequence with case evaluation guides, FAQ videos, and consultation reminders.',
      review_request: 'After each case resolution, the system sends a Google review request via SMS — timed for when the client has received their settlement.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures case type and injury details, and routes high-value cases to the attorney for immediate callback.',
    }),
    case_study: {
      title: 'How a Personal Injury Firm Captured 18 After-Hours Case Inquiries',
      metric: '$340,000',
      metricLabel: 'Case Value Captured',
      challenge: 'A personal injury law firm in Phoenix was missing intake calls after hours and on weekends. Injury victims don\'t wait — they call the next attorney who answers. Each missed call was potentially a $20K-$100K case.',
      solution: 'ClientSurge installed the Pro System with instant response, missed call text-back, smart booking, nurture sequences, review requests, and AI voice receptionist. The voice agent handled all after-hours intake, captured case details, and booked consultations for the next morning.',
      results: [
        '18 after-hours case inquiries captured in 60 days',
        'Average response time dropped from "next morning" to 68 seconds',
        'Case intake details collected automatically — less back-and-forth',
        'Google reviews increased from 19 to 54 in 90 days',
      ],
    },
    testimonials: [
      { metric: '18 cases captured', quote: 'Injury victims call at night and on weekends. Before ClientSurge, those calls went to voicemail. Now the AI catches every one and books the consultation.', name: 'Attorney James Walsh', business: 'Walsh Injury Law, Phoenix AZ' },
      { metric: '68-second response', quote: 'When someone is injured, they need help fast. ClientSurge responds in under 70 seconds with empathy and a consultation link. We\'ve never lost a lead to slow response.', name: 'Attorney Lisa Chen', business: 'Chen & Associates, Tucson AZ' },
    ],
  },

  'property-services': {
    hero_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a maintenance or leasing inquiry comes in, AI responds in under 60 seconds asking for property address, service need, and tenant or owner contact details.',
      missed_call: 'Missed calls from tenants or property owners get an instant text-back with a service request link — so the request doesn\'t go to another property management company.',
      booking_agent: 'Service requests book maintenance visits directly through AI — synced to your vendor calendar with property access notes pre-filled.',
      nurture_sequence: 'Open service quotes and vendor estimates receive a 14-day nurture sequence with follow-up reminders and status updates.',
      review_request: 'After each completed service, the system sends a Google review request to the property owner via SMS.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures maintenance urgency, and routes emergency maintenance (floods, no AC) to the on-call vendor.',
    }),
    case_study: {
      title: 'How a Property Management Company Organized 200+ Scattered Requests',
      metric: '14 hours saved',
      metricLabel: 'Per week on intake',
      challenge: 'A property management company in Phoenix was drowning in scattered maintenance requests across phone, email, and tenant portal. Requests were getting lost, and response times were 24+ hours.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every maintenance request was captured, organized, and routed to vendors automatically.',
      results: [
        '200+ scattered requests organized into a single workflow',
        'Average response time dropped from 24 hours to 82 seconds',
        '14 hours per week saved on manual intake and routing',
        'Google reviews increased from 28 to 71 in 90 days',
      ],
    },
    testimonials: [
      { metric: '14 hrs saved/week', quote: 'We were drowning in maintenance requests across phone, email, and portal. ClientSurge organized everything automatically. My team actually has time to focus on retention now.', name: 'Karen Mitchell', business: 'Desert Property Management, Phoenix AZ' },
      { metric: '82-second response', quote: 'Tenants used to wait 24 hours for a response. Now they get one in under 90 seconds. Owner satisfaction is way up.', name: 'Robert Hayes', business: 'Hayes Property Services, Mesa AZ' },
    ],
  },

  veterinary: {
    hero_image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a pet owner submits an appointment request, AI responds in under 60 seconds with available times and a brief intake question about their pet\'s concern.',
      missed_call: 'Missed calls from pet owners get an instant text-back with a booking link — so they don\'t call the vet down the street.',
      booking_agent: 'Pet owners book appointments directly through AI — synced to your clinic schedule with pet name and reason for visit pre-filled.',
      nurture_sequence: 'Inactive patients and overdue wellness visits receive a 14-day reactivation sequence with vaccination reminders, dental health tips, and wellness exam offers.',
      review_request: 'After each completed visit, the system sends a Google review request via SMS — timed for when the pet owner is back home and their pet is feeling better.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures pet symptoms and urgency, and routes emergencies (toxin ingestion, trauma) to the on-call vet.',
    }),
    case_study: {
      title: 'How a Veterinary Clinic Captured 22 After-Hours Emergency Calls',
      metric: '$11,000',
      metricLabel: 'Recovered Revenue',
      challenge: 'A 3-vet veterinary clinic in Phoenix was missing after-hours emergency calls. Pet owners calling about sick or injured animals would move on to the next clinic if nobody answered.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. After-hours calls were captured, emergencies were triaged, and non-urgent inquiries were booked for the next day.',
      results: [
        '22 after-hours emergency calls captured in 60 days',
        'Average response time dropped from "next morning" to 76 seconds',
        'Wellness visit reactivation brought back 18 overdue patients',
        'Google reviews grew from 34 to 82 in 90 days',
      ],
    },
    testimonials: [
      { metric: '22 emergencies captured', quote: 'Pet owners don\'t wait when their animal is sick. ClientSurge caught every after-hours call and booked them. That\'s 22 emergencies we would have lost.', name: 'Dr. Sarah Williams', business: 'Desert Paws Veterinary, Phoenix AZ' },
      { metric: '18 patients reactivated', quote: 'Our overdue wellness visit list was huge. ClientSurge reactivated 18 of them automatically. The reminders alone are worth it.', name: 'Dr. Michael Torres', business: 'Desert Animal Hospital, Gilbert AZ' },
    ],
  },

  electrician: {
    hero_image: 'https://images.unsplash.com/photo-1621905251918-48416cbd6309?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits an electrical service form, AI responds in under 60 seconds asking for issue type, urgency, and location — collecting what dispatch needs.',
      missed_call: 'Missed urgent electrical calls get an instant text-back — "We received your call about an electrical issue. Is this an emergency (outage/sparking)? Reply YES for priority."',
      booking_agent: 'Qualified electrical inquiries book service windows directly through AI — with issue type, location, and safety context collected.',
      nurture_sequence: 'Open panel upgrade and rewiring estimates receive a 14-day nurture sequence with financing options, code compliance guides, and before/after photos.',
      review_request: 'After each completed electrical job, the system sends a Google review request via SMS — timed right after the homeowner sees the fix working safely.',
      voice_ai: 'A 24/7 AI voice receptionist answers emergency electrical calls, captures outage details and safety context, and routes true emergencies (sparking, no power) to the on-call electrician.',
    }),
    case_study: {
      title: 'How an Electrical Contractor Captured 15 After-Hours Emergency Calls',
      metric: '$37,500',
      metricLabel: 'Recovered Revenue',
      challenge: 'A 4-truck electrical contractor in Phoenix was missing after-hours emergency calls. Outage and sparking calls lose trust fast when customers reach voicemail — each missed call was a $2,500 average job.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. After-hours calls were captured, emergencies were triaged, and panel upgrade estimates were followed up automatically.',
      results: [
        '15 after-hours emergency calls captured in 30 days',
        'Average response time dropped from "next morning" to 78 seconds',
        'Open panel upgrade estimates followed up automatically — 5 converted',
        'Google reviews grew from 27 to 64 in 60 days',
      ],
    },
    testimonials: [
      { metric: '15 emergencies captured', quote: 'Outage calls don\'t wait. ClientSurge caught every after-hours emergency and booked them before the customer called the next electrician.', name: 'Steve Patterson', business: 'Patterson Electric, Phoenix AZ' },
      { metric: '5 estimates converted', quote: 'Panel upgrade quotes were sitting in my inbox. The nurture sequence followed up automatically and closed 5 of them in two weeks.', name: 'Carlos Mendez', business: 'Mendez Electrical, Tempe AZ' },
    ],
  },

  landscaping: {
    hero_image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits a landscaping inquiry, AI responds in under 60 seconds asking for service type (lawn, hardscape, maintenance), property size, and preferred timeline.',
      missed_call: 'Missed landscaping calls get an instant text-back with a service-area confirmation and a booking link for a free estimate.',
      booking_agent: 'Interested homeowners book site visits and estimates directly through AI — synced to your project calendar with service type pre-filled.',
      nurture_sequence: 'Open maintenance plan leads and seasonal prospects receive a 14-day nurture sequence with before/after portfolio photos, seasonal tips, and maintenance plan offers.',
      review_request: 'After each completed project, the system sends a Google review request via SMS — timed for right after the homeowner sees their new landscape.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures project scope, and routes high-value hardscape and design inquiries to the owner for immediate callback.',
    }),
    case_study: {
      title: 'How a Landscaping Company Converted 12 Maintenance Plan Leads',
      metric: '$28,800',
      metricLabel: 'Annual Recurring Revenue',
      challenge: 'A landscaping company in Scottsdale was losing maintenance plan sign-ups because they couldn\'t follow up with every inquiry during the spring surge. Leads were coming in faster than they could respond.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every inquiry was responded to in under 90 seconds, and maintenance plan leads received structured follow-up.',
      results: [
        '12 maintenance plan leads converted in 30 days',
        '$28,800 in annual recurring revenue recovered',
        'Average response time during spring surge: 84 seconds',
        'Google reviews increased from 19 to 52 in 60 days',
      ],
    },
    testimonials: [
      { metric: '12 plans converted', quote: 'During spring, we got more calls than we could handle. ClientSurge caught every one and converted 12 into maintenance plans. That\'s $28K in recurring revenue.', name: 'Brandon Lee', business: 'Desert Oasis Landscaping, Scottsdale AZ' },
      { metric: '84-second response', quote: 'We were the fastest landscaping company to reply during the spring rush. ClientSurge responded to every lead in under 90 seconds.', name: 'Diego Ramirez', business: 'Ramirez Landscaping, Phoenix AZ' },
    ],
  },

  'tree-service': {
    hero_image: 'https://images.unsplash.com/photo-1599598275926-5e0a4b906475?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits a tree removal or trimming inquiry, AI responds in under 60 seconds asking for tree type, size, location, and hazard context.',
      missed_call: 'Missed storm-damage calls get an instant text-back — "We received your call about tree damage. Is the tree on a structure or power lines? Reply with details for priority dispatch."',
      booking_agent: 'Qualified homeowners book site visits and estimates directly through AI — with tree location, size, and hazard level collected.',
      nurture_sequence: 'Open stump grinding and cleanup estimates receive a 14-day nurture sequence with before/after photos, stump grinding FAQs, and seasonal trimming offers.',
      review_request: 'After each completed tree removal, the system sends a Google review request via SMS — timed for right after the homeowner sees their clean yard.',
      voice_ai: 'A 24/7 AI voice receptionist answers storm-damage calls, captures hazard level, and routes trees-on-structure emergencies to the on-call crew.',
    }),
    case_study: {
      title: 'How a Tree Service Company Won 8 Storm Leads in One Night',
      metric: '$21,000',
      metricLabel: 'Recovered Revenue',
      challenge: 'A tree service company in Phoenix was losing storm-damage leads to competitors who answered faster. After a windstorm, homeowners call multiple tree services and hire the first one who responds.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. The AI captured storm leads after hours, collected hazard details, and scheduled site visits for the next morning.',
      results: [
        '8 storm leads captured in one night that would have been lost',
        'Average response time during storm surge: 76 seconds',
        'Stump grinding estimate follow-up converted 4 stalled quotes',
        'Google reviews grew from 14 to 41 in 60 days',
      ],
    },
    testimonials: [
      { metric: '8 storm leads captured', quote: 'After the windstorm, we got 20 calls in 2 hours. ClientSurge caught every one and booked site visits. We closed 8 — $21K we would have lost.', name: 'Ricky Coleman', business: 'Coleman Tree Service, Phoenix AZ' },
      { metric: '4 estimates converted', quote: 'Stump grinding quotes were sitting dormant. The nurture sequence followed up and closed 4 of them. Pure recovered revenue.', name: 'Tom Higgins', business: 'Higgins Tree Care, Mesa AZ' },
    ],
  },

  painting: {
    hero_image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits a painting inquiry, AI responds in under 60 seconds asking for project type (interior/exterior), surface area, timeline, and location.',
      missed_call: 'Missed painting calls get an instant text-back with a service-area confirmation and a booking link for a free walk-through estimate.',
      booking_agent: 'Interested homeowners book walk-through estimates directly through AI — synced to your project calendar with project type pre-filled.',
      nurture_sequence: 'Open painting quotes receive a 14-day nurture sequence with color palette guides, before/after portfolio photos, and limited-time scheduling incentives.',
      review_request: 'After each completed painting project, the system sends a Google review request via SMS — timed for right after the homeowner sees their freshly painted space.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures project scope, and routes commercial painting inquiries to the owner for immediate callback.',
    }),
    case_study: {
      title: 'How a Painting Contractor Closed 9 Stalled Quotes in 2 Weeks',
      metric: '$34,200',
      metricLabel: 'Recovered Revenue',
      challenge: 'A painting contractor in Phoenix was losing track of open interior and exterior estimates. Quotes would sit for weeks without follow-up, and prospects would hire whoever followed up first.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every open quote was automatically followed up with structured touchpoints over 14 days.',
      results: [
        '9 stalled quotes converted in 2 weeks — $34.2K recovered',
        'Average response time to new inquiries: 82 seconds',
        'Project details collected automatically — less back-and-forth',
        'Google reviews increased from 17 to 48 in 60 days',
      ],
    },
    testimonials: [
      { metric: '9 quotes closed', quote: 'I had quotes sitting in my inbox for weeks. ClientSurge followed up automatically and closed 9 of them. That\'s $34K I would have lost.', name: 'Anthony Russo', business: 'Russo Painting, Phoenix AZ' },
      { metric: '82-second response', quote: 'When someone submits an inquiry, they get a response before they even close the browser. We\'re always the first painter to reply.', name: 'Jared Moss', business: 'Moss Pro Painting, Gilbert AZ' },
    ],
  },

  'pest-control': {
    hero_image: 'https://images.unsplash.com/photo-1584468764996-15ad89a5b0b5?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a homeowner submits a pest control inquiry, AI responds in under 60 seconds asking for pest type, location, urgency, and property details.',
      missed_call: 'Missed urgent pest calls get an instant text-back — "We received your call about pest control. What type of pest are you seeing? Reply for priority scheduling."',
      booking_agent: 'Qualified pest inquiries book treatment visits directly through AI — with pest type, property size, and urgency collected.',
      nurture_sequence: 'Recurring treatment plan leads receive a 14-day nurture sequence with seasonal pest guides, treatment plan benefits, and sign-up incentives.',
      review_request: 'After each completed treatment, the system sends a Google review request via SMS — timed for when the homeowner is seeing results.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures pest type and urgency, and routes severe infestations (termites, bed bugs) for same-day service.',
    }),
    case_study: {
      title: 'How a Pest Control Company Signed 16 Recurring Treatment Plans',
      metric: '$19,200',
      metricLabel: 'Annual Recurring Revenue',
      challenge: 'A pest control company in Phoenix was struggling to convert one-time service calls into recurring quarterly plans. Leads were coming in but follow-up was inconsistent.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every inquiry was responded to in under 90 seconds, and recurring plan leads received structured nurture.',
      results: [
        '16 recurring treatment plans signed in 30 days',
        '$19,200 in annual recurring revenue recovered',
        'Average response time: 78 seconds',
        'Google reviews grew from 22 to 58 in 60 days',
      ],
    },
    testimonials: [
      { metric: '16 plans signed', quote: 'One-time calls weren\'t converting to recurring plans. ClientSurge nurtured every lead automatically and signed 16 quarterly plans in a month.', name: 'Greg Sanders', business: 'Desert Shield Pest Control, Phoenix AZ' },
      { metric: '78-second response', quote: 'When someone sees a scorpion, they want help now. ClientSurge responds in under 80 seconds. We\'re always the first exterminator to reply.', name: 'Mike Dawson', business: 'Dawson Pest Solutions, Mesa AZ' },
    ],
  },

  salon: {
    hero_image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a client submits an appointment or service inquiry, AI responds in under 60 seconds with available times and stylist recommendations.',
      missed_call: 'Missed calls from booking inquiries get an instant text-back with a booking link — so they don\'t call the salon down the street.',
      booking_agent: 'Clients book appointments directly through AI — synced to your stylist schedule with service type (cut, color, treatment) pre-filled.',
      nurture_sequence: 'Dormant clients and past color treatment leads receive a 14-day reactivation sequence with seasonal style trends, product highlights, and rebooking offers.',
      review_request: 'After each completed appointment, the system sends a Google review request via SMS — timed for when the client is home and loving their new look.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, books appointments, answers pricing questions, and routes color consultation requests to the senior stylist.',
    }),
    case_study: {
      title: 'How a Salon Filled 32 Empty Chairs in 30 Days',
      metric: '$9,600',
      metricLabel: 'Recovered Revenue',
      challenge: 'A 6-station salon in Phoenix was losing appointment inquiries during busy hours. The front desk was overwhelmed, and manual reminders weren\'t reducing no-shows.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Inquiries were responded to in under 90 seconds, and dormant clients were reactivated automatically.',
      results: [
        '32 empty chairs filled in 30 days',
        'No-show rate dropped from 19% to 6% with automated reminders',
        '24 dormant clients reactivated with structured follow-up',
        'Google reviews grew from 35 to 78 in 60 days',
      ],
    },
    testimonials: [
      { metric: '32 chairs filled', quote: 'We were losing appointment inquiries every day. ClientSurge caught them all and booked them automatically. 32 filled chairs in a month.', name: 'Sophie Laurent', business: 'Studio 6 Salon, Phoenix AZ' },
      { metric: '6% no-show rate', quote: 'Our no-show rate was killing us. The automated reminders cut it from 19% to 6%. My front desk actually has time to help clients now.', name: 'Maria Santos', business: 'Bloom Hair Studio, Scottsdale AZ' },
    ],
  },

  'auto-repair': {
    hero_image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a vehicle owner submits a diagnostic or repair inquiry, AI responds in under 60 seconds asking for vehicle make, model, issue, and preferred timing.',
      missed_call: 'Missed diagnostic calls get an instant text-back — "We received your call about auto repair. What\'s the vehicle make and issue? We\'ll call you back with an estimate."',
      booking_agent: 'Vehicle owners book drop-off or diagnostic appointments directly through AI — synced to your shop schedule with vehicle details pre-filled.',
      nurture_sequence: 'Open repair estimates receive a 14-day nurture sequence with repair FAQs, financing options, and scheduling incentives.',
      review_request: 'After each completed repair, the system sends a Google review request via SMS — timed for when the customer picks up their vehicle.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, captures vehicle issue and make/model, and routes urgent repairs (brakes, check engine) for priority scheduling.',
    }),
    case_study: {
      title: 'How an Auto Repair Shop Recovered 18 Stalled Estimates',
      metric: '$27,000',
      metricLabel: 'Recovered Revenue',
      challenge: 'An auto repair shop in Phoenix was losing track of open repair estimates. Quotes would sit without follow-up, and customers would take their vehicle elsewhere.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every open estimate was automatically followed up over 14 days.',
      results: [
        '18 stalled estimates recovered in 30 days',
        'Average response time to new inquiries: 76 seconds',
        'Past customer reactivation brought back 12 vehicles for service',
        'Google reviews increased from 31 to 74 in 60 days',
      ],
    },
    testimonials: [
      { metric: '18 estimates recovered', quote: 'Repair quotes were sitting in my inbox. ClientSurge followed up automatically and recovered 18 of them. $27K in recovered revenue.', name: 'Frank Lopez', business: 'Lopez Auto Repair, Phoenix AZ' },
      { metric: '12 customers reactivated', quote: 'Old repair customers just disappeared. ClientSurge brought 12 of them back for service. The reactivation alone paid for the system.', name: 'Dan Carter', business: 'Carter Automotive, Mesa AZ' },
    ],
  },

  accounting: {
    hero_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a prospect submits a tax or bookkeeping inquiry, AI responds in under 60 seconds with consultation availability and a brief intake question about their needs.',
      missed_call: 'Missed calls from prospective clients get an instant text-back — "We received your call. Are you looking for tax preparation, bookkeeping, or advisory services? We\'ll call you back shortly."',
      booking_agent: 'Prospects book free consultations directly through AI — synced to your calendar with service type (tax, bookkeeping, advisory) pre-filled.',
      nurture_sequence: 'Open proposals and past-season prospects receive a 14-day nurture sequence with tax deadline reminders, service highlights, and consultation offers.',
      review_request: 'After each completed engagement, the system sends a Google review request via SMS — timed for after the client receives their tax return or financial statements.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls during tax season surges, captures service type, and routes high-value advisory inquiries to the senior partner.',
    }),
    case_study: {
      title: 'How an Accounting Firm Handled 60+ Tax Season Inquiries Without Adding Staff',
      metric: '42 consultations',
      metricLabel: 'Booked Automatically',
      challenge: 'A 4-partner accounting firm in Phoenix was overwhelmed during tax season. They were receiving 60+ inquiries per week but couldn\'t respond fast enough without adding front-desk staff.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every inquiry was responded to in under 90 seconds, and consultations were booked automatically.',
      results: [
        '42 consultations booked automatically in 30 days during tax season',
        'Average response time dropped from 6 hours to 82 seconds',
        'Past-season prospects reactivated — 11 new engagements signed',
        'Google reviews grew from 24 to 61 in 90 days',
      ],
    },
    testimonials: [
      { metric: '42 consultations booked', quote: 'During tax season, we were drowning. ClientSurge responded to every inquiry in under 90 seconds and booked 42 consultations automatically. No extra staff needed.', name: 'CPA Robert Chen', business: 'Chen & Partners Accounting, Phoenix AZ' },
      { metric: '11 engagements signed', quote: 'Old tax season prospects were sitting untouched. ClientSurge reactivated 11 of them and they all signed for advisory services.', name: 'CPA Susan Walsh', business: 'Walsh Tax Advisors, Scottsdale AZ' },
    ],
  },

  fitness: {
    hero_image: 'https://images.unsplash.com/photo-1534438327276-14e030dce1a0?w=1600&q=95',
    automation_tiers: buildTiers({
      instant_response: 'When a prospect submits a membership or trial inquiry, AI responds in under 60 seconds with available class times and a free trial booking link.',
      missed_call: 'Missed calls from prospective members get an instant text-back — "We received your call! Ready to try a free class? Reply and we\'ll get you booked."',
      booking_agent: 'Prospects book free trial sessions directly through AI — synced to your class schedule with fitness level and goals pre-filled.',
      nurture_sequence: 'Free trial leads who haven\'t converted yet receive a 14-day nurture sequence with member success stories, class schedules, and limited-time membership offers.',
      review_request: 'After each member milestone (first class, 30-day mark, transformation), the system sends a Google review request via SMS.',
      voice_ai: 'A 24/7 AI voice receptionist answers calls, books trial sessions, answers membership pricing questions, and routes personal training inquiries to the trainer.',
    }),
    case_study: {
      title: 'How a Fitness Studio Converted 24 Free Trials Into Memberships',
      metric: '$18,000',
      metricLabel: 'New Membership Revenue',
      challenge: 'A boutique fitness studio in Phoenix was getting free trial sign-ups but converting fewer than 20% to memberships. Follow-up was inconsistent, and trial leads would go cold within days.',
      solution: 'ClientSurge installed the Growth System with instant response, missed call text-back, smart booking, and nurture sequences. Every trial lead received structured follow-up over 14 days with member stories and conversion offers.',
      results: [
        '24 free trials converted to memberships in 30 days',
        'Conversion rate jumped from 18% to 52%',
        'Average response time to inquiries: 74 seconds',
        'Google reviews grew from 29 to 73 in 60 days',
      ],
    },
    testimonials: [
      { metric: '24 trials converted', quote: 'We were getting free trial sign-ups but losing them. ClientSurge nurtured every lead and converted 24 into memberships in a month. Conversion rate jumped from 18% to 52%.', name: 'Jake Morrison', business: 'Iron Forge Fitness, Phoenix AZ' },
      { metric: '74-second response', quote: 'When someone wants to try a class, they want to book now. ClientSurge responds in under 80 seconds and books the trial. We never lose a lead to slow response.', name: 'Ashley Brooks', business: 'Brooks Yoga Studio, Scottsdale AZ' },
    ],
  },
};

// ── Helper: get enrichment data by slug ──
export function getIndustryContent(slug) {
  return INDUSTRY_CONTENT[slug] || null;
}

// ── Helper: merge marketing config with content enrichment ──
// PART 1 FIX: case_study and testimonials are set to null/empty because they
// contain fabricated proof data that must NOT be rendered until real verified
// client proof is added. The source data is retained but suppressed from output.
export function getMergedIndustryData(slug, marketingData) {
  const content = INDUSTRY_CONTENT[slug];
  if (!content) return { ...marketingData, case_study: null, testimonials: [] };
  return {
    ...marketingData,
    hero_image: content.hero_image,
    automation_tiers: content.automation_tiers,
    // Fabricated proof suppressed — see PART 1 FIX comment above
    case_study: null,
    testimonials: [],
  };
}
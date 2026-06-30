const sharedMetrics = {
  response_speed: 'Faster replies',
  follow_up_quality: 'Cleaner follow-up',
  booking_path: 'Clearer booking handoff',
  launch_proof: 'Tested before launch',
};

const sharedTestimonials = [];

const buildIndustry = ({ slug, industry_name, display_name, headline, subheadline, description, pains, useCases, features, recommended_plan = 'growth_system' }) => ({
  slug,
  industry_name,
  display_name,
  hero_headline: headline,
  hero_subheadline: subheadline,
  hero_description: description,
  primary_cta: 'Compare Packages',
  secondary_cta: 'View Automation Stack',
  pain_points: pains,
  use_cases: useCases,
  roi_metrics: sharedMetrics,
  testimonials: sharedTestimonials,
  recommended_plan,
  key_features: features,
});

export const INDUSTRY_MARKETING_DATA = {
  'med-spa': buildIndustry({
    slug: 'med-spa',
    industry_name: 'Medical Spa',
    display_name: 'Medical Spa Automation System',
    headline: 'Turn Treatment Inquiries Into Faster Consultation Paths',
    subheadline: 'AI systems for med spas that need faster response, cleaner follow-up, and better booking handoff.',
    description: 'ClientSurge helps med spas capture treatment inquiries, respond quickly, follow up consistently, and route interested prospects toward consultation booking without overloading the front desk.',
    pains: [
      { title: 'Delayed Consult Response', desc: 'Treatment inquiries wait while the front desk handles clients, calls, and checkout.' },
      { title: 'Manual Booking Friction', desc: 'Interested prospects lose momentum when booking requires too much back-and-forth.' },
      { title: 'Follow-Up Inconsistency', desc: 'New leads and past clients often receive uneven follow-up.' },
      { title: 'Review Requests Get Forgotten', desc: 'Happy clients are not always asked for reviews at the right time.' },
    ],
    useCases: [
      { title: 'Instant Inquiry Response', description: 'New treatment inquiries receive an approved response and a clear next step.', icon: 'MessageSquare', metrics: 'Target outcome: faster consultation path' },
      { title: 'Booking Handoff', description: 'Interested prospects are guided toward the right booking or callback path.', icon: 'Calendar', metrics: 'Target outcome: fewer stalled inquiries' },
      { title: 'Missed-Call Recovery', description: 'Missed calls receive a timely text-back and are routed into follow-up.', icon: 'Phone', metrics: 'Target outcome: fewer dropped calls' },
      { title: 'Client Reactivation', description: 'Past clients and dormant leads can receive structured reactivation campaigns.', icon: 'RotateCw', metrics: 'Target outcome: more recovered conversations' },
    ],
    features: ['Lead capture', 'Instant response', 'Missed-call recovery', 'Booking handoff', 'Review requests', 'Reactivation campaigns'],
  }),

  dental: buildIndustry({
    slug: 'dental',
    industry_name: 'Dental Practice',
    display_name: 'Dental Practice Automation System',
    headline: 'Help New Patient Inquiries Get Answered Faster',
    subheadline: 'AI systems for dental teams that need response, routing, booking, reminders, and follow-up support.',
    description: 'ClientSurge helps dental practices reduce response delays, organize new-patient requests, route urgent inquiries, and keep appointment conversations moving.',
    pains: [
      { title: 'Front Desk Overload', desc: 'Calls and forms arrive while the team is helping in-office patients.' },
      { title: 'New Patient Delay', desc: 'Unanswered inquiries can turn into lost appointment opportunities.' },
      { title: 'Scheduling Friction', desc: 'Manual appointment coordination creates unnecessary back-and-forth.' },
      { title: 'Dormant Patient Lists', desc: 'Recall and unfinished treatment conversations often sit untouched.' },
    ],
    useCases: [
      { title: 'New Patient Response', description: 'New inquiries receive an approved reply and a simple next step.', icon: 'Users', metrics: 'Target outcome: faster patient routing' },
      { title: 'Emergency Routing', description: 'Urgent requests can be flagged for the right response path.', icon: 'AlertCircle', metrics: 'Target outcome: clearer prioritization' },
      { title: 'Appointment Handoff', description: 'Interested patients are moved toward booking, confirmation, and reminders.', icon: 'Calendar', metrics: 'Target outcome: cleaner scheduling flow' },
      { title: 'Recall Reactivation', description: 'Dormant patients and unfinished plans can receive structured reactivation.', icon: 'RotateCw', metrics: 'Target outcome: more re-engagement' },
    ],
    features: ['New patient response', 'Missed-call text-back', 'Booking handoff', 'Appointment reminders', 'Recall follow-up', 'Review requests'],
  }),

  hvac: buildIndustry({
    slug: 'hvac',
    industry_name: 'HVAC',
    display_name: 'HVAC Automation System',
    headline: 'Respond to Service Calls Before the Opportunity Goes Cold',
    subheadline: 'AI systems for HVAC teams that need fast response, missed-call recovery, scheduling support, and seasonal follow-up.',
    description: 'ClientSurge helps HVAC teams keep repair, maintenance, and estimate requests moving through response, follow-up, and booking paths.',
    pains: [
      { title: 'Peak Volume Spikes', desc: 'Busy seasons create more calls and inquiries than staff can handle manually.' },
      { title: 'Missed Service Calls', desc: 'Missed calls often turn into another company receiving the job.' },
      { title: 'Slow Estimate Follow-Up', desc: 'Unanswered estimate requests lose momentum quickly.' },
      { title: 'Seasonal Reactivation Gaps', desc: 'Maintenance and tune-up opportunities are easy to forget.' },
    ],
    useCases: [
      { title: 'Service Request Capture', description: 'Requests are captured with service type, urgency, and contact details.', icon: 'Zap', metrics: 'Target outcome: cleaner dispatch handoff' },
      { title: 'Missed-Call Text-Back', description: 'Missed callers receive a fast response path.', icon: 'Phone', metrics: 'Target outcome: fewer dropped calls' },
      { title: 'Booking Support', description: 'Qualified leads are routed toward appointment or callback next steps.', icon: 'Calendar', metrics: 'Target outcome: less scheduling drag' },
      { title: 'Seasonal Campaigns', description: 'Past customers can be reactivated for tune-ups and maintenance.', icon: 'Thermometer', metrics: 'Target outcome: more repeat conversations' },
    ],
    features: ['Service request capture', 'Missed-call recovery', 'Follow-up sequence', 'Booking handoff', 'Seasonal reactivation', 'Review requests'],
  }),

  plumbing: buildIndustry({
    slug: 'plumbing',
    industry_name: 'Plumbing',
    display_name: 'Plumbing Automation System',
    headline: 'Give Plumbing Inquiries a Faster Response Path',
    subheadline: 'AI systems for plumbing teams that need emergency response, missed-call recovery, and clean scheduling handoff.',
    description: 'ClientSurge helps plumbing businesses capture repair and emergency inquiries, respond quickly, and route prospects toward the right next step.',
    pains: [
      { title: 'Emergency Call Delay', desc: 'Urgent plumbing inquiries need fast acknowledgement and routing.' },
      { title: 'Missed Calls During Jobs', desc: 'Crews cannot answer every call while they are on-site.' },
      { title: 'Manual Scheduling', desc: 'Manual coordination slows down dispatch and service booking.' },
      { title: 'Old Estimate Follow-Up', desc: 'Unclosed estimates and maintenance opportunities often sit untouched.' },
    ],
    useCases: [
      { title: 'Emergency Intake Path', description: 'Urgent requests can be routed into a fast response workflow.', icon: 'AlertCircle', metrics: 'Target outcome: clearer urgency handling' },
      { title: 'Missed-Call Recovery', description: 'Missed callers receive a text-back and next-step prompt.', icon: 'Phone', metrics: 'Target outcome: fewer lost conversations' },
      { title: 'Service Booking Handoff', description: 'Qualified requests move toward schedule confirmation or callback.', icon: 'Calendar', metrics: 'Target outcome: smoother booking' },
      { title: 'Past Customer Follow-Up', description: 'Old estimates and maintenance opportunities can be reactivated.', icon: 'RotateCw', metrics: 'Target outcome: more repeat opportunities' },
    ],
    features: ['Emergency inquiry routing', 'Missed-call recovery', 'Lead capture', 'Booking handoff', 'Follow-up sequence', 'Review request flow'],
  }),

  roofing: buildIndustry({
    slug: 'roofing',
    industry_name: 'Roofing',
    display_name: 'Roofing Automation System',
    headline: 'Keep Roof Repair and Inspection Leads Moving',
    subheadline: 'AI systems for roofing teams that need faster inquiry response, inspection booking, and estimate follow-up.',
    description: 'ClientSurge helps roofing teams capture storm, repair, and inspection inquiries, route them clearly, and follow up after estimates or appointments.',
    pains: [
      { title: 'High-Volume Inquiry Windows', desc: 'Weather and seasonal spikes create more calls and forms than a manual process can track cleanly.' },
      { title: 'Inspection Scheduling Friction', desc: 'Qualified homeowners need a clear next step before momentum drops.' },
      { title: 'Estimate Follow-Up Gaps', desc: 'Quotes and inspections require structured follow-up to stay active.' },
      { title: 'Old Storm Leads', desc: 'Past inquiries often remain valuable but untouched.' },
    ],
    useCases: [
      { title: 'Inspection Lead Capture', description: 'Roofing inquiries are captured with location, issue type, and contact details.', icon: 'Home', metrics: 'Target outcome: cleaner inspection handoff' },
      { title: 'Missed-Call Text-Back', description: 'Missed homeowner calls receive a fast next-step prompt.', icon: 'Phone', metrics: 'Target outcome: faster response' },
      { title: 'Estimate Follow-Up', description: 'Open quotes receive structured follow-up until there is a clear outcome.', icon: 'FileCheck', metrics: 'Target outcome: fewer stale quotes' },
      { title: 'Lead Reactivation', description: 'Old repair and storm inquiries can be reactivated with controlled messaging.', icon: 'Cloud', metrics: 'Target outcome: more revived opportunities' },
    ],
    features: ['Inspection lead capture', 'Missed-call recovery', 'Estimate follow-up', 'Booking handoff', 'Lead reactivation', 'Review requests'],
  }),

  contractors: buildIndustry({
    slug: 'contractors',
    industry_name: 'Contractors',
    display_name: 'Contractor Automation System',
    headline: 'Keep Project Inquiries and Quotes From Going Stale',
    subheadline: 'AI systems for contractors that need faster response, estimate follow-up, and appointment handoff.',
    description: 'ClientSurge helps contractors capture project inquiries, qualify basic context, follow up on estimates, and route interested prospects toward walkthroughs or calls.',
    pains: [
      { title: 'Quote Follow-Up Gaps', desc: 'Open estimates often stall when follow-up depends on memory.' },
      { title: 'Project Inquiry Delay', desc: 'Prospects often compare providers and choose the clearest response path.' },
      { title: 'Walkthrough No-Shows', desc: 'Unconfirmed appointments can waste time and scheduling capacity.' },
      { title: 'Scattered Lead Details', desc: 'Photos, scope, location, and timing can get spread across channels.' },
    ],
    useCases: [
      { title: 'Project Lead Capture', description: 'Collect job type, location, timeline, and contact details.', icon: 'ClipboardList', metrics: 'Target outcome: cleaner qualification' },
      { title: 'Quote Follow-Up', description: 'Send structured follow-up for estimates and pending decisions.', icon: 'Send', metrics: 'Target outcome: fewer stale quotes' },
      { title: 'Walkthrough Handoff', description: 'Move interested prospects toward a walkthrough or callback.', icon: 'Calendar', metrics: 'Target outcome: clearer next step' },
      { title: 'Review Request Flow', description: 'Completed projects can trigger a timely reputation request.', icon: 'MessageSquare', metrics: 'Target outcome: more consistent review asks' },
    ],
    features: ['Project inquiry capture', 'Quote follow-up', 'Walkthrough scheduling handoff', 'Missed-call recovery', 'Reactivation', 'Review requests'],
  }),

  chiropractic: buildIndustry({
    slug: 'chiropractic',
    industry_name: 'Chiropractic',
    display_name: 'Chiropractic Automation System',
    headline: 'Help New Patient Inquiries Move Toward Booking Faster',
    subheadline: 'AI systems for chiropractic and physical therapy teams that need response, intake, booking, and reactivation support.',
    description: 'ClientSurge helps clinics respond to new patient inquiries, guide interested patients toward booking, send reminders, and reactivate dormant patients.',
    pains: [
      { title: 'New Patient Response Delay', desc: 'Inquiries can wait while staff handle visits and front-desk work.' },
      { title: 'Intake Friction', desc: 'Patients need a simple path to share context and schedule.' },
      { title: 'Appointment Reminders', desc: 'Manual reminders are inconsistent and easy to miss.' },
      { title: 'Dormant Patient Follow-Up', desc: 'Past patients often go quiet without structured reactivation.' },
    ],
    useCases: [
      { title: 'New Patient Response', description: 'New inquiries receive an approved reply and a clear appointment path.', icon: 'MessageSquare', metrics: 'Target outcome: faster patient response' },
      { title: 'Booking Handoff', description: 'Interested patients are routed toward available appointment options.', icon: 'Calendar', metrics: 'Target outcome: less scheduling friction' },
      { title: 'Reminder Support', description: 'Appointments can receive confirmations and reminders.', icon: 'CheckCircle', metrics: 'Target outcome: cleaner attendance flow' },
      { title: 'Patient Reactivation', description: 'Dormant patients can receive structured follow-up.', icon: 'RotateCw', metrics: 'Target outcome: more re-engagement' },
    ],
    features: ['New patient response', 'Booking handoff', 'Appointment reminders', 'Missed-call text-back', 'Patient reactivation', 'Review request flow'],
  }),

  'real-estate': buildIndustry({
    slug: 'real-estate',
    industry_name: 'Real Estate',
    display_name: 'Real Estate Automation System',
    headline: 'Respond to Buyer and Seller Inquiries Faster',
    subheadline: 'AI systems for real estate teams that need fast inquiry response, showing handoff, and follow-up.',
    description: 'ClientSurge helps real estate teams capture inquiries, follow up consistently, route prospects toward showings or consultations, and reactivate old prospects.',
    pains: [
      { title: 'Inquiry Response Delay', desc: 'Prospects often contact several agents or teams before deciding who to work with.' },
      { title: 'Showing Coordination', desc: 'Manual scheduling slows down interested buyers.' },
      { title: 'Follow-Up Gaps', desc: 'Prospects go quiet when follow-up is not structured.' },
      { title: 'Old Prospect Lists', desc: 'Past buyers and seller leads often sit untouched.' },
    ],
    useCases: [
      { title: 'Buyer Lead Response', description: 'Buyer inquiries receive an approved reply and next-step prompt.', icon: 'Search', metrics: 'Target outcome: faster response' },
      { title: 'Showing Handoff', description: 'Interested buyers are guided toward a showing or call path.', icon: 'MapPin', metrics: 'Target outcome: clearer scheduling' },
      { title: 'Follow-Up Sequence', description: 'Quiet prospects receive structured follow-up.', icon: 'Send', metrics: 'Target outcome: fewer forgotten leads' },
      { title: 'Seller Lead Capture', description: 'Seller inquiries can be routed into a consultation path.', icon: 'Home', metrics: 'Target outcome: cleaner seller intake' },
    ],
    features: ['Buyer inquiry response', 'Showing handoff', 'Seller lead capture', 'Follow-up sequence', 'Missed-call recovery', 'Lead reactivation'],
  }),

  'property-services': buildIndustry({
    slug: 'property-services',
    industry_name: 'Property Services',
    display_name: 'Property Services Automation System',
    headline: 'Capture Property Service Inquiries Before They Go Cold',
    subheadline: 'AI systems for property service teams that need response, routing, booking, and follow-up support.',
    description: 'ClientSurge helps property service teams capture repair, maintenance, leasing, and service inquiries with a clearer response and follow-up path.',
    pains: [
      { title: 'Scattered Requests', desc: 'Calls, forms, and messages often arrive across different channels.' },
      { title: 'Slow Routing', desc: 'Requests can wait before the right person sees them.' },
      { title: 'Manual Follow-Up', desc: 'Incomplete follow-up creates stalled opportunities.' },
      { title: 'Review Timing', desc: 'Reputation requests are easy to miss after completed service.' },
    ],
    useCases: [
      { title: 'Inquiry Capture', description: 'Requests are organized by contact, property, need, and source.', icon: 'Building2', metrics: 'Target outcome: cleaner routing' },
      { title: 'Missed-Call Recovery', description: 'Missed calls receive a text-back and next-step prompt.', icon: 'Phone', metrics: 'Target outcome: fewer dropped requests' },
      { title: 'Booking Handoff', description: 'Qualified requests move toward booking or callback.', icon: 'Calendar', metrics: 'Target outcome: clearer scheduling' },
      { title: 'Follow-Up Path', description: 'Open conversations receive structured follow-up.', icon: 'MessageSquare', metrics: 'Target outcome: fewer stalled inquiries' },
    ],
    features: ['Request capture', 'Routing support', 'Missed-call text-back', 'Booking handoff', 'Follow-up sequence', 'Review requests'],
  }),

  veterinary: buildIndustry({
    slug: 'veterinary',
    industry_name: 'Veterinary Clinic',
    display_name: 'Veterinary Clinic Automation System',
    headline: 'Help Pet Owner Inquiries Get a Faster Next Step',
    subheadline: 'AI systems for veterinary teams that need response, appointment handoff, reminders, and follow-up support.',
    description: 'ClientSurge helps veterinary clinics capture appointment requests, route inquiries, follow up consistently, and support appointment confirmation workflows.',
    pains: [
      { title: 'Front Desk Overload', desc: 'Calls and requests arrive while staff are helping clients and pets.' },
      { title: 'Appointment Request Delays', desc: 'Pet owners need a clear next step quickly.' },
      { title: 'Reminder Gaps', desc: 'Appointment and follow-up reminders are easy to miss manually.' },
      { title: 'Past Client Reactivation', desc: 'Wellness reminders and past clients need structured follow-up.' },
    ],
    useCases: [
      { title: 'Appointment Request Capture', description: 'Requests are captured with pet owner details and service need.', icon: 'ClipboardList', metrics: 'Target outcome: cleaner intake' },
      { title: 'Missed-Call Text-Back', description: 'Missed callers receive a timely text-back.', icon: 'Phone', metrics: 'Target outcome: fewer dropped calls' },
      { title: 'Booking Handoff', description: 'Interested owners are routed toward the right booking path.', icon: 'Calendar', metrics: 'Target outcome: clearer scheduling' },
      { title: 'Wellness Reactivation', description: 'Past clients can receive structured reminder campaigns.', icon: 'RotateCw', metrics: 'Target outcome: more re-engagement' },
    ],
    features: ['Appointment request capture', 'Missed-call recovery', 'Booking handoff', 'Reminder support', 'Client reactivation', 'Review requests'],
  }),
};

export function getIndustryBySlug(slug) {
  return INDUSTRY_MARKETING_DATA[slug] || null;
}

export function getAllIndustries() {
  return Object.values(INDUSTRY_MARKETING_DATA);
}

export function getIndustrySlugs() {
  return Object.keys(INDUSTRY_MARKETING_DATA);
}

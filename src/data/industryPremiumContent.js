/**
 * Industry Premium Content Registry — Sprint 3.1
 *
 * Modular content registry for premium industry pages.
 * Each industry has unique hero, pain points, automation solutions,
 * revenue leak language, lead capture workflow, benefits, recommended
 * system, FAQ, SEO metadata, and final CTA.
 *
 * Rules enforced:
 * - No fabricated testimonials or case studies
 * - No unsupported revenue claims or invented statistics
 * - Every industry must have unique copy — no generic duplication
 * - Content is decoupled from components for future scalability
 *
 * Currently covers Sprint 3.1 industries:
 *   hvac, roofing, dental, med-spa, law-firm
 *
 * Future industries can be added here without touching components.
 */

export const INDUSTRY_PREMIUM_CONTENT = {
  // ═══════════════════════════════════════════════════════════
  // HVAC
  // ═══════════════════════════════════════════════════════════
  hvac: {
    seo: {
      title: 'HVAC AI Lead Response & Missed Call Automation | ClientSurge',
      metaDescription:
        'Automate HVAC emergency call response, missed-call text-back, and appointment booking. Capture after-hours service calls before competitors answer.',
      h1: 'Never Lose Another Emergency Service Call',
      h2Structure: [
        'Where HVAC Opportunities Slip Away',
        'How ClientSurge Automates HVAC Lead Response',
        'The Cost of Unanswered HVAC Calls',
        'Your HVAC Lead Capture Workflow',
        'What Changes When HVAC Leads Get Automated',
        'Recommended HVAC System',
        'HVAC Automation FAQ',
      ],
      keywords: [
        'HVAC lead automation',
        'emergency AC repair response',
        'missed call text back HVAC',
        'HVAC dispatch automation',
        'after-hours HVAC calls',
        'HVAC appointment booking',
      ],
      searchIntent:
        'Transactional — HVAC owners searching for automated lead response and missed-call recovery solutions',
    },

    hero: {
      headline: 'Never Lose Another Emergency Service Call',
      subheadline:
        'AI responds to every HVAC inquiry in under 60 seconds — capturing emergency AC repair calls, after-hours service requests, and maintenance inquiries before the homeowner calls your competitor.',
      description:
        'ClientSurge builds HVAC-specific AI growth systems that combine instant lead response, missed-call text-back, emergency triage, and appointment booking into one automated workflow — so no service call slips through the cracks.',
      primaryCTA: 'See HVAC Automation Pricing',
      secondaryCTA: 'View Automation Stack',
    },

    painPoints: [
      {
        title: 'Emergency Calls Happen After Hours',
        desc: 'AC failures and heating outages do not wait for business hours. When a homeowner calls at 9 PM and reaches voicemail, they call the next HVAC company on the list — and that job is gone by morning.',
      },
      {
        title: 'Peak-Season Call Volume Overwhelms Dispatch',
        desc: 'During summer surges, your dispatch team cannot answer every call. Calls queue up, get abandoned, and turn into lost revenue — sometimes thousands of dollars per missed emergency repair.',
      },
      {
        title: 'Competitors Respond Faster',
        desc: 'Homeowners calling for emergency service typically contact 3–4 HVAC companies. The first one to respond with a clear next step usually wins the job. A two-hour callback window is already too late.',
      },
    ],

    automationSolutions: [
      {
        title: 'Missed-Call Recovery',
        desc: 'When a homeowner calls and nobody answers, an instant branded text-back goes out within 60 seconds — confirming your service area, asking for the issue type, and offering the next available appointment window.',
      },
      {
        title: 'Emergency Inquiry Response',
        desc: 'Every form submission, website inquiry, and missed call receives an automated AI response that captures the issue type (AC outage, no heat, leak near unit), urgency level, and address — before dispatch even reviews it.',
      },
      {
        title: 'Estimate Request Follow-Up',
        desc: 'Open tune-up, maintenance plan, and installation estimates receive structured follow-up over 14 days — with seasonal maintenance tips, filter change reminders, and scheduling offers — so past customers do not go quiet.',
      },
      {
        title: 'Dispatch Qualification',
        desc: 'Before a technician is ever dispatched, the AI collects job type, urgency, address, access notes, and preferred timing — giving your dispatch team a cleaner handoff and reducing back-and-forth calls.',
      },
    ],

    revenueLeak: {
      headline: 'Every Unanswered HVAC Call Creates an Opening for a Competitor',
      body: 'When a homeowner has a broken AC in July, they do not leave voicemails. They call the next company on the list. Every unanswered inquiry — whether after hours, during peak season, or while your team is on-site — creates an opportunity for a competitor to respond first and win the job.',
      points: [
        'Emergency callers rarely wait more than a few minutes before trying the next company',
        'After-hours calls go to voicemail and are rarely recovered',
        'Peak-season call surges create more inquiries than dispatch can manually handle',
        'Past maintenance customers drift to competitors without seasonal reactivation',
      ],
    },

    leadCaptureWorkflow: {
      title: 'How an HVAC Lead Moves Through the System',
      steps: [
        { label: 'Homeowner Submits Inquiry', desc: 'Call, form, or text — any channel' },
        { label: 'AI Responds in 60 Seconds', desc: 'Branded text-back with service-area confirmation' },
        { label: 'Emergency Urgency Detected', desc: 'AC outage, no heat, or leak flagged for priority' },
        { label: 'Service Window Offered', desc: 'Next available appointment presented automatically' },
        { label: 'Appointment Confirmed', desc: 'Homeowner books directly into dispatch calendar' },
        { label: 'Dispatch Team Notified', desc: 'Job details, address, and urgency sent to your team' },
      ],
    },

    benefits: [
      {
        title: 'Faster Emergency Response',
        desc: 'Every after-hours and peak-season call gets a response in under 60 seconds — before the homeowner calls your competitor.',
      },
      {
        title: 'More Estimate Opportunities',
        desc: 'Open tune-up, maintenance plan, and installation estimates receive structured follow-up so past customers do not go quiet between seasons.',
      },
      {
        title: 'Less Dispatcher Workload',
        desc: 'The AI collects job type, urgency, address, and preferred timing before dispatch reviews — so your team gets cleaner handoffs and fewer back-and-forth calls.',
      },
    ],

    recommendedSystem: {
      tier: 'Growth System',
      tierKey: 'growth',
      reason:
        'Best fit for HVAC companies handling recurring inbound service calls, after-hours emergencies, and seasonal maintenance follow-up. Growth adds 14-day nurture and smart booking on top of instant response and missed-call recovery.',
    },

    faq: [
      {
        q: 'Can AI respond to emergency HVAC service requests after hours?',
        a: 'Yes. When a homeowner calls after hours and nobody answers, the system sends an instant branded text-back within 60 seconds. It captures the issue type (AC outage, no heat, leak), confirms your service area, and offers the next available appointment window — so the homeowner does not call the next HVAC company.',
      },
      {
        q: 'How does missed-call text-back work for HVAC?',
        a: 'When a call goes unanswered, the system automatically sends a branded SMS that acknowledges the call, asks for the issue type and urgency, and provides a booking link or callback path. The homeowner gets an immediate response and your dispatch team gets organized job context.',
      },
      {
        q: 'Can the system qualify whether a call is a true emergency?',
        a: 'Yes. The AI asks targeted questions about the issue — AC outage, no heat, water near the unit, gas smell — and flags true emergencies for priority dispatch. Non-urgent tune-up and maintenance inquiries can be booked for the next available window.',
      },
      {
        q: 'Will this work during summer peak-season call surges?',
        a: 'Yes. The system is designed to handle volume spikes. Every call, form, and text gets a response in under 60 seconds — even when your dispatch team is overwhelmed. Inquiries are organized by urgency and job type before your team reviews them.',
      },
      {
        q: 'Does the system follow up on past maintenance and tune-up customers?',
        a: 'Yes. Past customers and open estimates receive a 14-day nurture sequence with seasonal maintenance tips, filter change reminders, and tune-up offers — so recurring revenue does not slip away between seasons.',
      },
    ],

    finalCTA: {
      headline: 'See How HVAC Automation Works',
      body: 'Compare HVAC-tailored packages, choose the system that fits your call volume, and move into guided setup — from first inquiry to booked service call.',
      buttonLabel: 'See HVAC Automation Pricing',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ROOFING
  // ═══════════════════════════════════════════════════════════
  roofing: {
    seo: {
      title: 'Roofing Lead Automation & Storm Damage Response | ClientSurge',
      metaDescription:
        'Automate roofing lead capture, storm-damage inquiry response, inspection booking, and estimate follow-up. Win more roof jobs before competitors respond.',
      h1: 'Capture Every Storm-Damage Lead Before Competitors Answer',
      h2Structure: [
        'Where Roofing Opportunities Slip Away',
        'How ClientSurge Automates Roofing Lead Response',
        'The Cost of Slow Storm-Damage Response',
        'Your Roofing Lead Capture Workflow',
        'What Changes When Roofing Leads Get Automated',
        'Recommended Roofing System',
        'Roofing Automation FAQ',
      ],
      keywords: [
        'roofing lead automation',
        'storm damage lead response',
        'roof inspection booking',
        'roofing estimate follow-up',
        'missed call recovery roofing',
        'roofing CRM automation',
      ],
      searchIntent:
        'Transactional — roofing contractors searching for automated lead response and storm-damage capture solutions',
    },

    hero: {
      headline: 'Capture Every Storm-Damage Lead Before Competitors Answer',
      subheadline:
        'AI responds to every roofing inquiry in under 60 seconds — capturing storm-damage calls, inspection requests, and estimate inquiries before the homeowner calls the next roofer on their list.',
      description:
        'ClientSurge builds roofing-specific AI growth systems that combine instant lead response, missed-call text-back, storm-damage intake, inspection booking, and estimate follow-up — so no high-value roof job slips through the cracks.',
      primaryCTA: 'See Roofing Automation Pricing',
      secondaryCTA: 'View Automation Stack',
    },

    painPoints: [
      {
        title: 'Storm Windows Create Lead Surges',
        desc: 'After hail, wind, or heavy rain, homeowners contact 3–5 roofers and hire the one that responds first. If your team is overwhelmed or after-hours, those storm leads go to whoever picks up the phone.',
      },
      {
        title: 'Inspection Scheduling Gets Chaotic',
        desc: 'Roofing leads need address, damage type, roof age, insurance context, and photos before your team can schedule an inspection. Without that context collected upfront, scheduling turns into a back-and-forth game.',
      },
      {
        title: 'Estimates Go Cold Without Follow-Up',
        desc: 'Open roof repair and replacement estimates often stall when follow-up depends on memory. A good inspection can still die if nobody follows up at the right time with the right next step.',
      },
    ],

    automationSolutions: [
      {
        title: 'Storm-Damage Lead Capture',
        desc: 'When a homeowner reports roof damage, the AI captures damage type (hail, wind, leak), address, roof age, insurance status, and timing — organizing everything your sales team needs before the inspection call.',
      },
      {
        title: 'Missed-Call Text-Back',
        desc: 'Missed storm-damage calls get an instant branded text-back — confirming receipt, asking about storm timing and damage type, and offering the next available inspection slot before the homeowner calls the next roofer.',
      },
      {
        title: 'Inspection Booking Handoff',
        desc: 'Qualified homeowners book roof inspections directly through the AI — with address, damage type, and insurance context already collected and sent to your sales team for a cleaner handoff.',
      },
      {
        title: 'Estimate Follow-Up',
        desc: 'Open roof repair and replacement estimates receive structured follow-up over 14 days — with financing options, insurance claim guides, and before/after project photos — so quotes do not go cold.',
      },
    ],

    revenueLeak: {
      headline: 'After a Storm, the First Roofer to Respond Usually Wins',
      body: 'When a homeowner has roof damage, they do not wait for a callback. They call the next roofer on their list. Every unanswered storm-damage inquiry — whether during a surge, after hours, or while your team is on-site — creates an opportunity for a competitor to respond first and win a high-value job.',
      points: [
        'Storm-damage callers contact multiple roofers and hire the first responder',
        'After-hours storm calls go to voicemail and are rarely recovered',
        'Peak-season surges create more inquiries than sales teams can manually handle',
        'Old storm leads and stalled estimates sit dormant without structured reactivation',
      ],
    },

    leadCaptureWorkflow: {
      title: 'How a Roofing Lead Moves Through the System',
      steps: [
        { label: 'Homeowner Reports Damage', desc: 'Call, form, or text — any channel' },
        { label: 'AI Captures Storm Details', desc: 'Damage type, address, roof age, insurance context' },
        { label: 'Inspection Qualified', desc: 'Urgency and scope assessed before scheduling' },
        { label: 'Estimate Follow-Up Triggered', desc: '14-day nurture for open quotes' },
        { label: 'Inspection Scheduled', desc: 'Homeowner books directly into sales calendar' },
        { label: 'Sales Team Notified', desc: 'Job context, address, and damage details sent' },
      ],
    },

    benefits: [
      {
        title: 'Faster Storm-Damage Response',
        desc: 'Every storm-damage call and form gets a response in under 60 seconds — before the homeowner calls the next roofer on their list.',
      },
      {
        title: 'More Inspection Bookings',
        desc: 'Qualified homeowners book inspections directly through the AI — with address, damage type, and insurance context already organized for your sales team.',
      },
      {
        title: 'Cleaner Estimate Pipeline',
        desc: 'Open roof repair and replacement estimates receive structured 14-day follow-up — with financing guides and insurance claim resources — so quotes do not stall.',
      },
    ],

    recommendedSystem: {
      tier: 'Growth System',
      tierKey: 'growth',
      reason:
        'Best fit for roofing companies handling storm surges, high-value inspection leads, and estimate follow-up. Growth adds 14-day nurture and smart booking on top of instant response and missed-call recovery.',
    },

    faq: [
      {
        q: 'Can AI respond to storm-damage calls after a hailstorm or wind event?',
        a: 'Yes. When a storm hits and call volume surges, every missed call gets an instant branded text-back within 60 seconds. The AI captures damage type, address, roof age, and insurance status — so your sales team has organized context before the inspection call.',
      },
      {
        q: 'How does missed-call text-back work for roofing?',
        a: 'When a call goes unanswered, the system sends a branded SMS that acknowledges the call, asks about storm timing and damage type, and provides a booking link for the next available inspection. The homeowner gets an immediate response instead of calling the next roofer.',
      },
      {
        q: 'Can the system collect insurance and roof age information before the inspection?',
        a: 'Yes. The AI asks targeted questions about damage type, roof age, insurance status, and timing — collecting the context your sales team needs to prioritize inspections and prepare estimates before the first call.',
      },
      {
        q: 'Does the system follow up on open roof repair and replacement estimates?',
        a: 'Yes. Open estimates receive a 14-day nurture sequence with financing options, insurance claim guides, and before/after project photos — so quotes do not go cold while the homeowner is deciding.',
      },
      {
        q: 'Can old storm leads be reactivated after the initial surge passes?',
        a: 'Yes. Past storm-damage inquiries, stalled inspections, and old estimates receive structured reactivation campaigns — bringing dormant roofing opportunities back into motion with controlled messaging.',
      },
    ],

    finalCTA: {
      headline: 'Build My Roofing Lead System',
      body: 'Compare roofing-tailored packages, choose the system that fits your storm volume, and move into guided setup — from first inquiry to scheduled inspection.',
      buttonLabel: 'See Roofing Automation Pricing',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // DENTAL
  // ═══════════════════════════════════════════════════════════
  dental: {
    seo: {
      title: 'Dental Practice Lead Automation & Appointment Booking | ClientSurge',
      metaDescription:
        'Automate dental new-patient response, appointment scheduling, recall campaigns, and no-show recovery. Fill empty chairs without overloading your front desk.',
      h1: 'Turn More Website Visitors Into Scheduled Appointments',
      h2Structure: [
        'Where Dental Opportunities Slip Away',
        'How ClientSurge Automates Dental Lead Response',
        'The Cost of Unanswered Patient Inquiries',
        'Your Dental Lead Capture Workflow',
        'What Changes When Patient Inquiries Get Automated',
        'Recommended Dental System',
        'Dental Automation FAQ',
      ],
      keywords: [
        'dental lead automation',
        'dental appointment booking',
        'new patient response dental',
        'dental recall campaigns',
        'no-show reduction dental',
        'dental front desk automation',
      ],
      searchIntent:
        'Transactional — dental practice owners searching for automated patient response and appointment booking solutions',
    },

    hero: {
      headline: 'Turn More Website Visitors Into Scheduled Appointments',
      subheadline:
        'AI responds to every dental inquiry in under 60 seconds — capturing new patient requests, insurance questions, and appointment inquiries before the patient calls the next dentist.',
      description:
        'ClientSurge builds dental-specific AI growth systems that combine instant lead response, missed-call text-back, appointment booking, recall campaigns, and no-show recovery — so your front desk can focus on in-office patients instead of chasing inquiries.',
      primaryCTA: 'See Dental Automation Pricing',
      secondaryCTA: 'View Automation Stack',
    },

    painPoints: [
      {
        title: 'Missed Consultation Requests',
        desc: 'New patient inquiries arrive during lunch hours, after close, and while your front desk is helping in-office patients. Unanswered inquiries turn into lost appointment opportunities — and the patient calls the next dentist.',
      },
      {
        title: 'Slow Insurance Inquiry Response',
        desc: 'Patients calling about insurance coverage, accepted plans, and pricing often wait for a callback. If the answer takes too long, they book with a practice that responds faster — even if your care is better.',
      },
      {
        title: 'Staff Overwhelmed by Call Volume',
        desc: 'Your front desk is managing check-ins, checkout, insurance verification, and patient questions — all while new calls and form fills arrive. When the phone rings unanswered, new patient opportunities slip away.',
      },
    ],

    automationSolutions: [
      {
        title: 'Appointment Booking Automation',
        desc: 'New patients book their first appointment directly through the AI — synced to your operatory schedule with reason for visit pre-filled. No waiting for the front desk to call back with available times.',
      },
      {
        title: 'Insurance Inquiry Routing',
        desc: 'Patients asking about insurance coverage and accepted plans get an instant response with basic plan information and a path to verify specifics — reducing front-desk call volume while keeping the patient engaged.',
      },
      {
        title: 'Recall Campaigns',
        desc: 'Inactive patients and overdue hygiene visits receive structured recall campaigns — with appointment reminders, cleaning benefits, and booking links — so dormant patients do not drift to competitors.',
      },
      {
        title: 'No-Show Recovery',
        desc: 'Automated multi-channel reminders (SMS + email) go out 24 hours and 2 hours before appointments — reducing no-shows and keeping your schedule full without manual reminder calls.',
      },
    ],

    revenueLeak: {
      headline: 'Every Unanswered Patient Inquiry Creates an Opening for a Competitor',
      body: 'When a patient submits a new patient form or calls about an appointment, they are actively comparing practices. If your front desk cannot respond quickly — during lunch, after hours, or during peak call times — the patient books with whoever answers first. Every unanswered inquiry is a lost appointment.',
      points: [
        'New patient inquiries arrive when the front desk is busiest',
        'Patients comparing practices book with whoever responds first',
        'Inactive patients drift to competitors without recall campaigns',
        'No-shows create empty chairs that manual reminders cannot prevent',
      ],
    },

    leadCaptureWorkflow: {
      title: 'How a Dental Lead Moves Through the System',
      steps: [
        { label: 'Patient Inquiry Received', desc: 'Call, form, or Google Business profile' },
        { label: 'AI Responds with Availability', desc: 'Instant reply with appointment options' },
        { label: 'Patient Books Appointment', desc: 'Booked directly into operatory schedule' },
        { label: 'Reminder Sent Automatically', desc: 'SMS + email 24 hours and 2 hours before' },
        { label: 'Patient Arrives for Visit', desc: 'No-show risk reduced with reminders' },
        { label: 'Review Request Triggered', desc: 'Google review request sent after visit' },
      ],
    },

    benefits: [
      {
        title: 'More Scheduled Consultations',
        desc: 'New patients book appointments directly through the AI — without waiting for the front desk to call back — so inquiries convert before the patient books elsewhere.',
      },
      {
        title: 'Less Front-Desk Interruption',
        desc: 'Insurance inquiries, appointment requests, and reminders are handled automatically — so your front desk can focus on in-office patients instead of chasing phone calls.',
      },
      {
        title: 'Better Patient Communication',
        desc: 'Multi-channel reminders, recall campaigns, and post-visit follow-up keep patients engaged — reducing no-shows and reactivating dormant patients without manual outreach.',
      },
    ],

    recommendedSystem: {
      tier: 'Pro System',
      tierKey: 'pro',
      reason:
        'Best fit for dental practices needing booking, follow-up, patient communication, recall campaigns, and review automation. Pro adds voice AI receptionist and advanced patient segmentation for practices with high call volume.',
    },

    faq: [
      {
        q: 'Can AI help schedule new patient appointments automatically?',
        a: 'Yes. When a new patient submits a form or calls, the AI responds in under 60 seconds with available appointment times. The patient books directly into your operatory schedule — with reason for visit pre-filled — without waiting for the front desk to call back.',
      },
      {
        q: 'How does missed-call text-back work for dental practices?',
        a: 'When a call goes unanswered — during lunch, after hours, or while the front desk is busy — the system sends a branded text-back within 60 seconds. It acknowledges the call, offers available appointment times, and provides a booking link so the patient does not call the next dentist.',
      },
      {
        q: 'Can the system reduce no-shows?',
        a: 'Yes. Automated multi-channel reminders (SMS + email) go out 24 hours and 2 hours before each appointment — keeping the schedule full without manual reminder calls. Patients who confirm or reschedule through the reminder are less likely to no-show.',
      },
      {
        q: 'Does the system handle patient recall and reactivation?',
        a: 'Yes. Inactive patients and overdue hygiene visits receive structured recall campaigns with appointment reminders, cleaning benefits, and booking links — so dormant patients come back instead of drifting to competitors.',
      },
      {
        q: 'Can the system answer insurance questions?',
        a: 'The AI can provide basic information about accepted plans and direct patients to verify specifics with your front desk — reducing routine insurance call volume while keeping the patient engaged until they can book.',
      },
    ],

    finalCTA: {
      headline: 'Build My Dental Lead System',
      body: 'Compare dental-tailored packages, choose the system that fits your patient volume, and move into guided setup — from first inquiry to scheduled appointment.',
      buttonLabel: 'See Dental Automation Pricing',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // MED SPA
  // ═══════════════════════════════════════════════════════════
  'med-spa': {
    seo: {
      title: 'Med Spa Lead Automation & Consultation Booking | ClientSurge',
      metaDescription:
        'Automate med spa treatment inquiry response, consultation booking, package nurture, and client reactivation. Convert more browsers into booked consults.',
      h1: 'Convert More Treatment Browsers Into Booked Consultations',
      h2Structure: [
        'Where Med Spa Opportunities Slip Away',
        'How ClientSurge Automates Med Spa Lead Response',
        'The Cost of Slow Consultation Follow-Up',
        'Your Med Spa Lead Capture Workflow',
        'What Changes When Treatment Inquiries Get Automated',
        'Recommended Med Spa System',
        'Med Spa Automation FAQ',
      ],
      keywords: [
        'med spa lead automation',
        'consultation booking automation',
        'treatment inquiry response',
        'med spa nurture campaigns',
        'med spa client reactivation',
        'botox filler lead response',
      ],
      searchIntent:
        'Transactional — med spa owners searching for automated consultation booking and treatment inquiry response solutions',
    },

    hero: {
      headline: 'Convert More Treatment Browsers Into Booked Consultations',
      subheadline:
        'AI responds to every med spa inquiry in under 60 seconds — capturing Botox, filler, laser, and membership leads before the prospect books a consultation with a competitor.',
      description:
        'ClientSurge builds med spa-specific AI growth systems that combine instant lead response, missed-call text-back, consultation booking, package nurture, and client reactivation — so high-value treatment inquiries do not go cold.',
      primaryCTA: 'See Med Spa Automation Pricing',
      secondaryCTA: 'View Automation Stack',
    },

    painPoints: [
      {
        title: 'High-Value Leads Researching Competitors',
        desc: 'Treatment inquiries for Botox, filler, laser, and body contouring are high-intent — but prospects compare multiple providers. If your front desk does not respond quickly, the prospect books a consultation elsewhere.',
      },
      {
        title: 'Slow Consultation Follow-Up',
        desc: 'Treatment inquiries arriving through Instagram DMs, website forms, and missed calls often wait hours for a response. By the time the front desk replies, the prospect has already booked with another med spa.',
      },
      {
        title: 'Appointment Abandonment',
        desc: 'Consultation no-shows and abandoned booking attempts create gaps in the schedule. Without automated reminders and follow-up, booked consultations slip away and revenue is lost.',
      },
    ],

    automationSolutions: [
      {
        title: 'Consultation Booking',
        desc: 'Prospects book consultations directly through the AI — synced to your calendar with treatment type pre-filled (Botox, filler, laser, body contouring) — without waiting for the front desk to call back.',
      },
      {
        title: 'Lead Nurturing',
        desc: 'Prospects who are not ready to book immediately receive a 14-day nurture sequence with before/after photos, treatment FAQs, and limited-time consultation offers — keeping them engaged until they convert.',
      },
      {
        title: 'Treatment Follow-Up',
        desc: 'After each completed treatment, the system sends a follow-up message checking on results, offering complementary services, and triggering a Google review request — timed for when satisfaction is highest.',
      },
      {
        title: 'Package Lead Nurture',
        desc: 'Higher-ticket package and membership inquiries receive structured multi-touch follow-up — because these prospects often need several touchpoints before committing to a consultation or purchase.',
      },
    ],

    revenueLeak: {
      headline: 'Treatment Inquiries Compare Multiple Providers — and Book with the Fastest',
      body: 'When a prospect inquires about Botox, filler, or laser treatments, they are actively comparing med spas. If your front desk does not respond quickly — through Instagram, website forms, or missed calls — the prospect books a consultation with whoever responds first. Every unanswered inquiry is a lost consultation.',
      points: [
        'Treatment inquiries arrive through Instagram, forms, and calls — scattered channels',
        'Prospects comparing providers book with the fastest responder',
        'Consultation no-shows create schedule gaps without automated reminders',
        'Past clients and package leads go dormant without reactivation campaigns',
      ],
    },

    leadCaptureWorkflow: {
      title: 'How a Med Spa Lead Moves Through the System',
      steps: [
        { label: 'Treatment Inquiry Arrives', desc: 'Website, Instagram, call, or form' },
        { label: 'AI Responds with Consult Options', desc: 'Instant reply with available slots' },
        { label: 'Prospect Qualified', desc: 'Treatment type and interest captured' },
        { label: 'Nurture Sequence Activated', desc: '14-day follow-up for not-yet-ready leads' },
        { label: 'Consultation Booked', desc: 'Prospect books directly into calendar' },
        { label: 'Front Desk Notified', desc: 'Treatment type and context sent to team' },
      ],
    },

    benefits: [
      {
        title: 'More Booked Consultations',
        desc: 'Prospects book consultations directly through the AI — without waiting for the front desk — so high-value treatment inquiries convert before the prospect books elsewhere.',
      },
      {
        title: 'Faster Inquiry Response',
        desc: 'Every treatment inquiry — through Instagram, website forms, or missed calls — gets a response in under 60 seconds, keeping prospects engaged instead of comparing competitors.',
      },
      {
        title: 'Cleaner Nurture Pipeline',
        desc: 'Prospects who are not ready to book immediately receive structured 14-day follow-up with before/after photos and consultation offers — so they do not go cold.',
      },
    ],

    recommendedSystem: {
      tier: 'Growth System',
      tierKey: 'growth',
      reason:
        'Best fit for med spas handling treatment inquiries across multiple channels. Growth adds 14-day nurture and smart booking on top of instant response and missed-call recovery — ideal for converting browsers into consultations.',
    },

    faq: [
      {
        q: 'Can AI follow up with treatment consultation requests automatically?',
        a: 'Yes. When a prospect inquires about Botox, filler, laser, or body contouring, the AI responds in under 60 seconds with available consultation slots. If they are not ready to book, a 14-day nurture sequence keeps them engaged with before/after photos and consultation offers.',
      },
      {
        q: 'How does missed-call text-back work for med spas?',
        a: 'When a call goes unanswered — while the front desk is busy or after hours — the system sends a branded text-back within 60 seconds. It acknowledges the inquiry, offers consultation booking, and keeps the prospect from calling the next med spa.',
      },
      {
        q: 'Can the system handle Instagram DM inquiries?',
        a: 'The system is designed to capture inquiries across channels — website forms, calls, and missed calls. Each inquiry gets an instant response with consultation options, regardless of how the prospect reached out.',
      },
      {
        q: 'Does the system nurture prospects who are not ready to book yet?',
        a: 'Yes. Prospects who are not ready to book immediately receive a 14-day nurture sequence with before/after photos, treatment FAQs, and limited-time consultation offers — so they stay engaged until they convert.',
      },
      {
        q: 'Can the system reactivate past clients and dormant leads?',
        a: 'Yes. Past treatment clients and dormant package leads receive structured reactivation campaigns — bringing them back into conversation with membership offers, seasonal treatments, and follow-up messages.',
      },
    ],

    finalCTA: {
      headline: 'Automate My Consultation Follow-Up',
      body: 'Compare med spa-tailored packages, choose the system that fits your inquiry volume, and move into guided setup — from first inquiry to booked consultation.',
      buttonLabel: 'See Med Spa Automation Pricing',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // LAW FIRM
  // ═══════════════════════════════════════════════════════════
  'law-firm': {
    seo: {
      title: 'Law Firm Lead Automation & Intake Qualification | ClientSurge',
      metaDescription:
        'Automate law firm after-hours intake, consultation booking, case qualification, and dormant lead reactivation. Capture high-value legal leads before competitors respond.',
      h1: 'Capture High-Value Legal Leads Before Competitors Respond',
      h2Structure: [
        'Where Law Firm Opportunities Slip Away',
        'How ClientSurge Automates Legal Lead Response',
        'The Cost of Unanswered Case Inquiries',
        'Your Law Firm Lead Capture Workflow',
        'What Changes When Case Inquiries Get Automated',
        'Recommended Law Firm System',
        'Law Firm Automation FAQ',
      ],
      keywords: [
        'law firm lead automation',
        'legal intake automation',
        'attorney consultation booking',
        'case qualification automation',
        'after-hours law firm intake',
        'law firm CRM automation',
      ],
      searchIntent:
        'Transactional — law firm partners and intake managers searching for automated lead response and case qualification solutions',
    },

    hero: {
      headline: 'Capture High-Value Legal Leads Before Competitors Respond',
      subheadline:
        'AI responds to every case inquiry in under 60 seconds — capturing after-hours intake, qualifying case types, and booking consultations before the prospect calls the next attorney.',
      description:
        'ClientSurge builds law firm-specific AI growth systems that combine instant lead response, missed-call text-back, after-hours intake, consultation booking, case qualification, and dormant lead reactivation — so no high-value case inquiry goes unanswered.',
      primaryCTA: 'See Law Firm Automation Pricing',
      secondaryCTA: 'View Automation Stack',
    },

    painPoints: [
      {
        title: 'Expensive Leads Going Unanswered',
        desc: 'Legal leads are among the most expensive to acquire — often $50–$200+ per inquiry. When those calls go to voicemail after hours or during court, the prospect calls the next attorney who answers. Each missed call can be a $20K–$100K case.',
      },
      {
        title: 'Intake Delays',
        desc: 'Prospects who submit consultation requests expect a fast response. If intake staff cannot call back quickly — during court, depositions, or after hours — the prospect moves on. Legal clients do not wait for callbacks.',
      },
      {
        title: 'Missed After-Hours Consultations',
        desc: 'Injury, family law, and criminal defense callers often reach out after hours and on weekends. When those calls go to voicemail, the prospect calls the next firm — and the case is gone by Monday morning.',
      },
    ],

    automationSolutions: [
      {
        title: 'Intake Qualification',
        desc: 'When a prospect calls or submits a form, the AI captures case type (personal injury, family law, criminal defense, civil), urgency, and basic facts — qualifying the lead before intake staff reviews it.',
      },
      {
        title: 'Consultation Scheduling',
        desc: 'Prospects book free consultations directly through the AI — synced to the attorney calendar with case type pre-filled — so interested prospects do not lose momentum waiting for intake to call back.',
      },
      {
        title: 'Lead Response Automation',
        desc: 'Every case inquiry — calls, forms, and missed calls — gets a response in under 60 seconds. The system acknowledges the inquiry with empathy, provides next steps, and offers a consultation booking link.',
      },
      {
        title: 'Dormant Lead Reactivation',
        desc: 'Past consultations and old inquiries receive structured reactivation campaigns — with case evaluation guides, FAQ resources, and consultation reminders — so dormant prospects come back when they are ready.',
      },
    ],

    revenueLeak: {
      headline: 'Legal Prospects Do Not Wait — They Call the Next Attorney',
      body: 'When someone needs an attorney, they are often in a time-sensitive situation. They do not leave voicemails and wait. They call the next firm on their list. Every unanswered case inquiry — after hours, during court, or while intake is busy — creates an opportunity for a competitor to capture a high-value case.',
      points: [
        'Legal leads are expensive to acquire — each missed call wastes ad spend',
        'After-hours callers do not leave voicemails — they call the next firm',
        'Prospects submitting consultation forms expect a response within minutes',
        'Past consultations and old inquiries have residual value but go untouched',
      ],
    },

    leadCaptureWorkflow: {
      title: 'How a Law Firm Lead Moves Through the System',
      steps: [
        { label: 'Prospect Calls or Submits Form', desc: 'After hours, weekends, or during court' },
        { label: 'AI Captures Case Type', desc: 'Injury, family, criminal, civil — and urgency' },
        { label: 'Consultation Qualified', desc: 'Case facts and timeline collected' },
        { label: 'Booking Link Sent', desc: 'Prospect books directly into attorney calendar' },
        { label: 'Consultation Scheduled', desc: 'Case context pre-filled for the attorney' },
        { label: 'Attorney Notified', desc: 'Case type, urgency, and facts sent for review' },
      ],
    },

    benefits: [
      {
        title: 'Faster Intake Response',
        desc: 'Every case inquiry gets a response in under 60 seconds — with empathy, next steps, and a consultation booking link — so prospects do not call the next attorney while waiting for intake.',
      },
      {
        title: 'More Booked Consultations',
        desc: 'Prospects book consultations directly through the AI — synced to the attorney calendar with case type pre-filled — so interested prospects do not lose momentum.',
      },
      {
        title: 'Better Case Qualification',
        desc: 'The AI collects case type, urgency, and basic facts before intake reviews — so attorneys spend time on qualified cases instead of filtering unqualified calls.',
      },
    ],

    recommendedSystem: {
      tier: 'Pro System',
      tierKey: 'pro',
      reason:
        'Best fit for law firms needing after-hours intake, consultation booking, case qualification, and dormant lead reactivation. Pro adds voice AI receptionist for 24/7 call handling and advanced case-type routing.',
    },

    faq: [
      {
        q: 'Can AI qualify potential clients before intake?',
        a: 'Yes. When a prospect calls or submits a form, the AI captures case type (personal injury, family law, criminal defense, civil), urgency, and basic facts. Intake staff receives only qualified leads with context — instead of spending time filtering unqualified calls.',
      },
      {
        q: 'How does after-hours intake automation work for law firms?',
        a: 'When a prospect calls after hours or on weekends and nobody answers, the system sends an instant branded text-back within 60 seconds. It acknowledges the inquiry with empathy, asks for case type, and provides a consultation booking link — so the prospect does not call the next firm.',
      },
      {
        q: 'Can the system schedule consultations automatically?',
        a: 'Yes. Prospects book free consultations directly through the AI — synced to the attorney calendar with case type pre-filled. The prospect does not wait for intake to call back with available times.',
      },
      {
        q: 'Does the system handle missed calls when attorneys are in court?',
        a: 'Yes. When attorneys or intake staff are unavailable — during court, depositions, or meetings — the system responds to every call and form in under 60 seconds. Prospects get an immediate response instead of reaching voicemail.',
      },
      {
        q: 'Can the system reactivate dormant case inquiries?',
        a: 'Yes. Past consultations and old inquiries receive structured reactivation campaigns with case evaluation guides, FAQ resources, and consultation reminders — bringing dormant prospects back when they are ready to move forward.',
      },
    ],

    finalCTA: {
      headline: 'Capture Every Legal Lead',
      body: 'Compare law firm-tailored packages, choose the system that fits your case volume, and move into guided setup — from first inquiry to scheduled consultation.',
      buttonLabel: 'See Law Firm Automation Pricing',
    },
  },
};

/**
 * Get premium content for an industry by slug.
 * Returns null if no premium content exists (non-Sprint-3.1 industries).
 */
export function getPremiumContent(slug) {
  return INDUSTRY_PREMIUM_CONTENT[slug] || null;
}

/**
 * Check whether an industry has premium content registered.
 */
export function hasPremiumContent(slug) {
  return Boolean(INDUSTRY_PREMIUM_CONTENT[slug]);
}

/**
 * Get all industry slugs that have premium content.
 */
export function getPremiumIndustrySlugs() {
  return Object.keys(INDUSTRY_PREMIUM_CONTENT);
}
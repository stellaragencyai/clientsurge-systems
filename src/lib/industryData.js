// Centralized industry data - single source of truth for all 6 industries
// #95: Canonical industry data. Do NOT duplicate industry definitions inline in components.
// Components should import from here. Industry-specific automation use cases: lib/sixAutomations.js INDUSTRY_AUTOMATION_USE_CASES.
// Structure allows easy addition of new industries with minimal code
// Variations: images, pain points, SMS demo, metrics, testimonials, FAQs are industry-specific
// Shared sections: layout, component structure, CTA flow

export const INDUSTRIES = {
  "med-spa": {
    id: "med-spa",
    name: "Med Spas & Aesthetic Clinics",
    shortName: "Med Spas",
    slug: "med-spa",
    routePath: "/med-spa",
    
    // Hero section
    hero: {
      eyebrow: "For Aesthetic Clinics",
      headline: "Book More Med Spa Consults Before Leads Go Cold",
      subheadline: "ClientSurge helps med spas respond to consultation requests, aesthetic treatment inquiries, missed DMs and calls, and booking handoffs before high-intent leads drift away.",
      cta: "Free Med Spa Automation Audit",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      treatmentFlow: {
        label: "Treatment-Specific Lead Intake",
        description: "Dropdown selector for Botox, Fillers, Laser, Facials, etc. for better qualification",
        enabled: true,
      },
      beforeAfter: {
        label: "Before/After Gallery",
        description: "Showcases aesthetic improvements to build confidence",
        enabled: true,
      },
      luxuryTone: {
        label: "Refined, Lifestyle-Oriented Copy",
        description: "Premium language focused on confidence and self-care vs. medical terminology",
        enabled: true,
      },
      reviewSpotlight: {
        label: "5-Star Review Carousel",
        description: "Real patient testimonials and Google review snippets",
        enabled: true,
      },
      smsRefinement: {
        label: "Conversational, Non-Clinical SMS",
        description: "Messages sound friendly and aspirational, not clinical",
        enabled: true,
      },
    },

    // Industry pain stats
    painStats: [
      { icon: "⏱️", value: "47%", label: "of leads go dark if not contacted within 5 min" },
      { icon: "📱", value: "3x", label: "more conversions with guided booking flow" },
      { icon: "💰", value: "$800-2000", label: "avg revenue per appointment lost to no-show follow-up" },
    ],

    // Problem/solution cards
    problems: [
      {
        problem: "Phone inquiry goes to voicemail",
        stat: "62% of callers never leave a message",
        solution: "Instant SMS the moment a call is missed",
        result: "Zero missed opportunity",
      },
      {
        problem: "Website form leads sit for hours",
        stat: "Odds drop 21× after 5 minutes",
        solution: "Automated response within 60 seconds",
        result: "Under 60 sec response",
      },
      {
        problem: "Interested leads never get pushed to book",
        stat: "Guided booking increases conversions 3×",
        solution: "AI conversation guides warm leads to calendar",
        result: "Cleaner path to booking",
      },
      {
        problem: "Old leads never get a second chance",
        stat: "56% of old leads convert when re-engaged",
        solution: "Reactivation SMS brings dormant leads back",
        result: "Old leads re-engaged",
      },
      {
        problem: "Manual follow-up eats hours of staff time",
        stat: "80% of sales require 5+ touchpoints",
        solution: "14-day automated nurture sequence",
        result: "14-day nurture",
      },
      {
        problem: "No pipeline visibility or tracking",
        stat: "Companies lose 20–30% of revenue to poor visibility",
        solution: "Every lead tracked from first contact to booked appointment",
        result: "Full pipeline visibility",
      },
    ],

    // SMS demo simulation
    smsDemo: {
      businessName: "Luminous Aesthetics",
      initialMessage: "Hi! I'm interested in a Botox appointment. What are your rates?",
      automatedResponse: "Hi! Thanks for reaching out to Luminous. 💉 We're here to help! Standard Botox starts at $150. Would you like to see availability? Our next opening is tomorrow at 2 PM or Friday morning.",
      leadReply: "Tomorrow at 2 works perfect!",
      confirmationMessage: "Awesome! Your appointment is confirmed for tomorrow at 2 PM. Here's your confirmation: [link]. See you soon! 🎉",
    },

    // Metrics/results
    metrics: [
      { value: "60 sec", label: "target response window for consult and treatment inquiries" },
      { value: "14-day", label: "nurture path for unbooked consult requests" },
      { value: "5-7 business", label: "days for setup after onboarding and provider access" },
    ],

    // Credibility note, not a customer testimonial.
    testimonial: {
      type: "readiness",
      label: "Launch proof boundary",
      quote: "Use this page for controlled traffic only after source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },

    // FAQ section
    faqs: [
      {
        q: "How does the AI know what to say in the response?",
        a: "We train the AI on your specific business: your pricing, services, booking process, and brand voice. It learns from your best responses and adapts.",
      },
      {
        q: "Can we customize the response messages?",
        a: "Yes. We set up your messaging during onboarding, and you can update templates anytime. Most clients refine it in week 2-3 after seeing what works.",
      },
      {
        q: "What if we want to manually reply to some messages?",
        a: "The system detects when you respond, pauses automation for that lead, and stops sending follow-ups once you engage.",
      },
      {
        q: "Do you integrate with our booking calendar?",
        a: "Yes. We sync with Google Calendar, Calendly, Acuity, and other major platforms so leads see real availability.",
      },
      {
        q: "How long until we see results?",
        a: "Local setup can be completed quickly once provider access, services, booking rules, and compliance copy are confirmed. Production lift must be measured after a controlled launch.",
      },
    ],
  },

  "dental": {
    id: "dental",
    name: "Dental & Orthodontics",
    shortName: "Dental Practices",
    slug: "dental",
    routePath: "/dental",
    
    hero: {
      eyebrow: "For Dental Offices",
      headline: "Turn More New Patient Inquiries Into Confirmed Appointments",
      subheadline: "ClientSurge helps dental teams capture new patient calls, appointment requests, missed front desk inquiries, recall opportunities, and follow-up tasks before patients move on.",
      cta: "Free Dental Automation Audit",
      image: "https://images.unsplash.com/photo-1606811841694-647df192d289?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      emergencyToggle: {
        label: "Emergency Tooth Pain Fast-Track",
        description: "Prominent button in hero for immediate emergency response",
        enabled: true,
      },
      insuranceWidget: {
        label: "Insurance Provider Icons",
        description: "Visual grid showing all accepted insurance plans",
        enabled: true,
      },
      ehrBadge: {
        label: "EHR Integration Badges",
        description: "Clear indicators for Dentrix, Eaglesoft, Open Dental compatibility",
        enabled: true,
      },
      appointmentReminders: {
        label: "Detailed Reminder Logic",
        description: "Explains SMS/Email recall sequence for hygiene visits",
        enabled: true,
      },
      doctorProfiles: {
        label: "Meet the Doctor Cards",
        description: "Small profile previews of dentists and specialists",
        enabled: true,
      },
    },

    painStats: [
      { icon: "📞", value: "40%", label: "of dental calls go unanswered during busy hours" },
      { icon: "📅", value: "2x", label: "more confirmed appointments with instant response" },
      { icon: "🦷", value: "$200-500", label: "avg revenue per missed patient intake" },
    ],

    problems: [
      {
        problem: "Patient calls during treatment, no one picks up",
        stat: "68% of callers call a competitor if you don't answer",
        solution: "Instant SMS text-back with appointment info",
        result: "No more missed calls",
      },
      {
        problem: "Online appointment requests sit in inbox",
        stat: "24 hours of delay = 30% lower conversion",
        solution: "Automated response within 60 seconds",
        result: "Under 60 sec response",
      },
      {
        problem: "Patients need direction/parking/prep info",
        stat: "Smart chatbot answers 80% of prep questions",
        solution: "AI sends prep instructions automatically",
        result: "Fewer day-of cancellations",
      },
      {
        problem: "No follow-up on scheduling hesitation",
        stat: "2nd touch increases booking by 35%",
        solution: "Automated follow-up keeps interested patients engaged",
        result: "14-day nurture",
      },
      {
        problem: "Hygiene appointment reminders cost time",
        stat: "AI handles all reminder sequences",
        solution: "Automated reminders reduce no-shows by 20%",
        result: "Cleaner schedule",
      },
      {
        problem: "New patient intake forms scattered",
        stat: "Centralized lead tracking prevents loss",
        solution: "All patient inquiries tracked in one pipeline",
        result: "Full pipeline visibility",
      },
    ],

    smsDemo: {
      businessName: "Bright Smile Dental",
      initialMessage: "Hi, I need an emergency appointment. My tooth is killing me.",
      automatedResponse: "Hi! We're sorry to hear you're in pain. 😟 Bright Smile Dental can see you today. Our next emergency slot is 3 PM. Reply YES to confirm or call (602) 584-3227 for other times.",
      leadReply: "YES - 3 PM works",
      confirmationMessage: "Perfect! You're confirmed for today at 3 PM. Please arrive 10 min early. Address: 123 Main St. See you soon! 🦷",
    },

    metrics: [
      { value: "60 sec", label: "target response window for new-patient inquiries" },
      { value: "Recall", label: "follow-up path for unscheduled patients and treatment plans" },
      { value: "5-7 business", label: "days for setup after onboarding and provider access" },
    ],

    testimonial: {
      type: "readiness",
      label: "Launch proof boundary",
      quote: "Use this page for controlled traffic only after dental-specific source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },

    faqs: [
      {
        q: "Can the AI handle emergency calls?",
        a: "Yes. It prioritizes emergency requests, offers same-day slots, and escalates urgent cases to your team immediately.",
      },
      {
        q: "Does it work with our practice management software?",
        a: "We integrate with Dentrix, Eaglesoft, Open Dental, and most major PM systems. Sync happens in real-time.",
      },
      {
        q: "What if a patient has special needs or complications?",
        a: "The system flags complex cases for your team. Simple questions it answers; anything nuanced goes to your staff.",
      },
      {
        q: "Do patients feel like they're talking to a bot?",
        a: "No. It's conversational, uses your office voice, and handles 95% of routine questions naturally. Patients often don't realize it's AI.",
      },
      {
        q: "How much does it cost?",
        a: "The safest next step is a free dental automation audit. Pricing depends on the launch scope, integrations, and provider access needed for the practice.",
      },
    ],
  },

  "chiropractic": {
    id: "chiropractic",
    name: "Chiropractic & Physical Therapy",
    shortName: "Chiropractors",
    slug: "chiropractic",
    routePath: "/chiropractic",
    
    hero: {
      eyebrow: "For Chiropractors & PT Clinics",
      headline: "Convert Patient Inquiries Into Booked Adjustments",
      subheadline: "PT and chiropractic leads are price-sensitive and comparison-shop. Respond in 60 seconds with your rates and availability, and you win the booking.",
      cta: "See How Chiro Offices Use This",
      image: "https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      insuranceVerification: {
        label: "Insurance Verification Info",
        description: "AI guides patients on common insurance questions and pre-auth steps",
        enabled: true,
      },
      ehrIntegration: {
        label: "EHR Auto-Sync",
        description: "Direct integration with ChiroTouch, Curo, PrognoCIS",
        enabled: true,
      },
      treatmentPlanNurture: {
        label: "Unfinished Treatment Plan Follow-Up",
        description: "Automated reminders for patients who paused care",
        enabled: true,
      },
      accessibilityUI: {
        label: "Accessibility First",
        description: "Larger fonts, higher contrast for older demographics",
        enabled: true,
      },
      noShowPrevention: {
        label: "No-Show Prevention",
        description: "SMS reminders at 24h and 2h before appointments",
        enabled: true,
      },
    },

    painStats: [
      { icon: "⏱️", value: "55%", label: "of chiro inquiries go unanswered during clinic hours" },
      { icon: "📊", value: "4x", label: "better conversion with instant pricing & availability" },
      { icon: "💵", value: "$150-300", label: "avg first visit value lost per missed lead" },
    ],

    problems: [
      {
        problem: "Insurance questions come in, no one answers",
        stat: "Patients call 3+ clinics before booking",
        solution: "AI instant response with your insurance info",
        result: "You win the booking",
      },
      {
        problem: "Phone lines overloaded during peak hours",
        stat: "Staff answer only 40% of calls",
        solution: "AI handles unlimited simultaneous inquiries",
        result: "Every call answered",
      },
      {
        problem: "Patients need to know your intake process",
        stat: "Confused patients don't book",
        solution: "AI sends intake requirements automatically",
        result: "Smoother first visit",
      },
      {
        problem: "Workers comp patients need pre-auth info",
        stat: "Delayed pre-auth kills bookings",
        solution: "AI guides WC patients through pre-auth steps",
        result: "Higher close rate",
      },
      {
        problem: "Follow-up on fence-sitters takes time",
        stat: "2nd contact = 30% higher booking rate",
        solution: "14-day automated follow-up sequence",
        result: "14-day nurture",
      },
      {
        problem: "Recurring patient reminders are manual",
        stat: "AI handles all appointment reminders",
        solution: "Automated SMS reminders reduce no-shows",
        result: "Cleaner schedule",
      },
    ],

    smsDemo: {
      businessName: "Peak Performance PT",
      initialMessage: "Do you accept my insurance? I have Blue Cross.",
      automatedResponse: "Hi! Yes, we accept Blue Cross and 95+ other plans. Your first session is $125. Can you come in tomorrow at 10 AM or Wednesday at 2 PM?",
      leadReply: "Wednesday 2 PM works!",
      confirmationMessage: "Perfect! You're booked for Wednesday at 2 PM. Please bring your insurance card. 📋 Address: [clinic address]. See you soon!",
    },

    metrics: [
      { value: "71%", label: "of inquiries responded to in under 60 sec" },
      { value: "3 more", label: "patient bookings per week" },
      { value: "5-7 business", label: "days to launch and go-live" },
    ],

    testimonial: {
      quote: "We were losing patients to clinics with faster responses. Now we answer every inquiry instantly, even after hours. First month: 18 new patients. Best investment in the practice.",
      name: "Dr. Jennifer Liu",
      business: "Peak Performance PT, Seattle WA",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    },

    faqs: [
      {
        q: "Does it handle insurance verification?",
        a: "It provides common insurance info and directs complex questions to your staff. It doesn't do full eligibility checks, but guides patients on what to expect.",
      },
      {
        q: "Can it schedule patients directly into our EHR?",
        a: "Yes. We integrate with ChiroTouch, Curo, PrognoCIS, and other major EHR systems. Bookings sync automatically.",
      },
      {
        q: "What if we need to adjust intake requirements?",
        a: "You control all messaging. Update requirements anytime and the AI reflects changes immediately.",
      },
      {
        q: "Does it work for recurring patient appointment reminders?",
        a: "Yes. It sends automated appointment reminders, post-visit follow-ups, and return visit prompts.",
      },
      {
        q: "How do we prevent no-shows?",
        a: "The system sends SMS reminders 24 hours and 2 hours before appointments. Reduces no-shows by 20-25%.",
      },
    ],
  },

  "hvac": {
    id: "hvac",
    name: "HVAC & Heating/Cooling Contractors",
    shortName: "HVAC Companies",
    slug: "hvac",
    routePath: "/hvac",
    
    hero: {
      eyebrow: "For HVAC Contractors",
      headline: "Book More HVAC Service Calls During Peak Demand",
      subheadline: "ClientSurge helps HVAC teams respond to after-hours AC and heating leads, emergency calls, seasonal demand spikes, appointment requests, and maintenance plan opportunities faster.",
      cta: "Free HVAC Automation Audit",
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      emergencyDetection: {
        label: "Emergency Call Priority Logic",
        description: "System flags urgent AC/heating calls separately for faster dispatch",
        enabled: true,
      },
      serviceArea: {
        label: "Service Area Validation",
        description: "Confirms calls are within your service radius before full engagement",
        enabled: true,
      },
      dispatchSync: {
        label: "Dispatch Software Integration",
        description: "Real-time sync with ServiceTitan, Housecall Pro, Jobber",
        enabled: true,
      },
      technicianMobile: {
        label: "Technician Mobile Details",
        description: "Full appointment info syncs to field tech app before arrival",
        enabled: true,
      },
      dynamicPricing: {
        label: "Dynamic Service Pricing",
        description: "Different rates for diagnostics, repairs, maintenance, seasonal services",
        enabled: true,
      },
    },

    painStats: [
      { icon: "🚨", value: "73%", label: "of emergency HVAC calls go to whoever answers first" },
      { icon: "📲", value: "5-7 more", label: "service calls per week from instant response" },
      { icon: "💰", value: "$400-1200", label: "avg service revenue lost per missed call" },
    ],

    problems: [
      {
        problem: "Technicians in the field, customer calls office",
        stat: "Voicemail = call goes to competitor",
        solution: "Instant SMS text-back with availability",
        result: "You get the booking",
      },
      {
        problem: "After-hours calls during on-call rotation",
        stat: "AI takes the call 24/7, schedules the appointment",
        solution: "Automated scheduling syncs to on-call system",
        result: "No more missed after-hours calls",
      },
      {
        problem: "Customer needs to know the service fee upfront",
        stat: "Transparent pricing increases conversion 40%",
        solution: "AI sends service pricing and availability instantly",
        result: "Faster confirmations",
      },
      {
        problem: "No-show appointments waste time & gas",
        stat: "AI reminders reduce no-shows by 25%",
        solution: "SMS reminder + confirmation prevents ghosting",
        result: "Cleaner schedule",
      },
      {
        problem: "Technician upsells fall through the cracks",
        stat: "Automated follow-up captures 15% more upsells",
        solution: "AI sends maintenance reminders, seasonal upsells",
        result: "More repeat revenue",
      },
      {
        problem: "Manual dispatch scheduling is chaotic",
        stat: "Centralized lead tracking prevents missed jobs",
        solution: "All service requests tracked in one pipeline",
        result: "Full visibility",
      },
    ],

    smsDemo: {
      businessName: "Rapid Response HVAC",
      initialMessage: "[Missed call from homeowner]",
      automatedResponse: "Hi! We saw your missed call. 🔧 Rapid Response HVAC here. We can send a technician TODAY for emergency AC repair. Service call is $89. Available 2-5 PM or 6-9 PM. Which works?",
      leadReply: "2 PM today works!",
      confirmationMessage: "Booked! Technician arriving 2-2:30 PM today. Here's your address confirmation & tech details: [info]. Thanks! ⏱️",
    },

    metrics: [
      { value: "2 min", label: "target response window for emergency service inquiries" },
      { value: "Seasonal", label: "surge handling for AC and heating demand spikes" },
      { value: "5-7 days", label: "setup target after onboarding and provider access" },
    ],

    testimonial: {
      type: "readiness",
      label: "Launch proof boundary",
      quote: "Use this page for controlled traffic only after HVAC source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },

    faqs: [
      {
        q: "Does it work for emergency calls?",
        a: "Yes. It prioritizes urgent requests, provides same-day availability, and escalates critical issues to your dispatcher immediately.",
      },
      {
        q: "Can we set different pricing for different services?",
        a: "Yes. You control all pricing. Different rates for diagnostics, repairs, maintenance, and seasonal services.",
      },
      {
        q: "What about service area limitations?",
        a: "You set your service areas. If a call comes from outside your radius, the AI lets them know and offers alternatives.",
      },
      {
        q: "Does it sync with our dispatch software?",
        a: "We integrate with ServiceTitan, Housecall Pro, Jobber, and most major field service platforms.",
      },
      {
        q: "How do technicians get the customer info in the field?",
        a: "All appointment details sync to your mobile app so technicians have full info before they arrive.",
      },
    ],
  },

  "plumbing": {
    id: "plumbing",
    name: "Plumbing & Drain Services",
    shortName: "Plumbing Companies",
    slug: "plumbing",
    routePath: "/plumbing",

    hero: {
      eyebrow: "For Plumbing Companies",
      headline: "Turn Urgent Plumbing Calls Into Booked Dispatches Faster",
      subheadline: "ClientSurge helps plumbing teams recover missed emergency leak calls, drain repair requests, water heater inquiries, after-hours calls, and fast-dispatch expectations before homeowners call the next company.",
      cta: "Free Plumbing Automation Audit",
      image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      urgencyDetection: {
        label: "Urgency-Level Detection",
        description: "AI separates emergency leaks from routine drain repair requests",
        enabled: true,
      },
      afterHours: {
        label: "24/7 After-Hours Capture",
        description: "Designed specifically to handle calls outside business hours",
        enabled: true,
      },
      serviceQualification: {
        label: "Service-Type Intake Flow",
        description: "Asks about leak, drain, water heater, clog, fixture types",
        enabled: true,
      },
      dispatchContext: {
        label: "Dispatch Handoff Context",
        description: "Collects urgency, location, symptoms before routing to dispatch",
        enabled: true,
      },
      confirmationReminder: {
        label: "Appointment Confirmation & Reminder",
        description: "Confirmation SMS + 24h reminder reduces no-shows",
        enabled: true,
      },
    },

    painStats: [
      { icon: "🚰", value: "Urgent", label: "leak and water-heater leads usually choose the fastest responder" },
      { icon: "📞", value: "24/7", label: "after-hours calls need capture even when dispatch is busy" },
      { icon: "🧰", value: "Dispatch", label: "source, service type, and urgency must reach the right person fast" },
    ],

    problems: [
      {
        problem: "Homeowner has an emergency leak and reaches voicemail",
        stat: "Urgent jobs often go to whoever responds first",
        solution: "Instant missed-call text-back captures the issue and urgency",
        result: "Lead stays in your pipeline",
      },
      {
        problem: "Drain repair inquiry sits in a website form",
        stat: "Slow follow-up makes price shoppers move on",
        solution: "Automated response asks service type, address, and best dispatch window",
        result: "Cleaner qualification",
      },
      {
        problem: "Water heater calls need fast next steps",
        stat: "Replacement and repair requests need context before dispatch",
        solution: "AI collects symptoms, age, photos, and timing needs",
        result: "Better handoff",
      },
      {
        problem: "After-hours calls stack up while techs are in the field",
        stat: "Manual callbacks miss the highest-intent window",
        solution: "After-hours capture routes urgent requests and starts follow-up",
        result: "24/7 capture",
      },
      {
        problem: "Booked service calls need confirmation",
        stat: "No-shows waste dispatch time",
        solution: "Confirmation and reminder sequence keeps homeowners aligned",
        result: "Cleaner schedule",
      },
      {
        problem: "Old estimates and maintenance opportunities go quiet",
        stat: "Dormant plumbing leads need relevant reactivation",
        solution: "Win-back follow-up revives prior quotes and seasonal maintenance",
        result: "More second chances",
      },
    ],

    smsDemo: {
      businessName: "Rapid Flow Plumbing",
      initialMessage: "[Missed call from homeowner]",
      automatedResponse: "Hi, Rapid Flow Plumbing here. Sorry we missed you. Is this for an emergency leak, drain repair, or water heater issue? Reply with the issue and ZIP code so we can route the fastest next step.",
      leadReply: "Emergency leak under kitchen sink in 85282.",
      confirmationMessage: "Got it. We are flagging this as urgent and sending your details to dispatch. If water is actively running, shut off the nearest valve if safe. We will follow up with availability next.",
    },

    metrics: [
      { value: "60 sec", label: "target response window for urgent plumbing inquiries" },
      { value: "Dispatch", label: "handoff context for leak, drain, and water heater calls" },
      { value: "5-7 days", label: "setup target after onboarding and provider access" },
    ],

    testimonial: {
      type: "readiness",
      label: "Launch proof boundary",
      quote: "Use this page for controlled traffic only after plumbing source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },

    faqs: [
      {
        q: "Can the system separate emergency leaks from routine plumbing requests?",
        a: "Yes. The intake flow can ask for issue type, urgency, location, and dispatch timing so urgent leads are flagged differently from routine requests.",
      },
      {
        q: "Does it work after hours?",
        a: "Yes. The campaign path is designed to capture after-hours calls and form fills, then route the context according to your approved dispatch rules.",
      },
      {
        q: "Can it handle drain repair and water heater inquiries?",
        a: "Yes. Messaging can be tailored around leaks, drains, water heaters, clogs, fixture repair, and other service categories you approve during onboarding.",
      },
      {
        q: "Will it send real SMS or email during local testing?",
        a: "No. Local/source testing should use mocks or source review only. Live delivery requires a separate production-safe test approval.",
      },
      {
        q: "What should we bring to the plumbing automation audit?",
        a: "Bring current lead sources, dispatch hours, emergency handling rules, service areas, and the plumbing services you want prioritized first.",
      },
    ],
  },

  "roofing": {
    id: "roofing",
    name: "Roofing & Restoration",
    shortName: "Roofing Contractors",
    slug: "roofing",
    routePath: "/roofing",
    
    hero: {
      eyebrow: "For Roofing & Restoration Contractors",
      headline: "Get More Roofing Leads Booked Before Competitors Reply",
      subheadline: "ClientSurge helps roofing companies recover missed calls, answer storm and roof repair quote requests fast, follow up automatically, and turn more estimate requests into booked jobs.",
      cta: "Free Roofing Automation Audit",
      image: "https://images.unsplash.com/photo-1619886066112-b9faa6d2b77b?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      stormSurge: {
        label: "Storm-Surge Lead Handling",
        description: "Scales to handle 200+ simultaneous inquiries during storm events",
        enabled: true,
      },
      insuranceEducation: {
        label: "Insurance Education Block",
        description: "AI explains deductibles, coverage, and direct billing to reduce hesitation",
        enabled: true,
      },
      estimateBooking: {
        label: "Estimate Appointment Booking",
        description: "Schedules inspection appointments directly through automation",
        enabled: true,
      },
      damageAssessment: {
        label: "Damage Assessment Questionnaire",
        description: "Collects hail/storm damage details and cost-estimate expectations",
        enabled: true,
      },
      photoCollection: {
        label: "Photo Collection & Attachment",
        description: "Customers send before/after photos via SMS that attach to lead",
        enabled: true,
      },
    },

    painStats: [
      { icon: "⛈️", value: "60%", label: "of storm-damaged roofs get estimates from fastest responder" },
      { icon: "📋", value: "2x", label: "more estimates from faster response time" },
      { icon: "💵", value: "$3,000-8,000", label: "avg roofing job value lost per missed lead" },
    ],

    problems: [
      {
        problem: "Storm hits, 200 leads flood in at once",
        stat: "Can only answer 30% of calls",
        solution: "AI handles unlimited simultaneous inquiries",
        result: "Every lead gets a response",
      },
      {
        problem: "Homeowners need damage assessment info",
        stat: "Most want to know repair cost range upfront",
        solution: "AI sends damage questionnaire, cost estimate, & appointment",
        result: "Faster to estimate stage",
      },
      {
        problem: "Insurance questions hold up booking",
        stat: "Customers hesitate without insurance clarity",
        solution: "AI explains insurance process, deductibles, coverage",
        result: "More confident customers",
      },
      {
        problem: "Estimate appointments get rescheduled",
        stat: "Reminders reduce reschedules by 20%",
        solution: "SMS reminders keep customers committed",
        result: "Cleaner schedule",
      },
      {
        problem: "Old storm leads go stale waiting for follow-up",
        stat: "56% of old leads close with re-engagement",
        solution: "Automated follow-up reactivates dormant leads",
        result: "Old leads re-engaged",
      },
      {
        problem: "Manual estimate tracking is chaos",
        stat: "Lost estimates = lost revenue",
        solution: "All estimates tracked in one pipeline",
        result: "Full visibility",
      },
    ],

    smsDemo: {
      businessName: "StormPro Roofing",
      initialMessage: "Hi, I have hail damage on my roof. How much does repair cost?",
      automatedResponse: "Hi! Sorry to hear about the hail damage. 😟 StormPro Roofing can help. Cost typically ranges $200-600 per square depending on damage. We offer FREE inspections & direct insurance billing. Available tomorrow or Friday?",
      leadReply: "Tomorrow works!",
      confirmationMessage: "Perfect! Inspector coming tomorrow 2-4 PM. Bring insurance info if possible. We handle the claim. See you then! 🏠",
    },

    metrics: [
      { value: "5 min", label: "target response window for storm and quote inquiries" },
      { value: "Inspection", label: "handoff path from request to booked roof inspection" },
      { value: "5-7 business", label: "days to setup after onboarding and provider access" },
    ],

    testimonial: {
      type: "readiness",
      label: "Launch proof boundary",
      quote: "Use this page for controlled traffic only after roofing source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },

    faqs: [
      {
        q: "Can it handle complex insurance questions?",
        a: "It provides basic coverage info and guides customers. Complex claims questions go to your team.",
      },
      {
        q: "Does it know about local building codes?",
        a: "You control all information. Set your local codes, materials, pricing in the system.",
      },
      {
        q: "Can we schedule estimates directly?",
        a: "Yes. It books estimates and syncs with your calendar and dispatch software in real-time.",
      },
      {
        q: "What about seasonal vs. emergency pricing?",
        a: "You set different pricing for routine repairs, seasonal maintenance, and emergency damage. Easy to update.",
      },
      {
        q: "How does it handle before/after photos from customers?",
        a: "Customers can send photos via SMS or web form. They're attached to the lead for your estimator to review.",
      },
    ],
  },

  "contractors": {
    id: "contractors",
    name: "Contractors & Trades",
    shortName: "Contractors",
    slug: "contractors",
    routePath: "/contractors",
    
    hero: {
      eyebrow: "For General Contractors & Trades",
      headline: "Land More Jobs, Faster Response, Higher Closing Rate",
      subheadline: "General contractors live on word-of-mouth and quick turnaround. Respond to estimates in 60 seconds, and you win. Slow down, and your competitor does.",
      cta: "See How Contractors Use This",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      projectTimeline: {
        label: "Project Timeline Transparency",
        description: "AI sends realistic timelines and process steps upfront",
        enabled: true,
      },
      processClarity: {
        label: "Process & Deposit Clarity",
        description: "Explains deposit requirements, project phases, approval checkpoints",
        enabled: true,
      },
      estimateFollowUp: {
        label: "Estimate Follow-Up Automation",
        description: "Automated reminders keep quotes top-of-mind for decision-makers",
        enabled: true,
      },
      photoRouting: {
        label: "Photo/Question Request Routing",
        description: "AI acknowledges site photos and questions, routes to your team",
        enabled: true,
      },
      repeatRecognition: {
        label: "Repeat-Customer Recognition",
        description: "System recognizes prior jobs and offers faster booking for familiar clients",
        enabled: true,
      },
    },

    painStats: [
      { icon: "🏗️", value: "50%", label: "of project inquiries go to the fastest responder" },
      { icon: "📞", value: "4x", label: "faster response = 3-4 more jobs per month" },
      { icon: "💰", value: "$2,000-10,000", label: "avg project value lost per missed lead" },
    ],

    problems: [
      {
        problem: "Phone rings during job site, customer calls competitor",
        stat: "Slow response = lost estimate opportunity",
        solution: "Instant SMS tells customer you're on the way",
        result: "You get the estimate",
      },
      {
        problem: "Customers ask about your process upfront",
        stat: "Clarity = higher trust = more bookings",
        solution: "AI sends project timeline, process, & deposit info",
        result: "More confident clients",
      },
      {
        problem: "Estimate follow-up is spotty",
        stat: "Manual follow-up gets forgotten",
        solution: "Automated reminders keep quotes top-of-mind",
        result: "Higher closing rate",
      },
      {
        problem: "Job site photos/questions pile up",
        stat: "Clients get frustrated waiting for responses",
        solution: "AI acknowledges requests, routes to your team",
        result: "Better client experience",
      },
      {
        problem: "Old quotes sit in email, never resurfaced",
        stat: "56% of old leads close with re-engagement",
        solution: "Automated follow-up brings old quotes back",
        result: "Old quotes re-engaged",
      },
      {
        problem: "Project timeline isn't transparent",
        stat: "Clients want to know exactly when work happens",
        solution: "AI sends timeline, next steps, scheduling info",
        result: "More committed customers",
      },
    ],

    smsDemo: {
      businessName: "BuildRight Contracting",
      initialMessage: "I need a quote on a bathroom remodel. How long does it take?",
      automatedResponse: "Hi! Thanks for reaching out. 🔨 BuildRight Contracting can help. Bathroom remodels typically take 3-4 weeks. We'd love to see your space & provide a free estimate. Available this week Thursday or Friday?",
      leadReply: "Friday works!",
      confirmationMessage: "Perfect! Estimator coming Friday at 10 AM. Please have photos of current bathroom if possible. We'll send detailed quote within 48 hours. See you then! 📸",
    },

    metrics: [
      { value: "88%", label: "of inquiries responded to in under 2 hours" },
      { value: "3-4 more", label: "job bids per month" },
      { value: "5-7 business", label: "days to full setup" },
    ],

    testimonial: {
      quote: "As a contractor, being slow to respond kills deals. Now we answer every inquiry instantly, even when we're on job sites. Added 12 jobs last quarter just from faster response times.",
      name: "Mike Johnson",
      business: "BuildRight Contracting, Phoenix AZ",
      image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop",
    },

    faqs: [
      {
        q: "Can it handle complex estimate requests?",
        a: "It collects initial info and photos, then routes to you for detailed estimate. Speeds up the process.",
      },
      {
        q: "Does it work for recurring customers & repeat projects?",
        a: "Yes. It recognizes repeat customers and offers faster booking for jobs they've done before.",
      },
      {
        q: "Can we share project timelines?",
        a: "Yes. You set typical timelines for each project type. Customers see realistic expectations upfront.",
      },
      {
        q: "Does it track permit/inspection status?",
        a: "You can log permits and inspections. AI sends customer updates automatically.",
      },
      {
        q: "What about payment terms & deposit collection?",
        a: "AI explains your deposit requirements upfront. You control payment terms.",
      },
    ],
  },

  "real-estate": {
    id: "real-estate",
    name: "Real Estate Agents",
    shortName: "Real Estate Agents",
    slug: "real-estate",
    routePath: "/real-estate",
    hero: {
      eyebrow: "For Real Estate Agents",
      headline: "Respond to Buyer & Seller Leads Before Any Competitor Does",
      subheadline: "In real estate, the agent who responds first wins the client. ClientSurge helps agents instantly follow up on Zillow leads, website inquiries, missed calls, and showing requests — 24/7.",
      cta: "Free Real Estate Automation Audit",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      multiSourceIntegration: {
        label: "Multi-Source Lead Integration",
        description: "Connects to Zillow, Realtor.com, MLS portals, and website forms simultaneously",
        enabled: true,
      },
      showingScheduler: {
        label: "Showing Scheduler",
        description: "AI books showing appointments directly into your calendar",
        enabled: true,
      },
      cmaDisplay: {
        label: "CMA & Market Data Display",
        description: "AI provides comparable sales and market context for sellers",
        enabled: true,
      },
      openHouseNurture: {
        label: "Open House Attendee Nurture",
        description: "14-day automated follow-up for open house walkers",
        enabled: true,
      },
      leadAttribution: {
        label: "Lead Source Attribution",
        description: "Tracks every lead source to ROI to optimize marketing spend",
        enabled: true,
      },
    },
    painStats: [
      { icon: "⏱️", value: "5 min", label: "is the window before a real estate lead goes cold" },
      { icon: "🏡", value: "78%", label: "of buyers use the first agent who responds" },
      { icon: "💰", value: "$8,000+", label: "avg commission lost per missed qualified lead" },
    ],
    problems: [
      { problem: "Zillow lead comes in — you're showing a house", stat: "78% of buyers use the first agent who responds", solution: "Instant AI response qualifies the lead and locks in a call", result: "You get the client" },
      { problem: "Buyer asks about a listing after hours", stat: "50% of leads arrive outside business hours", solution: "24/7 AI captures interest, schedules showing automatically", result: "24/7 lead capture" },
      { problem: "Seller inquiry needs CMA and pricing discussion", stat: "Sellers go with the most responsive agent", solution: "AI collects property details and books listing consultation", result: "More listing appointments" },
      { problem: "Past clients with expired listings never re-engaged", stat: "56% of dormant leads respond to a personal re-touch", solution: "Reactivation sequence wakes up cold opportunities", result: "Old leads re-engaged" },
      { problem: "Open house follow-up is inconsistent", stat: "Most agents follow up only once after open houses", solution: "Automated 14-day nurture for open house attendees", result: "14-day nurture" },
      { problem: "No tracking of which leads came from which source", stat: "Source confusion wastes marketing budget", solution: "Every lead tracked from source to signed contract", result: "Full pipeline visibility" },
    ],
    smsDemo: {
      businessName: "Prestige Realty Group",
      initialMessage: "Hi, I saw a listing at 4521 Oak St. Is it still available?",
      automatedResponse: "Hi! Yes, 4521 Oak St is still available. 🏡 It's a 4bd/3ba at $485K. I'd love to schedule a showing — I have times open tomorrow at 10 AM or 4 PM. Which works for you?",
      leadReply: "4 PM tomorrow sounds great!",
      confirmationMessage: "You're confirmed for a showing tomorrow at 4 PM. I'll meet you there! Address details & my contact are below. See you then! 🔑",
    },
    metrics: [
      { value: "60 sec", label: "target response window for buyer and seller inquiries" },
      { value: "14-day", label: "nurture path for open house and portal leads" },
      { value: "5-7 business", label: "days to launch after onboarding and MLS access" },
    ],
    testimonial: {
      type: "readiness",
      label: "Launch proof boundary",
      quote: "Use this page for controlled traffic only after source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Can it respond to leads from Zillow, Realtor.com, and my website?", a: "Yes. We connect to all major lead portals and your website forms. Every inquiry gets an instant response regardless of source." },
      { q: "Will it schedule showings directly on my calendar?", a: "Yes. We sync with Google Calendar, Calendly, and major scheduling tools so prospects see real availability and book instantly." },
      { q: "What if I want to take over the conversation manually?", a: "The moment you reply, the AI pauses and steps aside. It only re-engages if you don't respond within a set window." },
      { q: "Does it work for listing leads and buyer leads?", a: "Yes. We configure separate flows for buyers, sellers, investor leads, and rental inquiries — all with the right messaging." },
      { q: "How long until I see more booked showings?", a: "Most agents see results within the first 2 weeks once the system is live and lead sources are connected." },
    ],
  },

  "personal-injury": {
    id: "personal-injury",
    name: "Personal Injury Law",
    shortName: "PI Law Firms",
    slug: "personal-injury",
    routePath: "/personal-injury",
    hero: {
      eyebrow: "For Personal Injury Law Firms",
      headline: "Sign More Cases With 24/7 AI Intake Before Leads Call Another Firm",
      subheadline: "Personal injury leads are high-value and highly perishable. ClientSurge helps PI firms respond instantly to accident inquiries, qualify cases 24/7, and move fast before the next firm in line picks up.",
      cta: "Free Law Firm Automation Audit",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=100&fit=crop&auto=format",
    },

    // Top 5 Industry-Specific Enhancements
    industrySpecific: {
      intakeBot: {
        label: "24/7 AI Legal Intake",
        description: "Answers accident calls immediately, gathers case details around the clock",
        enabled: true,
      },
      casePrescreen: {
        label: "Automated Case Pre-Screening",
        description: "AI filters unqualified leads before routing to attorneys",
        enabled: true,
      },
      legalCompliance: {
        label: "Legal Compliance Guardrails",
        description: "All messaging non-committal, reviewed by legal, no unauthorized advice",
        enabled: true,
      },
      urgencyEscalation: {
        label: "Urgent Case Escalation",
        description: "Severe injuries/liability cases route directly to on-call attorney",
        enabled: true,
      },
      contingencyClarity: {
        label: "Contingency Fee Clarity",
        description: "AI clearly explains 'you pay nothing unless we win' upfront",
        enabled: true,
      },
    },
    painStats: [
      { icon: "⚖️", value: "82%", label: "of PI leads contact multiple firms — first to respond wins" },
      { icon: "📞", value: "24/7", label: "accident calls need immediate response regardless of hour" },
      { icon: "💰", value: "$15,000+", label: "avg case value lost when a qualified lead isn't signed fast" },
    ],
    problems: [
      { problem: "Accident victim calls at 2 AM, no one answers", stat: "82% of PI leads call 2-3 firms before signing", solution: "AI intake agent answers 24/7, gathers case details immediately", result: "You get the case" },
      { problem: "Website contact form — no immediate follow-up", stat: "5-minute delay drops conversion rate by 20×", solution: "Instant AI response qualifies accident type and injury details", result: "Under 60 sec response" },
      { problem: "Intake team is on lunch, calls stack up", stat: "Missed calls go directly to competitors", solution: "AI handles unlimited simultaneous inquiries with legal-safe responses", result: "No call ever missed" },
      { problem: "Unqualified leads waste attorney time", stat: "40% of intake calls don't meet case criteria", solution: "AI pre-screens cases before routing to attorneys", result: "Better qualified leads" },
      { problem: "Follow-up on hesitant clients never happens", stat: "56% of hesitant leads sign after a second touch", solution: "Automated nurture keeps your firm top of mind", result: "14-day nurture" },
      { problem: "No tracking of case source or intake stage", stat: "Invisible pipeline = missed cases and lost revenue", solution: "Every inquiry tracked from first contact to signed retainer", result: "Full pipeline visibility" },
    ],
    smsDemo: {
      businessName: "Shields Law Group",
      initialMessage: "I was in a car accident yesterday and I'm not sure what to do.",
      automatedResponse: "Hi, this is Shields Law Group. We're sorry to hear about your accident. 🚗 We offer FREE consultations and work on contingency — you pay nothing unless we win. Can we schedule a quick 15-min call today to review your case?",
      leadReply: "Yes, today at 3 PM works.",
      confirmationMessage: "Confirmed — your free case review is today at 3 PM with one of our attorneys. You'll receive a call from us. No obligation. We're here to help. ⚖️",
    },
    metrics: [
      { value: "60 sec", label: "target response for accident and injury inquiries" },
      { value: "24/7", label: "AI intake coverage including weekends and holidays" },
      { value: "5-7 business", label: "days to launch after onboarding and compliance review" },
    ],
    testimonial: {
      type: "readiness",
      label: "Launch proof boundary",
      quote: "Use this page for controlled traffic only after PI-specific source tracking, notification delivery, legal compliance review, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Is the AI compliant with legal advertising rules?", a: "We configure all messaging to be non-committal and legally safe — no guarantees, no unauthorized legal advice. All copy is reviewed before going live." },
      { q: "Can it handle multiple accident types (auto, slip & fall, workers comp)?", a: "Yes. We set up separate intake flows for each case type with the right qualifying questions and routing rules." },
      { q: "What if someone needs to speak to an attorney immediately?", a: "The AI escalates urgent cases to your on-call line. You define what triggers an immediate handoff." },
      { q: "Does it integrate with our case management software?", a: "We integrate with Clio, MyCase, Litify, and most major legal practice management platforms." },
      { q: "How do we ensure no unauthorized legal advice is given?", a: "All responses are templated and pre-approved by your team. The AI never gives legal opinions — only collects intake information and schedules consultations." },
    ],
  },
};

// Helper function for route navigation
export function getIndustryBySlug(slug) {
  return INDUSTRIES[slug] || null;
}

// Helper to get all industry keys for routing
export function getAllIndustryKeys() {
  return Object.keys(INDUSTRIES);
}

// Helper to get industry name for display
export function getIndustryName(slug) {
  return INDUSTRIES[slug]?.name || "Industry";
}
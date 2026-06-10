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
      headline: "Stop Losing Booking Leads to Slow Response Times",
      subheadline: "AI-powered instant response and follow-up turns inquiry floods into booked appointments. Most aesthetic leads go cold in 5 minutes — we keep them hot.",
      cta: "See Your Instant Response System",
    },

    // Industry pain stats
    painStats: [
      { icon: "⏱️", value: "47%", label: "of leads go dark if not contacted within 5 min", shortLabel: "Leads lost in 5 min" },
      { icon: "📱", value: "3x", label: "more conversions with guided booking flow", shortLabel: "More conversions" },
      { icon: "💰", value: "$800-2000", label: "avg revenue per appointment lost to no-show follow-up", shortLabel: "Lost per no-show" },
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
      { value: "82%", label: "of booking inquiries responded to in under 60 sec" },
      { value: "3 more", label: "bookings per week from faster responses" },
      { value: "5-7 business", label: "days for full system setup and go-live" },
    ],

    // Testimonial
    testimonial: {
      quote: "We were losing leads to competitors simply because we couldn't pick up the phone fast enough. Within the first week, we had 12 extra booked appointments. This system pays for itself.",
      name: "Dr. Sarah Chen",
      business: "Luminous Aesthetics, Phoenix AZ",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
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
        a: "Most of our aesthetic clients see 3-5 extra bookings in the first week. Full ROI typically appears by week 3-4.",
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
      headline: "Turn Appointment Calls Into Confirmed Bookings",
      subheadline: "Dental practices lose 40% of potential patients to poor response times. Our AI answers every call, texts back missed calls, and guides patients straight to your booking page.",
      cta: "See How Dental Practices Use This",
    },

    painStats: [
      { icon: "📞", value: "40%", label: "of dental calls go unanswered during busy hours", shortLabel: "Calls unanswered" },
      { icon: "📅", value: "2x", label: "more confirmed appointments with instant response", shortLabel: "More appointments" },
      { icon: "🦷", value: "$200-500", label: "avg revenue per missed patient intake", shortLabel: "Lost per missed call" },
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
      { value: "68%", label: "of inquiries responded to in under 60 sec" },
      { value: "3 more", label: "confirmed appointments per week" },
      { value: "5-7 business", label: "days to full setup and go-live" },
    ],

    testimonial: {
      quote: "We were turning away patients during peak hours. Now our AI answers every call, texts back missed calls, and confirms appointments 24/7. We've added 15 new patients in month one.",
      name: "Dr. Marcus Rodriguez",
      business: "Bright Smile Dental, Austin TX",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
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
        a: "Starting at $497/month. Most dental offices see ROI within 2 weeks.",
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
    },

    painStats: [
      { icon: "⏱️", value: "55%", label: "of chiro inquiries go unanswered during clinic hours", shortLabel: "Inquiries unanswered" },
      { icon: "📊", value: "4x", label: "better conversion with instant pricing & availability", shortLabel: "Conversion lift" },
      { icon: "💵", value: "$150-300", label: "avg first visit value lost per missed lead", shortLabel: "Lost per missed lead" },
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
    name: "HVAC, Plumbing & Home Services",
    shortName: "Home Services",
    slug: "hvac",
    routePath: "/hvac",
    
    hero: {
      eyebrow: "HVAC & Home Services",
      headline: "Every Service Call Answered. Every Job Booked.",
      subheadline: "Home service leads are urgent and time-sensitive. Miss the call, and they call your competitor. Instant SMS turns missed calls into booked service appointments.",
      cta: "Free HVAC Automation Audit",
    },

    painStats: [
      { icon: "🚨", value: "73%", label: "of emergency HVAC calls go to whoever answers first", shortLabel: "First responder wins" },
      { icon: "📲", value: "5-7 more", label: "service calls per week from instant response", shortLabel: "Extra weekly calls" },
      { icon: "💰", value: "$400-1200", label: "avg service revenue lost per missed call", shortLabel: "Lost per missed call" },
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
      initialMessage: "Hi, my AC is out and it's 110°F inside. Can someone come today?",
      automatedResponse: "Hi! We saw your missed call. 🔧 Rapid Response HVAC here. We can send a technician TODAY for emergency AC repair. Service call is $89. Available 2-5 PM or 6-9 PM. Which works?",
      leadReply: "2 PM today works!",
      confirmationMessage: "Booked! Technician arriving 2-2:30 PM today. Here's your address confirmation & tech details: [info]. Thanks! ⏱️",
    },

    metrics: [
      { value: "85%", label: "of calls responded to in under 2 minutes" },
      { value: "5-7 more", label: "service calls per week" },
      { value: "5-7 days", label: "to full setup and go-live" },
    ],

    testimonial: {
      quote: "We were losing 30-40% of emergency calls to competitors because we couldn't pick up. Now our AI answers every call instantly, books the appointment, and sends reminders. Revenue jumped 28% in month one.",
      name: "Tom Bradley",
      business: "Rapid Response HVAC, Denver CO",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
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

  "roofing": {
    id: "roofing",
    name: "Roofing & Restoration",
    shortName: "Roofing Contractors",
    slug: "roofing",
    routePath: "/roofing",
    
    hero: {
      eyebrow: "For Roofing & Restoration Contractors",
      headline: "Get More Roofing Leads Booked Before Competitors Reply",
      subheadline: "ClientSurge helps roofing companies recover missed calls, answer storm and quote requests fast, follow up automatically, and turn more estimate requests into booked jobs.",
      cta: "Free Roofing Automation Audit",
    },

    painStats: [
      { icon: "⛈️", value: "60%", label: "of storm-damaged roofs get estimates from fastest responder", shortLabel: "First estimator wins" },
      { icon: "📋", value: "2x", label: "more estimates from faster response time", shortLabel: "More estimates" },
      { icon: "💵", value: "$3K–$8K", label: "avg roofing job value lost per missed lead", shortLabel: "Lost per missed lead" },
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
      { value: "91%", label: "of inquiries responded to in under 5 minutes" },
      { value: "2 more", label: "estimates closed per week" },
      { value: "5-7 business", label: "days to setup and go-live" },
    ],

    testimonial: {
      quote: "During hail season, we get crushed with calls. Our AI answers every single one, qualifies them, and books the estimate. We closed 14 jobs that would have gone to competitors. Game changer.",
      name: "Rick Mitchell",
      business: "StormPro Roofing, Oklahoma City OK",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
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
      headline: "The Job Goes to the Contractor Who Responds First.",
      subheadline: "While you're on-site, our AI answers every call, qualifies every lead, and books the estimate — so you close the job before you even get home.",
      cta: "Book Your Free Contractor Audit",
    },

    painStats: [
      { icon: "🏗️", value: "50%", label: "of project inquiries go to the fastest responder", shortLabel: "First responder wins" },
      { icon: "📞", value: "4x", label: "faster response = 3-4 more jobs per month", shortLabel: "More jobs/month" },
      { icon: "💰", value: "$5K avg", label: "project value lost per missed lead inquiry", shortLabel: "Lost per missed lead" },
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
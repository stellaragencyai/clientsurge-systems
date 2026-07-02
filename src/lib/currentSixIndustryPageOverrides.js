// Current six priority industry landing-page overrides.
// These override generic template copy without touching homepage card inventory.

export const CURRENT_SIX_INDUSTRY_PAGE_OVERRIDES = {
  hvac: {
    hero: {
      eyebrow: "Emergency HVAC lead recovery",
      headline: "AI automation that answers urgent HVAC leads before your competitors do.",
      subheadline:
        "ClientSurge helps HVAC companies respond instantly to emergency calls, seasonal service requests, estimate follow-ups, and maintenance opportunities so fewer jobs disappear after the first missed call.",
      cta: "Get My Free HVAC Automation Audit",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=90&fit=crop&auto=format",
    },
    painStats: [
      { icon: "🚨", value: "Urgent", label: "AC and heating calls usually go to the first company that responds" },
      { icon: "📞", value: "After-hours", label: "Missed calls need instant text-back and dispatch context" },
      { icon: "🔁", value: "Seasonal", label: "Maintenance and estimate follow-up keeps demand from leaking away" },
    ],
    problems: [
      { problem: "Emergency AC call hits while your team is in the field", stat: "Urgent callers keep dialing until someone answers", solution: "Instant missed-call text-back captures the issue, ZIP code, and timing need", result: "Faster rescue path" },
      { problem: "Seasonal demand spikes overwhelm the front desk", stat: "Peak weather creates more calls than staff can handle manually", solution: "AI qualifies service type, urgency, location, and preferred callback window", result: "Cleaner dispatch handoff" },
      { problem: "Estimates and maintenance-plan opportunities go cold", stat: "Unfollowed estimates become competitor revenue", solution: "Automated follow-up keeps tune-ups, replacements, and estimates moving", result: "More second chances" },
      { problem: "Customers need service-area and timing answers fast", stat: "Unclear availability slows booking decisions", solution: "The workflow confirms service area, urgency, and next-step availability language", result: "Less friction to book" },
    ],
    smsDemo: {
      businessName: "Rapid Response HVAC",
      initialMessage: "My AC stopped working and the house is getting hot. Can someone come today?",
      automatedResponse:
        "Rapid Response HVAC here. We can help. Is the system fully down or still blowing warm air? Reply with your ZIP code and whether this is urgent so we can route the fastest next step.",
      leadReply: "Fully down. ZIP is 85282. Need help today.",
      confirmationMessage:
        "Got it. We are flagging this as urgent and sending the details to dispatch. If there is any electrical smell or water around the unit, shut it off if safe.",
    },
    metrics: [
      { value: "60 sec", label: "target response window for urgent HVAC inquiries" },
      { value: "Dispatch", label: "handoff context for service type, urgency, ZIP code, and timing" },
      { value: "Follow-up", label: "estimate, maintenance, and seasonal reactivation paths" },
    ],
    testimonial: {
      type: "readiness",
      label: "Operational proof boundary",
      quote:
        "Use this page for controlled traffic only after HVAC source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Can this handle emergency HVAC calls after hours?", a: "Yes. The workflow can capture the urgency, issue type, ZIP code, and preferred timing, then route the lead according to your approved dispatch rules." },
      { q: "Will it replace our dispatcher?", a: "No. It captures and organizes the lead before your team responds. Urgent or complex cases still route to your team for human handling." },
      { q: "Can it follow up on old estimates and maintenance plans?", a: "Yes. Approved follow-up paths can re-engage old estimates, seasonal tune-up leads, and maintenance-plan opportunities." },
      { q: "Does it support service-area filtering?", a: "Yes. The intake can ask for location or ZIP code before pushing the next step so outside-area leads are handled cleanly." },
      { q: "What should we bring to the HVAC automation audit?", a: "Bring your service areas, dispatch rules, emergency handling process, common service categories, and current lead sources." },
    ],
  },

  roofing: {
    hero: {
      eyebrow: "Storm-response lead recovery",
      headline: "Recover roofing leads before storm-season demand disappears.",
      subheadline:
        "ClientSurge helps roofing companies respond to storm damage inquiries, inspection requests, insurance questions, missed calls, and old estimates with automated follow-up that keeps jobs moving.",
      cta: "Get My Free Roofing Automation Audit",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=90&fit=crop&auto=format",
    },
    painStats: [
      { icon: "⛈️", value: "Storm", label: "Inspection requests need fast capture before homeowners call another roofer" },
      { icon: "📋", value: "Estimate", label: "Old quotes and inspection requests need consistent follow-up" },
      { icon: "🏠", value: "Insurance", label: "Homeowners need a clear next step around claims and inspections" },
    ],
    problems: [
      { problem: "Storm damage leads arrive in a rush", stat: "Homeowners often contact multiple roofers", solution: "Instant response collects damage type, property details, urgency, and inspection intent", result: "Faster inspection path" },
      { problem: "Insurance questions slow down booking", stat: "Confusion creates hesitation", solution: "Approved messaging explains the next inspection step without overpromising claim outcomes", result: "Clearer next step" },
      { problem: "Old estimates disappear after one callback", stat: "Manual quote follow-up is easy to miss", solution: "Automated estimate follow-up keeps prior inspections and quotes active", result: "More reactivation" },
      { problem: "Missed calls after hours become lost inspections", stat: "The next roofer to answer can win the appointment", solution: "Missed-call text-back acknowledges the request and asks for inspection details", result: "Less lead leakage" },
    ],
    smsDemo: {
      businessName: "StormPro Roofing",
      initialMessage: "We had hail last night and I think my roof may be damaged. Do you do inspections?",
      automatedResponse:
        "StormPro Roofing here. Yes, we can help with roof inspections. Is this for hail, wind, leaking, or missing shingles? Reply with the issue and ZIP code so we can route the next step.",
      leadReply: "Hail damage. ZIP is 85018.",
      confirmationMessage:
        "Got it. We are flagging this as a storm inspection request and sending your details to the team. If you have photos, you can send them here before the inspection.",
    },
    metrics: [
      { value: "Storm", label: "lead capture for hail, wind, leak, and roof repair requests" },
      { value: "Inspection", label: "handoff path from inquiry to roof inspection next step" },
      { value: "Follow-up", label: "old estimate and prior inspection reactivation sequence" },
    ],
    testimonial: {
      type: "readiness",
      label: "Operational proof boundary",
      quote:
        "Use this page for controlled traffic only after roofing source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Can this handle storm lead surges?", a: "Yes. The intake flow is designed to acknowledge storm inquiries quickly, collect damage context, and route the next inspection step." },
      { q: "Will it answer insurance questions?", a: "It can share approved process language and route complex claim questions to your team. It should not promise claim outcomes." },
      { q: "Can homeowners send roof photos?", a: "The messaging can prompt homeowners to send photos before the inspection so your team has better context." },
      { q: "Can it reactivate old estimates?", a: "Yes. Approved follow-up sequences can re-engage old estimates, prior inspections, and dormant storm leads." },
      { q: "What should we bring to the roofing automation audit?", a: "Bring your inspection process, service areas, storm response rules, estimate follow-up language, and approved insurance-question wording." },
    ],
  },

  dental: {
    hero: {
      eyebrow: "New-patient booking flow",
      headline: "Turn more dental inquiries into booked patient appointments.",
      subheadline:
        "ClientSurge helps dental practices respond instantly to new patients, emergency inquiries, missed calls, appointment reminders, treatment-plan follow-up, and review requests.",
      cta: "Get My Free Dental Automation Audit",
      image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=90&fit=crop&auto=format",
    },
    painStats: [
      { icon: "🦷", value: "New Patients", label: "Form fills and calls need fast intake before patients keep searching" },
      { icon: "⏰", value: "No-shows", label: "Appointment reminders protect chair time and front-desk capacity" },
      { icon: "⭐", value: "Reviews", label: "Post-visit review requests need a consistent system" },
    ],
    problems: [
      { problem: "New-patient forms sit until the front desk catches up", stat: "Delayed response lowers booking intent", solution: "Instant intake confirms interest and pushes the next scheduling step", result: "Faster booking path" },
      { problem: "Emergency dental calls interrupt a busy schedule", stat: "Urgent patients keep calling until someone responds", solution: "The workflow captures emergency type, timing, and callback preference", result: "Cleaner triage" },
      { problem: "Treatment plans do not get followed up consistently", stat: "Unfollowed treatment plans become lost production", solution: "Approved nurture keeps treatment-plan next steps in front of the patient", result: "Better follow-through" },
      { problem: "Recall and review requests are inconsistent", stat: "Manual reminders are easy to miss", solution: "Automated reminders and review requests keep patients engaged after the visit", result: "More consistency" },
    ],
    smsDemo: {
      businessName: "BrightPath Dental",
      initialMessage: "Hi, I need to schedule a new patient cleaning and exam. Do you have anything this week?",
      automatedResponse:
        "BrightPath Dental here. We can help. Are you a new patient, and do you prefer morning or afternoon? Reply with your preferred day and we’ll route the next scheduling step.",
      leadReply: "New patient. Afternoon is best.",
      confirmationMessage:
        "Perfect. We’re sending your request to the scheduling team with your afternoon preference. If you have insurance details, you can bring them to the visit or reply here.",
    },
    metrics: [
      { value: "Intake", label: "new-patient and emergency inquiry capture" },
      { value: "Reminder", label: "appointment and recall follow-up paths" },
      { value: "Review", label: "post-visit review request workflow" },
    ],
    testimonial: {
      type: "readiness",
      label: "Operational proof boundary",
      quote:
        "Use this page for controlled traffic only after dental source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Can this help with new-patient intake?", a: "Yes. The workflow can capture new-patient intent, timing preference, emergency status, and routing details before your team follows up." },
      { q: "Can it handle emergency dental inquiries?", a: "It can identify emergency intent and route the request based on your approved office rules. It does not diagnose or provide clinical advice." },
      { q: "Can it reduce no-shows?", a: "It can support appointment reminders and confirmation flows. Actual no-show reduction depends on your schedule, policies, and patient behavior." },
      { q: "Can it follow up on treatment plans?", a: "Yes. Approved treatment-plan follow-up language can keep next steps visible without making unsupported clinical claims." },
      { q: "What should we bring to the dental automation audit?", a: "Bring your new-patient process, emergency call rules, recall process, review-request timing, and front-desk handoff preferences." },
    ],
  },

  "med-spa": {
    hero: {
      eyebrow: "Consultation booking automation",
      headline: "Book more med spa consults without chasing every lead manually.",
      subheadline:
        "ClientSurge helps med spas respond to cosmetic treatment inquiries, handle price questions, send reminders, nurture package interest, request reviews, and reactivate old leads automatically.",
      cta: "Get My Free Med Spa Automation Audit",
      image: "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95&fit=crop&auto=format",
    },
    painStats: [
      { icon: "💬", value: "Consults", label: "Treatment inquiries need fast, polished follow-up" },
      { icon: "💉", value: "Packages", label: "Price shoppers and package leads need nurture" },
      { icon: "🔁", value: "Reactivation", label: "Old cosmetic leads can be brought back with approved outreach" },
    ],
    problems: [
      { problem: "Treatment inquiries come in while the team is with clients", stat: "Slow response lets price shoppers drift", solution: "Instant consult response captures treatment interest and preferred timing", result: "Faster consult path" },
      { problem: "Price shoppers ask once and disappear", stat: "Cosmetic leads often need multiple touches", solution: "Approved nurture keeps package value and consultation next steps visible", result: "Better follow-up" },
      { problem: "No-shows and late cancellations waste provider time", stat: "Unconfirmed consults weaken the schedule", solution: "Reminder and confirmation flows support the consult booking process", result: "Stronger schedule hygiene" },
      { problem: "Old leads and membership opportunities sit untouched", stat: "Dormant cosmetic interest can still be valuable", solution: "Reactivation flows re-engage old leads with approved offers or consult prompts", result: "More reactivation" },
    ],
    smsDemo: {
      businessName: "GlowLab Aesthetics",
      initialMessage: "Hi, I’m interested in Botox or filler but want pricing first.",
      automatedResponse:
        "GlowLab Aesthetics here. We can help. Pricing depends on treatment goals, so the best next step is a quick consult. Are you interested in Botox, filler, facial, or laser treatments?",
      leadReply: "Botox. I’d like a consult this week.",
      confirmationMessage:
        "Great. We’re flagging this as a Botox consult request and sending your timing preference to the team. You’ll get the next booking step shortly.",
    },
    metrics: [
      { value: "Consult", label: "treatment inquiry to booking handoff" },
      { value: "Nurture", label: "package, membership, and price-shopper follow-up" },
      { value: "Reviews", label: "post-treatment review request workflow" },
    ],
    testimonial: {
      type: "readiness",
      label: "Operational proof boundary",
      quote:
        "Use this page for controlled traffic only after med spa source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Can this respond to treatment inquiries from forms or messages?", a: "Yes. The workflow can capture treatment interest, timing, and consultation intent, then route the next step to your team." },
      { q: "Can it answer pricing questions?", a: "It can use approved language that guides prospects toward a consultation. It should not quote unsupported or unapproved pricing." },
      { q: "Can it reactivate old cosmetic leads?", a: "Yes. Approved reactivation campaigns can follow up with dormant consult requests, package interest, or membership opportunities." },
      { q: "Will it make medical or aesthetic claims?", a: "No. Messaging should stay within approved operational and scheduling language. Clinical claims stay with your licensed team." },
      { q: "What should we bring to the med spa automation audit?", a: "Bring your treatment categories, consult booking rules, package follow-up language, no-show process, and review-request timing." },
    ],
  },

  contractors: {
    hero: {
      eyebrow: "Quote follow-up system",
      headline: "Stop letting project quote requests die in the inbox.",
      subheadline:
        "ClientSurge helps contractors respond to project inquiries, qualify budget and timeline, follow up on estimates, recover missed calls, and keep old opportunities from disappearing.",
      cta: "Get My Free Contractor Automation Audit",
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=90&fit=crop&auto=format",
    },
    painStats: [
      { icon: "🧰", value: "Quotes", label: "Project inquiries need fast response and clear next steps" },
      { icon: "📋", value: "Scope", label: "Budget, timeline, and job type must be qualified early" },
      { icon: "🔁", value: "Old Estimates", label: "Prior quotes need follow-up before they disappear" },
    ],
    problems: [
      { problem: "Project requests arrive while the crew is on a job site", stat: "Slow replies make homeowners call the next contractor", solution: "Instant response captures project type, location, timeline, and next-step preference", result: "Cleaner inquiry capture" },
      { problem: "Unqualified inquiries eat up owner time", stat: "Missing budget and timeline context slows estimating", solution: "The workflow asks the right upfront questions before the callback", result: "Better lead context" },
      { problem: "Estimates do not get followed up after the first send", stat: "Forgotten quotes leave revenue hanging", solution: "Approved quote follow-up keeps the project moving without manual chasing", result: "More estimate recovery" },
      { problem: "Old opportunities never get reactivated", stat: "Dormant estimates can still convert with a timely touch", solution: "Reactivation sequences revive past estimate and project inquiries", result: "More second chances" },
    ],
    smsDemo: {
      businessName: "BuildRight Contractors",
      initialMessage: "I need a quote for a bathroom remodel. Are you taking projects?",
      automatedResponse:
        "BuildRight Contractors here. Yes, we can help. What is your target timeline, ZIP code, and approximate project scope? Photos are helpful if you have them.",
      leadReply: "85260. Want to start within 2 months. Full bathroom remodel.",
      confirmationMessage:
        "Thanks. We’re sending this as a remodel quote request with your timeline and ZIP code. The team will follow up with the next estimate step.",
    },
    metrics: [
      { value: "Scope", label: "project type, timeline, location, and estimate context" },
      { value: "Quote", label: "follow-up path after estimate or consultation" },
      { value: "Digest", label: "owner-facing summary of hot opportunities" },
    ],
    testimonial: {
      type: "readiness",
      label: "Operational proof boundary",
      quote:
        "Use this page for controlled traffic only after contractor source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Can this qualify project leads before we call them?", a: "Yes. It can collect project type, timeline, location, budget range, photos, and callback preference before your team follows up." },
      { q: "Can it follow up on estimates automatically?", a: "Yes. Approved quote follow-up sequences can keep estimates active without your team manually chasing every lead." },
      { q: "Can it handle different trades?", a: "Yes. The workflow can be adjusted for remodeling, general contracting, specialty trades, and service-area rules." },
      { q: "Will it promise pricing or project timelines?", a: "No. It should collect context and route the next step. Final pricing and timeline stay with your team." },
      { q: "What should we bring to the contractor automation audit?", a: "Bring your project categories, estimate process, service areas, quote follow-up language, and current lead sources." },
    ],
  },

  chiropractic: {
    hero: {
      eyebrow: "Patient intake and care-plan follow-up",
      headline: "Keep chiropractic patient inquiries moving into scheduled care.",
      subheadline:
        "ClientSurge helps chiropractic clinics respond to new patient inquiries, recover missed calls, send reminders, follow up on care plans, reactivate inactive patients, and request reviews automatically.",
      cta: "Get My Free Chiropractic Automation Audit",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=90&fit=crop&auto=format",
    },
    painStats: [
      { icon: "🧍", value: "New Patients", label: "Pain-related inquiries need fast, careful intake" },
      { icon: "📅", value: "Reminders", label: "Appointment confirmations protect schedule consistency" },
      { icon: "🔁", value: "Reactivation", label: "Inactive patients and care-plan drop-off need approved follow-up" },
    ],
    problems: [
      { problem: "New patient inquiries arrive while staff are with patients", stat: "Delayed follow-up lowers scheduling intent", solution: "Instant intake captures pain area, urgency, timing, and scheduling preference", result: "Faster intake path" },
      { problem: "Missed calls happen during appointments", stat: "Front desk bandwidth is limited", solution: "Missed-call text-back acknowledges the request and collects next-step context", result: "Less leakage" },
      { problem: "Care-plan drop-off is not followed up consistently", stat: "Inactive care plans weaken retention", solution: "Approved follow-up keeps care-plan next steps visible without clinical overreach", result: "Better continuity" },
      { problem: "Inactive patients are rarely reactivated", stat: "Past patients can return with the right reminder", solution: "Reactivation campaigns invite patients back using approved office language", result: "More re-engagement" },
    ],
    smsDemo: {
      businessName: "Aligned Chiropractic",
      initialMessage: "Hi, I’m having lower back pain and want to see if I can get an appointment.",
      automatedResponse:
        "Aligned Chiropractic here. We can help route your request. Is this a new issue or ongoing pain, and do you prefer morning or afternoon appointments?",
      leadReply: "New issue. Afternoon is best.",
      confirmationMessage:
        "Thanks. We’re sending this as a new patient appointment request with afternoon preference. If symptoms are severe or urgent, please seek appropriate medical care.",
    },
    metrics: [
      { value: "Intake", label: "new-patient inquiry and scheduling context" },
      { value: "Reminder", label: "appointment confirmation and follow-up path" },
      { value: "Reactivate", label: "inactive patient and care-plan follow-up workflow" },
    ],
    testimonial: {
      type: "readiness",
      label: "Operational proof boundary",
      quote:
        "Use this page for controlled traffic only after chiropractic source tracking, notification delivery, and safe live confirmation proof are completed.",
      name: "ClientSurge Launch Checklist",
      business: "No customer case study claimed for this page",
    },
    faqs: [
      { q: "Can this help with new patient intake?", a: "Yes. It can capture patient inquiry context, timing preference, and scheduling intent, then route the lead to your team." },
      { q: "Will it give medical advice?", a: "No. The workflow should not diagnose or give clinical advice. It collects scheduling context and routes patients to your office." },
      { q: "Can it follow up on care-plan drop-off?", a: "Yes. Approved reminders can re-engage patients who missed visits or went inactive, while leaving clinical decisions to your team." },
      { q: "Can it request reviews after visits?", a: "Yes. Review request timing can be configured around your office workflow and approved messaging." },
      { q: "What should we bring to the chiropractic automation audit?", a: "Bring your new-patient intake process, appointment reminder rules, reactivation language, and front-desk handoff preferences." },
    ],
  },
};

export function applyCurrentSixIndustryOverride(industry, slug) {
  const override = CURRENT_SIX_INDUSTRY_PAGE_OVERRIDES[slug];
  if (!industry || !override) return industry;

  return {
    ...industry,
    ...override,
    hero: {
      ...industry.hero,
      ...override.hero,
    },
  };
}

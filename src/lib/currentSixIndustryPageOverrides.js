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
      {
        problem: "Emergency AC call hits while your team is in the field",
        stat: "Urgent callers keep dialing until someone answers",
        solution: "Instant missed-call text-back captures the issue, ZIP code, and timing need",
        result: "Faster rescue path",
      },
      {
        problem: "Seasonal demand spikes overwhelm the front desk",
        stat: "Peak weather creates more calls than staff can handle manually",
        solution: "AI qualifies service type, urgency, location, and preferred callback window",
        result: "Cleaner dispatch handoff",
      },
      {
        problem: "Estimates and maintenance-plan opportunities go cold",
        stat: "Unfollowed estimates become competitor revenue",
        solution: "Automated follow-up keeps tune-ups, replacements, and estimates moving",
        result: "More second chances",
      },
      {
        problem: "Customers need service-area and timing answers fast",
        stat: "Unclear availability slows booking decisions",
        solution: "The workflow confirms service area, urgency, and next-step availability language",
        result: "Less friction to book",
      },
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
      {
        q: "Can this handle emergency HVAC calls after hours?",
        a: "Yes. The workflow can capture the urgency, issue type, ZIP code, and preferred timing, then route the lead according to your approved dispatch rules.",
      },
      {
        q: "Will it replace our dispatcher?",
        a: "No. It captures and organizes the lead before your team responds. Urgent or complex cases still route to your team for human handling.",
      },
      {
        q: "Can it follow up on old estimates and maintenance plans?",
        a: "Yes. Approved follow-up paths can re-engage old estimates, seasonal tune-up leads, and maintenance-plan opportunities.",
      },
      {
        q: "Does it support service-area filtering?",
        a: "Yes. The intake can ask for location or ZIP code before pushing the next step so outside-area leads are handled cleanly.",
      },
      {
        q: "What should we bring to the HVAC automation audit?",
        a: "Bring your service areas, dispatch rules, emergency handling process, common service categories, and current lead sources.",
      },
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
      {
        problem: "Storm damage leads arrive in a rush",
        stat: "Homeowners often contact multiple roofers",
        solution: "Instant response collects damage type, property details, urgency, and inspection intent",
        result: "Faster inspection path",
      },
      {
        problem: "Insurance questions slow down booking",
        stat: "Confusion creates hesitation",
        solution: "Approved messaging explains the next inspection step without overpromising claim outcomes",
        result: "Clearer next step",
      },
      {
        problem: "Old estimates disappear after one callback",
        stat: "Manual quote follow-up is easy to miss",
        solution: "Automated estimate follow-up keeps prior inspections and quotes active",
        result: "More reactivation",
      },
      {
        problem: "Missed calls after hours become lost inspections",
        stat: "The next roofer to answer can win the appointment",
        solution: "Missed-call text-back acknowledges the request and asks for inspection details",
        result: "Less lead leakage",
      },
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
      {
        q: "Can this handle storm lead surges?",
        a: "Yes. The intake flow is designed to acknowledge storm inquiries quickly, collect damage context, and route the next inspection step.",
      },
      {
        q: "Will it answer insurance questions?",
        a: "It can share approved process language and route complex claim questions to your team. It should not promise claim outcomes.",
      },
      {
        q: "Can homeowners send roof photos?",
        a: "The messaging can prompt homeowners to send photos before the inspection so your team has better context.",
      },
      {
        q: "Can it reactivate old estimates?",
        a: "Yes. Approved follow-up sequences can re-engage old estimates, prior inspections, and dormant storm leads.",
      },
      {
        q: "What should we bring to the roofing automation audit?",
        a: "Bring your inspection process, service areas, storm response rules, estimate follow-up language, and approved insurance-question wording.",
      },
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

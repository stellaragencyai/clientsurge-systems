import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { setJsonLd, setPageMetadata } from "@/lib/seo";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";

const posts = [
  {
    slug: "missed-call-text-back-guide",
    tag: "Lead Capture",
    date: "May 2026",
    title: "Missed Call Text-Back: How Local Businesses Recover Lost Leads",
    description:
      "Learn how missed call text-back systems help local businesses respond faster, recover lost inquiries, and move leads into a clear follow-up path.",
    keyword: "missed call text back service",
    cta: { label: "Book an automation audit", href: "/book?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=missed_call_text_back_guide" },
    links: [
      { label: "Automation overview", href: "/automations" },
      { label: "Compare packages", href: "/pricing" },
      { label: "Book an audit", href: "/book" },
    ],
    sections: [
      {
        heading: "Why missed calls turn into lost revenue",
        body:
          "A missed call is still a buying signal. The person had enough intent to pick up the phone, but if nobody responds quickly they often keep searching, call another provider, or forget the request entirely.",
      },
      {
        heading: "What a missed call text-back system does",
        body:
          "A practical system detects the missed call, sends a fast text response, captures the lead context, and routes the conversation into the same follow-up path your team can see and manage.",
      },
      {
        heading: "The ideal workflow",
        body:
          "The flow should log the call, send one controlled reply, ask a useful next question, and stop duplicate sends if the same call event is replayed. Replies should move into the lead record instead of living only inside the phone account.",
      },
      {
        heading: "Where humans should step in",
        body:
          "Automation should cover speed and structure. Humans should still handle sensitive questions, complex estimates, final pricing, and any conversation where the lead clearly needs personal attention.",
      },
      {
        heading: "What to track",
        body:
          "Track missed calls, response delivery, replies, booked conversations, duplicate suppression, and opt-out handling. If those events are not visible, the workflow is too hard to trust at launch.",
      },
    ],
    faqs: [
      ["What is missed call text-back?", "It is an automated response that sends a text after a business misses an inbound call, giving the lead a fast path to continue the conversation."],
      ["Does it replace my front desk?", "No. It covers the response gap when the team is unavailable, then routes the conversation back into the business workflow."],
      ["Can it work after hours?", "Yes, as long as the business approves the response rules, timing, compliance language, and follow-up boundaries."],
      ["What happens if the lead replies?", "The automation should attach the reply to the lead record, stop unnecessary follow-up, and move the person toward the right next step."],
    ],
  },
  {
    slug: "ai-lead-follow-up-automation",
    tag: "Automation",
    date: "May 2026",
    title: "AI Lead Follow-Up Automation: What It Should Actually Do",
    description:
      "A practical guide to AI lead follow-up automation for service businesses, including triggers, reply handling, booking prompts, and reporting.",
    keyword: "AI lead follow up automation",
    cta: { label: "Compare ClientSurge packages", href: "/pricing?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=ai_lead_follow_up_automation" },
    links: [
      { label: "Compare packages", href: "/pricing" },
      { label: "See automations", href: "/automations" },
      { label: "Ask implementation questions", href: "/contact" },
    ],
    sections: [
      {
        heading: "What lead follow-up automation should solve",
        body:
          "Good follow-up automation solves inconsistency. It makes sure new leads get a timely response, interested leads get a next step, and quiet leads receive controlled follow-up without relying on manual memory.",
      },
      {
        heading: "More than reminders or a chatbot",
        body:
          "A real workflow reads lead source, package context, reply state, booking state, and timing. It should not randomly blast generic messages or let AI invent promises the business cannot honor.",
      },
      {
        heading: "Trigger points that matter",
        body:
          "Useful triggers include a new form lead, missed call, unanswered inquiry, no-show follow-up, dormant lead segment, or post-service review request. Each trigger needs a stop condition.",
      },
      {
        heading: "Replies and bookings should stop automation",
        body:
          "If someone replies, books, opts out, or is marked closed, the automation needs to stop or change mode. This protects the customer experience and keeps the business compliant.",
      },
      {
        heading: "What owners should see",
        body:
          "Owners should see the lead, message history, current status, next scheduled action, and whether the workflow succeeded or failed. Hidden automation is hard to operate.",
      },
    ],
    faqs: [
      ["What is AI lead follow-up automation?", "It is a workflow that uses automation and AI-assisted routing to respond to, nurture, and move leads toward the right next step."],
      ["How many follow-ups should a lead receive?", "It depends on the business and consent rules, but every sequence should have clear limits and stop when the lead replies or books."],
      ["Does AI write every message from scratch?", "It should not need to. The safest launch approach uses controlled templates with AI assistance for classification and routing."],
      ["Which package is best for a small team?", "Starter usually fits basic response gaps. Growth or Pro fits teams with more lead sources, reactivation needs, and reporting requirements."],
    ],
  },
  {
    slug: "med-spa-lead-response-automation",
    tag: "Med Spa",
    date: "May 2026",
    title: "Med Spa Lead Response Automation: Stop Losing Consult Requests",
    description:
      "See how med spa lead response automation helps clinics respond faster to Botox, filler, laser, and consultation inquiries without overloading the front desk.",
    keyword: "med spa lead response automation",
    cta: { label: "View the med spa system", href: "/med-spa?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=med_spa_lead_response_automation" },
    links: [
      { label: "Med spa system", href: "/med-spa" },
      { label: "Free Automation Audit", href: "/book" },
      { label: "Compare packages", href: "/pricing" },
    ],
    sections: [
      {
        heading: "Why med spa leads go cold quickly",
        body:
          "Med spa inquiries are competitive. Someone asking about Botox, fillers, laser, body contouring, or skin treatments may contact several clinics before choosing where to book.",
      },
      {
        heading: "The front desk gap automation should cover",
        body:
          "A strong front desk is still busy with in-room clients, calls, checkouts, and scheduling. Automation protects the moments when new inquiries would otherwise wait too long.",
      },
      {
        heading: "A practical med spa response workflow",
        body:
          "The workflow should capture the inquiry, respond quickly, ask for the right context, offer a booking path when intent is clear, and make the conversation visible to the clinic team.",
      },
      {
        heading: "What to automate",
        body:
          "Start with website forms, missed calls, follow-up reminders, booking prompts, and dormant lead reactivation. Instagram and paid-ad inquiries can be added once the routing path is clear.",
      },
      {
        heading: "What not to promise",
        body:
          "Do not promise medical outcomes, guaranteed revenue, or fully autonomous consultations. The automation should support response and booking, not replace professional judgment.",
      },
    ],
    faqs: [
      ["Does this work for Botox and filler inquiries?", "Yes, it can route those inquiries into a faster response and booking path while leaving clinical guidance to the practice."],
      ["Can automation handle Instagram leads?", "It can be part of the system when the capture and routing path is approved, but each channel needs its own setup and proof."],
      ["Will this replace my front desk?", "No. It helps the front desk by covering response gaps and organizing inquiries while the team stays focused on clients."],
      ["Can it send booking links?", "Yes, when the business approves the booking flow and the lead has reached the right step in the conversation."],
    ],
  },
  {
    slug: "dental-missed-call-automation",
    tag: "Dental",
    date: "May 2026",
    title: "Dental Missed Call Automation for New Patient Inquiries",
    description:
      "A practical guide to dental missed call automation for practices that need faster new-patient response without adding front desk overload.",
    keyword: "dental missed call automation",
    cta: { label: "Book a dental automation demo", href: "/book?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=dental_missed_call_automation" },
    links: [
      { label: "Dental system", href: "/dental" },
      { label: "Compare packages", href: "/pricing" },
      { label: "Free Automation Audit", href: "/book" },
    ],
    sections: [
      {
        heading: "Why dental missed calls matter",
        body:
          "New-patient calls often happen between appointments, during lunch, after hours, or while the front desk is handling in-office patients. If the call is not acknowledged quickly, the patient may keep searching.",
      },
      {
        heading: "What the automation should do first",
        body:
          "The first job is simple: identify the missed call, send one approved text response, and give the patient a clear path to request an appointment or share the reason for the visit.",
      },
      {
        heading: "Dental-specific routing",
        body:
          "A dental workflow should distinguish emergency intent, hygiene requests, cosmetic inquiries, insurance questions, and general appointment requests so the team can prioritize the right conversations.",
      },
      {
        heading: "Where the front desk stays in control",
        body:
          "Automation should not quote treatment plans, diagnose symptoms, or promise availability. It should gather context, reduce response delay, and hand the conversation to the practice team.",
      },
      {
        heading: "Proof to check before launch",
        body:
          "Test missed-call detection, duplicate suppression, reply capture, opt-out handling, and whether the lead record shows the call, text, reply, and next action clearly.",
      },
    ],
    faqs: [
      ["Can this handle emergency dental calls?", "It can identify emergency language and route the lead quickly, but the practice should define the exact escalation language and response path."],
      ["Does it integrate with dental scheduling software?", "Scheduling integration depends on the practice stack. The launch-safe path is to start with response, intake, and routing before deeper scheduler automation."],
      ["Will it text every missed caller?", "It should only text within the business-approved rules, consent boundaries, and compliance language."],
      ["Which package fits a dental office?", "Starter can cover basic missed-call response. Growth or Pro fits practices that want multi-source follow-up, reactivation, and reporting."],
    ],
  },
  {
    slug: "contractor-lead-follow-up-system",
    tag: "Contractors",
    date: "May 2026",
    title: "Contractor Lead Follow-Up Systems That Keep Estimates Moving",
    description:
      "How contractor lead follow-up systems keep estimate requests, quote conversations, and old opportunities from slipping through the cracks.",
    keyword: "contractor lead follow up system",
    cta: { label: "View contractor workflow", href: "/contractors?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=contractor_lead_follow_up_system" },
    links: [
      { label: "Contractor system", href: "/contractors" },
      { label: "Automation overview", href: "/automations" },
      { label: "Compare packages", href: "/pricing" },
    ],
    sections: [
      {
        heading: "Contractor leads need fast qualification",
        body:
          "Homeowners and property managers usually want a fast answer on scope, timing, service area, and estimate availability. Slow follow-up gives competitors room to win the job.",
      },
      {
        heading: "What the system should collect",
        body:
          "A useful follow-up flow captures service type, location, urgency, photos when relevant, preferred contact method, and whether the customer is ready for an estimate.",
      },
      {
        heading: "Estimate follow-up should be structured",
        body:
          "The workflow should remind leads about pending estimates, nudge unanswered quote conversations, and stop once the lead responds, books, declines, or becomes closed.",
      },
      {
        heading: "Old opportunities are still valuable",
        body:
          "Reactivation can surface dormant quote requests, seasonal maintenance needs, and customers who delayed work. The sequence should be respectful and tightly limited.",
      },
      {
        heading: "What owners should monitor",
        body:
          "Track response speed, estimates requested, estimates booked, unanswered leads, reply rate, and failed sends. Those numbers show whether follow-up is creating real operational lift.",
      },
    ],
    faqs: [
      ["Can contractors automate estimate follow-up?", "Yes, as long as the automation uses approved messaging and stops when the lead responds or the job status changes."],
      ["Can it handle different trades?", "Yes. The intake questions and routing should change for roofing, HVAC, plumbing, remodeling, electrical, and general contracting."],
      ["Should it quote prices automatically?", "Usually no. It should gather job context and move qualified leads toward an estimate or human review."],
      ["Which package is best for contractors?", "Growth is usually the starting point when a contractor has multiple lead sources and needs quote follow-up plus reactivation."],
    ],
  },
  {
    slug: "hvac-missed-call-text-back",
    tag: "HVAC",
    date: "May 2026",
    title: "HVAC Missed Call Text-Back for Emergency and Seasonal Leads",
    description:
      "How HVAC missed call text-back helps local heating and cooling companies protect urgent repair calls, seasonal tune-ups, and quote requests.",
    keyword: "HVAC missed call text back",
    cta: { label: "View HVAC automation", href: "/hvac?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=hvac_missed_call_text_back" },
    links: [
      { label: "HVAC system", href: "/hvac" },
      { label: "Book an audit", href: "/book" },
      { label: "Compare packages", href: "/pricing" },
    ],
    sections: [
      {
        heading: "HVAC intent can be urgent",
        body:
          "No-cooling, no-heat, replacement, and maintenance calls carry different urgency. A missed call response should help the lead continue without making unsupported service promises.",
      },
      {
        heading: "Seasonality makes speed more important",
        body:
          "During hot and cold spikes, teams get overwhelmed. Text-back protects inbound demand when call volume rises and the office cannot answer every call immediately.",
      },
      {
        heading: "A good HVAC text-back flow",
        body:
          "The flow should acknowledge the missed call, ask for the service need and location, offer a booking or callback path, and log the full interaction for the team.",
      },
      {
        heading: "Emergency boundaries",
        body:
          "Emergency language needs careful handling. The automation can route and escalate, but the business should approve any emergency disclaimers, timing claims, and callback expectations.",
      },
      {
        heading: "Launch proof",
        body:
          "Before launch, confirm the phone event fires, the approved message sends once, replies attach to the lead, opt-outs work, and failed sends show in admin.",
      },
    ],
    faqs: [
      ["Can HVAC companies text missed callers?", "They can when the workflow follows approved consent, compliance, and opt-out rules for the business."],
      ["Can it identify emergency jobs?", "It can classify urgency from approved intake questions and route urgent leads for faster team attention."],
      ["Does this replace dispatch?", "No. It helps capture and qualify demand before dispatch or office staff take over."],
      ["What should HVAC teams measure?", "Missed calls, text delivery, reply rate, booked callbacks, urgent jobs, and failed automation events."],
    ],
  },
  {
    slug: "roofing-lead-response-automation",
    tag: "Roofing",
    date: "May 2026",
    title: "Roofing Lead Response Automation for Storm and Estimate Demand",
    description:
      "How roofing lead response automation helps roofers respond faster after storms, qualify estimate requests, and organize follow-up.",
    keyword: "roofing lead response automation",
    cta: { label: "View roofing automation", href: "/roofing?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=roofing_lead_response_automation" },
    links: [
      { label: "Roofing system", href: "/roofing" },
      { label: "Automation overview", href: "/automations" },
      { label: "Book an audit", href: "/book" },
    ],
    sections: [
      {
        heading: "Roofing demand comes in waves",
        body:
          "Storms, hail, leaks, insurance deadlines, and seasonal replacements can create sudden lead volume. Automation helps the company answer faster without losing organization.",
      },
      {
        heading: "What roofing intake should capture",
        body:
          "Useful fields include property location, issue type, storm timing, photos, insurance involvement, preferred contact time, and whether the homeowner wants an inspection.",
      },
      {
        heading: "Follow-up after the first response",
        body:
          "The system should keep inspection requests moving, remind unanswered leads, and reconnect with older estimate conversations when demand slows.",
      },
      {
        heading: "Avoid overpromising",
        body:
          "Automation should not promise insurance outcomes, inspection availability, or repair timelines without business approval. It should create a reliable path to human review.",
      },
      {
        heading: "What launch proof looks like",
        body:
          "A roofing workflow is ready when form leads, missed calls, replies, booking prompts, and failed events are visible in one operational view.",
      },
    ],
    faqs: [
      ["Can roofing automation handle storm leads?", "Yes. It can prioritize storm-related inquiries and collect context, while the business controls inspection and insurance language."],
      ["Can homeowners send photos?", "That depends on the approved channel setup, but photo request language can be part of the intake path."],
      ["Does it work for commercial roofing?", "The structure can work, but commercial intake and qualification rules should be configured separately."],
      ["Which package fits roofing?", "Growth or Pro usually fits roofers that handle multiple lead sources, storm surges, and estimate reactivation."],
    ],
  },
  {
    slug: "ai-appointment-booking-local-business",
    tag: "Booking",
    date: "May 2026",
    title: "How AI Appointment Booking Works for Local Service Businesses",
    description:
      "A plain-English explanation of AI appointment booking for local businesses, including routing, qualification, calendars, and handoff limits.",
    keyword: "AI appointment booking local business",
    cta: { label: "Start with Growth package", href: "/pricing?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=ai_appointment_booking_local_business" },
    links: [
      { label: "Compare packages", href: "/pricing" },
      { label: "See automations", href: "/automations" },
      { label: "Book an audit", href: "/book" },
    ],
    sections: [
      {
        heading: "Booking starts before the calendar",
        body:
          "The system first needs to know who the lead is, what they want, where they are located, and whether they are ready for an appointment, estimate, consultation, or callback.",
      },
      {
        heading: "AI should support routing",
        body:
          "AI can help classify intent, detect urgency, and choose the next question. The safest launch path still uses controlled rules for booking links, confirmations, and limits.",
      },
      {
        heading: "Calendar integration is not the whole system",
        body:
          "A booking link alone does not solve lead follow-up. The workflow also needs reminders, reply handling, no-show follow-up, and status visibility for the business.",
      },
      {
        heading: "When humans need to approve",
        body:
          "Humans should handle unusual requests, high-value estimates, medical or legal-sensitive questions, and any lead that does not fit the approved booking path.",
      },
      {
        heading: "Package fit",
        body:
          "Starter can support a simple booking path. Growth adds stronger follow-up and source coverage. Pro fits teams that need deeper routing, reporting, and operational review.",
      },
    ],
    faqs: [
      ["What is AI appointment booking?", "It is a workflow that helps qualify leads and move them toward the right calendar, callback, or appointment path."],
      ["Does AI book directly into my calendar?", "It can when the business approves the calendar rules and integration. Many launches start with guided booking links first."],
      ["What if a lead asks a complex question?", "The workflow should route complex or sensitive questions to a human instead of improvising."],
      ["Can booking automation reduce no-shows?", "It can help with reminders and follow-up, but no-show results depend on the business, offer, and appointment type."],
    ],
  },
  {
    slug: "lead-response-speed-to-lead",
    tag: "Strategy",
    date: "May 2026",
    title: "Why Speed-To-Lead Still Wins Local Service Customers",
    description:
      "Why speed-to-lead still matters for local businesses and how automation closes the response gap without replacing the team.",
    keyword: "speed to lead local business",
    cta: { label: "Audit current response path", href: "/book?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=lead_response_speed_to_lead" },
    links: [
      { label: "Book an audit", href: "/book" },
      { label: "Compare packages", href: "/pricing" },
      { label: "Contact ClientSurge", href: "/contact" },
    ],
    sections: [
      {
        heading: "Intent decays quickly",
        body:
          "A lead who fills out a form, calls, or asks a question is usually still shopping. The longer the response gap, the more likely they are to choose another option.",
      },
      {
        heading: "Speed is only useful with structure",
        body:
          "Fast but messy follow-up can create confusion. The response should identify the request, give the lead a next step, and record the event where the team can manage it.",
      },
      {
        heading: "Automation covers the gaps",
        body:
          "Automation is strongest after hours, during high call volume, during staff handoffs, and when old leads need a consistent reactivation sequence.",
      },
      {
        heading: "What not to automate blindly",
        body:
          "Do not automate sensitive advice, exact price promises, or unlimited follow-up. Speed should be paired with consent, stop conditions, and team visibility.",
      },
      {
        heading: "How to audit response speed",
        body:
          "Check every source: website forms, phone calls, ads, referrals, social DMs, and old quotes. Then identify where leads wait, disappear, or lack a clear next step.",
      },
    ],
    faqs: [
      ["What does speed-to-lead mean?", "It means how quickly a business responds after a prospect shows interest through a call, form, message, or ad inquiry."],
      ["Is the fastest response always best?", "No. The best response is fast, clear, compliant, and connected to the right next step."],
      ["Can small teams improve speed-to-lead?", "Yes. Automation can cover response gaps without requiring the owner or front desk to watch every channel constantly."],
      ["How should I measure it?", "Track time to first response, delivery success, reply rate, booking rate, and lost or unanswered leads by source."],
    ],
  },
  {
    slug: "automation-package-comparison",
    tag: "Pricing",
    date: "May 2026",
    title: "Starter vs Growth vs Pro: Choosing the Right Automation Stack",
    description:
      "A package-fit guide for choosing between ClientSurge Starter, Growth, and Pro based on lead volume, channels, follow-up needs, and launch readiness.",
    keyword: "AI automation package pricing",
    cta: { label: "Compare packages", href: "/pricing?utm_source=organic&utm_medium=blog&utm_campaign=clientsurge_launch_2026_05&utm_content=automation_package_comparison" },
    links: [
      { label: "Compare packages", href: "/pricing" },
      { label: "Book an audit", href: "/book" },
      { label: "Ask a question", href: "/contact" },
    ],
    sections: [
      {
        heading: "Start with operational fit",
        body:
          "The right automation package depends on lead volume, response gaps, number of channels, urgency, team capacity, and how much reporting the business needs.",
      },
      {
        heading: "Starter fit",
        body:
          "Starter fits businesses that need a clean entry point: basic lead response, simple follow-up, and a defined path to capture missed opportunities without building a complex stack.",
      },
      {
        heading: "Growth fit",
        body:
          "Growth fits teams with multiple lead sources, recurring follow-up gaps, booking needs, and enough inbound activity to benefit from stronger automation and visibility.",
      },
      {
        heading: "Pro fit",
        body:
          "Pro fits businesses that want deeper implementation, broader automation coverage, advanced routing, reactivation, and a more hands-on operating system around the funnel.",
      },
      {
        heading: "How to choose honestly",
        body:
          "Do not buy more complexity than the team can use. Choose the smallest package that solves the current bottleneck, then expand when response, booking, and reporting proof justify it.",
      },
    ],
    faqs: [
      ["Which package should a new business choose?", "Starter is usually the safest first step if lead volume is still low or the business only needs basic response coverage."],
      ["When does Growth make sense?", "Growth makes sense when there are multiple lead sources, follow-up gaps, and enough activity to justify a fuller automation workflow."],
      ["Who needs Pro?", "Pro fits teams that want more complete funnel coverage, reactivation, reporting, and deeper operational support."],
      ["Are the packages fixed forever?", "No. The practical path is to start with the right current fit and expand when the workflow proves value."],
    ],
  },
];

const topicFilters = [
  { label: "All", tags: [] },
  { label: "Lead Capture", tags: ["Lead Capture", "Automation"] },
  { label: "Industries", tags: ["Med Spa", "Dental", "Contractors", "HVAC", "Roofing"] },
  { label: "Booking", tags: ["Booking"] },
  { label: "Strategy", tags: ["Strategy", "Pricing"] },
];

function buildArticleSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: "2026-05-22",
    dateModified: "2026-05-22",
    mainEntityOfPage: `https://clientsurgesystems.com/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "ClientSurge Systems",
    },
    publisher: {
      "@type": "Organization",
      name: "ClientSurge Systems",
    },
  };
}

function buildFaqSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

function BlogIndex() {
  const [activeTopic, setActiveTopic] = useState(topicFilters[0].label);
  const activeFilter = topicFilters.find((filter) => filter.label === activeTopic) || topicFilters[0];
  const filteredPosts = useMemo(() => {
    if (activeFilter.tags.length === 0) return posts;
    return posts.filter((post) => activeFilter.tags.includes(post.tag));
  }, [activeFilter]);

  useEffect(() => {
    return setPageMetadata({
      title: "ClientSurge Blog | AI Automation for Local Service Businesses",
      description:
        "AI automation guides for local service businesses covering missed-call text-back, lead follow-up, appointment booking, and industry-specific growth.",
      canonicalPath: "/blog",
      ogTitle: "ClientSurge Blog | AI Automation for Local Service Businesses",
      ogDescription:
        "Practical AI automation guides for service businesses that need faster lead response, better follow-up, and more booked appointments.",
    });
  }, []);

  return (
    <BlogShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_19rem] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Launch guides</p>
            <h1 className="font-titles text-[#001B44] mb-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              AI lead response guides for local service businesses
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Practical ClientSurge playbooks on missed-call recovery, AI lead follow-up, booking automation, and niche-specific response systems.
            </p>
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Field notes</p>
            <p className="leading-6">Each guide maps one lead leak to a practical automation path, then points to the matching package or audit route.</p>
          </div>
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Filter blog guides by topic">
          {topicFilters.map((filter) => {
            const selected = filter.label === activeTopic;
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => setActiveTopic(filter.label)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition ${
                  selected
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-primary/15 bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
                aria-pressed={selected}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block rounded-lg border border-primary/12 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md md:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{post.tag}</span>
                <span className="text-xs text-muted-foreground">{post.date}</span>
              </div>
              <h2 className="mb-2 text-xl font-extrabold leading-snug text-foreground">{post.title}</h2>
              <p className="mb-4 text-sm leading-6 text-muted-foreground">{post.description}</p>
              <span className="text-sm font-semibold text-primary transition group-hover:translate-x-0.5">Read guide</span>
            </Link>
          ))}
        </div>
      </div>
    </BlogShell>
  );
}

function BlogArticle({ post }) {
  useEffect(() => {
    const cleanupMetadata = setPageMetadata({
      title: `${post.title} | ClientSurge Systems`,
      description: post.description,
      canonicalPath: `/blog/${post.slug}`,
      ogTitle: post.title,
      ogDescription: post.description,
    });
    const cleanupArticle = setJsonLd(`article-${post.slug}`, buildArticleSchema(post));
    const cleanupFaq = setJsonLd(`article-faq-${post.slug}`, buildFaqSchema(post));

    return () => {
      cleanupMetadata();
      cleanupArticle();
      cleanupFaq();
    };
  }, [post]);

  return (
    <BlogShell>
      <article className="mx-auto max-w-3xl">
        <Link to="/blog" className="mb-8 inline-flex text-sm font-semibold text-primary hover:text-primary/80">
          Back to blog
        </Link>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{post.tag}</span>
          <span className="text-xs text-muted-foreground">{post.date}</span>
        </div>
        <h1 className="font-titles text-[#001B44] mb-5 text-4xl font-bold leading-tight md:text-5xl">{post.title}</h1>
        <p className="mb-8 text-lg leading-8 text-muted-foreground">{post.description}</p>

        <div className="mb-10 rounded-lg border border-primary/12 bg-card p-5 shadow-sm">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Useful next steps</p>
          <div className="flex flex-wrap gap-3">
            {post.links.map((link) => (
              <Link key={link.href} to={link.href} className="rounded-lg border border-primary/20 bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-titles text-[#001B44] mb-3 text-2xl font-bold">{section.heading}</h2>
              <p className="text-base leading-8 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="font-titles text-[#001B44] mb-5 text-2xl font-bold">FAQ</h2>
          <div className="space-y-3">
            {post.faqs.map(([question, answer]) => (
              <div key={question} className="rounded-lg border border-primary/12 bg-card p-5 shadow-sm">
                <h3 className="mb-2 text-base font-bold text-foreground">{question}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
          <h2 className="font-titles text-[#001B44] mb-3 text-2xl font-bold">Ready to inspect your lead path?</h2>
          <p className="mb-5 text-sm leading-6 text-muted-foreground">
            ClientSurge audits where leads go cold, then maps the automation stack that fits your package, team, and launch readiness.
          </p>
          <Link to={post.cta.href} className="cs-btn-primary">
            {post.cta.label}
          </Link>
        </div>
      </article>
    </BlogShell>
  );
}

function BlogShell({ children }) {
  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-5 pb-16 pt-[calc(var(--cs-nav-height)+48px)]">
          {children}
        </main>
        <Footer />
        <MobileCallBar />
      </div>
    </DemoBookingProvider>
  );
}

export default function Blog() {
  const { slug } = useParams();
  const post = posts.find((item) => item.slug === slug);

  if (slug && post) return <BlogArticle post={post} />;
  return <BlogIndex />;
}

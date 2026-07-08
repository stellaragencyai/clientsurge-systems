import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const HVAC_CONFIG = {
  slug: "hvac-ai-growth-system",
  display_name: "HVAC AI Growth System",
  description:
    "A vertical AI customer acquisition system for HVAC contractors, built to capture urgent service demand, recover missed calls, automate follow-up, and convert repair, replacement, tune-up, and maintenance-plan leads.",
  industry_category: "Trade Services",
  status: "published",
  version: "1.0.0",
  schema_version: "1.0.0",
  branding_config: {
    primary_color: "#003B8F",
    secondary_color: "#00AEEF",
    asset_map: {
      hero_image: "",
      logo: "",
      favicon: "",
      og_image: "",
    },
    layout_options: {
      hero_style: "premium_service_emergency",
      section_order: [
        "hero",
        "pain_points",
        "use_cases",
        "automation_tiers",
        "proof_empty_state",
        "features",
        "guided_match",
        "final_cta",
      ],
    },
  },
  website_content: {
    hero_config: {
      headline:
        "Turn Missed HVAC Calls Into Booked Jobs With a 24/7 AI Growth System",
      subheadline:
        "ClientSurge installs the digital plumbing, electricity, and automation your HVAC website needs to capture urgent demand, respond instantly, follow up automatically, and move more homeowners toward booked service.",
      cta_text: "Compare HVAC Packages",
      cta_destination: "/pricing?industry=hvac-ai-growth-system",
    },
    pain_points: [
      {
        title: "Emergency calls go cold after hours",
        description:
          "Heat waves, cold snaps, and weekend breakdowns create high-intent calls when the office is least likely to answer quickly.",
      },
      {
        title: "Missed calls become competitor revenue",
        description:
          "Homeowners with no AC or no heat usually keep calling until someone responds. Slow recovery leaks booked jobs.",
      },
      {
        title: "Estimate follow-up is inconsistent",
        description:
          "Repair, replacement, and maintenance-plan leads need structured follow-up before they forget, delay, or choose another contractor.",
      },
      {
        title: "The website looks fine but does not operate",
        description:
          "A basic HVAC website is a house with no utilities. It exists, but it does not capture, respond, qualify, book, or react automatically.",
      },
    ],
    use_cases: [
      {
        title: "Instant response for repair and replacement requests",
        description:
          "When a homeowner submits a form, the system can notify the owner and trigger package-permitted SMS or email response paths.",
        metrics: "Designed for speed-to-lead",
      },
      {
        title: "Missed-call recovery for urgent service demand",
        description:
          "If an HVAC call is missed, the system can send a professional text-back workflow when the customer package allows it.",
        metrics: "Recover more high-intent inquiries",
      },
      {
        title: "AI booking and qualification for Growth and Pro",
        description:
          "The HVAC AI assistant collects system type, urgency, address, availability, and service need before handoff or booking.",
        metrics: "Cleaner intake before dispatch",
      },
      {
        title: "Maintenance-plan and tune-up nurture",
        description:
          "Follow-up logic can keep seasonal tune-up, filter replacement, financing, and replacement-interest leads moving.",
        metrics: "Automated follow-up consistency",
      },
    ],
    services: [
      {
        name: "Emergency AC Repair",
        description:
          "Capture no-cooling requests and route urgent homeowners toward fast response.",
        urgency_level: "high",
        cta: "Request Emergency Help",
      },
      {
        name: "Heating Repair",
        description:
          "Collect furnace, heat pump, and no-heat details before technician handoff.",
        urgency_level: "high",
        cta: "Get Heating Help",
      },
      {
        name: "HVAC Replacement Estimates",
        description:
          "Qualify replacement interest, financing questions, home type, and timeline.",
        urgency_level: "medium",
        cta: "Request Estimate",
      },
      {
        name: "Seasonal Tune-Ups",
        description:
          "Convert maintenance interest into scheduled tune-up opportunities.",
        urgency_level: "medium",
        cta: "Schedule Tune-Up",
      },
      {
        name: "Maintenance Plans",
        description:
          "Support recurring service-plan conversations and reactivation campaigns.",
        urgency_level: "low",
        cta: "Ask About Plans",
      },
      {
        name: "Indoor Air Quality",
        description:
          "Handle IAQ questions around filters, air purifiers, humidity, and comfort concerns.",
        urgency_level: "low",
        cta: "Improve Air Quality",
      },
    ],
    faq: [
      {
        question: "Is this just an HVAC website template?",
        answer:
          "No. It is a configurable HVAC AI Growth System: website experience, AI intake logic, CRM pipeline, package-based automation access, and deployment health visibility.",
        category: "positioning",
      },
      {
        question: "Do all six automations activate automatically?",
        answer:
          "No. The HVAC system is compatible with all six modules, but the purchased package controls which automations are active.",
        category: "packages",
      },
      {
        question: "What happens on Starter?",
        answer:
          "Starter focuses on essential lead response and missed-call recovery. Growth and Pro unlock deeper booking, nurture, digest, review, and reactivation capabilities.",
        category: "packages",
      },
      {
        question: "Can the AI quote HVAC repair prices?",
        answer:
          "The AI can collect context and explain that final pricing depends on inspection, equipment, and technician diagnosis. It should not guarantee pricing.",
        category: "ai_safety",
      },
      {
        question: "Why does HVAC need automation?",
        answer:
          "HVAC demand is urgent. Homeowners usually choose the company that responds fastest, especially during extreme heat, cold, or equipment failure.",
        category: "industry_fit",
      },
    ],
    seo_config: {
      meta_title: "HVAC AI Growth System | ClientSurge Systems",
      meta_description:
        "A package-based AI customer acquisition system for HVAC contractors: instant response, missed-call recovery, AI booking, nurture, digest, reviews, and reactivation.",
      keywords: [
        "HVAC AI website",
        "HVAC automation system",
        "missed call text back HVAC",
        "HVAC lead response automation",
        "HVAC customer acquisition system",
      ],
      og_title: "HVAC AI Growth System",
      og_description:
        "Turn HVAC websites into functional revenue infrastructure with package-controlled AI automation modules.",
    },
  },
  ai_config: {
    ai_personality_id: "hvac_24_7_service_assistant_v1",
    ai_role: "24/7 HVAC customer service and booking assistant",
    ai_tone: "professional, calm, urgent when appropriate, concise, service-oriented",
    system_prompt_overrides:
      "You are the HVAC AI assistant for a local heating and cooling company. Your job is to identify the homeowner's service need, urgency, equipment type, location, contact information, preferred appointment window, and whether the situation may require emergency escalation. Do not diagnose dangerous electrical, refrigerant, gas, or combustion issues. Do not guarantee prices. Escalate gas smell, carbon monoxide concerns, sparking, smoke, or immediate safety risks to emergency instructions and human dispatch.",
    knowledge_base_id: "hvac_growth_system_v1",
    escalation_rules: [
      {
        trigger: "gas smell, carbon monoxide, smoke, fire, sparking, electrical burning smell",
        action:
          "Tell the customer to leave the area if unsafe, contact emergency services when appropriate, and request immediate human dispatch.",
        recipient: "owner_or_dispatch",
      },
      {
        trigger: "no cooling during extreme heat, elderly resident, infant, medical concern",
        action: "Mark as urgent and notify dispatch immediately.",
        recipient: "owner_or_dispatch",
      },
      {
        trigger: "no heat during freezing conditions",
        action: "Mark as urgent and notify dispatch immediately.",
        recipient: "owner_or_dispatch",
      },
    ],
    booking_rules: {
      booking_link: "",
      booking_window_hours: 72,
      emergency_routing: true,
    },
    prohibited_responses: [
      "Do not guarantee repair pricing before inspection.",
      "Do not instruct customers to open electrical panels, handle refrigerant, bypass safety switches, or work on gas lines.",
      "Do not claim a technician has been dispatched unless the booking or dispatch event is confirmed.",
      "Do not fabricate reviews, proof, service guarantees, or live availability.",
    ],
  },
  lead_crm_config: {
    lead_types: [
      { key: "emergency_ac_repair", label: "Emergency AC Repair", urgency: "high" },
      { key: "heating_repair", label: "Heating Repair", urgency: "high" },
      { key: "replacement_estimate", label: "Replacement Estimate", urgency: "medium" },
      { key: "maintenance_tuneup", label: "Maintenance / Tune-Up", urgency: "medium" },
      { key: "maintenance_plan", label: "Maintenance Plan Interest", urgency: "low" },
      { key: "indoor_air_quality", label: "Indoor Air Quality", urgency: "low" },
    ],
    qualification_workflow: [
      { step: "service_need", question: "What HVAC issue or service do you need help with?", field_type: "text" },
      { step: "urgency", question: "Is this urgent today, this week, or just planning ahead?", field_type: "select" },
      { step: "system_type", question: "Is this for AC, heating, heat pump, ductless, or another system?", field_type: "select" },
      { step: "property_location", question: "What city or service area is the property in?", field_type: "text" },
      { step: "appointment_window", question: "What appointment window works best?", field_type: "text" },
      { step: "contact", question: "What is the best phone number and email for follow-up?", field_type: "contact" },
    ],
    pipeline_template: [
      { stage: "New HVAC Lead", order: 1 },
      { stage: "Instant Response Sent", order: 2 },
      { stage: "Qualified", order: 3 },
      { stage: "Appointment Scheduled", order: 4 },
      { stage: "Estimate Sent", order: 5 },
      { stage: "Won", order: 6 },
      { stage: "Lost", order: 7 },
      { stage: "Review Requested", order: 8 },
    ],
  },
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ success: false, error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const existing = await base44.asServiceRole.entities.IndustryConfig.filter(
      { slug: HVAC_CONFIG.slug },
      "-created_date",
      1,
    ).catch(() => []);

    let record;
    let action;
    if (existing?.[0]?.id) {
      record = await base44.asServiceRole.entities.IndustryConfig.update(existing[0].id, HVAC_CONFIG);
      action = "updated";
    } else {
      record = await base44.asServiceRole.entities.IndustryConfig.create(HVAC_CONFIG);
      action = "created";
    }

    return secureJson({
      success: true,
      action,
      slug: HVAC_CONFIG.slug,
      display_name: HVAC_CONFIG.display_name,
      status: HVAC_CONFIG.status,
      route: "/industries/hvac-ai-growth-system",
      record_id: record?.id || null,
      modules_supported: [
        "instant_lead_response",
        "missed_call_text_back",
        "lead_nurture",
        "ai_booking_agent",
        "daily_digest",
        "review_reactivation",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to seed HVAC AI Growth System";
    console.error("[seedHvacAiGrowthSystem]", message);
    return secureJson({ success: false, error: message }, { status: 500 });
  }
});

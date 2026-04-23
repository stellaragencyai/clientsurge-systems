export const DEMO_VIDEO_LIBRARY = {
  flagship_demo: {
    demo_key: "flagship_agency_demo",
    audience: "public",
    type: "flagship_demo",
    title: "Flagship Agency Demo",
    goal: "Show the end-to-end system from new lead through response, follow-up, booking handoff, and operator visibility.",
    duration_target: "4-6 minutes",
    status: "record_next",
    public_url: "",
    hosting_status: "not_published",
    recommended_placements: ["homepage", "book_page", "sales_follow_up"],
    source_of_truth: [
      "Canonical service flows in /admin",
      "CommunicationEvent-backed timeline",
      "Real package and service language from sales catalog",
    ],
  },
  service_clips: [
    {
      demo_key: "instant_lead_response_clip",
      audience: "public",
      type: "service_clip",
      service_key: "instant_lead_response",
      title: "Instant Lead Response Demo",
      goal: "Show a new lead arriving, the instant SMS response, and the operator test confirmation.",
      duration_target: "45-75 seconds",
      status: "record_next",
      public_url: "",
      hosting_status: "not_published",
      recommended_placements: ["pricing", "store", "sales_follow_up"],
      source_of_truth: ["Order-backed config", "Send Test Lead runtime", "CommunicationEvent timeline"],
    },
    {
      demo_key: "missed_call_text_back_clip",
      audience: "public",
      type: "service_clip",
      service_key: "missed_call_text_back",
      title: "Missed Call Text-Back Demo",
      goal: "Show a missed call scenario, automatic text-back, and the confirmed runtime event trail.",
      duration_target: "45-75 seconds",
      status: "record_next",
      public_url: "",
      hosting_status: "not_published",
      recommended_placements: ["pricing", "store", "sales_follow_up"],
      source_of_truth: ["Order-backed config", "Simulate Missed Call runtime", "CommunicationEvent timeline"],
    },
    {
      demo_key: "nurture_sequence_14d_clip",
      audience: "public",
      type: "service_clip",
      service_key: "nurture_sequence_14d",
      title: "14-Day Nurture Sequence Demo",
      goal: "Show the first nurture step firing, the sequence structure, and what is real vs placeholder.",
      duration_target: "60-90 seconds",
      status: "ready_for_recording",
      public_url: "",
      hosting_status: "not_published",
      recommended_placements: ["store", "sales_follow_up"],
      source_of_truth: ["Sequence builder in /admin", "Run Nurture Sequence Test", "CommunicationEvent timeline"],
    },
    {
      demo_key: "ai_booking_agent_clip",
      audience: "public",
      type: "service_clip",
      service_key: "ai_booking_agent",
      title: "AI Booking Agent Demo",
      goal: "Show the booking handoff flow, confirmation messaging, and honest placeholder behavior.",
      duration_target: "60-90 seconds",
      status: "ready_for_recording",
      public_url: "",
      hosting_status: "not_published",
      recommended_placements: ["pricing", "store", "sales_follow_up"],
      source_of_truth: ["Booking config in /admin", "Run Booking Agent Test", "CommunicationEvent timeline"],
    },
    {
      demo_key: "lead_reactivation_clip",
      audience: "public",
      type: "service_clip",
      service_key: "lead_reactivation",
      title: "Old Lead Reactivation Demo",
      goal: "Show target segment selection, target-size preview, and controlled batch test behavior.",
      duration_target: "60-90 seconds",
      status: "ready_for_recording",
      public_url: "",
      hosting_status: "not_published",
      recommended_placements: ["store", "sales_follow_up"],
      source_of_truth: ["Canonical Leads preview", "Run Reactivation Test", "CommunicationEvent timeline"],
    },
    {
      demo_key: "review_request_clip",
      audience: "public",
      type: "service_clip",
      service_key: "review_request",
      title: "Review Request Automation Demo",
      goal: "Show trigger selection, message setup, and a canonical simulated review request test.",
      duration_target: "60-90 seconds",
      status: "ready_for_recording",
      public_url: "",
      hosting_status: "not_published",
      recommended_placements: ["store", "sales_follow_up"],
      source_of_truth: ["Review-request config in /admin", "Run Review Request Test", "CommunicationEvent timeline"],
    },
  ],
  industry_cutdowns: [
    {
      demo_key: "medspa_flagship_cutdown",
      audience: "public",
      type: "industry_cutdown",
      industry_key: "medspa",
      title: "Med Spa Demo Cutdown",
      goal: "Trim the flagship demo to a med spa lead-response and booking narrative.",
      duration_target: "60-90 seconds",
      status: "planned",
      public_url: "",
      hosting_status: "not_published",
      recommended_placements: ["medspa_page", "sales_follow_up"],
    },
  ],
  internal_operator_clips: [
    {
      demo_key: "operator_workspace_overview",
      audience: "internal",
      type: "operator_clip",
      title: "Install Workspace Overview",
      goal: "Train operators on the canonical queue, workspace, blockers, tests, and go-live rules.",
      duration_target: "4-6 minutes",
      status: "record_next",
      recommended_placements: ["internal_ops_doc"],
      source_of_truth: ["/admin install queue", "/admin install workspace", "Operator sequence in remoteSetupWorkspace"],
    },
    {
      demo_key: "operator_service_setup_pattern",
      audience: "internal",
      type: "operator_clip",
      title: "Per-Service Setup Pattern",
      goal: "Show the repeatable service-card workflow: required actions, config, test, go-live readiness, timeline.",
      duration_target: "3-5 minutes",
      status: "record_next",
      recommended_placements: ["internal_ops_doc"],
      source_of_truth: ["InstallOrderWorkspace", "Service playbooks", "CommunicationEvent timeline"],
    },
  ],
};

export function getPublicDemoEntries() {
  return [
    DEMO_VIDEO_LIBRARY.flagship_demo,
    ...DEMO_VIDEO_LIBRARY.service_clips,
    ...DEMO_VIDEO_LIBRARY.industry_cutdowns,
  ];
}

export function getInternalDemoEntries() {
  return [...DEMO_VIDEO_LIBRARY.internal_operator_clips];
}

export function getServiceDemoEntries() {
  return [...DEMO_VIDEO_LIBRARY.service_clips];
}

export function getDemoCoverageSummary() {
  const publicEntries = getPublicDemoEntries();
  const internalEntries = getInternalDemoEntries();

  return {
    public_total: publicEntries.length,
    public_published: publicEntries.filter((entry) => entry.public_url).length,
    internal_total: internalEntries.length,
    internal_record_next: internalEntries.filter((entry) => entry.status === "record_next").length,
    service_coverage_keys: DEMO_VIDEO_LIBRARY.service_clips.map((entry) => entry.service_key),
  };
}

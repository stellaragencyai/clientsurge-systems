import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Zap, MessageSquare, Mail, CalendarCheck, RotateCcw,
  LayoutDashboard, HeadphonesIcon, Search, CheckCircle2,
  XCircle, AlertCircle, Clock, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";

// The 9 core automations mapped to their system steps
const NINE_AUTOMATIONS = [
  {
    id: "instant_response",
    step: 1,
    title: "Instant Lead Response",
    desc: "Sends instant SMS + email within 60 seconds of a new lead being captured.",
    icon: Zap,
    automation_name: "Lead Capture & Instant Response",
    type: "entity",
    stepKey: "step_system_setup",
  },
  {
    id: "booking_link",
    step: 2,
    title: "Booking Link (Qualified Leads)",
    desc: "Automatically sends a booking link when a lead is marked Qualified.",
    icon: CalendarCheck,
    automation_name: "Send Booking Link (Qualified)",
    type: "entity",
    stepKey: "step_booking",
  },
  {
    id: "followup_sms",
    step: 3,
    title: "Follow-Up SMS (15 Min)",
    desc: "Sends a follow-up SMS 15 minutes after a lead is contacted if no reply.",
    icon: MessageSquare,
    automation_name: "Follow-Up SMS (15 Min)",
    type: "scheduled",
    stepKey: "step_followup",
  },
  {
    id: "lead_discovery",
    step: 4,
    title: "Daily Lead Discovery",
    desc: "Discovers and enriches new leads daily at 8AM from Google Maps.",
    icon: Search,
    automation_name: "Daily Lead Discovery & Enrichment",
    type: "scheduled",
    stepKey: null,
  },
  {
    id: "missed_call",
    step: 5,
    title: "Missed Call Text-Back",
    desc: "Immediately texts any lead that called but didn't get answered.",
    icon: RotateCcw,
    automation_name: null,
    type: "planned",
    stepKey: "step_sms",
  },
  {
    id: "email_sequence",
    step: 6,
    title: "Email Follow-Up Sequence",
    desc: "Multi-day email nurture sequence for leads who haven't booked yet.",
    icon: Mail,
    automation_name: null,
    type: "planned",
    stepKey: "step_email",
  },
  {
    id: "reactivation",
    step: 7,
    title: "Old Lead Reactivation",
    desc: "Re-engages dormant leads with a targeted re-activation campaign.",
    icon: RefreshCw,
    automation_name: null,
    type: "planned",
    stepKey: null,
  },
  {
    id: "crm_pipeline",
    step: 8,
    title: "CRM Pipeline Automation",
    desc: "Auto-tags and updates lead status through the pipeline based on activity.",
    icon: LayoutDashboard,
    automation_name: null,
    type: "planned",
    stepKey: "step_system_setup",
  },
  {
    id: "support",
    step: 9,
    title: "Ongoing Support & Optimization",
    desc: "Monthly performance reviews and continuous system optimization.",
    icon: HeadphonesIcon,
    automation_name: null,
    type: "manual",
    stepKey: "step_live",
  },
];

function StatusBadge({ automation, liveData }) {
  if (automation.type === "planned") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> Planned
      </span>
    );
  }
  if (automation.type === "manual") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <HeadphonesIcon className="w-3 h-3" /> Manual
      </span>
    );
  }
  if (!liveData) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
        <Clock className="w-3 h-3" /> Not Found
      </span>
    );
  }
  if (!liveData.is_active) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
        <XCircle className="w-3 h-3" /> Paused
      </span>
    );
  }
  if (liveData.last_run_status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-3 h-3" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3 h-3" /> Active
    </span>
  );
}

// Per-client step tracker for a selected project
function ClientStepUpdater({ project, onUpdate }) {
  const STEPS = [
    { key: "step_onboarding", label: "Onboarding Form" },
    { key: "step_payment", label: "Payment Confirmed" },
    { key: "step_system_setup", label: "System Setup" },
    { key: "step_sms", label: "SMS Connected" },
    { key: "step_email", label: "Email Connected" },
    { key: "step_booking", label: "Booking Flow Live" },
    { key: "step_followup", label: "Follow-Up Active" },
    { key: "step_live", label: "Full System Running" },
  ];
  const [saving, setSaving] = useState(false);

  const updateStep = async (key, value) => {
    setSaving(true);
    await base44.entities.ClientProject.update(project.id, { [key]: value });
    onUpdate();
    setSaving(false);
  };

  const completedCount = STEPS.filter(s => project[s.key] === "complete").length;

  return (
    <div className="mt-3 p-4 rounded-xl border border-border bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-foreground">{project.business_name}</p>
        <span className="text-xs text-muted-foreground">{completedCount}/8 complete</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((step) => {
          const status = project[step.key] || "pending";
          return (
            <div key={step.key}>
              <p className="text-[10px] text-muted-foreground mb-1">{step.label}</p>
              <select
                value={status}
                onChange={e => updateStep(step.key, e.target.value)}
                disabled={saving}
                className="w-full text-xs border border-border rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>
          );
        })}
      </div>
      {saving && <p className="text-xs text-primary mt-2">Saving & updating client portal...</p>}
    </div>
  );
}

export default function AutomationsPanel() {
  const [liveAutomations, setLiveAutomations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [projs] = await Promise.all([
        base44.entities.ClientProject.list("-created_date", 50),
      ]);
      setProjects(projs);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch live automation status via backend
  const loadAutomations = async () => {
    try {
      const res = await base44.functions.invoke("getAutomationStatus", {});
      setLiveAutomations(res.data?.automations || []);
    } catch {
      // fallback: no live data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAutomations();
  }, []);

  const getLiveData = (automation) => {
    if (!automation.automation_name) return null;
    return liveAutomations.find(a => a.name === automation.automation_name) || null;
  };

  const activeCount = NINE_AUTOMATIONS.filter(a => {
    const live = getLiveData(a);
    return live?.is_active && live?.last_run_status !== "failed";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">9-System Automations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} active · {NINE_AUTOMATIONS.length - activeCount} planned/manual
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); loadAutomations(); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* 9 Automation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {NINE_AUTOMATIONS.map((automation) => {
          const Icon = automation.icon;
          const live = getLiveData(automation);
          const isActive = live?.is_active && live?.last_run_status !== "failed";
          const isFailed = live?.last_run_status === "failed";

          return (
            <div
              key={automation.id}
              className="bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md"
              style={{
                borderColor: isActive
                  ? "rgba(154,92,46,0.35)"
                  : isFailed
                  ? "rgba(220,38,38,0.3)"
                  : "hsl(var(--border))",
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg,#9a5c2e,#c8965c)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive ? "#fff" : "#9a5c2e" }}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step {automation.step}</p>
                    <p className="text-sm font-semibold text-foreground leading-tight">{automation.title}</p>
                  </div>
                </div>
                <StatusBadge automation={automation} liveData={live} />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{automation.desc}</p>

              {live && (
                <div className="text-xs text-muted-foreground space-y-0.5 pt-3 border-t border-border">
                  <div className="flex justify-between">
                    <span>Total runs</span>
                    <span className="font-semibold text-foreground">{live.total_runs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successful</span>
                    <span className="font-semibold text-green-700">{live.successful_runs}</span>
                  </div>
                  {live.failed_runs > 0 && (
                    <div className="flex justify-between">
                      <span>Failed</span>
                      <span className="font-semibold text-red-600">{live.failed_runs}</span>
                    </div>
                  )}
                </div>
              )}

              {automation.type === "planned" && (
                <p className="text-xs text-amber-600 font-semibold pt-2 border-t border-border mt-2">
                  🔧 Coming soon — mark step complete in client projects when ready
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Client Project Step Updater */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <h3 className="font-semibold text-foreground mb-1">Update Client Build Progress</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Mark steps complete here — the client's pizza tracker updates instantly in real-time.
        </p>

        {loadingProjects ? (
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No client projects yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map(project => (
              <div key={project.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{project.business_name}</p>
                    <p className="text-xs text-muted-foreground">{project.client_email} · {project.plan}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {["step_onboarding","step_payment","step_system_setup","step_sms","step_email","step_booking","step_followup","step_live"].filter(k => project[k] === "complete").length}/8
                    </span>
                    {expandedProject === project.id
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </button>
                {expandedProject === project.id && (
                  <ClientStepUpdater
                    project={project}
                    onUpdate={loadData}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
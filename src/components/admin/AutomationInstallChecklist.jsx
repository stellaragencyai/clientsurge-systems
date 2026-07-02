import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { formatChecklistStepCompletedAt } from "@/lib/installChecklistTimestamps";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  Database,
  ExternalLink,
  Eye,
  Loader2,
  PauseCircle,
  Play,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const SERVICE_DEFINITIONS = {
  instant_lead_response: {
    label: "Instant Lead Response",
    icon: "⚡",
    description: "Lead capture → SMS/email response → CommunicationEvent proof.",
    steps: [
      { id: "lead_form", section: "Lead Form", label: "Lead capture path is producing WebsiteLead records" },
      { id: "sms_template", section: "Configuration", label: "Instant-response SMS template exists" },
      { id: "resend_key", section: "Resend", label: "Email provider activity/proof exists" },
      { id: "twilio_sid", section: "Twilio", label: "SMS provider activity/proof exists" },
      { id: "test_lead", section: "Test", label: "Test lead or live lead was created" },
      { id: "sms_received", section: "Test", label: "Outbound SMS event succeeded or delivered" },
      { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists" },
      { id: "lead_status_updated", section: "Proof", label: "Lead moved beyond new status" },
    ],
  },
  missed_call_text_back: {
    label: "Missed Call Text-Back",
    icon: "📞",
    description: "Missed call webhook → text-back SMS → delivery proof.",
    steps: [
      { id: "twilio_webhook", section: "Twilio", label: "Voice webhook / missed call event exists" },
      { id: "status_callback", section: "Twilio", label: "SMS status callback proof exists" },
      { id: "missed_call_template", section: "Configuration", label: "Missed-call template exists" },
      { id: "signature_validation", section: "Configuration", label: "Inbound webhook validation is expected" },
      { id: "test_call", section: "Test", label: "Missed-call test or live call event exists" },
      { id: "sms_received", section: "Proof", label: "Text-back SMS succeeded or delivered" },
      { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists" },
    ],
  },
  nurture_sequence_14d: {
    label: "14-Day Nurture Sequence",
    icon: "🔄",
    description: "Scheduled follow-ups → channel events → stop-on-reply proof.",
    steps: [
      { id: "nurture_templates", section: "Configuration", label: "Follow-up templates exist" },
      { id: "automation_schedule", section: "Configuration", label: "Follow-up processor has produced events" },
      { id: "stop_on_reply", section: "Configuration", label: "Inbound reply handler proof exists" },
      { id: "test_lead", section: "Test", label: "Lead exists for nurture flow" },
      { id: "step1_sent", section: "Proof", label: "Step 1 SMS/email sent" },
      { id: "step2_sent", section: "Proof", label: "Later follow-up sent" },
      { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent records exist" },
      { id: "stop_on_reply_verified", section: "Proof", label: "Reply received / cadence stopped proof exists" },
    ],
  },
  ai_booking_agent: {
    label: "AI Booking Agent",
    icon: "📅",
    description: "Qualified lead → booking prompt → booking link/event proof.",
    steps: [
      { id: "booking_link", section: "Booking", label: "Booking link/config is present" },
      { id: "calendar_system", section: "Booking", label: "Calendar system verified" },
      { id: "booking_prompt_sms", section: "Configuration", label: "Booking-prompt SMS configured" },
      { id: "booking_prompt_email", section: "Configuration", label: "Booking-prompt email configured" },
      { id: "qualified_trigger", section: "Configuration", label: "Qualified lead triggered booking prompt" },
      { id: "test_booking", section: "Test", label: "Booking prompt test/live event exists" },
      { id: "booking_link_in_sms", section: "Proof", label: "Booking link sent in outbound message" },
      { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists" },
    ],
  },
  lead_reactivation: {
    label: "Old Lead Reactivation",
    icon: "💰",
    description: "Dormant lead batch → controlled outbound proof.",
    steps: [
      { id: "old_leads_imported", section: "Data", label: "Lead pool exists" },
      { id: "leads_have_phone", section: "Data", label: "Phone numbers exist for outreach" },
      { id: "batch_size_set", section: "Configuration", label: "Batch control configured" },
      { id: "reactivation_templates", section: "Configuration", label: "Reactivation message exists" },
      { id: "test_batch", section: "Test", label: "Test batch/live batch event exists" },
      { id: "sms_received", section: "Proof", label: "Outbound SMS proof exists" },
      { id: "comm_event_logged", section: "Proof", label: "Batch CommunicationEvent exists" },
    ],
  },
  review_request: {
    label: "Review Request Automation",
    icon: "⭐",
    description: "Completed work → review request → link/event proof.",
    steps: [
      { id: "review_link", section: "Review Links", label: "Review link exists" },
      { id: "review_link_saved", section: "Review Links", label: "Review link stored in config" },
      { id: "trigger_defined", section: "Configuration", label: "Trigger event configured" },
      { id: "review_sms_template", section: "Configuration", label: "Review SMS template exists" },
      { id: "review_email_template", section: "Configuration", label: "Review email template exists" },
      { id: "test_request", section: "Test", label: "Review request test/live event exists" },
      { id: "comm_event_logged", section: "Proof", label: "CommunicationEvent log exists" },
    ],
  },
};

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-700", icon: Circle },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: RefreshCw },
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-100 text-red-700", icon: XCircle },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700", icon: PauseCircle },
};

const SECTION_COLORS = {
  Twilio: "text-blue-700 bg-blue-50",
  Resend: "text-purple-700 bg-purple-50",
  Booking: "text-green-700 bg-green-50",
  "Review Links": "text-yellow-700 bg-yellow-50",
  "Lead Form": "text-orange-700 bg-orange-50",
  Configuration: "text-slate-700 bg-slate-100",
  Data: "text-teal-700 bg-teal-50",
  Test: "text-indigo-700 bg-indigo-50",
  Proof: "text-emerald-700 bg-emerald-50",
};

const EVENT_TYPES_BY_STEP = {
  lead_form: ["lead_created"],
  test_lead: ["lead_created", "booking_simulation_created"],
  sms_received: ["sms_sent", "sms_delivered", "provider_send_succeeded"],
  step1_sent: ["sms_sent", "email_sent", "provider_send_succeeded"],
  step2_sent: ["email_sent", "sms_sent"],
  comm_event_logged: ["*"],
  lead_status_updated: ["status_update", "workflow_triggered"],
  twilio_sid: ["sms_sent", "sms_delivered", "provider_send_succeeded", "voice_call_completed", "voice_call_no_answer"],
  resend_key: ["email_sent", "provider_send_succeeded"],
  twilio_webhook: ["voice_call_no_answer", "voice_call_completed", "sms_received"],
  status_callback: ["sms_delivered", "provider_send_succeeded", "provider_send_failed"],
  test_call: ["voice_call_no_answer", "voice_call_completed"],
  automation_schedule: ["workflow_triggered", "sms_sent", "email_sent"],
  stop_on_reply: ["sms_received"],
  stop_on_reply_verified: ["sms_received"],
  qualified_trigger: ["workflow_triggered", "booking_simulation_created", "sms_sent", "email_sent"],
  test_booking: ["booking_simulation_created", "booking_created"],
  booking_link_in_sms: ["sms_sent", "sms_delivered"],
  test_batch: ["lead_reactivation_batch_completed"],
  review_link: ["review_request_trigger_simulated"],
  review_link_saved: ["review_request_trigger_simulated"],
  test_request: ["review_request_trigger_simulated"],
};

const LIVE_REFRESH_MS = 30000;

function isCompleteStatus(status) {
  return status === "complete" || status === "active" || status === "trusted";
}

function getEventTime(event) {
  return event?.created_date || event?.created_at || event?.updated_date || null;
}

function eventMatchesStep(event, stepId) {
  const candidates = EVENT_TYPES_BY_STEP[stepId];
  if (!candidates) return false;
  if (candidates.includes("*")) return true;
  return candidates.includes(event.event_type);
}

function deriveStepState(step, dbStep, events) {
  if (dbStep) {
    if (dbStep.status === "failed") {
      return {
        status: "failed",
        source: "DB step",
        detail: dbStep.error_message || dbStep.notes || "Persisted DB step failed.",
        timestamp: dbStep.completed_at,
      };
    }
    if (isCompleteStatus(dbStep.status)) {
      return {
        status: "complete",
        source: "DB step",
        detail: dbStep.notes || "Persisted install step marked complete.",
        timestamp: dbStep.completed_at,
      };
    }
    if (dbStep.status === "in_progress") {
      return { status: "in_progress", source: "DB step", detail: dbStep.notes || "Persisted install step is in progress.", timestamp: dbStep.completed_at };
    }
  }

  const matchingEvent = events.find(event => eventMatchesStep(event, step.id));
  if (matchingEvent) {
    const failed = ["failed", "sms_failed", "email_failed", "provider_send_failed"].includes(matchingEvent.status) || String(matchingEvent.event_type || "").includes("failed");
    return {
      status: failed ? "failed" : "complete",
      source: "Live event",
      detail: `${matchingEvent.event_type || "event"}${matchingEvent.status ? ` · ${matchingEvent.status}` : ""}${matchingEvent.provider ? ` · ${matchingEvent.provider}` : ""}`,
      timestamp: getEventTime(matchingEvent),
    };
  }

  return { status: "pending", source: "Waiting", detail: "No live evidence found yet.", timestamp: null };
}

function deriveCardStatus(checklist, stepStates, events) {
  const failedEvent = events.find(e => e.status === "failed" || String(e.event_type || "").includes("failed"));
  if (checklist.status === "paused") return "paused";
  if (checklist.status === "failed" || failedEvent || stepStates.some(s => s.status === "failed")) return "failed";
  const total = stepStates.length;
  const complete = stepStates.filter(s => s.status === "complete").length;
  if (total > 0 && complete === total) return "active";
  if (complete > 0 || events.length > 0 || stepStates.some(s => s.status === "in_progress")) return "in_progress";
  return "not_started";
}

function compactDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function LiveStepRow({ step, state }) {
  const Icon = state.status === "complete" ? CheckCircle2 : state.status === "failed" ? XCircle : state.status === "in_progress" ? RefreshCw : Circle;
  const color = state.status === "complete"
    ? "bg-green-50 border-green-200 text-green-800"
    : state.status === "failed"
      ? "bg-red-50 border-red-200 text-red-800"
      : state.status === "in_progress"
        ? "bg-blue-50 border-blue-200 text-blue-800"
        : "bg-white border-slate-200 text-slate-700";

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${color}`}>
      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${state.status === "in_progress" ? "animate-spin" : ""}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SECTION_COLORS[step.section] || "bg-slate-100 text-slate-600"}`}>{step.section}</span>
          <span className="text-sm font-medium">{step.label}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Database className="h-3 w-3" />{state.source}</span>
          <span>{state.detail}</span>
          {state.timestamp && <span>· {compactDate(state.timestamp)}</span>}
        </div>
      </div>
    </div>
  );
}

function ChecklistCard({ checklist, evidence, onManualStatus }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const def = SERVICE_DEFINITIONS[checklist.service_key];
  const steps = def?.steps || [];
  const dbSteps = evidence?.steps || [];
  const events = evidence?.events || [];
  const dbStepById = useMemo(() => {
    const map = {};
    dbSteps.forEach(step => {
      map[step.step_id] = step;
    });
    return map;
  }, [dbSteps]);

  const stepStates = steps.map(step => ({ ...deriveStepState(step, dbStepById[step.id], events), id: step.id }));
  const completeCount = stepStates.filter(s => s.status === "complete").length;
  const failedCount = stepStates.filter(s => s.status === "failed").length;
  const progress = steps.length ? Math.round((completeCount / steps.length) * 100) : 0;
  const liveStatus = deriveCardStatus(checklist, stepStates, events);
  const statusCfg = STATUS_CONFIG[liveStatus] || STATUS_CONFIG.not_started;
  const StatusIcon = statusCfg.icon;
  const latestEvent = events[0];
  const latestDbStep = dbSteps.find(s => s.completed_at);
  const latestEvidenceTime = getEventTime(latestEvent) || latestDbStep?.completed_at || checklist.updated_date;

  if (!def) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Unknown service key: <strong>{checklist.service_key}</strong>. This stale checklist will not be trusted until the service key is migrated.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-50" onClick={() => setExpanded(!expanded)}>
        <span className="text-2xl">{def.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{def.label}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${statusCfg.color}`}>
              <StatusIcon className={`h-3 w-3 ${liveStatus === "in_progress" ? "animate-spin" : ""}`} />
              Live: {statusCfg.label}
            </span>
            {checklist.status !== liveStatus && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Manual status says {checklist.status}</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{checklist.business_name} — {checklist.client_email}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500">{completeCount}/{steps.length} verified</span>
          </div>
        </div>
        <div className="hidden text-right text-[11px] text-slate-500 md:block">
          <div className="font-semibold text-slate-700">{events.length} events · {dbSteps.length} DB steps</div>
          <div>Latest: {compactDate(latestEvidenceTime)}</div>
        </div>
        <Eye className="h-4 w-4 text-slate-400" />
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-slate-100 p-4">
          <div className="grid gap-3 text-xs md:grid-cols-5">
            <div><p className="font-semibold uppercase tracking-wide text-slate-400">Order ID</p><p className="mt-0.5 truncate text-slate-700">{checklist.order_id || "—"}</p></div>
            <div><p className="font-semibold uppercase tracking-wide text-slate-400">Manual Status</p><p className="mt-0.5 text-slate-700">{checklist.status}</p></div>
            <div><p className="font-semibold uppercase tracking-wide text-slate-400">Live Evidence</p><p className="mt-0.5 text-slate-700">{events.length} events / {dbSteps.length} steps</p></div>
            <div><p className="font-semibold uppercase tracking-wide text-slate-400">Failed Signals</p><p className="mt-0.5 text-slate-700">{failedCount}</p></div>
            <div><p className="font-semibold uppercase tracking-wide text-slate-400">Latest Proof</p><p className="mt-0.5 text-slate-700">{compactDate(latestEvidenceTime)}</p></div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4" /><p><strong>Live mode:</strong> checkmarks below are derived from persisted AutomationChecklistStep rows and CommunicationEvent records. Manual clicks no longer create fake proof.</p></div>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => <LiveStepRow key={step.id} step={step} state={stepStates[index]} />)}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent Live Events</p>
              <span className="text-[10px] text-slate-400">Newest first</span>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No CommunicationEvent proof found for this order/service yet.</p>
            ) : (
              <div className="space-y-1.5">
                {events.slice(0, 6).map(event => (
                  <div key={event.id} className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2 text-xs">
                    <span className="truncate text-slate-700">{event.event_type} · {event.status} · {event.provider || "internal"}</span>
                    <span className="whitespace-nowrap text-slate-400">{compactDate(getEventTime(event))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-2">
            <button onClick={() => onManualStatus(checklist, "in_progress", user?.email)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"><RefreshCw className="h-3 w-3" />Manual Override: In Progress</button>
            <button onClick={() => onManualStatus(checklist, "active", user?.email)} className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"><CheckCircle2 className="h-3 w-3" />Manual Override: Active</button>
            <button onClick={() => onManualStatus(checklist, "paused", user?.email)} className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-100"><PauseCircle className="h-3 w-3" />Pause</button>
            <button onClick={() => onManualStatus(checklist, "failed", user?.email)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"><XCircle className="h-3 w-3" />Manual Override: Failed</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutomationInstallChecklist() {
  const [checklists, setChecklists] = useState([]);
  const [evidenceByChecklist, setEvidenceByChecklist] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [search, setSearch] = useState("");
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  useEffect(() => {
    loadDashboard(true);
    const timer = window.setInterval(() => loadDashboard(false), LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const loadEvidenceForChecklist = async (checklist) => {
    const stepQuery = { automation_checklist_id: checklist.id };
    const eventQuery = { service_key: checklist.service_key };
    if (checklist.order_id) eventQuery.order_id = checklist.order_id;

    const [steps, events] = await Promise.all([
      base44.entities.AutomationChecklistStep.filter(stepQuery, "step_order", 100).catch(() => []),
      checklist.order_id
        ? base44.entities.CommunicationEvent.filter(eventQuery, "-created_date", 50).catch(() => [])
        : Promise.resolve([]),
    ]);

    return { steps: steps || [], events: events || [] };
  };

  const loadDashboard = async (initial = false) => {
    if (initial) setLoading(true);
    setRefreshing(true);
    try {
      const data = await base44.entities.AutomationChecklist.list("-created_date", 200);
      const valid = (data || []).filter(item => item.dashboard_excluded !== true);
      const evidenceEntries = await Promise.all(valid.map(async checklist => [checklist.id, await loadEvidenceForChecklist(checklist)]));
      setChecklists(valid);
      setEvidenceByChecklist(Object.fromEntries(evidenceEntries));
      setLastRefreshAt(new Date().toISOString());
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const getLiveStatus = (checklist) => {
    const def = SERVICE_DEFINITIONS[checklist.service_key];
    const evidence = evidenceByChecklist[checklist.id] || { steps: [], events: [] };
    const dbMap = {};
    evidence.steps.forEach(step => { dbMap[step.step_id] = step; });
    const states = (def?.steps || []).map(step => deriveStepState(step, dbMap[step.id], evidence.events || []));
    return deriveCardStatus(checklist, states, evidence.events || []);
  };

  const handleManualStatus = async (checklist, status, email) => {
    const patch = {
      status,
      dashboard_truth_status: status === "active" ? "warning" : "unknown",
      dashboard_truth_notes: `Manual override by ${email || "admin"} on ${new Date().toISOString()}. Live dashboard evidence remains source of truth.`,
    };
    if (status === "active") patch.went_live_at = new Date().toISOString();
    if (status === "active" || status === "in_progress") patch.installed_by = email || "admin";
    const updated = await base44.entities.AutomationChecklist.update(checklist.id, patch);
    setChecklists(prev => prev.map(item => item.id === checklist.id ? updated : item));
  };

  const filtered = checklists.filter(checklist => {
    const liveStatus = getLiveStatus(checklist);
    if (filterStatus !== "all" && liveStatus !== filterStatus) return false;
    if (filterService !== "all" && checklist.service_key !== filterService) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${checklist.business_name || ""} ${checklist.client_email || ""} ${checklist.order_id || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, key) => {
    acc[key] = checklists.filter(checklist => getLiveStatus(checklist) === key).length;
    return acc;
  }, {});

  const totalEvents = Object.values(evidenceByChecklist).reduce((sum, evidence) => sum + (evidence.events?.length || 0), 0);
  const totalDbSteps = Object.values(evidenceByChecklist).reduce((sum, evidence) => sum + (evidence.steps?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Live Automation Checklist Dashboard</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700"><Activity className="h-3 w-3" />Auto-refresh: 30s</span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">Tracks install health from AutomationChecklistStep and CommunicationEvent proof, not manual checkbox theatre.</p>
        </div>
        <button onClick={() => loadDashboard(false)} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh Live Proof
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tracked Checklists</p><p className="mt-1 text-2xl font-bold text-slate-900">{checklists.length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live Events Loaded</p><p className="mt-1 text-2xl font-bold text-slate-900">{totalEvents}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">DB Steps Loaded</p><p className="mt-1 text-2xl font-bold text-slate-900">{totalDbSteps}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last Refresh</p><p className="mt-1 text-sm font-semibold text-slate-900">{compactDate(lastRefreshAt)}</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${filterStatus === key ? `${cfg.color} border-current` : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <Icon className="h-3 w-3" />{cfg.label}<span className="font-bold">{statusCounts[key] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search business, email, or order ID..." value={search} onChange={event => setSearch(event.target.value)} className="w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        <select value={filterService} onChange={event => setFilterService(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Services</option>
          {Object.entries(SERVICE_DEFINITIONS).map(([key, def]) => <option key={key} value={key}>{def.icon} {def.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400"><AlertCircle className="mx-auto mb-3 h-8 w-8 opacity-40" /><p className="text-sm font-medium">No matching live checklists found</p><p className="mt-1 text-xs">This is good if filters are tight. Bad if you expected production clients.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(checklist => <ChecklistCard key={checklist.id} checklist={checklist} evidence={evidenceByChecklist[checklist.id]} onManualStatus={handleManualStatus} />)}
        </div>
      )}
    </div>
  );
}

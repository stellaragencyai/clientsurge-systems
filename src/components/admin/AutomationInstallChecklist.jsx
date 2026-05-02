import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  CheckCircle2, Circle, XCircle, AlertCircle, Plus, ChevronDown, ChevronRight,
  Pencil, Save, X, Play, PauseCircle, RefreshCw, Loader2
} from "lucide-react";

const SERVICE_DEFINITIONS = {
  instant_lead_response: {
    label: "Instant Lead Response",
    icon: "⚡",
    description: "AI sends personalized SMS within 90 seconds of form submission.",
    steps: [
      { id: "twilio_sid", section: "Twilio", label: "TWILIO_ACCOUNT_SID secret set in dashboard" },
      { id: "twilio_token", section: "Twilio", label: "TWILIO_AUTH_TOKEN secret set" },
      { id: "twilio_phone", section: "Twilio", label: "TWILIO_PHONE_NUMBER secret set (E.164 format)" },
      { id: "resend_key", section: "Resend", label: "RESEND_API_KEY secret set" },
      { id: "resend_from", section: "Resend", label: "RESEND_FROM_EMAIL secret set (verified domain)" },
      { id: "lead_form", section: "Lead Form", label: "Lead capture form submits to /leads/capture or createLeadAndDispatch" },
      { id: "sms_template", section: "Configuration", label: "SMS template configured in Admin Settings" },
      { id: "webhook_automation", section: "Configuration", label: "Entity automation on WebsiteLead create → sendInstantLeadResponseSms" },
      { id: "test_lead", section: "Test", label: "Test lead submitted with real phone number" },
      { id: "sms_received", section: "Test", label: "SMS received on test phone within 90 seconds" },
      { id: "comm_event_logged", section: "Test", label: "CommunicationEvent record created (channel: sms, event_type: sms_sent)" },
      { id: "lead_status_updated", section: "Test", label: "WebsiteLead status updated to 'contacted'" },
    ],
  },
  missed_call_text_back: {
    label: "Missed Call Text-Back",
    icon: "📞",
    description: "Auto-sends SMS when a call goes unanswered.",
    steps: [
      { id: "twilio_sid", section: "Twilio", label: "TWILIO_ACCOUNT_SID secret set" },
      { id: "twilio_token", section: "Twilio", label: "TWILIO_AUTH_TOKEN secret set" },
      { id: "twilio_phone", section: "Twilio", label: "TWILIO_PHONE_NUMBER is the client's business number" },
      { id: "twilio_webhook", section: "Twilio", label: "Twilio Voice webhook URL set → /receiveTwilioMissedCallWebhook" },
      { id: "status_callback", section: "Twilio", label: "TWILIO_SMS_STATUS_CALLBACK_URL set for delivery tracking" },
      { id: "missed_call_template", section: "Configuration", label: "Missed call SMS template configured in Admin Settings" },
      { id: "signature_validation", section: "Configuration", label: "Twilio signature validation active (token used for HMAC)" },
      { id: "test_call", section: "Test", label: "Test call placed to Twilio number — left unanswered" },
      { id: "sms_received", section: "Test", label: "Text-back SMS received within 60 seconds" },
      { id: "comm_event_logged", section: "Test", label: "CommunicationEvent logged (service_key: missed_call_text_back)" },
    ],
  },
  nurture_sequence_14d: {
    label: "14-Day Nurture Sequence",
    icon: "🔄",
    description: "Multi-step SMS + email follow-up sequence over 14 days.",
    steps: [
      { id: "twilio_sid", section: "Twilio", label: "TWILIO_ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER set" },
      { id: "resend_key", section: "Resend", label: "RESEND_API_KEY and RESEND_FROM_EMAIL set" },
      { id: "nurture_templates", section: "Configuration", label: "All 4 follow-up SMS templates configured in Admin Settings" },
      { id: "email_templates", section: "Configuration", label: "Follow-up email templates (subject + body) configured" },
      { id: "automation_schedule", section: "Configuration", label: "Scheduled automation running processWebsiteLeadFollowUps (every 5–15 min)" },
      { id: "stop_on_reply", section: "Configuration", label: "inbound SMS handler (receiveTwilioInboundSms) active — stops sequence on reply" },
      { id: "test_lead", section: "Test", label: "Test lead created with valid phone + email" },
      { id: "step1_sent", section: "Test", label: "Step 1 (10-min SMS) sent and received" },
      { id: "step2_sent", section: "Test", label: "Step 2 (1-hr email) sent and logged" },
      { id: "comm_event_logged", section: "Test", label: "CommunicationEvent records exist for each step" },
      { id: "stop_on_reply_verified", section: "Test", label: "Replying to SMS stops further follow-ups" },
    ],
  },
  ai_booking_agent: {
    label: "AI Booking Agent",
    icon: "📅",
    description: "Booking link flow, confirmation messages, and intake handoff.",
    steps: [
      { id: "booking_link", section: "Booking", label: "Client's booking link added to Admin Settings (booking_link_default)" },
      { id: "calendar_system", section: "Booking", label: "Calendar system verified (Calendly / Acuity / Square)" },
      { id: "resend_key", section: "Resend", label: "RESEND_API_KEY set for confirmation emails" },
      { id: "twilio_sid", section: "Twilio", label: "Twilio set for confirmation/reminder SMS" },
      { id: "confirmation_template", section: "Configuration", label: "Booking confirmation SMS template set" },
      { id: "booking_prompt_sms", section: "Configuration", label: "Booking-prompt SMS template configured (follow_up_booking_prompt_sms)" },
      { id: "booking_prompt_email", section: "Configuration", label: "Booking-prompt email template configured" },
      { id: "qualified_trigger", section: "Configuration", label: "Automation fires booking prompt when lead status → Qualified" },
      { id: "test_booking", section: "Test", label: "Test lead marked Qualified — booking prompt SMS received" },
      { id: "booking_link_in_sms", section: "Test", label: "Booking link appears correctly in SMS" },
      { id: "comm_event_logged", section: "Test", label: "CommunicationEvent created on booking prompt send" },
    ],
  },
  lead_reactivation: {
    label: "Old Lead Reactivation",
    icon: "💰",
    description: "Re-engage dormant Leads with controlled batch outreach.",
    steps: [
      { id: "twilio_sid", section: "Twilio", label: "TWILIO_ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER set" },
      { id: "resend_key", section: "Resend", label: "RESEND_API_KEY and RESEND_FROM_EMAIL set" },
      { id: "old_leads_imported", section: "Data", label: "Old leads imported into Leads entity (not WebsiteLead)" },
      { id: "leads_have_phone", section: "Data", label: "Leads have valid phone numbers (E.164 format)" },
      { id: "batch_size_set", section: "Configuration", label: "Reactivation batch size confirmed with client (default: 25/day)" },
      { id: "reactivation_templates", section: "Configuration", label: "Reactivation SMS template configured" },
      { id: "stop_condition", section: "Configuration", label: "Stop condition set: stop if lead replies or books" },
      { id: "test_batch", section: "Test", label: "Small test batch (2–3 leads) run manually via admin tools" },
      { id: "sms_received", section: "Test", label: "Test leads received reactivation SMS" },
      { id: "comm_event_logged", section: "Test", label: "CommunicationEvent logged with event_type: lead_reactivation_batch_completed" },
      { id: "client_approved_batch", section: "Test", label: "Client reviewed and approved message + timing before full batch" },
    ],
  },
  review_request: {
    label: "Review Request Automation",
    icon: "⭐",
    description: "Sends review requests via SMS or email after job completion.",
    steps: [
      { id: "twilio_sid", section: "Twilio", label: "TWILIO_ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER set" },
      { id: "resend_key", section: "Resend", label: "RESEND_API_KEY set for email review requests" },
      { id: "review_link", section: "Review Links", label: "Google Business review link collected from client" },
      { id: "review_link_saved", section: "Review Links", label: "Review link saved to Admin Settings or service config" },
      { id: "trigger_defined", section: "Configuration", label: "Trigger defined: manual or post-completion event" },
      { id: "review_sms_template", section: "Configuration", label: "Review request SMS template includes review link" },
      { id: "review_email_template", section: "Configuration", label: "Review request email template includes review link" },
      { id: "test_request", section: "Test", label: "Test review request sent to admin phone/email" },
      { id: "link_opens", section: "Test", label: "Review link opens correctly on mobile" },
      { id: "comm_event_logged", section: "Test", label: "CommunicationEvent logged (event_type: review_request_trigger_simulated)" },
    ],
  },
};

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-600", icon: Circle },
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
};

function StepRow({ step, completed, onToggle }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        completed ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:bg-slate-50"
      }`}
      onClick={() => onToggle(step.id)}
    >
      <div className="mt-0.5 flex-shrink-0">
        {completed
          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
          : <Circle className="w-4 h-4 text-slate-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mr-2 ${SECTION_COLORS[step.section] || "bg-slate-100 text-slate-600"}`}>
          {step.section}
        </span>
        <span className={`text-sm ${completed ? "text-green-800 line-through opacity-70" : "text-slate-700"}`}>
          {step.label}
        </span>
      </div>
    </div>
  );
}

const DB_STEP_STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  complete:    { label: "Complete",    color: "bg-green-100 text-green-700" },
  failed:      { label: "Failed",      color: "bg-red-100 text-red-700" },
};

function DbStepRow({ step, onToggle, saving }) {
  const cfg = DB_STEP_STATUS_CONFIG[step.status] || DB_STEP_STATUS_CONFIG.pending;
  const isComplete = step.status === "complete";
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        isComplete ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:bg-slate-50"
      }`}
      onClick={() => !saving && onToggle(step)}
    >
      <div className="flex-shrink-0">
        {isComplete
          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
          : <Circle className="w-4 h-4 text-slate-300" />}
      </div>
      <span className={`flex-1 text-sm ${isComplete ? "line-through text-green-800 opacity-70" : "text-slate-700"}`}>
        {step.step_label}
      </span>
      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function ChecklistCard({ checklist, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [activeView, setActiveView] = useState("template"); // "template" | "db_steps"
  const [dbSteps, setDbSteps] = useState([]);
  const [loadingDbSteps, setLoadingDbSteps] = useState(false);
  const [savingStep, setSavingStep] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(checklist.admin_notes || "");
  const [failureNotes, setFailureNotes] = useState(checklist.failure_notes || "");
  const [editingFailure, setEditingFailure] = useState(false);

  const loadDbSteps = async () => {
    setLoadingDbSteps(true);
    try {
      const data = await base44.entities.AutomationChecklistStep.filter(
        { automation_checklist_id: checklist.id },
        "step_order",
        50
      );
      setDbSteps(data || []);
    } finally {
      setLoadingDbSteps(false);
    }
  };

  useEffect(() => {
    if (expanded && activeView === "db_steps" && dbSteps.length === 0) {
      loadDbSteps();
    }
  }, [expanded, activeView]);

  const handleDbStepToggle = async (step) => {
    const newStatus = step.status === "complete" ? "pending" : "complete";
    setSavingStep(step.id);
    const patch = { status: newStatus };
    if (newStatus === "complete") {
      patch.completed_at = new Date().toISOString();
      patch.completed_by = user?.email || "admin";
    } else {
      patch.completed_at = null;
      patch.completed_by = null;
    }
    await base44.entities.AutomationChecklistStep.update(step.id, patch);
    setDbSteps(prev => prev.map(s => s.id === step.id ? { ...s, ...patch } : s));
    setSavingStep(null);
  };

  const def = SERVICE_DEFINITIONS[checklist.service_key];
  const stepsCompleted = checklist.steps_completed || [];
  const totalSteps = def?.steps.length || 0;
  const completedCount = stepsCompleted.length;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const statusCfg = STATUS_CONFIG[checklist.status] || STATUS_CONFIG.not_started;
  const StatusIcon = statusCfg.icon;

  const save = async (patch) => {
    setSaving(true);
    const updated = await base44.entities.AutomationChecklist.update(checklist.id, patch);
    onUpdate(updated);
    setSaving(false);
  };

  const toggleStep = async (stepId) => {
    const current = checklist.steps_completed || [];
    const next = current.includes(stepId) ? current.filter(s => s !== stepId) : [...current, stepId];
    await save({ steps_completed: next });
  };

  const setStatus = async (status) => {
    const patch = { status };
    if (status === "active") patch.went_live_at = new Date().toISOString();
    if (status === "active" || status === "in_progress") patch.installed_by = user?.email || "admin";
    await save(patch);
  };

  const markTested = async () => {
    await save({ last_tested_at: new Date().toISOString() });
  };

  const saveNotes = async () => {
    await save({ admin_notes: notesValue });
    setEditingNotes(false);
  };

  const saveFailure = async () => {
    await save({ failure_notes: failureNotes, status: "failed" });
    setEditingFailure(false);
  };

  if (!def) return null;

  const groupedSteps = def.steps.reduce((acc, step) => {
    if (!acc[step.section]) acc[step.section] = [];
    acc[step.section].push(step);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-2xl">{def.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-sm">{def.label}</h3>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{checklist.business_name} — {checklist.client_email}</p>
          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
              {completedCount}/{totalSteps} steps
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-5">
          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveView("template")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === "template" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Install Checklist
            </button>
            <button
              onClick={() => { setActiveView("db_steps"); if (dbSteps.length === 0) loadDbSteps(); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === "db_steps" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              DB Steps {dbSteps.length > 0 && `(${dbSteps.filter(s => s.status === "complete").length}/${dbSteps.length})`}
            </button>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Installed By</p>
              <p className="text-slate-700 mt-0.5">{checklist.installed_by || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Last Tested</p>
              <p className="text-slate-700 mt-0.5">{checklist.last_tested_at ? new Date(checklist.last_tested_at).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Went Live</p>
              <p className="text-slate-700 mt-0.5">{checklist.went_live_at ? new Date(checklist.went_live_at).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wide">Order ID</p>
              <p className="text-slate-700 mt-0.5 truncate">{checklist.order_id || "—"}</p>
            </div>
          </div>

          {/* Steps — template view OR db steps view */}
          {activeView === "template" ? (
            <div className="space-y-4">
              {Object.entries(groupedSteps).map(([section, steps]) => (
                <div key={section}>
                  <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 px-2 py-1 rounded-md w-fit ${SECTION_COLORS[section] || "text-slate-600 bg-slate-100"}`}>
                    {section}
                  </p>
                  <div className="space-y-1.5">
                    {steps.map(step => (
                      <StepRow
                        key={step.id}
                        step={step}
                        completed={stepsCompleted.includes(step.id)}
                        onToggle={toggleStep}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-500">
                  Persisted step records from <code className="bg-slate-100 px-1 rounded text-[10px]">AutomationChecklistStep</code>
                </p>
                <button onClick={loadDbSteps} disabled={loadingDbSteps} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${loadingDbSteps ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              {loadingDbSteps ? (
                <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : dbSteps.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <p>No DB steps found.</p>
                  <p className="text-xs mt-1">Steps are created automatically by <strong>initializeInstallOS</strong> when an order is paid.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {dbSteps.map(step => (
                    <DbStepRow
                      key={step.id}
                      step={step}
                      onToggle={handleDbStepToggle}
                      saving={savingStep === step.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setStatus("in_progress")}
              disabled={checklist.status === "in_progress"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-40"
            >
              <RefreshCw className="w-3 h-3" /> Mark In Progress
            </button>
            <button
              onClick={() => setStatus("active")}
              disabled={checklist.status === "active"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-40"
            >
              <CheckCircle2 className="w-3 h-3" /> Mark Active (Go Live)
            </button>
            <button
              onClick={() => setStatus("paused")}
              disabled={checklist.status === "paused"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-semibold border border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-40"
            >
              <PauseCircle className="w-3 h-3" /> Pause
            </button>
            <button
              onClick={() => setEditingFailure(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200 hover:bg-red-100 transition-colors"
            >
              <XCircle className="w-3 h-3" /> Mark Failed
            </button>
            <button
              onClick={markTested}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <Play className="w-3 h-3" /> Log Test Run
            </button>
            <button
              onClick={() => setEditingNotes(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Add Notes
            </button>
          </div>

          {/* Admin Notes */}
          {(checklist.admin_notes || editingNotes) && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Admin Notes</p>
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Add installation notes..."
                  />
                  <div className="flex gap-2">
                    <button onClick={saveNotes} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingNotes(false)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{checklist.admin_notes}</p>
              )}
            </div>
          )}

          {/* Failure Notes */}
          {(checklist.failure_notes || editingFailure) && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Failure Notes</p>
              {editingFailure ? (
                <div className="space-y-2">
                  <textarea
                    value={failureNotes}
                    onChange={e => setFailureNotes(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-red-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
                    placeholder="Describe what failed and why..."
                  />
                  <div className="flex gap-2">
                    <button onClick={saveFailure} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">
                      <Save className="w-3 h-3" /> Save & Mark Failed
                    </button>
                    <button onClick={() => setEditingFailure(false)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-800 whitespace-pre-wrap">{checklist.failure_notes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewChecklistModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    business_name: "",
    order_id: "",
    service_key: "",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.client_email || !form.business_name || !form.service_key) return;
    setSaving(true);
    const record = await base44.entities.AutomationChecklist.create({
      ...form,
      status: "not_started",
      steps_completed: [],
    });
    onCreate(record);
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">New Automation Checklist</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { key: "client_name", label: "Client Full Name", required: false },
            { key: "client_email", label: "Client Email *", required: true, type: "email" },
            { key: "business_name", label: "Business Name *", required: true },
            { key: "order_id", label: "Order ID (optional)" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{f.label}</label>
              <input
                type={f.type || "text"}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Service *</label>
            <select
              value={form.service_key}
              onChange={e => setForm({ ...form, service_key: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a service...</option>
              {Object.entries(SERVICE_DEFINITIONS).map(([key, def]) => (
                <option key={key} value={key}>{def.icon} {def.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCreate}
            disabled={saving || !form.client_email || !form.business_name || !form.service_key}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Checklist
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AutomationInstallChecklist() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.AutomationChecklist.list("-created_date", 200);
    setChecklists(data || []);
    setLoading(false);
  };

  const handleUpdate = (updated) => {
    setChecklists(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleCreate = (record) => {
    setChecklists(prev => [record, ...prev]);
  };

  const filtered = checklists.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterService !== "all" && c.service_key !== filterService) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.business_name?.toLowerCase().includes(q) && !c.client_email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = checklists.filter(c => c.status === k).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Automation Install Checklists</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track installation, configuration, and verification for each client automation.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Checklist
        </button>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterStatus === key ? cfg.color + " border-current" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
              <span className="font-bold">{statusCounts[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by business or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
        />
        <select
          value={filterService}
          onChange={e => setFilterService(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Services</option>
          {Object.entries(SERVICE_DEFINITIONS).map(([key, def]) => (
            <option key={key} value={key}>{def.icon} {def.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No checklists found</p>
          <p className="text-xs mt-1">Create one to start tracking an automation install.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <ChecklistCard key={c.id} checklist={c} onUpdate={handleUpdate} onDelete={() => {}} />
          ))}
        </div>
      )}

      {showNew && <NewChecklistModal onClose={() => setShowNew(false)} onCreate={handleCreate} />}
    </div>
  );
}
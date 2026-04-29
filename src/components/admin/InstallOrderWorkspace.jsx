import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, getPackageDisplayLabel } from "@/lib/aiProducts";
import { buildBillingSummary, formatBillingDate } from "@/lib/billingSummary";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  TestTube2,
  Trash2,
  TriangleAlert,
  Wrench,
} from "lucide-react";

const STATUS_STYLES = {
  Paid: "bg-slate-100 text-slate-700",
  "Ready for Install": "bg-blue-50 text-blue-700",
  Configuring: "bg-amber-50 text-amber-700",
  Testing: "bg-purple-50 text-purple-700",
  Live: "bg-green-50 text-green-700",
  Error: "bg-red-50 text-red-700",
};

const PROVIDER_STYLES = {
  healthy: "bg-green-50 text-green-700 border-green-200",
  configured: "bg-blue-50 text-blue-700 border-blue-200",
  disabled: "bg-slate-100 text-slate-700 border-slate-200",
  error: "bg-red-50 text-red-700 border-red-200",
  unavailable: "bg-slate-50 text-slate-600 border-slate-200",
};

const ACTION_STYLES = {
  blocker: "border-red-200 bg-red-50 text-red-800",
  next: "border-blue-200 bg-blue-50 text-blue-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

const AFTER_HOURS_OPTIONS = [
  { value: "send_after_hours_sms", label: "Send after-hours SMS" },
  { value: "hold_until_open", label: "Hold until business opens" },
];

const CONSENT_OPTIONS = [
  { value: "include_opt_out_language", label: "Include opt-out language" },
  { value: "explicit_consent_required", label: "Explicit consent required" },
];

const BOOKING_MODE_OPTIONS = [
  { value: "external_link", label: "External Booking Link" },
  { value: "internal_placeholder", label: "Internal Placeholder" },
];

const BOOKING_INTAKE_FIELD_OPTIONS = [
  { value: "lead_name", label: "Lead Name" },
  { value: "lead_email", label: "Lead Email" },
  { value: "lead_phone", label: "Lead Phone" },
  { value: "customer_name", label: "Customer Name" },
  { value: "customer_email", label: "Customer Email" },
  { value: "customer_phone", label: "Customer Phone" },
  { value: "preferred_time", label: "Preferred Time" },
  { value: "notes", label: "Notes" },
];

const LEAD_REACTIVATION_SEGMENT_OPTIONS = [
  { value: "all_dormant", label: "All Dormant Leads" },
  { value: "contacted_no_reply", label: "Contacted, No Reply" },
  { value: "qualified_unbooked", label: "Qualified, Not Booked" },
];

const REVIEW_REQUEST_TRIGGER_OPTIONS = [
  { value: "appointment_completed", label: "Appointment Completed" },
  { value: "order_completed", label: "Order Completed" },
  { value: "manual_trigger", label: "Manual Trigger" },
];

const REVIEW_REQUEST_CHANNEL_OPTIONS = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

const MIRROR_STEPS = [
  { key: "step_payment", label: "Payment" },
  { key: "step_system_setup", label: "System Setup" },
  { key: "step_sms", label: "SMS" },
  { key: "step_live", label: "Go Live" },
];

function isNurtureService(serviceKey) {
  return serviceKey === "nurture_sequence_14d";
}

function isBookingService(serviceKey) {
  return serviceKey === "ai_booking_agent";
}

function isReactivationService(serviceKey) {
  return serviceKey === "lead_reactivation";
}

function isReviewRequestService(serviceKey) {
  return serviceKey === "review_request";
}

function StatusBadge({ value }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[value] || "bg-slate-100 text-slate-700"}`}>
      {value}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function getErrorMessage(error, fallback) {
  return error?.data?.error || error?.data?.message || error?.message || fallback;
}

function parseMetadata(event) {
  if (!event?.metadata_json) {
    return {};
  }

  try {
    return JSON.parse(event.metadata_json);
  } catch {
    return {};
  }
}

function getEventTone(eventType, status) {
  if (eventType === "service_transition_blocked" || eventType === "runtime_attempt_blocked" || eventType === "provider_send_failed" || status === "failed") {
    return "border-red-200 bg-red-50";
  }

  if (eventType === "service_configuration_updated" || eventType === "runtime_attempt_started") {
    return "border-blue-200 bg-blue-50";
  }

  if (eventType === "service_status_changed" || eventType === "status_update" || eventType === "provider_send_attempted") {
    return "border-amber-200 bg-amber-50";
  }

  if (eventType === "order_paid" || eventType === "install_initialized" || eventType === "provider_send_succeeded" || eventType === "booking_simulation_created" || eventType === "review_request_trigger_simulated") {
    return "border-green-200 bg-green-50";
  }

  if (eventType === "lead_reactivation_batch_completed") {
    return "border-green-200 bg-green-50";
  }

  return "border-border bg-white";
}

function getEventTitle(event) {
  const metadata = parseMetadata(event);

  if (event.subject) {
    return event.subject;
  }

  if (event.event_type === "status_update") {
    return `Order status changed to ${metadata.next_status || "updated"}`;
  }

  return (event.event_type || "install_event").replaceAll("_", " ");
}

function getEventBody(event) {
  const metadata = parseMetadata(event);

  if (event.message_body) {
    return event.message_body;
  }

  if (event.event_type === "service_transition_blocked") {
    return metadata.reason || "The backend blocked this service transition.";
  }

  if (event.event_type === "runtime_attempt_blocked") {
    return metadata.reason || "The backend blocked this runtime attempt.";
  }

  if (event.event_type === "provider_send_attempted") {
    return `Preparing outbound ${event.channel || "message"} delivery.`;
  }

  if (event.event_type === "provider_send_succeeded") {
    return `Outbound ${event.channel || "message"} delivery succeeded.`;
  }

  if (event.event_type === "provider_send_failed") {
    return event.error_message || "Outbound delivery failed.";
  }

  if (event.event_type === "booking_simulation_created") {
    return "Canonical booking-agent simulation recorded.";
  }

  if (event.event_type === "lead_reactivation_batch_completed") {
    return "Lead reactivation batch summary recorded.";
  }

  if (event.event_type === "review_request_trigger_simulated") {
    return "Review-request trigger simulation recorded.";
  }

  return "Install event recorded.";
}

function MirrorStatusBadge({ value }) {
  const tone = value === "complete"
    ? "bg-green-50 text-green-700"
    : value === "in_progress"
    ? "bg-amber-50 text-amber-700"
    : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>
      {value || "pending"}
    </span>
  );
}

function InfoTile({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function LabeledField({ label, children, helper }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function ReadOnlyRecordCard({ title, rows }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-right text-xs font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProviderCard({ provider }) {
  const tone = PROVIDER_STYLES[provider.derived_status] || PROVIDER_STYLES.unavailable;

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{provider.name}</p>
          <p className="mt-1 text-xs opacity-80">{provider.status_label}</p>
        </div>
        <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold capitalize">
          {provider.derived_status}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed">{provider.status_reason}</p>
      {provider.order_business_phone !== undefined && (
        <p className="mt-2 text-xs">
          Order phone: <span className="font-semibold">{provider.order_business_phone || "Not set"}</span>
        </p>
      )}
      <p className="mt-2 text-xs">
        Latest test: <span className="font-semibold">{provider.latest_test_at ? formatDateTime(provider.latest_test_at) : "Unavailable"}</span>
      </p>
      {provider.latest_test_reason ? (
        <p className="mt-1 text-xs opacity-80">{provider.latest_test_reason}</p>
      ) : null}
    </div>
  );
}

function RequiredActionList({ title, actions, emptyLabel }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {actions.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {actions.map((action) => (
            <div key={`${action.code}:${action.field || ""}`} className={`rounded-lg border px-3 py-3 text-sm ${ACTION_STYLES[action.level] || ACTION_STYLES.info}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{action.title}</p>
                <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                  {action.level}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed">{action.detail}</p>
              <p className="mt-2 text-[11px] font-medium opacity-80">
                Blocks Testing: {action.blocks_testing ? "Yes" : "No"} | Blocks Live: {action.blocks_live ? "Yes" : "No"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompactActionList({ actions, emptyLabel = "No action required." }) {
  if (!actions?.length) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div key={`${action.code}:${action.field || ""}:${action.service_key || ""}`} className={`rounded-lg border px-3 py-3 ${ACTION_STYLES[action.level] || ACTION_STYLES.info}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{action.title}</p>
            {action.service_display_name ? (
              <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold">
                {action.service_display_name}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed">{action.detail}</p>
        </div>
      ))}
    </div>
  );
}

function SuggestionMeta({ suggestion }) {
  if (!suggestion) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Suggested, not saved</p>
      {suggestion.rationale ? <p className="text-xs text-muted-foreground">{suggestion.rationale}</p> : null}
      {suggestion.source_labels?.length ? (
        <p className="text-[11px] text-muted-foreground">
          Source: {suggestion.source_labels.join(", ")}
        </p>
      ) : null}
      {!suggestion.available && suggestion.unavailable_reason ? (
        <p className="text-[11px] text-amber-700">{suggestion.unavailable_reason}</p>
      ) : null}
    </div>
  );
}

function SuggestionCard({ suggestion, actionLabel = "Use suggestion", onApply }) {
  if (!suggestion) {
    return null;
  }

  return (
    <div className={`rounded-xl border p-3 ${suggestion.available ? "border-blue-200 bg-blue-50/60" : "border-amber-200 bg-amber-50/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{suggestion.label}</p>
          <SuggestionMeta suggestion={suggestion} />
        </div>
        {suggestion.available ? (
          <SuggestedValueButton label={actionLabel} onClick={onApply} />
        ) : null}
      </div>
      {typeof suggestion.value === "string" && suggestion.value ? (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-white/70 bg-white/80 px-3 py-3 text-xs text-foreground">{suggestion.value}</pre>
      ) : null}
      {Array.isArray(suggestion.value) ? (
        <div className="mt-3 space-y-2">
          {suggestion.value.map((entry, index) => (
            <div key={`${suggestion.field}:${index}`} className="rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-xs text-foreground">
              {typeof entry === "string"
                ? entry
                : `${entry.day != null ? `Day ${entry.day} - ` : ""}${entry.channel ? `${entry.channel.toUpperCase()} - ` : ""}${entry.message_template || ""}`}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function mergePreparedPatch(currentConfig, patch) {
  if (!patch) {
    return currentConfig;
  }

  return {
    ...(currentConfig || {}),
    shared: {
      ...(currentConfig?.shared || {}),
      ...(patch.shared || {}),
    },
    services: Object.entries(patch.services || {}).reduce(
      (services, [serviceKey, servicePatch]) => ({
        ...services,
        [serviceKey]: {
          ...(currentConfig?.services?.[serviceKey] || {}),
          ...(servicePatch || {}),
        },
      }),
      {
        ...(currentConfig?.services || {}),
      }
    ),
  };
}

function OperatorFocusPanel({ workspaceSummary }) {
  const counts = workspaceSummary?.counts || {};

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold text-foreground">Operator Focus</h4>
          </div>
          <p className="text-base font-semibold text-foreground">{workspaceSummary?.headline}</p>
          <p className="text-sm text-muted-foreground">{workspaceSummary?.detail}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Config Ready" value={`${counts.configuration_ready || 0}/${counts.tracked_services || 0}`} />
          <InfoTile label="Ready for Testing" value={String(counts.ready_for_testing || 0)} />
          <InfoTile label="Ready for Live" value={String(counts.ready_for_live || 0)} />
          <InfoTile label="Active Blockers" value={String(counts.blockers || 0)} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Next Best Actions</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Backend-prioritized actions across the order, shared config, and purchased services.
          </p>
          <div className="mt-3">
            <CompactActionList actions={workspaceSummary?.next_best_actions || []} emptyLabel="No immediate actions are derived from backend state." />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Shared Config Progress</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Shared runtime fields only appear here when a purchased service actually depends on them.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoTile
              label="Required Fields"
              value={`${workspaceSummary?.shared_configuration?.present_count || 0}/${workspaceSummary?.shared_configuration?.required_count || 0}`}
            />
            <InfoTile
              label="Status"
              value={workspaceSummary?.shared_configuration?.required
                ? workspaceSummary?.shared_configuration?.complete ? "Complete" : "Needs attention"
                : "Not required"}
            />
          </div>
          {(workspaceSummary?.shared_configuration?.missing_fields || []).length > 0 ? (
            <div className="mt-3 space-y-2">
              {workspaceSummary.shared_configuration.missing_fields.map((field) => (
                <div key={field.field} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                  <p className="font-semibold">{field.label}</p>
                  <p className="mt-1">
                    Needed for {field.applies_to_services.map((service) => service.display_name).join(", ")}.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No shared configuration blockers are currently derived.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SetupAssistPanel({ workspaceSummary }) {
  const assist = workspaceSummary?.setup_assist;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h4 className="text-lg font-semibold text-foreground">AI Setup Assist</h4>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        These suggestions are advisory only. Nothing is saved until the operator accepts a suggestion and then saves install configuration.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Safe Autofill" value={String(assist?.safe_autofill_count || 0)} />
        <InfoTile label="Still Manual" value={String(assist?.manual_required_count || 0)} />
        <InfoTile label="Current Blockers" value={String(workspaceSummary?.counts?.blockers || 0)} />
        <InfoTile label="Suggested Sources" value="Order and canonical workspace context" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Safe Autofill Available</p>
          {(assist?.safe_autofill || []).length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No safe autofill suggestions are available from current order context.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {assist.safe_autofill.map((item) => (
                <div key={`${item.field}:${item.service_key || "shared"}`} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-900">
                  <p className="font-semibold">{item.service_display_name ? `${item.service_display_name}: ${item.label}` : item.label}</p>
                  <p className="mt-1">{item.rationale}</p>
                  {item.source_labels?.length ? <p className="mt-1 opacity-80">Source: {item.source_labels.join(", ")}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Still Requires Manual Input</p>
          {(assist?.manual_required || []).length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No manual-only inputs are currently flagged.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {assist.manual_required.map((item) => (
                <div key={`${item.field}:${item.service_key || "shared"}`} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                  <p className="font-semibold">{item.service_display_name ? `${item.service_display_name}: ${item.label}` : item.label}</p>
                  <p className="mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeploymentSummaryPanel({
  overview,
  proposal,
  prepareLoading,
  prepareFeedback,
  sequenceLoading,
  sequenceFeedback,
  hasUnsavedConfigChanges,
  onPrepare,
  onApplyProposal,
  onClearProposal,
  onRunSequence,
}) {
  const summary = proposal?.deployment_summary || overview || {
    services_ready_for_sequence: [],
    services_requiring_manual_input: [],
    services_ready_for_live: [],
    expected_blockers: [],
    counts: {
      safe_autofill: 0,
      manual_required: 0,
      sequence_ready: 0,
      live_ready: 0,
    },
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold text-foreground">Deployment Summary</h4>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Backend-derived assisted deployment plan. Prepare setup never saves config, and sequence execution never moves services Live automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPrepare}
            disabled={prepareLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {prepareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Prepare Setup
          </button>
          {proposal ? (
            <>
              <button
                type="button"
                onClick={onApplyProposal}
                className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Apply to Form
              </button>
              <button
                type="button"
                onClick={onClearProposal}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
              >
                Clear Proposal
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onRunSequence}
            disabled={sequenceLoading || hasUnsavedConfigChanges}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {sequenceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
            Run Setup Sequence
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Safe Autofill" value={String(summary.counts?.safe_autofill || 0)} helper="Suggestions that can be applied locally before save." />
        <InfoTile label="Manual Remaining" value={String(summary.counts?.manual_required || 0)} helper="Items still requiring operator judgment or missing source data." />
        <InfoTile label="Sequence Ready" value={String(summary.counts?.sequence_ready || 0)} helper="Services that can be moved through guarded setup + test steps." />
        <InfoTile label="Live Ready" value={String(summary.counts?.live_ready || 0)} helper="Still requires explicit operator approval to move Live." />
      </div>

      {hasUnsavedConfigChanges ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Save install configuration before running the assisted setup sequence. The sequence only operates on already-saved canonical config.
        </div>
      ) : null}

      {prepareFeedback ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {prepareFeedback}
        </div>
      ) : null}

      {sequenceFeedback ? (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${sequenceFeedback.includes("completed") ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700"}`}>
          {sequenceFeedback}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">What Will Be Configured</p>
          {(summary.will_configure || []).length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No safe unsaved suggestions are currently available to apply.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {summary.will_configure.map((item) => (
                <div key={`${item.field}:${item.service_key || "shared"}`} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-900">
                  <p className="font-semibold">{item.service_display_name ? `${item.service_display_name}: ${item.label}` : item.label}</p>
                  {item.source_labels?.length ? <p className="mt-1">Source: {item.source_labels.join(", ")}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">What Will Be Tested</p>
          {(summary.will_test || summary.services_ready_for_sequence || []).length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No services are currently ready for the guarded setup sequence.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {(summary.will_test || summary.services_ready_for_sequence || []).map((service) => (
                <div key={service.service_key} className="rounded-lg border border-border bg-white px-3 py-3 text-xs text-foreground">
                  <p className="font-semibold">{service.display_name}</p>
                  <p className="mt-1 text-muted-foreground">Current status: {service.install_status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">What Remains Manual</p>
          {(summary.will_remain_manual || summary.services_requiring_manual_input || []).length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No manual-only items are currently surfaced.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {(summary.will_remain_manual || summary.services_requiring_manual_input || []).map((item, index) => (
                <div key={`${item.field || item.service_key || "manual"}:${index}`} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                  <p className="font-semibold">{item.service_display_name ? `${item.service_display_name}: ${item.label || item.display_name}` : item.label || item.display_name || "Manual input required"}</p>
                  <p className="mt-1">{item.reason || item.detail || "Operator review is still required before deployment can continue."}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Expected Blockers</p>
          {(summary.expected_blockers || []).length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No backend blockers are currently derived.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {summary.expected_blockers.map((item, index) => (
                <div key={`${item.title}:${index}`} className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-900">
                  <p className="font-semibold">{item.service_display_name ? `${item.service_display_name}: ${item.title}` : item.title}</p>
                  <p className="mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestedValueButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </button>
  );
}

function ServiceOperatorSummary({ service }) {
  const summary = service.operator_summary || {};

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
        <div>
          <p className="text-sm font-semibold text-foreground">What to do next</p>
          <p className="mt-1 text-sm text-foreground">{summary.next_action_title || "No action required"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.next_action_detail}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
          <InfoTile label="Current Phase" value={summary.phase_summary || service.install_status} />
          <InfoTile label="Service Blockers" value={String(summary.blocker_count || 0)} />
        </div>
      </div>
    </div>
  );
}

function OperationalReadiness({ service }) {
  const readiness = service.go_live_readiness;
  const executionProfile = service.execution_profile || {};
  const testSuccessAt = service.test_summary?.latest_test_success_at || service.test_summary?.latest_success_at;
  const productionSuccessAt = service.test_summary?.latest_production_success_at;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-sm font-semibold text-foreground">Go-Live Readiness</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <InfoTile label="Config Complete" value={readiness.config_complete ? "Yes" : "No"} />
        <InfoTile label="Provider Ready" value={readiness.provider_ready ? "Yes" : "No"} />
        <InfoTile label="Successful Test" value={readiness.tested ? "Yes" : "No"} helper={testSuccessAt ? formatDateTime(testSuccessAt) : "No successful test yet"} />
        <InfoTile label="Real Runtime" value={productionSuccessAt ? "Seen" : "Not yet"} helper={productionSuccessAt ? formatDateTime(productionSuccessAt) : executionProfile.trigger_label || "No production runtime yet"} />
        <InfoTile label="Recommended Next" value={readiness.recommended_next_action} />
      </div>
      {readiness.blocking_items.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-800">Live blockers</p>
          <p className="mt-1 text-xs text-red-700">{readiness.blocking_items.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

function ServicePlaybook({ service }) {
  const playbook = service.playbook || {};

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Internal Setup SOP</p>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{playbook.what_operator_is_doing}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MiniChecklist title="Manual inputs" items={playbook.manual_inputs || []} />
        <MiniChecklist title="Auto-fill sources" items={playbook.auto_fill_sources || []} />
        <MiniChecklist title="Verify before testing" items={playbook.testing_checks || []} />
        <MiniChecklist title="Verify before Live" items={playbook.live_checks || []} />
      </div>
      {service.scheduler ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scheduler</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{service.scheduler.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{service.scheduler.reason}</p>
          {service.scheduler.first_step ? (
            <p className="mt-2 text-xs text-muted-foreground">
              First configured step: Day {service.scheduler.first_step.day} via {service.scheduler.first_step.channel}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MiniChecklist({ title, items }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-xs text-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NurtureSequenceBuilder({ serviceKey, value, suggestions, onToggleChannel, onAddStep, onRemoveStep, onStepChange, onApplyPreset }) {
  const steps = Array.isArray(value?.steps) ? value.steps : [];
  const starterSmsSuggestion = getSuggestionField(suggestions, "sms_step_template");
  const starterEmailSuggestion = getSuggestionField(suggestions, "email_step_template");
  const starterSequence = suggestions?.presets?.starter_sequence || null;

  return (
    <div className="space-y-4">
      {starterSequence ? (
        <SuggestionCard
          suggestion={{
            label: starterSequence.label,
            value: starterSequence.value?.steps || [],
            source_labels: starterSequence.source_labels,
            rationale: starterSequence.rationale,
            available: starterSequence.available !== false,
            unavailable_reason: starterSequence.unavailable_reason || null,
          }}
          actionLabel="Use starter sequence"
          onApply={() => onApplyPreset(serviceKey, starterSequence.value)}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={Boolean(value?.sms_enabled)}
            onChange={(e) => onToggleChannel(serviceKey, "sms_enabled", e.target.checked)}
            className="h-4 w-4"
          />
          Enable SMS
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={Boolean(value?.email_enabled)}
            onChange={(e) => onToggleChannel(serviceKey, "email_enabled", e.target.checked)}
            className="h-4 w-4"
          />
          Enable Email
        </label>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={`${serviceKey}:step:${index}`} className="rounded-xl border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Step {index + 1}</p>
              <button
                type="button"
                onClick={() => onRemoveStep(serviceKey, index)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[120px_160px_minmax(0,1fr)]">
              <LabeledField label="Day">
                <input
                  type="number"
                  min="1"
                  value={step.day ?? ""}
                  onChange={(e) => onStepChange(serviceKey, index, "day", e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </LabeledField>
              <LabeledField label="Channel">
                <select
                  value={step.channel || ""}
                  onChange={(e) => onStepChange(serviceKey, index, "channel", e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select...</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </LabeledField>
              <LabeledField label="Message Template">
                <textarea
                  value={step.message_template || ""}
                  onChange={(e) => onStepChange(serviceKey, index, "message_template", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={step.channel === "email" ? (starterEmailSuggestion?.value || "Template for this nurture email step...") : (starterSmsSuggestion?.value || "Template for this nurture SMS step...")}
                />
              </LabeledField>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddStep(serviceKey)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Sequence Step
      </button>
    </div>
  );
}

function BookingAgentBuilder({ serviceKey, value, suggestions, onChange, onApplySuggestion }) {
  const intakeFields = Array.isArray(value?.intake_fields) ? value.intake_fields : [];
  const bookingModeSuggestion = getSuggestionField(suggestions, "booking_mode");
  const intakeFieldsSuggestion = getSuggestionField(suggestions, "intake_fields");
  const confirmationSuggestion = getSuggestionField(suggestions, "confirmation_template");
  const reminderSuggestion = getSuggestionField(suggestions, "reminder_template");

  return (
    <div className="grid gap-4">
      <LabeledField label="Booking Link" helper="Required. This is the booking URL the AI Booking Agent will drive leads into.">
        <input
          type="url"
          value={value?.booking_link || ""}
          onChange={(e) => onChange(serviceKey, "booking_link", e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="https://calendly.com/your-team/demo"
        />
      </LabeledField>

      <LabeledField label="Booking Mode" helper="Required. Use internal placeholder until a real external booking sync is available.">
        {bookingModeSuggestion ? (
          <div className="mb-2">
            <SuggestionCard
              suggestion={bookingModeSuggestion}
              actionLabel="Use suggestion"
              onApply={() => onApplySuggestion(serviceKey, "booking_mode", bookingModeSuggestion.value)}
            />
          </div>
        ) : null}
        <select
          value={value?.booking_mode || ""}
          onChange={(e) => onChange(serviceKey, "booking_mode", e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select mode...</option>
          {BOOKING_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </LabeledField>

      <LabeledField label="Booking Business Hours" helper="Optional service-specific booking hours shown to ops and stored on canonical booking config.">
        <input
          type="text"
          value={value?.business_hours || ""}
          onChange={(e) => onChange(serviceKey, "business_hours", e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Mon-Fri 8am-5pm"
        />
      </LabeledField>

      <LabeledField label="Confirmation Template" helper="Required. Logged during booking simulation as the canonical confirmation message event.">
        {confirmationSuggestion ? (
          <div className="mb-2">
            <SuggestionCard
              suggestion={confirmationSuggestion}
              actionLabel="Use suggestion"
              onApply={() => onApplySuggestion(serviceKey, "confirmation_template", confirmationSuggestion.value)}
            />
          </div>
        ) : null}
        <textarea
          value={value?.confirmation_template || ""}
          onChange={(e) => onChange(serviceKey, "confirmation_template", e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={confirmationSuggestion?.value || "Thanks {{first_name}}. Your booking request is confirmed here: {{booking_link}}"}
        />
      </LabeledField>

      <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={Boolean(value?.reminder_enabled)}
          onChange={(e) => onChange(serviceKey, "reminder_enabled", e.target.checked)}
          className="h-4 w-4"
        />
        Enable booking reminder follow-up
      </label>

      {value?.reminder_enabled ? (
        <LabeledField label="Reminder Template" helper="Required when reminders are enabled. Logged as an honest placeholder reminder event during booking-agent tests.">
          {reminderSuggestion ? (
            <div className="mb-2">
              <SuggestionCard
                suggestion={reminderSuggestion}
                actionLabel="Use suggestion"
                onApply={() => onApplySuggestion(serviceKey, "reminder_template", reminderSuggestion.value)}
              />
            </div>
          ) : null}
          <textarea
            value={value?.reminder_template || ""}
            onChange={(e) => onChange(serviceKey, "reminder_template", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder={reminderSuggestion?.value || "Reminder: your booking request is scheduled for {{scheduled_at}}."}
          />
        </LabeledField>
      ) : null}

      <LabeledField label="Required Intake Fields" helper="Choose the lead or customer fields ops expects the booking flow to capture before the simulation can succeed.">
        {intakeFieldsSuggestion ? (
          <div className="mb-2">
            <SuggestionCard
              suggestion={intakeFieldsSuggestion}
              actionLabel="Use suggestion"
              onApply={() => onApplySuggestion(serviceKey, "intake_fields", intakeFieldsSuggestion.value)}
            />
          </div>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {BOOKING_INTAKE_FIELD_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={intakeFields.includes(option.value)}
                onChange={(e) => {
                  const nextFields = e.target.checked
                    ? [...intakeFields, option.value]
                    : intakeFields.filter((field) => field !== option.value);
                  onChange(serviceKey, "intake_fields", nextFields);
                }}
                className="h-4 w-4"
              />
              {option.label}
            </label>
          ))}
        </div>
      </LabeledField>
    </div>
  );
}

function LeadReactivationBuilder({ serviceKey, value, suggestions, onChange, onApplySuggestion }) {
  const targetSegmentSuggestion = getSuggestionField(suggestions, "target_segment");
  const messageSuggestion = getSuggestionField(suggestions, "message_template");

  return (
    <div className="grid gap-4">
      <LabeledField label="Target Segment" helper="Required. This controls which canonical Leads records are eligible for reactivation.">
        {targetSegmentSuggestion ? (
          <div className="mb-2">
            <SuggestionCard
              suggestion={targetSegmentSuggestion}
              actionLabel="Use suggestion"
              onApply={() => onApplySuggestion(serviceKey, "target_segment", targetSegmentSuggestion.value)}
            />
          </div>
        ) : null}
        <select
          value={value?.target_segment || ""}
          onChange={(e) => onChange(serviceKey, "target_segment", e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select segment...</option>
          {LEAD_REACTIVATION_SEGMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </LabeledField>

      <LabeledField label="Message Template" helper="Required. Used for each selected lead during the canonical reactivation test batch.">
        {messageSuggestion ? (
          <div className="mb-2">
            <SuggestionCard
              suggestion={messageSuggestion}
              actionLabel="Use suggestion"
              onApply={() => onApplySuggestion(serviceKey, "message_template", messageSuggestion.value)}
            />
          </div>
        ) : null}
        <textarea
          value={value?.message_template || ""}
          onChange={(e) => onChange(serviceKey, "message_template", e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={messageSuggestion?.value || "Hi {{first_name}}, checking back in from {{business_name}}..."}
        />
      </LabeledField>

      <LabeledField label="Max Batch Size" helper="Defines the canonical maximum batch size. Test runs still cap themselves at 1-3 leads.">
        <input
          type="number"
          min="1"
          max="250"
          value={value?.max_batch_size ?? 25}
          onChange={(e) => onChange(serviceKey, "max_batch_size", Number(e.target.value) || 1)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </LabeledField>
    </div>
  );
}

function ReviewRequestBuilder({ serviceKey, value, suggestions, onChange, onApplySuggestion }) {
  const channelSuggestion = getSuggestionField(suggestions, "channel");
  const messageSuggestion = getSuggestionField(suggestions, "message_template");

  return (
    <div className="grid gap-4">
      <LabeledField label="Review Link" helper="Required. This is the public review destination sent during the canonical review-request test.">
        <input
          type="url"
          value={value?.review_link || ""}
          onChange={(e) => onChange(serviceKey, "review_link", e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="https://g.page/r/your-review-link"
        />
      </LabeledField>

      <LabeledField label="Trigger Event" helper="Required. The test simulates this configured trigger honestly instead of waiting for a live appointment/order signal.">
        <select
          value={value?.trigger_event || ""}
          onChange={(e) => onChange(serviceKey, "trigger_event", e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select trigger...</option>
          {REVIEW_REQUEST_TRIGGER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </LabeledField>

      <LabeledField label="Message Template" helper="Required. Used for the selected delivery channel during the canonical review-request test.">
        {messageSuggestion ? (
          <div className="mb-2">
            <SuggestionCard
              suggestion={messageSuggestion}
              actionLabel="Use suggestion"
              onApply={() => onApplySuggestion(serviceKey, "message_template", messageSuggestion.value)}
            />
          </div>
        ) : null}
        <textarea
          value={value?.message_template || ""}
          onChange={(e) => onChange(serviceKey, "message_template", e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={messageSuggestion?.value || "Hi {{first_name}}, thanks for visiting {{business_name}}. If you had a great experience, leave a quick review here: {{review_link}}"}
        />
      </LabeledField>

      <LabeledField label="Channel" helper="Required. The review-request test sends through the selected channel as an honest placeholder runtime.">
        {channelSuggestion ? (
          <div className="mb-2">
            <SuggestionCard
              suggestion={channelSuggestion}
              actionLabel="Use suggestion"
              onApply={() => onApplySuggestion(serviceKey, "channel", channelSuggestion.value)}
            />
          </div>
        ) : null}
        <select
          value={value?.channel || ""}
          onChange={(e) => onChange(serviceKey, "channel", e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select channel...</option>
          {REVIEW_REQUEST_CHANNEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </LabeledField>

      <LabeledField label="Send Delay (Minutes)" helper="Optional. Stored canonically for future trigger automation, but not scheduled live yet.">
        <input
          type="number"
          min="0"
          max="43200"
          value={value?.send_delay_minutes ?? ""}
          onChange={(e) => onChange(serviceKey, "send_delay_minutes", e.target.value === "" ? "" : Number(e.target.value))}
          className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="0"
        />
      </LabeledField>

      <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={Boolean(value?.fallback_internal_feedback_enabled)}
          onChange={(e) => onChange(serviceKey, "fallback_internal_feedback_enabled", e.target.checked)}
          className="h-4 w-4"
        />
        Enable internal feedback fallback
      </label>
    </div>
  );
}

function getRuntimeButtonLabel(service) {
  const serviceKey = service?.service_key;
  const executionMode = service?.execution_profile?.mode;
  const isLive = service?.install_status === "Live";
  if (serviceKey === "instant_lead_response") return "Send Test Lead";
  if (serviceKey === "missed_call_text_back") return "Simulate Missed Call";
  if (serviceKey === "ai_booking_agent") return "Run Booking Handoff Test";
  if (serviceKey === "lead_reactivation") {
    return executionMode === "manual_triggered" && isLive
      ? "Run Approved Batch"
      : "Run Reactivation Test";
  }
  if (serviceKey === "review_request") {
    return executionMode === "manual_triggered" && isLive
      ? "Send Manual Review Request"
      : "Run Review Request Test";
  }
  if (serviceKey === "nurture_sequence_14d") {
    return executionMode === "manual_runner" && isLive
      ? "Run Due Steps"
      : "Run Nurture Sequence Test";
  }
  return "Run Runtime Action";
}

function getSuggestionField(suggestions, field) {
  return suggestions?.fields?.[field] || null;
}

function matchesServiceFilter(service, filter) {
  if (filter === "blocked") {
    return (service.operator_summary?.blocker_count || 0) > 0;
  }

  if (filter === "testing_ready") {
    return service.go_live_readiness?.can_move_to_testing;
  }

  if (filter === "live_ready") {
    return service.go_live_readiness?.can_move_to_live;
  }

  if (filter === "in_testing") {
    return service.install_status === "Testing";
  }

  if (filter === "live") {
    return service.install_status === "Live";
  }

  return true;
}

function CommandViewPanel({ workspaceSummary }) {
  const commandView = workspaceSummary?.command_view;

  const items = [
    {
      label: "Configure first",
      value: commandView?.configure_first?.display_name || "No service queued",
      helper: commandView?.configure_first?.next_action_title || commandView?.configure_first?.next_action_detail || "No configuration-first action derived.",
    },
    {
      label: "Move to Testing now",
      value: commandView?.move_to_testing_now?.display_name || "None ready",
      helper: commandView?.move_to_testing_now?.detail || "No service is currently cleared to enter Testing.",
    },
    {
      label: "Test now",
      value: commandView?.test_now?.display_name || "None ready",
      helper: commandView?.test_now?.detail || "No service is currently in a clean test-ready state.",
    },
    {
      label: "Go live now",
      value: commandView?.go_live_now?.display_name || "None ready",
      helper: commandView?.go_live_now?.detail || "No service currently satisfies Live gating.",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary" />
        <h4 className="text-lg font-semibold text-foreground">Remote Setup Command View</h4>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Concise operator mode derived from canonical backend state. Use this first to decide which service to touch next.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <InfoTile key={item.label} label={item.label} value={item.value} helper={item.helper} />
        ))}
      </div>

      {commandView?.primary_blocker ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Primary blocker</p>
          <p className="mt-1 text-sm font-semibold text-red-900">
            {commandView.primary_blocker.service_display_name
              ? `${commandView.primary_blocker.service_display_name}: ${commandView.primary_blocker.title}`
              : commandView.primary_blocker.title}
          </p>
          <p className="mt-1 text-xs text-red-700">{commandView.primary_blocker.detail}</p>
        </div>
      ) : null}
    </div>
  );
}

function ServiceNavigation({ services, filter, onFilterChange, filterCounts }) {
  const filterOptions = [
    { key: "all", label: "All" },
    { key: "blocked", label: "Blocked" },
    { key: "testing_ready", label: "Testing Ready" },
    { key: "live_ready", label: "Live Ready" },
    { key: "in_testing", label: "In Testing" },
    { key: "live", label: "Live" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-foreground">Service Navigation</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Jump to a service or filter the workspace using backend-derived service state.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterChange(option.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                filter === option.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-white text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {option.label}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {filterCounts?.[option.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {services.map((service) => (
          <a
            key={service.service_key}
            href={`#service-${service.service_key}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            <span>{service.display_name}</span>
            <StatusBadge value={service.install_status} />
          </a>
        ))}
      </div>
    </div>
  );
}

function ServiceConfigEditor({ service, value, onChange, onApplySuggestion, onApplyPreset, onToggleChannel, onAddStep, onRemoveStep, onStepChange }) {
  if (isNurtureService(service.service_key)) {
    return (
      <NurtureSequenceBuilder
        serviceKey={service.service_key}
        value={value || {}}
        suggestions={service.config_suggestions}
        onToggleChannel={onToggleChannel}
        onAddStep={onAddStep}
        onRemoveStep={onRemoveStep}
        onStepChange={onStepChange}
        onApplyPreset={onApplyPreset}
      />
    );
  }

  if (isBookingService(service.service_key)) {
    return (
      <BookingAgentBuilder
        serviceKey={service.service_key}
        value={value || {}}
        suggestions={service.config_suggestions}
        onChange={onChange}
        onApplySuggestion={onApplySuggestion}
      />
    );
  }

  if (isReactivationService(service.service_key)) {
    return (
      <LeadReactivationBuilder
        serviceKey={service.service_key}
        value={value || {}}
        suggestions={service.config_suggestions}
        onChange={onChange}
        onApplySuggestion={onApplySuggestion}
      />
    );
  }

  if (isReviewRequestService(service.service_key)) {
    return (
      <ReviewRequestBuilder
        serviceKey={service.service_key}
        value={value || {}}
        suggestions={service.config_suggestions}
        onChange={onChange}
        onApplySuggestion={onApplySuggestion}
      />
    );
  }

  return (
    <LabeledField label="SMS Template">
      {getSuggestionField(service.config_suggestions, "sms_template") ? (
        <div className="mb-2">
          <SuggestionCard
            suggestion={getSuggestionField(service.config_suggestions, "sms_template")}
            actionLabel="Use suggestion"
            onApply={() => onApplySuggestion(service.service_key, "sms_template", getSuggestionField(service.config_suggestions, "sms_template")?.value)}
          />
        </div>
      ) : null}
      <textarea
        value={value?.sms_template || ""}
        onChange={(e) => onChange(service.service_key, "sms_template", e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder={getSuggestionField(service.config_suggestions, "sms_template")?.value || `Enter the ${service.display_name} SMS template...`}
      />
    </LabeledField>
  );
}

function ServiceLastResult({ service }) {
  const summary = service.test_summary || {};
  const executionProfile = service.execution_profile || {};
  const value =
    summary.latest_production_runtime_at ||
    (service.service_key === "lead_reactivation"
      ? summary.latest_batch_summary_at || summary.latest_runtime_at
      : service.service_key === "review_request"
      ? summary.latest_review_trigger_at || summary.latest_runtime_at
      : summary.latest_runtime_at);

  const helper =
    service.service_key === "lead_reactivation"
      ? summary.latest_batch_summary
        ? `${summary.latest_batch_summary.selected_lead_count || 0} lead(s) in last approved/test batch`
        : "No reactivation batch recorded yet."
      : service.service_key === "review_request"
      ? `${service.configuration?.channel || "No channel selected"} | ${summary.latest_production_success_at ? "Manual request sent" : summary.latest_review_trigger_at ? "Trigger simulated" : "No manual trigger yet"}`
      : service.service_key === "ai_booking_agent"
      ? summary.latest_booking_simulation_at
        ? "Booking simulation recorded in canonical timeline."
        : "No booking simulation recorded yet."
      : summary.latest_production_runtime_event_type
        ? `${executionProfile.label} | ${summary.latest_production_runtime_event_type}`
        : summary.latest_runtime_event_type || executionProfile.trigger_label || "No runtime result recorded yet.";

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-sm font-semibold text-foreground">Last Result</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoTile label="Latest Result" value={value ? formatDateTime(value) : "Not yet"} helper={helper} />
        <InfoTile label="Successful Test" value={summary.successful_test_exists ? "Yes" : "No"} helper={summary.latest_test_success_at ? `Last test success ${formatDateTime(summary.latest_test_success_at)}` : "No successful test yet"} />
        <InfoTile label="Latest Outcome" value={summary.latest_production_runtime_event_type || summary.latest_runtime_event_type || "No runtime yet"} helper={summary.latest_production_failed_at ? `Last production failure ${formatDateTime(summary.latest_production_failed_at)}` : summary.latest_production_blocked_at ? `Last production block ${formatDateTime(summary.latest_production_blocked_at)}` : summary.latest_failed_at ? `Last failure ${formatDateTime(summary.latest_failed_at)}` : summary.latest_blocked_at ? `Last blocked ${formatDateTime(summary.latest_blocked_at)}` : "No blocked or failed runtime recorded"} />
      </div>
    </div>
  );
}

function ServiceTimelineRelevance({ service }) {
  const relevance = service.timeline_relevance || {};
  const executionProfile = service.execution_profile || {};

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-sm font-semibold text-foreground">Timeline Relevance</p>
      <p className="mt-1 text-xs text-muted-foreground">
        This highlights the most recent service-specific audit signal. Use the full order timeline below for the complete event trail.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoTile label="Latest Service Event" value={relevance.latest_event_type ? relevance.latest_event_type.replaceAll("_", " ") : "No service event yet"} />
        <InfoTile label="Event Time" value={relevance.latest_event_at ? formatDateTime(relevance.latest_event_at) : "Not yet"} />
        <InfoTile label="Runtime Truth" value={relevance.successful_production_exists ? "Production runtime logged" : relevance.successful_test_exists ? "Test-only evidence" : executionProfile.label || "No evidence yet"} helper={relevance.latest_production_success_at ? `Last production success ${formatDateTime(relevance.latest_production_success_at)}` : relevance.latest_test_success_at ? `Last test success ${formatDateTime(relevance.latest_test_success_at)}` : executionProfile.trigger_detail} />
      </div>
    </div>
  );
}

export default function InstallOrderWorkspace({ orderId, onQueueRefresh }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [prepareProposal, setPrepareProposal] = useState(null);
  const [prepareLoading, setPrepareLoading] = useState(false);
  const [prepareFeedback, setPrepareFeedback] = useState("");
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [sequenceFeedback, setSequenceFeedback] = useState("");
  const [configNote, setConfigNote] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState("");
  const [transitionNotes, setTransitionNotes] = useState({});
  const [serviceFeedback, setServiceFeedback] = useState({});
  const [transitionSavingKey, setTransitionSavingKey] = useState("");
  const [runtimeTargetPhone, setRuntimeTargetPhone] = useState("");
  const [runtimeTargetEmail, setRuntimeTargetEmail] = useState("");
  const [runtimeFeedback, setRuntimeFeedback] = useState({});
  const [runtimeSavingKey, setRuntimeSavingKey] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");

  const loadDetail = async ({ preserveFeedback = true } = {}) => {
    if (!orderId) {
      setDetail(null);
      setForm(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await base44.functions.invoke("getInstallConfiguration", {
        order_id: orderId,
      });
      const nextDetail = response.data?.order || response.order || null;
      setDetail(nextDetail);
      setForm(nextDetail?.install_configuration || null);
      setPrepareProposal(null);
      setRuntimeTargetPhone((current) => (
        preserveFeedback && current ? current : (nextDetail?.workspace_summary?.runtime_targets?.suggested_phone || nextDetail?.customer_phone || "")
      ));
      setRuntimeTargetEmail((current) => (
        preserveFeedback && current ? current : (nextDetail?.workspace_summary?.runtime_targets?.suggested_email || nextDetail?.customer_email || "")
      ));
      if (!preserveFeedback) {
        setConfigFeedback("");
        setServiceFeedback({});
        setRuntimeFeedback({});
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load install detail."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setConfigNote("");
    setTransitionNotes({});
    setServiceFeedback({});
    setRuntimeFeedback({});
    setRuntimeTargetPhone("");
    setRuntimeTargetEmail("");
    setServiceFilter("all");
    loadDetail({ preserveFeedback: false });
  }, [orderId]);

  const timeline = useMemo(() => {
    return [...(detail?.timeline || [])].sort(
      (a, b) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
    );
  }, [detail]);

  const configurationReadyCount = detail?.services?.filter((service) => service.configuration_complete).length || 0;
  const totalTrackedServices = detail?.services?.length || 0;
  const totalBlockers = detail?.required_actions?.total_blockers || 0;
  const workspaceSummary = detail?.workspace_summary || null;
  const sharedConfigurationSummary = workspaceSummary?.shared_configuration || null;
  const visibleServices = useMemo(
    () => (detail?.services || []).filter((service) => matchesServiceFilter(service, serviceFilter)),
    [detail?.services, serviceFilter]
  );
  const hasUnsavedConfigChanges = useMemo(() => {
    const currentConfig = JSON.stringify(form || {});
    const savedConfig = JSON.stringify(detail?.install_configuration || {});
    return currentConfig !== savedConfig;
  }, [detail?.install_configuration, form]);

  const handleSharedChange = (field, value) => {
    setForm((current) => ({
      ...current,
      shared: {
        ...(current?.shared || {}),
        [field]: value,
      },
    }));
    setConfigFeedback("");
    setPrepareFeedback("");
  };

  const handleApplySharedSuggestion = (field, value) => {
    if (value == null || value === "") {
      return;
    }

    handleSharedChange(field, value);
  };

  const handleServiceConfigChange = (serviceKey, field, value) => {
    setForm((current) => ({
      ...current,
      services: {
        ...(current?.services || {}),
        [serviceKey]: {
          ...(current?.services?.[serviceKey] || {}),
          [field]: value,
        },
      },
    }));
    setConfigFeedback("");
    setPrepareFeedback("");
  };

  const handleApplyServiceSuggestion = (serviceKey, field, value) => {
    if (!value) {
      return;
    }

    handleServiceConfigChange(serviceKey, field, value);
  };

  const handleApplyServicePreset = (serviceKey, value) => {
    if (!value) {
      return;
    }

    setForm((current) => ({
      ...current,
      services: {
        ...(current?.services || {}),
        [serviceKey]: {
          ...(current?.services?.[serviceKey] || {}),
          ...value,
        },
      },
    }));
    setConfigFeedback("");
    setPrepareFeedback("");
  };

  const handleNurtureChannelToggle = (serviceKey, field, checked) => {
    setForm((current) => ({
      ...current,
      services: {
        ...(current?.services || {}),
        [serviceKey]: {
          sms_enabled: false,
          email_enabled: false,
          steps: [],
          ...(current?.services?.[serviceKey] || {}),
          [field]: checked,
        },
      },
    }));
    setConfigFeedback("");
    setPrepareFeedback("");
  };

  const handleAddNurtureStep = (serviceKey) => {
    setForm((current) => {
      const serviceConfig = current?.services?.[serviceKey] || {
        sms_enabled: false,
        email_enabled: false,
        steps: [],
      };
      return {
        ...current,
        services: {
          ...(current?.services || {}),
          [serviceKey]: {
            ...serviceConfig,
            steps: [
              ...(Array.isArray(serviceConfig.steps) ? serviceConfig.steps : []),
              {
                day: (Array.isArray(serviceConfig.steps) ? serviceConfig.steps.length : 0) + 1,
                channel: serviceConfig.sms_enabled ? "sms" : serviceConfig.email_enabled ? "email" : "",
                message_template: "",
              },
            ],
          },
        },
      };
    });
    setConfigFeedback("");
    setPrepareFeedback("");
  };

  const handleRemoveNurtureStep = (serviceKey, index) => {
    setForm((current) => {
      const serviceConfig = current?.services?.[serviceKey] || {};
      return {
        ...current,
        services: {
          ...(current?.services || {}),
          [serviceKey]: {
            ...serviceConfig,
            steps: (serviceConfig.steps || []).filter((_, stepIndex) => stepIndex !== index),
          },
        },
      };
    });
    setConfigFeedback("");
    setPrepareFeedback("");
  };

  const handleNurtureStepChange = (serviceKey, index, field, value) => {
    setForm((current) => {
      const serviceConfig = current?.services?.[serviceKey] || {};
      const steps = [...(serviceConfig.steps || [])];
      steps[index] = {
        ...(steps[index] || {}),
        [field]: field === "day" ? Number(value) : value,
      };
      return {
        ...current,
        services: {
          ...(current?.services || {}),
          [serviceKey]: {
            ...serviceConfig,
            steps,
          },
        },
      };
    });
    setConfigFeedback("");
    setPrepareFeedback("");
  };

  const handlePrepareSetup = async () => {
    if (!detail) return;

    try {
      setPrepareLoading(true);
      setPrepareFeedback("");
      setSequenceFeedback("");
      const response = await base44.functions.invoke("prepareAssistedSetup", {
        order_id: detail.id,
      });
      const proposal = response.data?.proposal || response.proposal || null;
      setPrepareProposal(proposal);
      setPrepareFeedback(
        proposal?.suggestions_applied?.length
          ? `Prepared ${proposal.suggestions_applied.length} safe suggestion${proposal.suggestions_applied.length === 1 ? "" : "s"}. Review the proposal before applying it to the form.`
          : "No safe autofill suggestions are available right now. Review the manual blockers below before continuing."
      );
    } catch (err) {
      setPrepareProposal(null);
      setPrepareFeedback(getErrorMessage(err, "Unable to prepare assisted setup."));
    } finally {
      setPrepareLoading(false);
    }
  };

  const handleApplyPreparedSetup = () => {
    if (!prepareProposal?.patch) {
      return;
    }

    setForm((current) => mergePreparedPatch(current, prepareProposal.patch));
    setConfigFeedback("Prepared setup was applied locally. Review the form and click Save Install Config to persist it.");
    setPrepareFeedback("Prepared setup was applied to the local form only. Nothing is saved until you click Save Install Config.");
  };

  const handleClearPreparedSetup = () => {
    setPrepareProposal(null);
    setPrepareFeedback("");
  };

  const handleSaveConfiguration = async () => {
    if (!detail || !form) return;

    try {
      setSavingConfig(true);
      setConfigFeedback("");
      await base44.functions.invoke("updateInstallConfiguration", {
        order_id: detail.id,
        shared: form.shared,
        services: form.services,
        note: configNote,
      });
      setConfigNote("");
      setConfigFeedback("Install configuration saved.");
      await loadDetail();
      await onQueueRefresh?.();
    } catch (err) {
      setConfigFeedback(getErrorMessage(err, "Unable to save install configuration."));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRunSetupSequence = async () => {
    if (!detail) return;

    if (hasUnsavedConfigChanges) {
      setSequenceFeedback("Save install configuration before running the assisted setup sequence. The sequence only uses saved canonical config.");
      return;
    }

    const confirmed = window.confirm(
      "Run the assisted setup sequence for the currently visible services? This will move eligible services through Configuring and Testing, then run their guarded test actions. It will not move anything Live automatically."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSequenceLoading(true);
      setSequenceFeedback("");
      setPrepareFeedback("");
      const response = await base44.functions.invoke("runAssistedSetupSequence", {
        order_id: detail.id,
        confirmed: true,
        selected_service_keys: visibleServices.map((service) => service.service_key),
        target_phone: runtimeTargetPhone || detail.customer_phone || "",
        target_email: runtimeTargetEmail || detail.customer_email || "",
        note: "Operator-confirmed assisted setup sequence",
      });
      const result = response.data?.result || response.result || null;
      const completedCount = result?.service_results?.length || 0;
      const manualCount = result?.manual_services?.length || 0;
      setSequenceFeedback(
        `Assisted setup sequence completed for ${completedCount} service${completedCount === 1 ? "" : "s"}${manualCount ? ` with ${manualCount} service${manualCount === 1 ? "" : "s"} still requiring manual follow-up.` : "."}`
      );
      await loadDetail();
      await onQueueRefresh?.();
    } catch (err) {
      const partialCount = err?.data?.details?.partial_results?.length || err?.details?.partial_results?.length || 0;
      const message = getErrorMessage(err, "Assisted setup sequence stopped.");
      setSequenceFeedback(
        partialCount
          ? `${message} ${partialCount} service${partialCount === 1 ? "" : "s"} completed before the sequence stopped.`
          : message
      );
      await loadDetail();
      await onQueueRefresh?.();
    } finally {
      setSequenceLoading(false);
    }
  };

  const handleTransition = async (serviceKey, nextStatus) => {
    if (!detail) return;

    const saveKey = `${serviceKey}:${nextStatus}`;
    try {
      setTransitionSavingKey(saveKey);
      setServiceFeedback((current) => ({
        ...current,
        [serviceKey]: "",
      }));

      await base44.functions.invoke("updateInstallStatus", {
        order_id: detail.id,
        service_key: serviceKey,
        install_status: nextStatus,
        note: transitionNotes[serviceKey] || "",
      });

      setTransitionNotes((current) => ({
        ...current,
        [serviceKey]: "",
      }));
      setServiceFeedback((current) => ({
        ...current,
        [serviceKey]: `${nextStatus} applied successfully.`,
      }));
      await loadDetail();
      await onQueueRefresh?.();
    } catch (err) {
      const validation = err?.data?.details?.validation || err?.details?.validation;
      const missing = validation?.missing_labels?.length
        ? ` Missing: ${validation.missing_labels.join(", ")}.`
        : "";
      setServiceFeedback((current) => ({
        ...current,
        [serviceKey]: `${getErrorMessage(err, "Transition blocked.")}${missing}`,
      }));
      await loadDetail();
      await onQueueRefresh?.();
    } finally {
      setTransitionSavingKey("");
    }
  };

  const handleRuntimeAction = async (service) => {
    if (!detail) return;

    const saveKey = service.service_key;
    const executionMode = service.execution_profile?.mode;
    const runProductionNurture = service.service_key === "nurture_sequence_14d" && executionMode === "manual_runner" && service.install_status === "Live";
    const runProductionReactivation = service.service_key === "lead_reactivation" && executionMode === "manual_triggered" && service.install_status === "Live";
    const runProductionReview = service.service_key === "review_request" && executionMode === "manual_triggered" && service.install_status === "Live";
    const endpoint =
      service.service_key === "instant_lead_response"
        ? "sendTestLead"
      : service.service_key === "missed_call_text_back"
        ? "simulateMissedCall"
      : service.service_key === "ai_booking_agent"
        ? "runBookingAgentTest"
      : runProductionReactivation
        ? "runLeadReactivationBatch"
      : runProductionReview
        ? "triggerReviewRequestManual"
      : service.service_key === "lead_reactivation"
        ? "runLeadReactivationTest"
      : service.service_key === "review_request"
        ? "runReviewRequestTest"
      : runProductionNurture
        ? "processNurtureSequenceRuntime"
      : "runNurtureSequenceTest";

    const payload =
      service.service_key === "instant_lead_response"
        ? {
            order_id: detail.id,
            target_phone: runtimeTargetPhone || detail.customer_phone,
            lead_name: "Test Lead",
          }
        : service.service_key === "missed_call_text_back"
        ? {
            order_id: detail.id,
            target_phone: runtimeTargetPhone || detail.customer_phone,
            caller_name: "Missed Caller",
            call_status: "no-answer",
          }
        : service.service_key === "ai_booking_agent"
        ? {
            order_id: detail.id,
            lead_name: "Booking Test Lead",
            lead_email: runtimeTargetEmail || detail.customer_email,
            lead_phone: runtimeTargetPhone || detail.customer_phone,
            scheduled_at: new Date().toISOString(),
          }
      : service.service_key === "lead_reactivation"
        ? runProductionReactivation
          ? {
              order_id: detail.id,
              approved: true,
            }
          : {
              order_id: detail.id,
              max_test_leads: 3,
            }
      : service.service_key === "review_request"
        ? runProductionReview
          ? {
              order_id: detail.id,
              target_phone: runtimeTargetPhone || detail.customer_phone,
              target_email: runtimeTargetEmail || detail.customer_email,
              customer_name: detail.customer_name || "Review Request Customer",
            }
          : {
              order_id: detail.id,
              target_phone: runtimeTargetPhone || detail.customer_phone,
              target_email: runtimeTargetEmail || detail.customer_email,
              customer_name: detail.customer_name || "Review Request Test Customer",
              trigger_event: service.configuration?.trigger_event || "manual_trigger",
            }
      : runProductionNurture
        ? {
            order_id: detail.id,
            limit: 25,
          }
      : service.service_key === "lead_reactivation"
        ? {
            order_id: detail.id,
            max_test_leads: 3,
          }
        : {
            order_id: detail.id,
            target_phone: runtimeTargetPhone || detail.customer_phone,
            target_email: runtimeTargetEmail || detail.customer_email,
            step_index: 0,
          };

    try {
      setRuntimeSavingKey(saveKey);
      setRuntimeFeedback((current) => ({
        ...current,
        [service.service_key]: "",
      }));

      const response = await base44.functions.invoke(endpoint, payload);
      const result = response.data?.result || response.result;
      const destination =
        result?.lead_email ||
        result?.recipient_phone ||
        result?.recipient_email ||
        runtimeTargetPhone ||
        runtimeTargetEmail ||
        detail.customer_phone ||
        detail.customer_email;
      setRuntimeFeedback((current) => ({
        ...current,
        [service.service_key]:
          service.service_key === "ai_booking_agent"
            ? `Booking handoff test succeeded. Confirmation logged for ${destination}.`
            : runProductionReactivation
            ? `Approved reactivation batch processed for ${result?.selected_lead_count || 0} lead(s).`
            : service.service_key === "lead_reactivation"
            ? `Reactivation test succeeded for ${result?.target_size || 0} lead(s).`
            : runProductionReview
            ? `Manual review request sent via ${result?.channel || service.configuration?.channel || "selected channel"}.`
            : service.service_key === "review_request"
            ? `Review request test succeeded via ${result?.channel || service.configuration?.channel || "selected channel"}.`
            : runProductionNurture
            ? `Due nurture steps processed for ${result?.processed || 0} lead(s).`
            : `Runtime succeeded. First step sent to ${destination}.`,
      }));
      await loadDetail();
      await onQueueRefresh?.();
    } catch (err) {
      const validation = err?.data?.details?.validation || err?.details?.validation;
      const missing = validation?.missing_labels?.length
        ? ` Missing: ${validation.missing_labels.join(", ")}.`
        : "";
      setRuntimeFeedback((current) => ({
        ...current,
        [service.service_key]: `${getErrorMessage(err, "Runtime blocked.")}${missing}`,
      }));
      await loadDetail();
      await onQueueRefresh?.();
    } finally {
      setRuntimeSavingKey("");
    }
  };

  if (!orderId) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
        Select a paid order from the install queue to open the canonical install workspace.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-white p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !detail || !form) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error || "Unable to load install workspace."}
      </div>
    );
  }

  const billing = buildBillingSummary({
    order: detail,
    subscription: detail.subscription,
    project: detail.client_project,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Client Setup Control Center</p>
              <StatusBadge value={detail.pipeline_status} />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground">{detail.business_name}</h3>
            <p className="text-sm text-muted-foreground">
              {detail.customer_name} | {detail.customer_email} | {detail.customer_phone || "Phone not provided"}
            </p>
            <p className="text-xs text-muted-foreground">
              Order {detail.id} | Payment {detail.payment_status} | Setup ${detail.total_setup} | Monthly ${detail.total_monthly}/mo
            </p>
            {detail.subscription ? (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                billing.billingStatus === "past_due" || detail.payment_status === "failed"
                  ? "border border-amber-200 bg-amber-50 text-amber-900"
                  : billing.billingStatus === "canceled"
                  ? "border border-red-200 bg-red-50 text-red-900"
                  : "border border-green-200 bg-green-50 text-green-900"
              }`}>
                <p className="font-semibold">
                  {billing.currentPlan} · <span className="capitalize">{billing.subscriptionStatus}</span> · Billing {billing.billingStatus}
                </p>
                <p className="mt-1 text-xs">
                  Renewal date: {formatBillingDate(billing.renewalDate)}
                  {detail.subscription.change_request_status ? ` · Request: ${detail.subscription.change_request_status}` : ""}
                </p>
                {billing.warnings.length > 0 ? (
                  <p className="mt-2 text-xs font-semibold">
                    {billing.warnings.join(" · ")}
                  </p>
                ) : null}
              </div>
            ) : null}
            {detail.pricing_summary ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <p className="font-semibold">{getPackageDisplayLabel(detail.pricing_summary)}</p>
                <p className="mt-1 text-xs text-blue-800">
                  {detail.pricing_summary.package_name
                    ? `${detail.pricing_summary.package_service_keys.length} package service(s)`
                    : `${detail.pricing_summary.selected_service_keys.length} selected service(s)`}
                  {detail.pricing_summary.add_on_service_keys?.length
                    ? ` + ${detail.pricing_summary.add_on_service_keys.length} add-on(s)`
                    : ""}
                  . Charged ${formatCurrency(detail.pricing_summary.total_setup)} setup and ${formatCurrency(detail.pricing_summary.total_monthly)}/mo.
                </p>
                {(detail.pricing_summary.setup_discount_total > 0 || detail.pricing_summary.monthly_discount_total > 0) ? (
                  <p className="mt-1 text-xs text-blue-800">
                    Bundle discount applied: ${formatCurrency(detail.pricing_summary.setup_discount_total)} setup and ${formatCurrency(detail.pricing_summary.monthly_discount_total)}/mo off the a la carte total.
                  </p>
                ) : null}
              </div>
            ) : null}
            {detail.pipeline_error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {detail.pipeline_error}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <InfoTile label="Config Ready" value={`${configurationReadyCount}/${totalTrackedServices} services`} />
            <InfoTile label="Required Blockers" value={String(totalBlockers)} helper="Deterministic blockers derived from backend state" />
            <InfoTile label="Last Install Event" value={detail.last_install_event_at ? formatDateTime(detail.last_install_event_at) : "Not yet"} />
            <InfoTile label="Next Focus" value={workspaceSummary?.headline || "Unavailable"} helper={workspaceSummary?.detail || "No backend focus summary available."} />
          </div>
        </div>
      </div>

      {detail.pricing_summary ? (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Purchased Package and Service Mapping</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Package name is sales context only. Install truth still lives on the individual order items listed below.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile label="Package" value={detail.pricing_summary.package_name || "Custom bundle"} />
              <InfoTile label="Installable Services" value={String(detail.pricing_summary.selected_service_keys?.length || 0)} />
              <InfoTile label="Bundle Savings" value={`$${formatCurrency(detail.pricing_summary.setup_discount_total || 0)} + $${formatCurrency(detail.pricing_summary.monthly_discount_total || 0)}/mo`} />
              <InfoTile label="Add-Ons" value={String(detail.pricing_summary.add_on_service_keys?.length || 0)} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Package Included Services</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(detail.pricing_summary.package_service_keys || []).length > 0 ? (
                  detail.pricing_summary.package_service_keys.map((serviceKey) => {
                    const service = detail.services.find((entry) => entry.service_key === serviceKey);
                    return (
                      <span key={serviceKey} className="inline-flex rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
                        {service?.display_name || serviceKey}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">No package was matched for this order.</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Add-On Services</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(detail.pricing_summary.add_on_service_keys || []).length > 0 ? (
                  detail.pricing_summary.add_on_service_keys.map((serviceKey) => {
                    const service = detail.services.find((entry) => entry.service_key === serviceKey);
                    return (
                      <span key={serviceKey} className="inline-flex rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground">
                        {service?.display_name || serviceKey}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">No add-on services were purchased outside the matched package.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <OperatorFocusPanel workspaceSummary={workspaceSummary} />
      <SetupAssistPanel workspaceSummary={workspaceSummary} />
      <DeploymentSummaryPanel
        overview={detail.assisted_deployment?.overview || workspaceSummary?.deployment_summary}
        proposal={prepareProposal}
        prepareLoading={prepareLoading}
        prepareFeedback={prepareFeedback}
        sequenceLoading={sequenceLoading}
        sequenceFeedback={sequenceFeedback}
        hasUnsavedConfigChanges={hasUnsavedConfigChanges}
        onPrepare={handlePrepareSetup}
        onApplyProposal={handleApplyPreparedSetup}
        onClearProposal={handleClearPreparedSetup}
        onRunSequence={handleRunSetupSequence}
      />
      <CommandViewPanel workspaceSummary={workspaceSummary} />
      <ServiceNavigation
        services={detail.services || []}
        filter={serviceFilter}
        onFilterChange={setServiceFilter}
        filterCounts={workspaceSummary?.service_filter_counts}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <h4 className="text-lg font-semibold text-foreground">Required Actions Engine</h4>
                <p className="text-sm text-muted-foreground">
                  Deterministic blockers and next actions derived from the order, service config, runtime tests, and provider readiness.
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <RequiredActionList
                title="Order-level actions"
                actions={detail.required_actions?.order || []}
                emptyLabel="No order-level blockers are currently derived."
              />
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Service setup queue</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Condensed service-level guidance so ops can see which purchased service should be handled next without scrolling through every detailed card first.
                </p>
                <div className="mt-3 space-y-3">
                  {detail.services.map((service) => (
                    <div key={service.service_key} className="rounded-lg border border-border bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{service.display_name}</p>
                        <StatusBadge value={service.install_status} />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-foreground">{service.operator_summary?.next_action_title || "No action required"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{service.operator_summary?.next_action_detail}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <InfoTile label="Phase" value={service.operator_summary?.phase_summary || service.install_status} />
                        <InfoTile label="Blockers" value={String(service.operator_summary?.blocker_count || 0)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-foreground">Remote Configuration</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  This form writes directly to <code>Order.install_configuration</code> for canonical shared runtime fields. Service-specific config lives on each service card below so ops edit each service in one place only.
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{configurationReadyCount}/{totalTrackedServices} services ready</p>
                <p>Testing and Live blockers are derived from backend state</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Shared runtime setup</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Complete these once for the SMS-based services on this order. The backend decides whether they are required.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    label="Shared Fields Ready"
                    value={sharedConfigurationSummary?.required
                      ? `${sharedConfigurationSummary.present_count}/${sharedConfigurationSummary.required_count}`
                      : "Not required"}
                  />
                  <InfoTile
                    label="Shared Status"
                    value={sharedConfigurationSummary?.required
                      ? sharedConfigurationSummary.complete ? "Complete" : "Needs setup"
                      : "Not needed"}
                  />
                </div>
                {(sharedConfigurationSummary?.missing_fields || []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {sharedConfigurationSummary.missing_fields.map((field) => (
                      <div key={field.field} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                        <p className="font-semibold">{field.label}</p>
                        <p className="mt-1">{field.helper}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Remote Test Targets</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  These are reused across runtime tests so operators do not have to re-enter them on every service card.
                </p>
                <div className="mt-4 grid gap-3">
                  <LabeledField label="Runtime Target Phone" helper="Used by SMS-based tests, manual triggers, booking handoff simulations, and nurture steps with SMS.">
                    <input
                      type="text"
                      value={runtimeTargetPhone}
                      onChange={(e) => setRuntimeTargetPhone(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={workspaceSummary?.runtime_targets?.suggested_phone || detail.customer_phone || "+1 (555) 555-5555"}
                    />
                  </LabeledField>
                  <LabeledField label="Runtime Target Email" helper="Used for nurture email sends, booking handoff simulations, and email review-request actions.">
                    <input
                      type="email"
                      value={runtimeTargetEmail}
                      onChange={(e) => setRuntimeTargetEmail(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={workspaceSummary?.runtime_targets?.suggested_email || detail.customer_email || "owner@example.com"}
                    />
                  </LabeledField>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="Twilio Business Phone" helper="Required for SMS runtime paths.">
                {getSuggestionField(workspaceSummary?.shared_suggestions, "twilio_business_phone") ? (
                  <div className="mb-2">
                    <SuggestionCard
                      suggestion={getSuggestionField(workspaceSummary?.shared_suggestions, "twilio_business_phone")}
                      actionLabel="Use suggestion"
                      onApply={() => handleApplySharedSuggestion("twilio_business_phone", getSuggestionField(workspaceSummary?.shared_suggestions, "twilio_business_phone")?.value)}
                    />
                  </div>
                ) : null}
                <input
                  type="text"
                  value={form.shared?.twilio_business_phone || ""}
                  onChange={(e) => handleSharedChange("twilio_business_phone", e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="+1 (602) 555-0100"
                />
              </LabeledField>
              <LabeledField label="Business Hours" helper="Used by the runtime after-hours guardrail.">
                {getSuggestionField(workspaceSummary?.shared_suggestions, "business_hours")?.available ? (
                  <div className="mb-2">
                    <SuggestionCard
                      suggestion={getSuggestionField(workspaceSummary?.shared_suggestions, "business_hours")}
                      actionLabel="Use suggestion"
                      onApply={() => handleApplySharedSuggestion("business_hours", getSuggestionField(workspaceSummary?.shared_suggestions, "business_hours")?.value)}
                    />
                  </div>
                ) : null}
                <input
                  type="text"
                  value={form.shared?.business_hours || ""}
                  onChange={(e) => handleSharedChange("business_hours", e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Mon-Fri 8am-5pm"
                />
              </LabeledField>
              <LabeledField label="After-Hours Behavior">
                {getSuggestionField(workspaceSummary?.shared_suggestions, "after_hours_behavior") ? (
                  <div className="mb-2">
                    <SuggestionCard
                      suggestion={getSuggestionField(workspaceSummary?.shared_suggestions, "after_hours_behavior")}
                      actionLabel="Use suggestion"
                      onApply={() => handleApplySharedSuggestion("after_hours_behavior", getSuggestionField(workspaceSummary?.shared_suggestions, "after_hours_behavior")?.value)}
                    />
                  </div>
                ) : null}
                <select
                  value={form.shared?.after_hours_behavior || ""}
                  onChange={(e) => handleSharedChange("after_hours_behavior", e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select behavior...</option>
                  {AFTER_HOURS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </LabeledField>
              <LabeledField label="Consent Behavior">
                {getSuggestionField(workspaceSummary?.shared_suggestions, "consent_behavior") ? (
                  <div className="mb-2">
                    <SuggestionCard
                      suggestion={getSuggestionField(workspaceSummary?.shared_suggestions, "consent_behavior")}
                      actionLabel="Use suggestion"
                      onApply={() => handleApplySharedSuggestion("consent_behavior", getSuggestionField(workspaceSummary?.shared_suggestions, "consent_behavior")?.value)}
                    />
                  </div>
                ) : null}
                <select
                  value={form.shared?.consent_behavior || ""}
                  onChange={(e) => handleSharedChange("consent_behavior", e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select behavior...</option>
                  {CONSENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </LabeledField>
            </div>

            <div className="mt-4">
              <LabeledField label="Opt-Out Message">
                {getSuggestionField(workspaceSummary?.shared_suggestions, "opt_out_message") ? (
                  <div className="mb-2">
                    <SuggestionCard
                      suggestion={getSuggestionField(workspaceSummary?.shared_suggestions, "opt_out_message")}
                      actionLabel="Use suggestion"
                      onApply={() => handleApplySharedSuggestion("opt_out_message", getSuggestionField(workspaceSummary?.shared_suggestions, "opt_out_message")?.value)}
                    />
                  </div>
                ) : null}
                <textarea
                  value={form.shared?.opt_out_message || ""}
                  onChange={(e) => handleSharedChange("opt_out_message", e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Reply STOP to opt out."
                />
              </LabeledField>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <input
                type="text"
                value={configNote}
                onChange={(e) => setConfigNote(e.target.value)}
                placeholder="Optional config update note for the timeline"
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleSaveConfiguration}
                disabled={savingConfig}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Install Config
              </button>
            </div>

            {configFeedback && (
              <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                configFeedback.includes("saved") ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700"
              }`}>
                {configFeedback}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {visibleServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
                No services match the current backend-derived filter.
              </div>
            ) : null}

            {visibleServices.map((service) => (
              <div id={`service-${service.service_key}`} key={service.service_key} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-foreground">{service.display_name}</h4>
                      <StatusBadge value={service.install_status} />
                    </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                      Canonical configuration and runtime truth for this purchased service. Production sends only run through the trigger model shown below.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoTile label="Runtime Mode" value={service.execution_profile?.label || "Unknown"} helper={service.execution_profile?.trigger_label || "No trigger model recorded"} />
                    <InfoTile label="Allowed Next" value={service.allowed_next_statuses.length > 0 ? service.allowed_next_statuses.join(", ") : "None"} />
                    <InfoTile
                      label={
                        service.service_key === "ai_booking_agent"
                          ? "Last Booking Test"
                          : service.service_key === "lead_reactivation"
                          ? "Last Reactivation Run"
                          : service.service_key === "review_request"
                          ? "Last Review Trigger"
                          : service.execution_profile?.mode === "production_real"
                          ? "Last Real Runtime"
                          : service.execution_profile?.mode === "manual_runner"
                          ? "Last Due-Step Run"
                          : "Last Successful Test"
                      }
                      value={(service.test_summary.latest_production_runtime_at || service.test_summary.latest_runtime_at) ? formatDateTime(service.test_summary.latest_production_runtime_at || service.test_summary.latest_runtime_at) : "Not yet"}
                      helper={
                        service.service_key === "ai_booking_agent"
                          ? `${service.test_summary.latest_runtime_event_type || "No booking-agent runtime yet"}${service.test_summary.latest_success_at ? ` | last success ${formatDateTime(service.test_summary.latest_success_at)}` : ""}`
                          : service.service_key === "lead_reactivation"
                          ? `${service.target_size || 0} eligible lead(s) currently match the configured segment${service.test_summary.latest_batch_summary_at ? ` | last batch ${formatDateTime(service.test_summary.latest_batch_summary_at)}` : ""}`
                          : service.service_key === "review_request"
                          ? `${service.configuration?.channel || "No channel selected"} | ${service.test_summary.latest_production_success_at ? `last send ${formatDateTime(service.test_summary.latest_production_success_at)}` : service.test_summary.latest_review_trigger_at ? `last test ${formatDateTime(service.test_summary.latest_review_trigger_at)}` : "No review-request trigger yet"}`
                          : `${service.execution_profile?.label || "Unknown mode"} | ${service.execution_profile?.trigger_label || service.scheduler?.label || "No runtime trigger configured"}`
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <ServiceOperatorSummary service={service} />

                  <RequiredActionList
                    title="Required Actions"
                    actions={service.required_actions || []}
                    emptyLabel="No required actions remain for this service."
                  />

                  <div className="rounded-xl border border-border bg-white p-4">
                    <p className="text-sm font-semibold text-foreground">Config</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Service-specific configuration writes to <code>Order.install_configuration.services.{service.service_key}</code> only after the operator saves.
                    </p>

                    {service.service_key === "lead_reactivation" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <InfoTile label="Target Size" value={String(service.target_size || 0)} helper="Derived from canonical Leads matches for this order business and segment." />
                        <InfoTile label="Last Batch Count" value={String(service.test_summary.latest_batch_summary?.selected_lead_count || 0)} helper={service.test_summary.latest_batch_summary_at ? formatDateTime(service.test_summary.latest_batch_summary_at) : "No batch summary yet"} />
                        <InfoTile label="Configured Max Batch" value={String(service.configuration?.max_batch_size || 25)} helper={service.configuration?.target_segment || "No segment selected"} />
                      </div>
                    ) : service.service_key === "review_request" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <InfoTile label="Channel" value={service.configuration?.channel || "Not set"} helper={service.configuration?.trigger_event || "No trigger selected"} />
                        <InfoTile label="Send Delay" value={service.configuration?.send_delay_minutes != null ? `${service.configuration.send_delay_minutes} min` : "Immediate"} helper={service.test_summary.latest_production_success_at ? formatDateTime(service.test_summary.latest_production_success_at) : service.test_summary.latest_review_trigger_at ? formatDateTime(service.test_summary.latest_review_trigger_at) : "No trigger simulation yet"} />
                        <InfoTile label="Fallback Feedback" value={service.configuration?.fallback_internal_feedback_enabled ? "Enabled" : "Disabled"} helper={service.configuration?.review_link || "No review link saved"} />
                      </div>
                    ) : null}

                    {service.service_key === "lead_reactivation" && service.target_lead_preview?.length > 0 ? (
                      <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                        <p className="text-sm font-semibold text-foreground">Target Lead Preview</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          First few canonical Leads currently matched by the selected segment.
                        </p>
                        <div className="mt-3 space-y-2">
                          {service.target_lead_preview.map((lead) => (
                            <div key={lead.id} className="rounded-lg border border-border bg-white px-3 py-3 text-xs text-foreground">
                              <p className="font-semibold">{lead.full_name || "Unnamed lead"}</p>
                              <p className="text-muted-foreground">{lead.email || "No email"} | {lead.phone || "No phone"} | {lead.status || "Unknown status"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <ServiceConfigEditor
                        service={service}
                        value={form.services?.[service.service_key] || {}}
                        onChange={handleServiceConfigChange}
                        onApplySuggestion={handleApplyServiceSuggestion}
                        onApplyPreset={handleApplyServicePreset}
                        onToggleChannel={handleNurtureChannelToggle}
                        onAddStep={handleAddNurtureStep}
                        onRemoveStep={handleRemoveNurtureStep}
                        onStepChange={handleNurtureStepChange}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center gap-2">
                      <TestTube2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Runtime Control</p>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {service.execution_profile?.trigger_detail || "Uses canonical runtime handling for this service."} Shared targets: {runtimeTargetPhone || workspaceSummary?.runtime_targets?.suggested_phone || "No phone"} | {runtimeTargetEmail || workspaceSummary?.runtime_targets?.suggested_email || "No email"}.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.allowed_next_statuses.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No next transitions currently allowed by backend state.</span>
                      ) : (
                        service.allowed_next_statuses.map((status) => {
                          const saveKey = `${service.service_key}:${status}`;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleTransition(service.service_key, status)}
                              disabled={transitionSavingKey === saveKey}
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
                            >
                              {transitionSavingKey === saveKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                              Move to {status}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                      <input
                        type="text"
                        value={transitionNotes[service.service_key] || ""}
                        onChange={(e) => setTransitionNotes((current) => ({
                          ...current,
                          [service.service_key]: e.target.value,
                        }))}
                        placeholder="Optional transition note"
                        className="h-10 rounded-xl border border-input bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleRuntimeAction(service)}
                        disabled={runtimeSavingKey === service.service_key}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
                      >
                        {runtimeSavingKey === service.service_key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {getRuntimeButtonLabel(service)}
                      </button>
                    </div>

                    {serviceFeedback[service.service_key] && (
                      <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
                        serviceFeedback[service.service_key].includes("successfully")
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-red-200 bg-red-50 text-red-700"
                      }`}>
                        {serviceFeedback[service.service_key]}
                      </div>
                    )}

                    {runtimeFeedback[service.service_key] && (
                      <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
                        runtimeFeedback[service.service_key].includes("succeeded")
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-red-200 bg-red-50 text-red-700"
                      }`}>
                        {runtimeFeedback[service.service_key]}
                      </div>
                    )}
                  </div>

                  <OperationalReadiness service={service} />
                  <ServiceLastResult service={service} />
                  <ServiceTimelineRelevance service={service} />
                  <ServicePlaybook service={service} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Install Event Timeline</h4>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              CommunicationEvent-backed ops timeline for payment, config, service transitions, blocked moves, runtime attempts, provider sends, and order rollups.
            </p>

            {timeline.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No install events have been recorded for this order yet.
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((event) => (
                  <div key={event.id} className={`rounded-xl border p-4 ${getEventTone(event.event_type, event.status)}`}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{getEventTitle(event)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{getEventBody(event)}</p>
                        {event.error_message && (
                          <p className="mt-2 text-xs font-medium text-red-700">{event.error_message}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatDateTime(event.created_date)}</p>
                        <p>{event.provider} | {event.status}</p>
                        {event.service_key && <p>{event.service_key}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Provider Readiness</h4>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Read-only integration readiness derived from canonical backend settings and CommunicationEvent activity. Unavailable values are shown honestly as unavailable.
            </p>
            <div className="space-y-3">
              <ProviderCard provider={detail.provider_readiness.stripe} />
              <ProviderCard provider={detail.provider_readiness.twilio} />
              <ProviderCard provider={detail.provider_readiness.resend} />
              <ProviderCard provider={detail.provider_readiness.webhook} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Operator Sequence</h4>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Exact remote setup sequence for internal ops. Follow this order so the UI, backend rules, and timeline stay aligned.
            </p>
            <div className="space-y-3">
              {(detail.operator_sequence || []).map((step) => (
                <div key={step.step} className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-sm font-semibold text-foreground">{step.step}. {step.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Linked Records</h4>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              These records are mirrored or supporting context only. Install truth remains on the order.
            </p>

            <div className="space-y-4">
              <ReadOnlyRecordCard
                title="Client"
                rows={[
                  ["Client ID", detail.client_id || "Pending link"],
                  ["Name", detail.client?.full_name || detail.customer_name],
                  ["Email", detail.client?.email || detail.customer_email],
                  ["Phone", detail.client?.phone || detail.customer_phone || "Not provided"],
                  ["Status", detail.client?.status || "Not linked"],
                ]}
              />

              <ReadOnlyRecordCard
                title="ClientProject Mirror"
                rows={[
                  ["Project ID", detail.client_project_id || "Pending link"],
                  ["Plan", detail.client_project?.plan || "Not linked"],
                  ["Plan Change Request", detail.client_project?.plan_change_request || "None"],
                  ...MIRROR_STEPS.map((step) => [
                    step.label,
                    <MirrorStatusBadge key={step.key} value={detail.client_project?.[step.key] || "pending"} />,
                  ]),
                ]}
              />

              <ReadOnlyRecordCard
                title="OnboardingClient Mirror"
                rows={[
                  ["Onboarding ID", detail.onboarding_client_id || "Pending link"],
                  ["Status", detail.onboarding_client?.status || "Not linked"],
                  ["Twilio Number", detail.onboarding_client?.twilio_number || "Not mirrored yet"],
                  ["Instant Lead Response", detail.onboarding_client?.step_instant_response ? "Live" : "Pending"],
                  ["Missed Call Text-Back", detail.onboarding_client?.step_missed_call ? "Live" : "Pending"],
                  ["Messages Customized", detail.onboarding_client?.step_messages_customized ? "Yes" : "No"],
                  ["Tested", detail.onboarding_client?.step_tested ? "Yes" : "No"],
                  ["Live", detail.onboarding_client?.step_live ? "Yes" : "No"],
                ]}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Install truth guardrail</p>
                <p className="mt-1 text-sm text-amber-800">
                  Do not edit install progress through mirrored ClientProject or OnboardingClient records. Use this order workspace for configuration, state transitions, runtime tests, and timeline review.
                </p>
              </div>
            </div>
          </div>

          {detail.notes ? (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-semibold text-foreground">Internal notes</h4>
              </div>
              <p className="text-sm text-muted-foreground">{detail.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

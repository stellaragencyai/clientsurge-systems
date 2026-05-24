import { CheckCircle2, Loader2, Sparkles, Wrench } from "lucide-react";

function InfoTile({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export default function DeploymentSummaryPanel({
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
    counts: { safe_autofill: 0, manual_required: 0, sequence_ready: 0, live_ready: 0 },
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
          <button type="button" onClick={onPrepare} disabled={prepareLoading} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60">
            {prepareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Prepare Setup
          </button>
          {proposal ? (
            <>
              <button type="button" onClick={onApplyProposal} className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <CheckCircle2 className="h-4 w-4" /> Apply to Form
              </button>
              <button type="button" onClick={onClearProposal} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
                Clear Proposal
              </button>
            </>
          ) : null}
          <button type="button" onClick={onRunSequence} disabled={sequenceLoading || hasUnsavedConfigChanges} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60">
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
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Save install configuration before running the assisted setup sequence.
        </div>
      ) : null}
      {prepareFeedback ? <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{prepareFeedback}</div> : null}
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
                <div key={`${item.field || item.service_key || "manual"}:${index}`} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-900">
                  <p className="font-semibold">{item.service_display_name ? `${item.service_display_name}: ${item.label || item.display_name}` : item.label || item.display_name || "Manual input required"}</p>
                  <p className="mt-1">{item.reason || item.detail || "Operator review is still required."}</p>
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
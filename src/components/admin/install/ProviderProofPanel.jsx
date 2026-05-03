import { CheckCircle2, Loader2, Mail, Phone, ShieldAlert } from "lucide-react";

const PROOF_STATUS_STYLES = {
  live_provider_proofed: "border-green-200 bg-green-50 text-green-800",
  test_wired: "border-blue-200 bg-blue-50 text-blue-800",
  configured: "border-sky-200 bg-sky-50 text-sky-800",
  failed: "border-red-200 bg-red-50 text-red-800",
  not_configured: "border-slate-200 bg-slate-100 text-slate-700",
  unavailable: "border-slate-200 bg-slate-50 text-slate-700",
};

function formatDateTime(value) {
  if (!value) return "Not recorded yet";
  return new Date(value).toLocaleString();
}

function StatusPill({ derivedStatus, statusLabel }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${PROOF_STATUS_STYLES[derivedStatus] || PROOF_STATUS_STYLES.unavailable}`}>
      {statusLabel || "Unavailable"}
    </span>
  );
}

function DetailRow({ label, value, helper, monospace = false }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium text-foreground ${monospace ? "break-all font-mono text-[11px]" : ""}`}>
        {value || "Unavailable"}
      </p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function ProofCheckpoint({ label, event, emptyLabel = "Not recorded yet." }) {
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {event ? (
        <>
          <p className="mt-1 text-sm font-semibold text-foreground">{event.subject || event.event_type || "Recorded event"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.created_date)}</p>
          {event.provider_message_id ? (
            <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{event.provider_message_id}</p>
          ) : null}
          {event.error_message ? <p className="mt-1 text-xs text-red-700">{event.error_message}</p> : null}
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function InstructionList({ title, items }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {items?.length ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item} className="rounded-lg border border-border bg-white px-3 py-3 text-xs leading-relaxed text-foreground">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No operator notes are currently available.</p>
      )}
    </div>
  );
}

function ProofCard({
  title,
  description,
  proofStatus,
  details,
  checkpoints,
  actionLabel,
  actionKey,
  actionHelper,
  actionIcon: ActionIcon,
  savingKey,
  actionDisabled = false,
  onRunProof,
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">{proofStatus?.status_reason || "No proof status has been derived yet."}</p>
        </div>
        <StatusPill derivedStatus={proofStatus?.derived_status} statusLabel={proofStatus?.status_label} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {details.map((detail) => (
          <DetailRow
            key={detail.label}
            label={detail.label}
            value={detail.value}
            helper={detail.helper}
            monospace={detail.monospace}
          />
        ))}
      </div>

      {actionLabel ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{actionLabel}</p>
              {actionHelper ? <p className="mt-1 text-xs text-muted-foreground">{actionHelper}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onRunProof(actionKey)}
              disabled={actionDisabled || savingKey === actionKey}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {savingKey === actionKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ActionIcon className="h-3.5 w-3.5" />}
              {actionLabel}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {checkpoints.map((checkpoint) => (
          <ProofCheckpoint
            key={checkpoint.label}
            label={checkpoint.label}
            event={checkpoint.event}
            emptyLabel={checkpoint.emptyLabel}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProviderProofPanel({
  proof,
  runtimeTargetPhone,
  runtimeTargetEmail,
  savingKey,
  feedback,
  hasUnsavedConfigChanges,
  onRunProof,
}) {
  if (!proof) {
    return null;
  }

  const feedbackTone =
    feedback?.tone === "success"
      ? "border border-green-200 bg-green-50 text-green-700"
      : feedback?.tone === "error"
      ? "border border-red-200 bg-red-50 text-red-700"
      : "border border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold text-foreground">Live Launch Proof</h4>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Run real order-scoped proof actions and record the external validations that cannot be simulated locally. This keeps Twilio, webhook, booking, and review-request go-live claims honest.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailRow
            label="Proof Gaps"
            value={String(proof.missing_live_proof_items?.length || 0)}
            helper="Remaining live-proof items derived from canonical order events."
          />
          <DetailRow
            label="Runtime Phone"
            value={runtimeTargetPhone || "No runtime phone set"}
            helper="Used by live SMS proof."
          />
          <DetailRow
            label="Runtime Email"
            value={runtimeTargetEmail || "No runtime email set"}
            helper="Used by live email proof."
          />
        </div>
      </div>

      {hasUnsavedConfigChanges ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Save install configuration before running live provider proof. Proof actions only use saved canonical config.
        </div>
      ) : null}

      {feedback?.message ? (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${feedbackTone}`}>
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <ProofCard
          title="Lead Ingestion Proof"
          description="Posts a real order-scoped proof lead through the canonical webhook using issued order credentials."
          proofStatus={proof.webhook}
          details={[
            {
              label: "Webhook URL",
              value: proof.webhook?.url || "Unavailable",
              helper: "Point real customer-facing forms or CRM webhooks here.",
              monospace: true,
            },
            {
              label: "Credentials",
              value: proof.webhook?.credentials_active ? "Active" : "Not active",
              helper: proof.webhook?.credentials_last_used_at ? `Last used ${formatDateTime(proof.webhook.credentials_last_used_at)}` : "No credential use has been recorded yet.",
            },
          ]}
          checkpoints={[
            {
              label: "Last Live Proof",
              event: proof.webhook?.last_live_proof,
              emptyLabel: "No live webhook proof has been recorded for this order.",
            },
            {
              label: "Last Ingestion Event",
              event: proof.webhook?.last_ingestion_event,
              emptyLabel: "No customer lead-ingestion event has been recorded for this order yet.",
            },
          ]}
          actionLabel="Run Webhook Proof"
          actionKey="lead_ingestion_webhook"
          actionHelper="Uses the order-scoped API key and webhook secret already issued to this paid order."
          actionIcon={CheckCircle2}
          savingKey={savingKey}
          onRunProof={onRunProof}
        />

        <ProofCard
          title="Twilio Live Proof"
          description="Sends a real order-scoped SMS proof and then waits for Twilio callback evidence on the canonical timeline."
          proofStatus={proof.twilio}
          details={[
            {
              label: "Order Twilio Phone",
              value: proof.twilio?.order_business_phone || "Not set",
              helper: "This is the business number the runtime expects to use for SMS and missed-call recovery.",
            },
            {
              label: "SMS Status Callback URL",
              value: proof.twilio?.status_callback_url || proof.twilio?.callback_url || "Unavailable",
              helper: "Twilio should post outbound SMS delivery callbacks here.",
              monospace: true,
            },
            {
              label: "Missed-Call Webhook URL",
              value: proof.twilio?.missed_call_callback_url || proof.twilio?.callback_url || "Unavailable",
              helper: "Twilio voice or missed-call callbacks should land here for the canonical recovery path.",
              monospace: true,
            },
          ]}
          checkpoints={[
            {
              label: "Last Live SMS Proof",
              event: proof.twilio?.last_live_sms_proof,
              emptyLabel: "No real SMS proof send has been recorded for this order.",
            },
            {
              label: "Latest Delivery Callback",
              event: proof.twilio?.last_delivery_callback,
              emptyLabel: "No Twilio delivery callback has been observed yet.",
            },
            {
              label: "Latest Missed-Call Webhook",
              event: proof.twilio?.last_missed_call_live_webhook,
              emptyLabel: "No real missed-call webhook has been captured yet.",
            },
          ]}
          actionLabel="Run Live SMS Proof"
          actionKey="live_sms_instant_lead_response"
          actionHelper={`Sends to ${runtimeTargetPhone || "the saved customer phone once it is set"} so ops can verify real Twilio delivery.`}
          actionIcon={Phone}
          savingKey={savingKey}
          actionDisabled={!runtimeTargetPhone}
          onRunProof={onRunProof}
        />

        <ProofCard
          title="Email Live Proof"
          description="Sends a real provider proof email and waits for callback evidence from the configured email provider."
          proofStatus={proof.resend}
          details={[
            {
              label: "Email Callback URL",
              value: proof.resend?.callback_url || "Unavailable",
              helper: "Resend or Gmail webhook delivery must arrive here to close the proof loop.",
              monospace: true,
            },
            {
              label: "Last Provider Callback",
              value: proof.resend?.last_callback ? formatDateTime(proof.resend.last_callback.created_date) : "Not recorded yet",
              helper: proof.resend?.last_callback?.subject || "No email provider callback has been recorded yet.",
            },
          ]}
          checkpoints={[
            {
              label: "Last Live Email Proof",
              event: proof.resend?.last_live_email_proof,
              emptyLabel: "No live email proof send has been recorded for this order.",
            },
            {
              label: "Last Delivered Callback",
              event: proof.resend?.last_delivered_callback,
              emptyLabel: "No delivered callback has been observed yet.",
            },
            {
              label: "Last Opened Callback",
              event: proof.resend?.last_opened_callback,
              emptyLabel: "No opened callback has been observed yet.",
            },
          ]}
          actionLabel="Run Live Email Proof"
          actionKey="live_email"
          actionHelper={`Sends to ${runtimeTargetEmail || "the saved customer email once it is set"} so ops can verify outbound and callback flow.`}
          actionIcon={Mail}
          savingKey={savingKey}
          actionDisabled={!runtimeTargetEmail}
          onRunProof={onRunProof}
        />
      </div>

      {(proof.booking?.enabled || proof.review?.enabled) ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {proof.booking?.enabled ? (
            <ProofCard
              title="AI Booking Agent Proof"
              description="Record this only after a real booking lands in the external calendar for this paid order."
              proofStatus={proof.booking}
              details={[
                {
                  label: "Booking Mode",
                  value: proof.booking?.booking_mode || "Not set",
                  helper: proof.booking?.proof_prereq_reason || "No booking proof guidance is currently available.",
                },
                {
                  label: "Booking Link",
                  value: proof.booking?.booking_link || "Not set",
                  helper: "Live calendar proof only makes sense when this routes into the real external booking flow.",
                  monospace: true,
                },
              ]}
              checkpoints={[
                {
                  label: "Last Booking Simulation",
                  event: proof.booking?.last_booking_simulation,
                  emptyLabel: "No booking simulation has been recorded yet.",
                },
                {
                  label: "Last Live Calendar Proof",
                  event: proof.booking?.last_live_calendar_proof,
                  emptyLabel: "No operator-confirmed live calendar proof has been recorded yet.",
                },
              ]}
              actionLabel="Record Calendar Sync Proof"
              actionKey="live_booking_calendar_sync"
              actionHelper="Use this only after verifying the real external calendar booking outside the internal simulation path."
              actionIcon={CheckCircle2}
              savingKey={savingKey}
              actionDisabled={!proof.booking?.proof_ready}
              onRunProof={onRunProof}
            />
          ) : null}

          {proof.review?.enabled ? (
            <ProofCard
              title="Review Request Trigger Proof"
              description="Record this only after a real appointment-completed or order-completed event fires the review-request flow in production."
              proofStatus={proof.review}
              details={[
                {
                  label: "Trigger Event",
                  value: proof.review?.trigger_event || "Not set",
                  helper: proof.review?.proof_prereq_reason || "No review-request proof guidance is currently available.",
                },
                {
                  label: "Channel",
                  value: proof.review?.channel || "Not set",
                  helper:
                    proof.review?.send_delay_minutes == null
                      ? "Immediate delivery is configured."
                      : `${proof.review.send_delay_minutes} minute delay is configured.`,
                },
              ]}
              checkpoints={[
                {
                  label: "Last Trigger Simulation",
                  event: proof.review?.last_review_trigger_simulation,
                  emptyLabel: "No review-request trigger simulation has been recorded yet.",
                },
                {
                  label: "Last Live Trigger Proof",
                  event: proof.review?.last_live_trigger_proof,
                  emptyLabel: "No operator-confirmed live completion-trigger proof has been recorded yet.",
                },
              ]}
              actionLabel="Record Completion Trigger Proof"
              actionKey="live_review_request_trigger"
              actionHelper="Use this only after verifying a real completion event produced the review-request send in production."
              actionIcon={CheckCircle2}
              savingKey={savingKey}
              actionDisabled={!proof.review?.proof_ready}
              onRunProof={onRunProof}
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <InstructionList title="Lead Ingestion Instructions" items={proof.instructions?.webhook_lead_capture || []} />
        <InstructionList title="Twilio Callback Instructions" items={proof.instructions?.twilio_missed_call || []} />
        <InstructionList title="Email Callback Instructions" items={proof.instructions?.resend_webhook || []} />
        <InstructionList title="Booking Proof Instructions" items={proof.instructions?.booking_calendar_sync || []} />
        <InstructionList title="Review Trigger Instructions" items={proof.instructions?.review_request_trigger || []} />
        <InstructionList title="Real-World Limits" items={proof.instructions?.cannot_be_proven_locally || []} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-semibold text-foreground">Remaining Live-Proof Gaps</p>
        {(proof.missing_live_proof_items || []).length ? (
          <div className="mt-3 space-y-2">
            {proof.missing_live_proof_items.map((item) => (
              <div key={item} className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-900">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-xs text-green-800">
            All currently tracked provider proof items are satisfied for this order.
          </div>
        )}
      </div>
    </div>
  );
}

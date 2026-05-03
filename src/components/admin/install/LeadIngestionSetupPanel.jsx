import { CheckCircle2, KeyRound, Loader2, PlayCircle, RotateCcw, ShieldAlert, Trash2, Webhook } from "lucide-react";

const STATUS_STYLES = {
  active: "border-green-200 bg-green-50 text-green-800",
  partial: "border-amber-200 bg-amber-50 text-amber-800",
  partially_revoked: "border-amber-200 bg-amber-50 text-amber-800",
  revoked: "border-red-200 bg-red-50 text-red-800",
  not_issued: "border-slate-200 bg-slate-100 text-slate-700",
};

function formatDateTime(value) {
  if (!value) return "Not recorded yet";
  return new Date(value).toLocaleString();
}

function InfoTile({ label, value, helper = null, monospace = false }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium text-foreground ${monospace ? "break-all font-mono text-[11px]" : ""}`}>
        {value || "Unavailable"}
      </p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function ActionButton({ icon: Icon, label, actionKey, savingKey, onClick, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 text-red-700 hover:border-red-300 hover:text-red-800"
      : "border-border text-foreground hover:border-primary hover:text-primary";

  return (
    <button
      type="button"
      onClick={() => onClick(actionKey)}
      disabled={savingKey === actionKey}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-xs font-semibold disabled:opacity-60 ${toneClass}`}
    >
      {savingKey === actionKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

export default function LeadIngestionSetupPanel({
  setup,
  savingKey,
  feedback,
  revealedCredentials,
  onAction,
}) {
  if (!setup) {
    return null;
  }

  const feedbackTone =
    feedback?.tone === "success"
      ? "border border-green-200 bg-green-50 text-green-700"
      : feedback?.tone === "error"
      ? "border border-red-200 bg-red-50 text-red-700"
      : "border border-blue-200 bg-blue-50 text-blue-700";
  const statusTone = STATUS_STYLES[setup.credential_status] || STATUS_STYLES.not_issued;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold text-foreground">Lead Ingestion Setup</h4>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage the paid-order webhook credentials, verify the canonical lead-ingestion endpoint, and keep the customer-owned lead path separate from platform Website Leads.
          </p>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusTone}`}>
          {setup.credential_status.replaceAll("_", " ")}
        </span>
      </div>

      {feedback?.message ? (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${feedbackTone}`}>
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 xl:grid-cols-4">
        <InfoTile
          label="Webhook URL"
          value={setup.webhook_url}
          helper="Use this endpoint for paid customer lead ingestion only."
          monospace={true}
        />
        <InfoTile
          label="API Key"
          value={setup.credentials?.masked_api_key || "Not issued"}
          helper={setup.credentials?.issued_at ? `Issued ${formatDateTime(setup.credentials.issued_at)}` : "No active API key has been issued yet."}
          monospace={true}
        />
        <InfoTile
          label="Webhook Secret"
          value={setup.credentials?.masked_webhook_secret || "Not issued"}
          helper={setup.credentials?.rotated_at ? `Rotated ${formatDateTime(setup.credentials.rotated_at)}` : setup.credentials?.revoked_at ? `Revoked ${formatDateTime(setup.credentials.revoked_at)}` : "No rotation recorded yet."}
          monospace={true}
        />
        <InfoTile
          label="Last Credential Use"
          value={setup.credentials?.last_used_at ? formatDateTime(setup.credentials.last_used_at) : "Not recorded yet"}
          helper={setup.idempotency_guidance}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {setup.actions?.can_issue ? (
          <ActionButton
            icon={KeyRound}
            label="Issue Credentials"
            actionKey="issue"
            savingKey={savingKey}
            onClick={onAction}
          />
        ) : null}
        {setup.actions?.can_rotate ? (
          <ActionButton
            icon={RotateCcw}
            label="Rotate Credentials"
            actionKey="rotate"
            savingKey={savingKey}
            onClick={onAction}
          />
        ) : null}
        {setup.actions?.can_revoke ? (
          <ActionButton
            icon={Trash2}
            label="Revoke Credentials"
            actionKey="revoke"
            savingKey={savingKey}
            onClick={onAction}
            tone="danger"
          />
        ) : null}
        {setup.actions?.can_test ? (
          <ActionButton
            icon={PlayCircle}
            label="Run Lead Ingestion Test"
            actionKey="test"
            savingKey={savingKey}
            onClick={onAction}
          />
        ) : null}
      </div>

      {revealedCredentials ? (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <p className="text-sm font-semibold text-green-900">Current revealed credentials</p>
          </div>
          <p className="mt-1 text-xs text-green-800">
            These values are only shown immediately after issuing or rotating credentials.
          </p>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <InfoTile label="API Key" value={revealedCredentials.api_key} monospace={true} />
            <InfoTile label="Webhook Secret" value={revealedCredentials.webhook_secret} monospace={true} />
            <InfoTile label="Webhook URL" value={revealedCredentials.webhook_url} monospace={true} />
          </div>
          {revealedCredentials.example_curl ? (
            <div className="mt-4 rounded-xl border border-green-200 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Example cURL</p>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[11px] text-foreground">
                {revealedCredentials.example_curl}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Setup Instructions</p>
          <div className="mt-3 space-y-2">
            {(setup.setup_instructions || []).map((item) => (
              <div key={item} className="rounded-lg border border-border bg-white px-3 py-3 text-xs text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Identity Modes</p>
          <div className="mt-3 space-y-2">
            {(setup.identity_modes || []).map((mode) => (
              <div key={mode.key} className="rounded-lg border border-border bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                  {mode.recommended ? (
                    <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Path separation reminder</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{setup.warning}</p>
      </div>
    </div>
  );
}

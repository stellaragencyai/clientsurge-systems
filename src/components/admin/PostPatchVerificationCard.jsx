import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FlaskConical,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
} from "lucide-react";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function PassFailRow({ pass, label }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground/70">{label}</span>
      {pass ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" /> PASS
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> FAIL
        </span>
      )}
    </div>
  );
}

export default function PostPatchVerificationCard({
  verification,
  verifying,
  onRun,
}) {
  const v = verification;
  const hasResult = v && v.overall_status;
  const overallColor =
    v?.overall_status === "pass"
      ? "green"
      : v?.overall_status === "partial"
        ? "amber"
        : v?.overall_status === "fail"
          ? "red"
          : "gray";
  const cardBg = {
    green: "border-green-200 bg-green-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    red: "border-red-200 bg-red-50/50",
    gray: "border-border bg-card",
  }[overallColor];

  return (
    <div className={`mb-6 rounded-xl border p-5 ${cardBg}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Post-Patch Verification</h3>
          {hasResult && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                overallColor === "green"
                  ? "bg-green-200 text-green-800"
                  : overallColor === "amber"
                    ? "bg-amber-200 text-amber-800"
                    : "bg-red-200 text-red-800"
              }`}
            >
              {v.overall_status.toUpperCase()}
            </span>
          )}
        </div>
        <button
          onClick={onRun}
          disabled={verifying}
          className="cs-btn-primary text-sm"
        >
          {verifying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FlaskConical className="w-4 h-4" />
          )}
          <span className="ml-1">
            {verifying ? "Running…" : "Run Post-Patch Verification"}
          </span>
        </button>
      </div>

      {!hasResult && (
        <p className="text-sm text-foreground/50">
          No verification has been run yet. Click the button to create one safe
          eligible lead and one internal/test lead, then process both — proving
          the automation guard works correctly.
        </p>
      )}

      {hasResult && (
        <>
          <p className="text-xs text-foreground/50 mb-3">
            Last run: {formatDate(v.run_at)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Safe Eligible Lead */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <h4 className="text-sm font-bold text-foreground">
                  Safe Eligible Lead
                </h4>
              </div>
              <PassFailRow
                pass={v.safe_sms_pass}
                label="SMS sent (real Twilio SID)"
              />
              <PassFailRow
                pass={v.safe_email_pass}
                label="Email sent (real Resend ID)"
              />
              {(v.safe_sms_provider_id || v.safe_email_provider_id) && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                  {v.safe_sms_provider_id && (
                    <div className="text-xs text-foreground/60 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> SID:{" "}
                      <code className="font-mono text-[10px]">
                        {String(v.safe_sms_provider_id).slice(0, 22)}…
                      </code>
                    </div>
                  )}
                  {v.safe_email_provider_id && (
                    <div className="text-xs text-foreground/60 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> ID:{" "}
                      <code className="font-mono text-[10px]">
                        {String(v.safe_email_provider_id).slice(0, 22)}…
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Internal/Test Lead */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-foreground">
                  Internal/Test Lead (Must Skip)
                </h4>
              </div>
              <PassFailRow
                pass={v.internal_sms_skip_pass}
                label="SMS skipped (no send)"
              />
              <PassFailRow
                pass={v.internal_email_skip_pass}
                label="Email skipped (no send)"
              />
              <div className="mt-2 pt-2 border-t border-border/50">
                <PassFailRow
                  pass={!v.leaked_internal_send_detected}
                  label="No leaked sends detected"
                />
              </div>
            </div>
          </div>

          {/* CommunicationLog References */}
          {(v.safe_sms_log_id ||
            v.safe_email_log_id ||
            v.internal_sms_log_id ||
            v.internal_email_log_id) && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs font-semibold text-foreground/60 mb-2">
                CommunicationLog References:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {v.safe_sms_log_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-foreground/60">
                    Safe SMS:{" "}
                    <code className="font-mono text-[10px]">
                      {String(v.safe_sms_log_id).slice(0, 10)}…
                    </code>
                  </span>
                )}
                {v.safe_email_log_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-foreground/60">
                    Safe Email:{" "}
                    <code className="font-mono text-[10px]">
                      {String(v.safe_email_log_id).slice(0, 10)}…
                    </code>
                  </span>
                )}
                {v.internal_sms_log_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-foreground/60">
                    Internal SMS (skip):{" "}
                    <code className="font-mono text-[10px]">
                      {String(v.internal_sms_log_id).slice(0, 10)}…
                    </code>
                  </span>
                )}
                {v.internal_email_log_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-foreground/60">
                    Internal Email (skip):{" "}
                    <code className="font-mono text-[10px]">
                      {String(v.internal_email_log_id).slice(0, 10)}…
                    </code>
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
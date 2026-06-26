/**
 * Retry Failed Job Button — admin UI component for retrying failed jobs.
 * Fixes FLAW #41: No "Re-try Failed Job" button in UI.
 */
import { useState } from "react";
import { RotateCcw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function RetryFailedJobButton({ jobId, onRetried, size = "sm" }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  const handleRetry = async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await base44.functions.invoke("retriggerTaskJob", { job_id: jobId });
      if (res?.data?.success === false) {
        throw new Error(res?.data?.error || "Retry failed");
      }
      setStatus("success");
      onRetried?.(jobId);
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setError(err?.message || "Failed to retry job");
      setStatus("error");
    }
  };

  const sizeClass = size === "sm" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2";

  if (status === "loading") {
    return (
      <button disabled className={`inline-flex items-center gap-1.5 rounded-lg border border-border ${sizeClass} text-muted-foreground`}>
        <Loader2 className="w-3 h-3 animate-spin" /> Retrying...
      </button>
    );
  }

  if (status === "success") {
    return (
      <button disabled className={`inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 ${sizeClass} text-green-700`}>
        <CheckCircle2 className="w-3 h-3" /> Retried
      </button>
    );
  }

  if (status === "error") {
    return (
      <div className="inline-flex items-center gap-2">
        <button
          onClick={handleRetry}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 ${sizeClass} text-red-700 hover:bg-red-100 transition-colors`}
          title={error}
        >
          <AlertCircle className="w-3 h-3" /> Retry Failed
        </button>
        <span className="text-xs text-red-600 max-w-xs truncate" title={error}>{error}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleRetry}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border ${sizeClass} text-foreground hover:bg-muted hover:border-primary/30 transition-colors`}
    >
      <RotateCcw className="w-3 h-3" /> Retry
    </button>
  );
}
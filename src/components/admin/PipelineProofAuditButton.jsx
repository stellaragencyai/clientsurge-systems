import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PipelineProofAuditButton({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunAudit = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('runPipelineProofAudit', {});
      setResult({
        success: res.data?.success,
        message: res.data?.success
          ? `Audit complete. Created ${res.data.results.eventQueueCreated} queues, ${res.data.results.communicationEventCreated} events, ${res.data.results.deadLetterLogsCreated} dead letters.`
          : res.data?.error || 'Audit failed',
      });
      if (onComplete) onComplete();
    } catch (err) {
      setResult({ success: false, message: `Error: ${err.message}` });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleRunAudit}
        disabled={running}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ minHeight: 'unset', minWidth: 'unset' }}
      >
        {running ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Running Audit...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Run Pipeline Proof Audit
          </>
        )}
      </button>

      {result && (
        <div
          className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm ${
            result.success
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}
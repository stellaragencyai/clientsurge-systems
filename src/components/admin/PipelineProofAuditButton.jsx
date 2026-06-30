import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';
import AdminActionResult from './AdminActionResult';
import { errorToAdminActionResult, normalizeAdminActionResult } from '@/lib/adminActionResult';

export default function PipelineProofAuditButton({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunAudit = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('runPipelineProofAudit', {});
      const data = res.data || res;
      const createdQueues = Number(data?.results?.eventQueueCreated || 0);
      const createdEvents = Number(data?.results?.communicationEventCreated || 0);
      const createdDeadLetters = Number(data?.results?.deadLetterLogsCreated || 0);
      setResult(normalizeAdminActionResult({
        action: 'Pipeline Check',
        success: Boolean(data?.success),
        status: data?.success ? 'success' : 'error',
        message: data?.success
          ? 'Pipeline check completed and wrote verification records.'
          : data?.error || 'Pipeline check failed.',
        affected: createdQueues + createdEvents + createdDeadLetters,
        failed: data?.success ? 0 : 1,
        details: [
          `${createdQueues} queue record(s) created`,
          `${createdEvents} event record(s) created`,
          `${createdDeadLetters} dead-letter record(s) created`,
        ],
        retry: data?.success ? 'Open Launch Proof or Communication Logs to verify the newly written evidence.' : undefined,
        raw: data,
      }));
      if (onComplete) onComplete();
    } catch (err) {
      setResult(errorToAdminActionResult('Pipeline Check', err, 'Pipeline check failed.'));
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
        <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
        {running ? 'Running Check...' : 'Run Pipeline Check'}
      </button>

      <AdminActionResult result={result} onRetry={!running ? handleRunAudit : null} onDismiss={() => setResult(null)} />
    </div>
  );
}

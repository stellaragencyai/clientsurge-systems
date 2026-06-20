import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export default function AdminReconciliationButton({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('runAdminReconciliation', {});
      const d = res.data;
      setResult({
        success: d?.success,
        truthStatus: d?.truth_status,
        message: d?.success
          ? `Reconciliation complete. ${d.results.eventQueuesCreated} queues created, ${d.results.eventQueuesAlreadyExisted} existed. Truth: ${d.truth_status}.`
          : d?.error || 'Reconciliation failed.',
      });
      if (onComplete) onComplete();
    } catch (err) {
      setResult({ success: false, message: `Error: ${err.message}` });
    } finally {
      setRunning(false);
    }
  };

  const statusColor = result?.truthStatus === 'trusted'
    ? 'border-green-200 bg-green-50 text-green-800'
    : result?.truthStatus === 'warning'
      ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
      : result?.truthStatus === 'blocked'
        ? 'border-red-200 bg-red-50 text-red-800'
        : result?.success === false
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-green-200 bg-green-50 text-green-800';

  const StatusIcon = result?.truthStatus === 'trusted'
    ? CheckCircle2
    : result?.truthStatus === 'warning'
      ? AlertTriangle
      : AlertCircle;

  return (
    <div className="space-y-3">
      <button
        onClick={handleRun}
        disabled={running}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-opacity disabled:opacity-60"
        style={{ minHeight: 'unset', minWidth: 'unset' }}
      >
        <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
        {running ? 'Reconciling...' : 'Admin Reconciliation'}
      </button>

      {result && (
        <div className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm ${statusColor}`}>
          <StatusIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}
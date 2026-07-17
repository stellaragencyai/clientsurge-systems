import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import AdminActionResult from './AdminActionResult';
import DashboardTrustScorePanel from './DashboardTrustScorePanel';
import { errorToAdminActionResult, normalizeAdminActionResult } from '@/lib/adminActionResult';

export default function AdminReconciliationButton({ onComplete }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setLastAction(() => handleRun);
    setResult(null);
    try {
      const res = await base44.functions.invoke('runAdminReconciliation', {});
      const d = res.data || res;
      const created = Number(d?.results?.eventQueuesCreated || 0);
      const existed = Number(d?.results?.eventQueuesAlreadyExisted || 0);
      setResult(normalizeAdminActionResult({
        action: 'Admin Reconciliation',
        success: Boolean(d?.success),
        status: d?.success ? (d?.truth_status === 'warning' ? 'warning' : 'success') : 'error',
        message: d?.success
          ? `Reconciliation complete. Truth status: ${d.truth_status || 'unknown'}.`
          : d?.error || 'Reconciliation failed.',
        affected: created + existed,
        skipped: existed,
        failed: d?.success ? 0 : 1,
        details: [`${created} queue(s) created`, `${existed} queue(s) already existed`],
        retry: d?.success ? 'Review Launch Proof and Communication Logs for resulting evidence.' : undefined,
        raw: d,
      }));
      if (onComplete) onComplete();
    } catch (err) {
      setResult(errorToAdminActionResult('Admin Reconciliation', err, 'Reconciliation failed.'));
    } finally {
      setRunning(false);
    }
  };

  const handleTrackC = async () => {
    setRunning(true);
    setLastAction(() => handleTrackC);
    setResult(null);
    try {
      const res = await base44.functions.invoke('trackCLeadTruthCleanup', { dry_run: false });
      const d = res?.data || res;
      const updated = Number(d?.updated || 0);
      const alreadyDone = Number(d?.already_quarantined || 0);
      const failed = Number(d?.failed || 0);
      setResult(normalizeAdminActionResult({
        action: 'Track C Cleanup',
        success: Boolean(d?.success),
        status: d?.success && failed > 0 ? 'partial' : d?.success ? 'success' : 'error',
        message: d?.success ? 'Track C cleanup action completed.' : d?.error || 'Track C action failed.',
        affected: updated + alreadyDone + failed,
        skipped: alreadyDone,
        failed,
        details: [`${updated} record(s) updated`, `${alreadyDone} already handled`, `${failed} failed`],
        retry: d?.success && failed === 0 ? 'Open CRM Data Quality to verify updated counts.' : undefined,
        raw: d,
      }));
      if (onComplete) onComplete();
    } catch (err) {
      setResult(errorToAdminActionResult('Track C Cleanup', err, 'Track C action failed.'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-opacity disabled:opacity-60"
            style={{ minHeight: 'unset', minWidth: 'unset' }}
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Working...' : 'Admin Reconciliation'}
          </button>
          <button
            onClick={handleTrackC}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 font-semibold text-sm hover:bg-blue-100 transition-opacity disabled:opacity-60"
            style={{ minHeight: 'unset', minWidth: 'unset' }}
          >
            <ShieldCheck className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            Track C Cleanup
          </button>
        </div>

        <AdminActionResult result={result} onRetry={!running && lastAction ? lastAction : null} onDismiss={() => setResult(null)} />
      </div>

      <DashboardTrustScorePanel />
    </div>
  );
}

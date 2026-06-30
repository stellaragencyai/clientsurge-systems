import { AlertCircle, AlertTriangle, CheckCircle2, Info, RotateCcw } from 'lucide-react';
import { summarizeActionCounts } from '@/lib/adminActionResult';

const CONFIG = {
  success: { Icon: CheckCircle2, className: 'border-green-200 bg-green-50 text-green-800', label: 'Success' },
  partial: { Icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800', label: 'Partial Success' },
  warning: { Icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800', label: 'Warning' },
  error: { Icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-800', label: 'Failed' },
  info: { Icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-800', label: 'Info' },
};

export default function AdminActionResult({ result, onRetry, onDismiss }) {
  if (!result) return null;
  const config = CONFIG[result.status] || CONFIG.info;
  const Icon = config.Icon;
  const counts = summarizeActionCounts(result);

  return (
    <div className={`rounded-lg border p-3 text-sm ${config.className}`}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground/90">{result.action || config.label}</p>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{config.label}</span>
          </div>
          <p className="mt-1 leading-relaxed">{result.message}</p>
          {counts && <p className="mt-1 text-xs opacity-80">{counts}</p>}
          {result.details?.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-90">
              {result.details.slice(0, 6).map((detail, index) => <li key={`${detail}-${index}`}>{detail}</li>)}
            </ul>
          )}
          {result.retry && <p className="mt-2 text-xs font-medium opacity-90">Next step: {result.retry}</p>}
          {result.completed_at && <p className="mt-1 text-[10px] opacity-60">Completed: {new Date(result.completed_at).toLocaleString()}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {onRetry && (
            <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold hover:bg-white">
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="rounded-md bg-white/60 px-2 py-1 text-[11px] font-semibold hover:bg-white">Dismiss</button>
          )}
        </div>
      </div>
    </div>
  );
}

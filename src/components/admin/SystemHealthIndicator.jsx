import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Task 50 — Global System Health Indicator (Green/Yellow/Red)
 * Aggregates failed events, dead letters, open alerts into one status
 */
export default function SystemHealthIndicator({ compact = false }) {
  const [status, setStatus] = useState(null); // 'green' | 'yellow' | 'red'
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    computeHealth();
    const interval = setInterval(computeHealth, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const computeHealth = async () => {
    try {
      setLoading(true);
      const [failedEvents, deadLetters, alerts] = await Promise.all([
        base44.asServiceRole.entities.CommunicationEvent.filter({ status: 'failed' }, '-created_date', 50).catch(() => []),
        base44.asServiceRole.entities.DeadLetterLog.list('-created_date', 20).catch(() => []),
        base44.asServiceRole.entities.Alert.filter({ resolved: false }, '-created_date', 20).catch(() => []),
      ]);

      const r = [];
      let s = 'green';

      if (deadLetters.length > 0) {
        r.push(`${deadLetters.length} dead-letter event(s) require attention`);
        s = 'red';
      }
      if (failedEvents.length > 10) {
        r.push(`${failedEvents.length} failed communication events`);
        if (s !== 'red') s = 'yellow';
      }
      if (alerts.length > 5) {
        r.push(`${alerts.length} unresolved automation alerts`);
        if (s !== 'red') s = 'yellow';
      }

      setStatus(s);
      setReasons(r);
    } catch (e) {
      setStatus('yellow');
      setReasons(['Health check encountered an error']);
    } finally {
      setLoading(false);
    }
  };

  const config = {
    green: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'All Systems Operational' },
    yellow: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Degraded Performance' },
    red: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'System Issues Detected' },
  };

  const current = status ? config[status] : config.green;
  const Icon = current.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${current.bg} ${current.color}`}>
        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {loading ? 'Checking...' : current.label}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${current.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 font-semibold ${current.color}`}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
          System Health: {loading ? 'Checking...' : current.label}
        </div>
        <button onClick={computeHealth} className={`text-xs underline ${current.color}`} disabled={loading}>
          Refresh
        </button>
      </div>
      {reasons.length > 0 && (
        <ul className={`text-xs space-y-0.5 ${current.color}`}>
          {reasons.map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
      )}
    </div>
  );
}
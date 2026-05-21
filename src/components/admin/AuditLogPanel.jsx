import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Download, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';

const LIMIT = 200;

const formatDate = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatJsonBlock = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return JSON.stringify(value, null, 2);
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function buildAuditCsv(logs) {
  const rows = [
    ['timestamp', 'admin_email', 'action', 'entity_name', 'record_id', 'notes'],
    ...logs.map((log) => [
      log.timestamp || log.created_date || '',
      log.admin_email || '',
      log.action || '',
      log.entity_name || '',
      log.record_id || '',
      log.notes || '',
    ]),
  ];
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await base44.asServiceRole.entities.AuditLog.list('-timestamp', LIMIT);
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load audit log:', err);
      setError('Unable to load audit log records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return logs;

    return logs.filter((log) =>
      [
        log.admin_email,
        log.action,
        log.entity_name,
        log.record_id,
        log.notes,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [logs, query]);

  const exportCsv = () => {
    try {
      setExporting(true);
      const blob = new Blob([buildAuditCsv(filteredLogs)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Audit Log</h2>
          <p className="text-sm text-muted-foreground">Admin action records from the AuditLog entity.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={exporting || filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm transition hover:bg-muted disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export CSV
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search action, admin, entity, record, or notes"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
          Loading audit log...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8 text-center text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 opacity-30" />
          No audit records found
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          {filteredLogs.map((log) => {
            const expanded = expandedId === log.id;
            const before = formatJsonBlock(log.before);
            const after = formatJsonBlock(log.after);

            return (
              <div key={log.id || `${log.action}-${log.timestamp}`} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setExpandedId(expanded ? null : log.id)}
                  className="grid w-full gap-3 p-4 text-left transition hover:bg-muted md:grid-cols-[1.3fr,1fr,1fr,0.7fr]"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{log.action || 'unknown_action'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(log.timestamp || log.created_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</p>
                    <p className="truncate text-sm text-foreground">{log.admin_email || 'Unknown admin'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entity</p>
                    <p className="truncate text-sm text-foreground">
                      {log.entity_name || 'Unknown'}{log.record_id ? ` / ${log.record_id}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-xs font-semibold text-primary">
                    {expanded ? 'Hide' : 'Details'}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-border bg-background/50 p-4">
                    {log.notes && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-semibold text-foreground">Notes</p>
                        <p className="rounded border border-border bg-white p-2 text-sm text-foreground">{log.notes}</p>
                      </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold text-foreground">Before</p>
                        <pre className="max-h-72 overflow-auto rounded border border-border bg-white p-3 text-xs text-foreground">
                          {before || 'No previous state recorded'}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-foreground">After</p>
                        <pre className="max-h-72 overflow-auto rounded border border-border bg-white p-3 text-xs text-foreground">
                          {after || 'No new state recorded'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

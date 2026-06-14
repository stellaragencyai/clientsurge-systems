import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';

export default function MissionControlLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const auditLogs = await base44.entities.AuditLog.list('-created_date', 200);
        const events = await base44.entities.CommunicationEvent.list('-created_date', 200);

        const combined = [
          ...(auditLogs || []).map(log => ({
            id: log.id,
            timestamp: log.timestamp || log.created_date,
            type: 'audit',
            action: log.action,
            entity: log.entity_name,
            recordId: log.record_id,
            admin: log.admin_email,
            notes: log.notes,
          })),
          ...(events || []).map(event => ({
            id: event.id,
            timestamp: event.created_date,
            type: 'event',
            action: event.event_type,
            channel: event.channel,
            status: event.status,
            leadId: event.lead_id,
            provider: event.provider,
          })),
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setLogs(combined);
      } catch (error) {
        console.error('Error loading logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const getIcon = (type, status) => {
    if (type === 'event') {
      return status === 'failed' ? (
        <AlertCircle className="w-4 h-4 text-red-500" />
      ) : (
        <CheckCircle className="w-4 h-4 text-green-500" />
      );
    }
    return <Zap className="w-4 h-4 text-blue-500" />;
  };

  const filteredLogs =
    filter === 'all' ? logs : logs.filter(log => log.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground mt-1">
            Recent system activity and audit trail
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('audit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'audit'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Audit
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'event'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Events
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No logs found</p>
        </div>
      ) : (
        <div className="space-y-2 border border-border rounded-lg overflow-hidden">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <div className="mt-1">
                {getIcon(log.type, log.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">
                      {log.type === 'audit'
                        ? `${log.action} (${log.entity})`
                        : `${log.action} (${log.channel})`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.type === 'audit'
                        ? `Admin: ${log.admin || 'Unknown'} • Record: ${log.recordId || 'N/A'}`
                        : `Lead: ${log.leadId || 'Unknown'} • Status: ${log.status}`}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                {log.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {log.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
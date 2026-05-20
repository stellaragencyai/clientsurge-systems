import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Check, Loader2, Send } from 'lucide-react';
import {
  COMMUNICATION_LOG_PAGE_SIZE,
  getCommunicationLogFetchLimit,
  getCommunicationLogOffset,
  getCommunicationLogPage,
} from '@/lib/communicationLogPagination';

export default function CommunicationLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [reassignModal, setReassignModal] = useState(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    loadLogs(page);
  }, [filter, page]);

  const loadLogs = async (nextPage = page) => {
    try {
      setLoading(true);
      let query = {};

      if (filter === 'failed') {
        query = { status: 'failed' };
      } else if (filter === 'unmatched') {
        query = { context_type: 'inbound_sms_unmatched' };
      }

      const fetchLimit = getCommunicationLogFetchLimit({ page: nextPage });
      const data = await base44.asServiceRole.entities.CommunicationEvent.filter(
        query,
        '-created_date',
        fetchLimit
      );
      const pageLogs = getCommunicationLogPage(data, { page: nextPage });
      setLogs(pageLogs);
      setHasNextPage((data || []).length > getCommunicationLogOffset({ page: nextPage }) + COMMUNICATION_LOG_PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      failed: 'bg-red-100 text-red-800 border-red-300',
      received: 'bg-green-100 text-green-800 border-green-300',
      unmatched: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      skipped: 'bg-gray-100 text-gray-800 border-gray-300',
      sent: 'bg-blue-100 text-blue-800 border-blue-300',
      pending: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEventIcon = (eventType) => {
    if (eventType.includes('failed')) return <AlertCircle className="w-4 h-4" />;
    if (eventType.includes('received')) return <Check className="w-4 h-4" />;
    return <Send className="w-4 h-4" />;
  };

  const parseMetadata = (json) => {
    if (!json) return {};
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Communication Logs</h2>
        <button
          onClick={() => loadLogs(page)}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'failed', 'unmatched', 'received'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-border text-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? 'All Events' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No events found
        </div>
      ) : (
        <div className="space-y-2 bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`border-b border-border last:border-b-0 transition ${
                log.status === 'failed' || log.context_type === 'inbound_sms_unmatched'
                  ? 'bg-red-50 hover:bg-red-100'
                  : 'bg-white hover:bg-muted'
              }`}
            >
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full p-4 text-left flex items-start justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-muted-foreground">
                      {getEventIcon(log.event_type)}
                    </div>
                    <p className="font-semibold text-foreground text-sm">{log.subject}</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadgeColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.channel} • {log.event_type}
                    {log.provider && ` • ${log.provider}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.created_date).toLocaleString()}
                  </p>
                </div>
                <div className="text-muted-foreground text-xs">
                  {expandedId === log.id ? '▼' : '▶'}
                </div>
              </button>

              {expandedId === log.id && (
                <div className="px-4 pb-4 border-t border-border/50 bg-background/50">
                  <div className="space-y-3">
                    {log.message_body && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Message</p>
                        <p className="text-sm text-foreground bg-white p-2 rounded border border-border">
                          {log.message_body}
                        </p>
                      </div>
                    )}

                    {log.error_message && (
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1">Error</p>
                        <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                          {log.error_message}
                        </p>
                      </div>
                    )}

                    {log.provider_message_id && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Provider ID</p>
                        <p className="text-xs text-muted-foreground font-mono bg-white p-2 rounded border border-border">
                          {log.provider_message_id}
                        </p>
                      </div>
                    )}

                    {log.context_id && log.context_type === 'website_lead' && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Linked Lead</p>
                        <p className="text-xs text-muted-foreground font-mono">{log.context_id}</p>
                      </div>
                    )}

                    {log.context_type === 'inbound_sms_unmatched' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs font-semibold text-yellow-800 mb-2">⚠️ Unmatched Inbound</p>
                        <p className="text-xs text-yellow-700 mb-3">
                          This SMS did not match any active WebsiteLead. Manually assign it below.
                        </p>
                        <button
                          onClick={() => setReassignModal(log)}
                          className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition"
                        >
                          Assign to Lead
                        </button>
                      </div>
                    )}

                    {log.metadata_json && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Metadata</p>
                        <pre className="text-xs bg-white p-2 rounded border border-border overflow-auto max-h-48">
                          {JSON.stringify(parseMetadata(log.metadata_json), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page + 1}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || loading}
            className="px-3 py-1.5 border border-border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage || loading}
            className="px-3 py-1.5 border border-border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition"
          >
            Next
          </button>
        </div>
      </div>

      {reassignModal && (
        <ReassignModal
          log={reassignModal}
          onClose={() => setReassignModal(null)}
          onSuccess={() => {
            setReassignModal(null);
            loadLogs();
          }}
        />
      )}
    </div>
  );
}

function ReassignModal({ log, onClose, onSuccess }) {
  const [leadId, setLeadId] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await base44.asServiceRole.entities.WebsiteLead.filter(
        { lead_status: { $in: ['new', 'contacted'] } },
        '-created_date',
        50
      );
      setLeads(data || []);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!leadId) return;

    try {
      setAssigning(true);
      const metadata = log.metadata_json ? JSON.parse(log.metadata_json) : {};

      await base44.asServiceRole.entities.CommunicationEvent.create({
        context_type: 'website_lead',
        context_id: leadId,
        channel: log.channel,
        direction: log.direction,
        event_type: 'sms_received',
        provider: log.provider,
        status: 'received',
        subject: `[MANUAL] ${log.subject}`,
        message_body: log.message_body,
        provider_message_id: log.provider_message_id,
        metadata_json: JSON.stringify({
          ...metadata,
          manually_assigned: true,
          original_log_id: log.id,
        }),
      });

      await base44.asServiceRole.entities.WebsiteLead.update(leadId, {
        reply_status: 'responded',
        lead_status: 'responded',
        automation_enabled: false,
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to assign:', error);
      alert('Failed to assign: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  const metadata = log.metadata_json ? JSON.parse(log.metadata_json) : {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Assign Unmatched SMS to Lead</h3>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-xs text-blue-700">
            <strong>From:</strong> {metadata.from || 'Unknown'}<br />
            <strong>Message:</strong> {log.message_body?.substring(0, 80)}...
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-4">Loading leads...</p>
        ) : (
          <div className="space-y-3 mb-6">
            <label className="text-sm font-semibold text-foreground">Select Lead</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-white text-foreground text-sm"
            >
              <option value="">-- Choose a lead --</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.full_name} ({lead.phone_number}) - {lead.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 border border-border rounded text-sm font-medium text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!leadId || assigning}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'Assigning...' : 'Assign & Mark Responded'}
          </button>
        </div>
      </div>
    </div>
  );
}

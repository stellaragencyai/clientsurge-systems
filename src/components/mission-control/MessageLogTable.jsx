import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Download, Search } from 'lucide-react';
import { useRealTimePolling } from '@/hooks/useRealTimePolling';
import { deltaFetchHelpers } from './DeltaFetchHelper';

export default function MessageLogTable({ filters, refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now());

  // Real-time delta fetch
  const fetchDeltaEvents = async (lastTimestamp) => {
    try {
      const newEvents = await deltaFetchHelpers.fetchNewCommunicationEvents(lastTimestamp);
      if (newEvents.length > 0) {
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(e => e.id));
          const filtered = newEvents.filter(e => !existingIds.has(e.id));
          return [...filtered, ...prevEvents].slice(0, 100);
        });
        setLastUpdatedTime(Date.now());
      }
      return newEvents;
    } catch (error) {
      console.error('Error fetching delta events:', error);
      throw error;
    }
  };

  // Real-time polling
  useRealTimePolling(fetchDeltaEvents, 3000, null, null, true);

  // Initial load
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.CommunicationEvent.list('-created_date', 100);
        let filtered = data || [];

        if (filters.phoneNumber) {
          filtered = filtered.filter(e =>
            e.lead_id?.includes(filters.phoneNumber) || false
          );
        }

        setEvents(filtered);
        setLastUpdatedTime(Date.now());
      } catch (error) {
        console.error('Error loading message log:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [filters, refreshKey]);

  const applyFilters = () => {
    let filtered = [...events];

    if (filters.phoneNumber) {
      filtered = filtered.filter(e =>
        e.lead_id?.includes(filters.phoneNumber) || false
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.message_body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false
      );
    }

    return filtered;
  };

  const exportCSV = () => {
    const filtered = applyFilters();
    const headers = ['timestamp', 'lead_id', 'channel', 'direction', 'status', 'message'];
    const rows = filtered.map(e => [
      new Date(e.created_date).toISOString(),
      e.lead_id,
      e.channel,
      e.direction,
      e.status,
      `"${(e.message_body || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-log-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  const filtered = applyFilters();
  const statusColors = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} message{filtered.length !== 1 ? 's' : ''} • Updated {Math.round((Date.now() - lastUpdatedTime) / 1000)}s ago
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">No messages found</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Lead ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Channel</th>
                  <th className="px-4 py-3 text-left font-semibold">Direction</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.created_date), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{event.lead_id}</td>
                    <td className="px-4 py-3 capitalize">{event.channel}</td>
                    <td className="px-4 py-3 capitalize text-xs">
                      <span className={event.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'}>
                        {event.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColors[event.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate">
                      {event.message_body || event.subject || '(no content)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
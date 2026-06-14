import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Download, Search } from 'lucide-react';

export default function MessageLogTable({ filters, refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

        if (searchTerm) {
          filtered = filtered.filter(e =>
            e.message_body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            false
          );
        }

        setEvents(filtered);
      } catch (error) {
        console.error('Error loading message log:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [filters, refreshKey, searchTerm]);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Lead ID', 'Channel', 'Direction', 'Status', 'Message'],
      ...events.map(e => [
        e.created_date || '',
        e.lead_id || '',
        e.channel || '',
        e.direction || '',
        e.status || '',
        `"${(e.message_body || e.subject || '').replace(/"/g, '""')}"`,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="h-40 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                <th className="text-left px-4 py-3 font-semibold">Lead ID</th>
                <th className="text-left px-4 py-3 font-semibold">Channel</th>
                <th className="text-left px-4 py-3 font-semibold">Direction</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No messages found
                  </td>
                </tr>
              ) : (
                events.map(event => (
                  <tr
                    key={event.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {event.created_date
                        ? formatDistanceToNow(new Date(event.created_date), {
                          addSuffix: true,
                        })
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-xs">
                      {event.lead_id || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs uppercase font-semibold">
                        {event.channel || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold uppercase ${
                        event.direction === 'outbound'
                          ? 'text-blue-600'
                          : 'text-green-600'
                      }`}>
                        {event.direction || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate">
                      {event.message_body || event.subject || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
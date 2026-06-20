import { useState, useEffect } from 'react';
import { User, Clock, CheckCircle, Phone, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString();
}

const STATUS_CONFIG = {
  Booked: { label: 'Booked', bg: 'bg-green-100', text: 'text-green-700', Icon: CheckCircle },
  Qualified: { label: 'Qualified', bg: 'bg-blue-100', text: 'text-blue-700', Icon: CheckCircle },
  Contacted: { label: 'Contacted', bg: 'bg-purple-100', text: 'text-purple-700', Icon: Phone },
  Replied: { label: 'Replied', bg: 'bg-indigo-100', text: 'text-indigo-700', Icon: Mail },
  New: { label: 'New', bg: 'bg-gray-100', text: 'text-gray-600', Icon: User },
};

export default function SaasLeadFeed({ clientId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      const data = await base44.entities.Leads.filter(
        { client_id: clientId },
        '-last_activity_at',
        50
      ).catch(() => []);
      setLeads(data || []);
      setLoading(false);
    };
    load();
  }, [clientId]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'booked', label: 'Booked' },
  ];

  const filtered = leads.filter(l => {
    if (filter === 'all') return true;
    if (filter === 'booked') return l.status === 'Booked';
    if (filter === 'new') return l.status === 'New';
    if (filter === 'contacted') return ['Contacted', 'Replied', 'Qualified'].includes(l.status);
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-900">Lead Activity</h2>
        <div className="flex gap-1">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-50 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No leads yet</div>
        ) : (
          filtered.map(lead => {
            const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.New;
            const Icon = sc.Icon;
            return (
              <div key={lead.id} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400 truncate">{lead.business_name || lead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                    <Icon className="w-3 h-3" />{sc.label}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatTime(lead.last_activity_at || lead.created_date)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {leads.length >= 50 && (
        <p className="text-xs text-gray-400 text-center">Showing latest 50 leads</p>
      )}
    </div>
  );
}
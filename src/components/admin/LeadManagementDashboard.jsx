import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Trash2, Edit2 } from 'lucide-react';

const intakeTypeLabels = {
  lead_capture: 'Lead Capture',
  contact_inquiry: 'Contact Inquiry',
  demo_booking: 'Demo Booking',
};

const sourceLabels = {
  website: 'Website',
};

export default function LeadManagementDashboard() {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, search, statusFilter, scoreFilter]);

  const fetchLeads = async () => {
    try {
      const data = await base44.entities.Leads.list('-created_date', 100);
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = leads;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.full_name?.toLowerCase().includes(q) || 
        l.email?.toLowerCase().includes(q) ||
        l.phone?.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(l => l.status === statusFilter);
    }

    if (scoreFilter !== 'all') {
      const score = parseInt(scoreFilter);
      if (scoreFilter === 'high') result = result.filter(l => l.lead_score >= 75);
      if (scoreFilter === 'medium') result = result.filter(l => l.lead_score >= 50 && l.lead_score < 75);
      if (scoreFilter === 'low') result = result.filter(l => l.lead_score < 50);
    }

    setFiltered(result);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-purple-100 text-purple-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Booked': 'bg-emerald-100 text-emerald-800',
      'Closed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatIntakeType = (value) => intakeTypeLabels[value] || value || 'Unknown';
  const formatSource = (value) => sourceLabels[value] || value || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Lead Management</h2>
        <p className="text-sm text-muted-foreground mt-1">View and manage all leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={leads.length} />
        <StatCard label="New" value={leads.filter(l => l.status === 'New').length} color="blue" />
        <StatCard label="Qualified" value={leads.filter(l => l.status === 'Qualified').length} color="green" />
        <StatCard label="Booked" value={leads.filter(l => l.status === 'Booked').length} color="emerald" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Booked">Booked</option>
          </select>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Scores</option>
            <option value="high">High (75+)</option>
            <option value="medium">Medium (50-74)</option>
            <option value="low">Low (&lt;50)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Contact</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Intake</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Score</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Created</th>
                <th className="px-6 py-3 text-center font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">No leads found</td></tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{lead.full_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{lead.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-foreground">{formatIntakeType(lead.intake_type)}</p>
                        <p className="text-xs text-muted-foreground">{formatSource(lead.source)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(lead.lead_score)}`}>
                        {lead.lead_score || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(lead.created_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-muted-foreground">
        Showing {filtered.length} of {leads.length} leads
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'default' }) {
  const colors = {
    default: 'bg-blue-50 text-blue-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className={`rounded-xl border border-border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

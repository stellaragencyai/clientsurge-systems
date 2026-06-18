import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronDown, Search, Filter } from 'lucide-react';

// Badge component
function LeadBadge({ type }) {
  const badges = {
    HOT: { bg: 'bg-red-100', text: 'text-red-700', label: 'HOT' },
    WARM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'WARM' },
    COLD: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'COLD' },
    BOOKED: { bg: 'bg-green-100', text: 'text-green-700', label: 'BOOKED' },
    IMPORTED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'IMPORTED' },
    NEEDS_VERIFICATION: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'VERIFY' },
    DUPLICATE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'DUPLICATE' },
    NO_CONTACT: { bg: 'bg-red-100', text: 'text-red-700', label: 'DO NOT CONTACT' },
    QA_TEST: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'QA/TEST' },
  };
  const badge = badges[type] || badges.COLD;
  return <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}>{badge.label}</span>;
}

// Risk flag indicator
function RiskFlag({ flag }) {
  const risks = {
    consent_missing: '⚠️ No Consent',
    email_bounced: '❌ Email Bounced',
    email_unsubscribed: '❌ Unsubscribed',
    do_not_contact: '🚫 DNC',
    missing_phone: '📱 No Phone',
    missing_email: '📧 No Email',
    missing_website: '🌐 No Website',
    duplicate: '⚠️ Duplicate',
    qa_test: '🧪 QA/Test',
  };
  return <span className="text-xs text-gray-600">{risks[flag] || flag}</span>;
}

// Summary cards
function SummaryCards({ stats }) {
  const cards = [
    { label: 'Total Leads', value: stats.total, bg: 'bg-blue-50', border: 'border-blue-200', val: 'text-blue-700' },
    { label: 'Hot Leads',   value: stats.hot,   bg: 'bg-red-50',  border: 'border-red-200',  val: 'text-red-700' },
    { label: 'Booked',      value: stats.booked, bg: 'bg-green-50', border: 'border-green-200', val: 'text-green-700' },
    { label: 'QA / Test',   value: stats.qaTest, bg: 'bg-slate-50', border: 'border-slate-200', val: 'text-slate-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-5 ${card.bg} ${card.border}`}>
          <p className="text-xs font-semibold text-gray-500 mb-2">{card.label}</p>
          <p className={`text-3xl font-bold ${card.val}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// Filter tabs
function FilterTabs({ activeFilter, onFilterChange }) {
  const filters = [
    'All Leads',
    'Hot Leads',
    'Booked',
    'Needs Review',
    'QA / Test',
  ];

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === filter
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

// Get badge for lead
function getLeadBadge(lead) {
  if (lead.do_not_contact) return 'NO_CONTACT';
  if (lead.dedupe_status === 'merged_duplicate') return 'DUPLICATE';
  if (isQATestProof(lead)) return 'QA_TEST';
  if (lead.import_source) return 'IMPORTED';
  if (lead.crm_stage === 'booked') return 'BOOKED';
  if (lead.lead_score >= 70) return 'HOT';
  if (lead.lead_score >= 45) return 'WARM';
  return 'COLD';
}

// Detect QA/Test/Proof records
function isQATestProof(lead) {
  const testKeywords = ['qa', 'smoke', 'proof', 'runtime', 'test', 'clientsurge', 'codex', 'ignore'];
  const fields = [lead.business_name, lead.problem, lead.notes, lead.description, lead.email].filter(Boolean);
  return fields.some(field => testKeywords.some(kw => field?.toLowerCase?.()?.includes(kw)));
}

// Get risk flags for lead
function getRiskFlags(lead) {
  const risks = [];
  if (!lead.consent_given) risks.push('consent_missing');
  if (lead.email_bounced) risks.push('email_bounced');
  if (lead.email_unsubscribed) risks.push('email_unsubscribed');
  if (lead.do_not_contact) risks.push('do_not_contact');
  if (!lead.phone) risks.push('missing_phone');
  if (!lead.email) risks.push('missing_email');
  if (!lead.website) risks.push('missing_website');
  if (lead.dedupe_status === 'merged_duplicate' || lead.dedupe_duplicate_of) risks.push('duplicate');
  if (isQATestProof(lead)) risks.push('qa_test');
  return risks;
}

// Main component
export default function LeadIntelligenceTable() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Leads');
  const [sortBy, setSortBy] = useState('lead_score');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const subRef = useRef(null);
  const pageSize = 50;

  // Load leads
  useEffect(() => {
    const loadLeads = async () => {
      try {
        const data = await base44.entities.Leads.list('-created_date', 5000);
        setLeads(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load leads:', err);
        setLoading(false);
      }
    };

    loadLeads();

    // Subscribe to real-time updates
    try {
      subRef.current = base44.entities.Leads.subscribe((event) => {
        if (event.type === 'create') setLeads(p => [event.data, ...p]);
        else if (event.type === 'update') setLeads(p => p.map(l => l.id === event.data.id ? event.data : l));
        else if (event.type === 'delete') setLeads(p => p.filter(l => l.id !== event.data.id));
      });
    } catch (e) {
      console.log('Real-time subscribe not available, using polling fallback');
    }

    return () => {
      if (subRef.current?.unsubscribe) subRef.current.unsubscribe();
    };
  }, []);

  // Filter and sort
  useEffect(() => {
    let filtered = leads;

    // Apply filter
    if (activeFilter === 'Hot Leads') {
      filtered = filtered.filter(l => l.lead_score >= 70 && !l.do_not_contact && !isQATestProof(l));
    } else if (activeFilter === 'Booked') {
      filtered = filtered.filter(l => l.crm_stage === 'booked' || l.booked_at);
    } else if (activeFilter === 'Needs Review') {
      filtered = filtered.filter(l => !l.email || !l.phone || l.dedupe_status === 'merged_duplicate' || l.dedupe_duplicate_of || l.do_not_contact);
    } else if (activeFilter === 'QA / Test') {
      filtered = filtered.filter(l => isQATestProof(l));
    } else {
      // All Leads: exclude QA/test by default
      filtered = filtered.filter(l => !isQATestProof(l));
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        (l.business_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.website || '').toLowerCase().includes(q) ||
        (l.problem || '').toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'lead_score') {
        aVal = Number(a.lead_score) || 0;
        bVal = Number(b.lead_score) || 0;
      }

      return sortDir === 'desc'
        ? (bVal > aVal ? 1 : -1)
        : (aVal > bVal ? 1 : -1);
    });

    setFilteredLeads(filtered);
    setPage(1);
  }, [leads, activeFilter, search, sortBy, sortDir]);

  // Calculate stats
  const stats = {
    total: leads.filter(l => !isQATestProof(l)).length,
    hot: leads.filter(l => l.lead_score >= 70 && !l.do_not_contact && !isQATestProof(l)).length,
    booked: leads.filter(l => l.crm_stage === 'booked' && !isQATestProof(l)).length,
    imported: leads.filter(l => l.import_source && !isQATestProof(l)).length,
    needsVerification: leads.filter(l => (!l.email || !l.phone || !l.website) && !isQATestProof(l)).length,
    duplicates: leads.filter(l => (l.dedupe_status === 'merged_duplicate' || l.dedupe_duplicate_of) && !isQATestProof(l)).length,
    qaTest: leads.filter(l => isQATestProof(l)).length,
    dnc: leads.filter(l => l.do_not_contact && !isQATestProof(l)).length,
  };

  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredLeads.length / pageSize);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full"></div>
        <p className="mt-4">Loading Lead Intelligence Table...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="font-semibold text-amber-900">Lead Intelligence Table</p>
          <p className="text-sm text-amber-800">For review and prioritization only. No external actions run from this view.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards stats={stats} />

      {/* Filter Tabs */}
      <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Search & Sort Controls */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by business name, email, phone, website..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="lead_score">Sort by Score</option>
          <option value="created_date">Sort by Date</option>
          <option value="business_name">Sort by Business</option>
        </select>
        <button
          onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          {sortDir === 'desc' ? '↓ High to Low' : '↑ Low to High'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">Business / Contact</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Industry</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Score</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Source</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Risk Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No leads found for this filter.
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">{lead.business_name}</p>
                      <p className="text-xs text-gray-600">{lead.full_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lead.industry || lead.business_type || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      lead.lead_score >= 70 ? 'bg-red-100 text-red-700' :
                      lead.lead_score >= 45 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.lead_score || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <LeadBadge type={getLeadBadge(lead)} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{lead.source || '—'}</td>
                  <td className="px-4 py-3">
                    {getRiskFlags(lead).length > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                        {getRiskFlags(lead).length} flag{getRiskFlags(lead).length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {paginatedLeads.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLeads.length)} of {filteredLeads.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg overflow-y-auto p-6 space-y-4">
          <button
            onClick={() => setSelectedLead(null)}
            className="text-sm text-gray-500 hover:text-gray-700 float-right"
          >
            ✕ Close
          </button>
          <h3 className="text-lg font-bold text-gray-900">{selectedLead.business_name}</h3>
          <button
            onClick={() => {
              navigate(`/admin/leads/${selectedLead.id}`);
              setSelectedLead(null);
            }}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
          >
            Open Full Detail →
          </button>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900">Contact</p>
              <p className="text-gray-600">{selectedLead.full_name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p className="text-gray-600">{selectedLead.email || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Phone</p>
              <p className="text-gray-600">{selectedLead.phone || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Website</p>
              <p className="text-gray-600">{selectedLead.website || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Problem / Hook</p>
              <p className="text-gray-600">{selectedLead.problem || selectedLead.enrichment_notes || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Lead Score</p>
              <p className="text-gray-600">{selectedLead.lead_score || 0}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">CRM Stage</p>
              <p className="text-gray-600">{selectedLead.crm_stage || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Risk Flags</p>
              <div className="space-y-1 mt-1">
                {getRiskFlags(selectedLead).map((flag) => (
                  <div key={flag}><RiskFlag flag={flag} /></div>
                ))}
                {getRiskFlags(selectedLead).length === 0 && <p className="text-gray-400">None</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
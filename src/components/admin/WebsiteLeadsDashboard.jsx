import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, MessageSquare, CheckCircle2, Clock, AlertCircle, Loader2, Archive, Trash2, Shield } from 'lucide-react';
import {
  WEBSITE_LEAD_SORT_OPTIONS,
  buildWebsiteLeadQuery,
  getWebsiteLeadFetchLimit,
  getWebsiteLeadPage,
  hasNextWebsiteLeadPage,
  normalizeWebsiteLeadPage,
} from '@/lib/websiteLeadsDashboard';
import {
  getWebsiteLeadCleanupEligibility,
  isWebsiteLeadVisibleInSalesViews,
} from '@/lib/leadCleanupGuards';

export default function WebsiteLeadsDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('-created_date');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [logs, setLogs] = useState([]);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    loadLeads(1);
  }, [filter, sort, includeHidden]);

  const loadLeads = async (nextPage = page) => {
    try {
      setLoading(true);
      const safePage = normalizeWebsiteLeadPage(nextPage);
      let data;
      try {
        data = await base44.asServiceRole.entities.WebsiteLead.filter(
          buildWebsiteLeadQuery(filter, { includeHidden }),
          sort,
          getWebsiteLeadFetchLimit(safePage, undefined, includeHidden ? 1 : 4)
        );
      } catch (error) {
        // Some Base44 SDK contexts may not support $ne; retry raw and filter client-side.
        data = await base44.asServiceRole.entities.WebsiteLead.filter(
          buildWebsiteLeadQuery(filter, { includeHidden: true }),
          sort,
          getWebsiteLeadFetchLimit(safePage, undefined, includeHidden ? 1 : 4)
        );
      }

      let nextLeads = data || [];
      if (!includeHidden) {
        nextLeads = nextLeads.filter(isWebsiteLeadVisibleInSalesViews);
      }
      setLeads(getWebsiteLeadPage(nextLeads, safePage));
      setHasNextPage(hasNextWebsiteLeadPage(nextLeads, safePage));
      setPage(safePage);
    } catch (error) {
      console.error('Failed to load website leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (leadId) => {
    try {
      const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { context_id: leadId, context_type: 'website_lead' },
        '-created_date',
        50
      );
      setLogs(events || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setCleanupMessage('');
    loadLogs(lead.id);
  };

  const updateLeadStatus = async (leadId, field, value) => {
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(leadId, {
        [field]: value,
      });
      loadLeads(page);
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, [field]: value });
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const runImmediateResponse = async (leadId) => {
    const lead = selectedLead?.id === leadId ? selectedLead : leads.find((item) => item.id === leadId);
    if (lead && !isWebsiteLeadVisibleInSalesViews(lead)) {
      alert('Blocked: this looks like an internal/test/hidden website lead. Unhide and verify it before sending automation.');
      return;
    }
    try {
      await base44.functions.invoke('sendWebsiteLeadResponse', { lead_id: leadId });
      loadLogs(leadId);
      alert('Immediate response sent!');
    } catch (error) {
      console.error('Failed to send response:', error);
      alert('Failed to send response');
    }
  };

  const archiveWebsiteLead = async (lead) => {
    if (!lead?.id) return;
    setCleanupLoading(true);
    try {
      await base44.asServiceRole.entities.WebsiteLead.update(lead.id, {
        archived: true,
        archived_at: new Date().toISOString(),
        lead_status: 'ignored',
        cadence_paused: true,
        cadence_paused_at: new Date().toISOString(),
        automation_enabled: false,
      });
      setCleanupMessage('Archived and removed from normal Website Leads view.');
      setSelectedLead({ ...lead, archived: true, lead_status: 'ignored', cadence_paused: true, automation_enabled: false });
      await loadLeads(page);
    } catch (error) {
      setCleanupMessage(error?.message || 'Failed to archive website lead.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const deleteVerifiedWebsiteJunk = async (lead) => {
    if (!lead?.id) return;
    const eligibility = getWebsiteLeadCleanupEligibility(lead);
    if (!eligibility.eligible) {
      setCleanupMessage(`Delete blocked: ${eligibility.blockers.join('; ') || 'not verified junk'}`);
      return;
    }
    const phrase = window.prompt(
      `This WebsiteLead passed verified-junk guardrails.\n\nLead: ${lead.business_name || lead.full_name || lead.email || lead.id}\nReason: ${(eligibility.signals || []).slice(0, 3).join('; ')}\n\nType DELETE JUNK to permanently delete it.`
    );
    if (phrase !== 'DELETE JUNK') return;

    setCleanupLoading(true);
    try {
      await base44.asServiceRole.entities.WebsiteLead.delete(lead.id);
      setCleanupMessage('Deleted verified junk WebsiteLead.');
      setSelectedLead(null);
      setLogs([]);
      await loadLeads(page);
    } catch (error) {
      setCleanupMessage(error?.message || 'Failed to delete verified junk WebsiteLead.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-50 border-blue-200',
      contacted: 'bg-yellow-50 border-yellow-200',
      responded: 'bg-green-50 border-green-200',
      hot: 'bg-red-50 border-red-200',
      booked: 'bg-purple-50 border-purple-200',
      closed: 'bg-gray-50 border-gray-200',
      ignored: 'bg-gray-50 border-gray-200',
    };
    return colors[status] || 'bg-white border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      new: <Clock className="w-4 h-4 text-blue-600" />,
      contacted: <MessageSquare className="w-4 h-4 text-yellow-600" />,
      responded: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      hot: <AlertCircle className="w-4 h-4 text-red-600" />,
      booked: <CheckCircle2 className="w-4 h-4 text-purple-600" />,
      closed: <CheckCircle2 className="w-4 h-4 text-gray-600" />,
      ignored: <AlertCircle className="w-4 h-4 text-gray-600" />,
    };
    return icons[status];
  };

  const selectedEligibility = selectedLead ? getWebsiteLeadCleanupEligibility(selectedLead) : null;
  const selectedHidden = selectedLead ? !isWebsiteLeadVisibleInSalesViews(selectedLead) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Website Leads</h2>
          <p className="mt-1 text-xs text-muted-foreground">Trusted view hides archived, smoke, install, QA, 555, and .internal test leads by default.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {['all', 'new', 'contacted', 'responded', 'booked', 'closed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-border text-foreground hover:bg-muted'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded border border-border bg-background px-3 py-1 text-sm font-medium text-foreground"
            >
              {WEBSITE_LEAD_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={includeHidden}
              onChange={(event) => setIncludeHidden(event.target.checked)}
              className="rounded"
            />
            Show hidden/test
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex items-start gap-3">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Website lead cleanup is guarded.</p>
          <p className="text-xs mt-1">Normal view hides known fake/test WebsiteLead records. Archive pauses automation. Delete requires strict eligibility plus DELETE JUNK confirmation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : leads.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No trusted website leads found</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {leads.map((lead) => {
                  const hidden = !isWebsiteLeadVisibleInSalesViews(lead);
                  return (
                    <button
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className={`w-full p-4 border-b border-border text-left transition hover:bg-muted ${
                        selectedLead?.id === lead.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      } ${hidden ? 'opacity-80' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{lead.full_name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                          {lead.phone_number && (
                            <p className="text-xs text-muted-foreground">{lead.phone_number}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {getStatusIcon(lead.lead_status)}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(lead.lead_status)}`}>
                          {lead.lead_status}
                        </span>
                        {hidden && (
                          <span className="text-xs px-2 py-1 rounded-full border border-red-200 bg-red-50 text-red-700">
                            Hidden/Test
                          </span>
                        )}
                        {lead.archived && (
                          <span className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                            Archived
                          </span>
                        )}
                        {lead.reply_status === 'responded' && (
                          <span className="text-xs px-2 py-1 rounded-full border border-green-200 bg-green-50">
                            Replied
                          </span>
                        )}
                        {lead.initial_response_sent_at && (
                          <span className="text-xs px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                            AI Reply Sent
                          </span>
                        )}
                        {lead.booking_status === 'booked' && (
                          <span className="text-xs px-2 py-1 rounded-full border border-purple-200 bg-purple-50">
                            Booked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {!loading && leads.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                <button
                  onClick={() => loadLeads(page - 1)}
                  disabled={page === 1}
                  className="rounded border border-border px-3 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-muted-foreground">Page {page}</span>
                <button
                  onClick={() => loadLeads(page + 1)}
                  disabled={!hasNextPage}
                  className="rounded border border-border px-3 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lead Details */}
        {selectedLead && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-border shadow-sm p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedLead.full_name}</h3>
                  {selectedHidden && <p className="text-xs font-semibold text-red-700">Hidden/test WebsiteLead — automation is blocked unless manually verified.</p>}
                </div>
                {selectedHidden && <span className="rounded-full bg-red-50 border border-red-200 px-2 py-1 text-xs font-semibold text-red-700">Hidden/Test</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedLead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedLead.email}`} className="text-sm text-primary hover:underline truncate">
                      {selectedLead.email}
                    </a>
                  </div>
                )}
                {selectedLead.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedLead.phone_number}`} className="text-sm text-primary hover:underline">
                      {selectedLead.phone_number}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Service Interest</p>
                  <p className="text-sm text-foreground">{selectedLead.service_interest || selectedLead.interested_service || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Message</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedLead.message || selectedLead.call_summary || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Follow-Up Step</p>
                  <p className="text-sm text-foreground">{selectedLead.follow_up_step || 0}</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Cleanup Guard</p>
                <p className={`mt-1 text-sm font-semibold ${selectedEligibility?.eligible ? 'text-red-700' : 'text-foreground'}`}>
                  {selectedEligibility?.eligible ? 'Eligible for verified-junk deletion' : 'Hard delete blocked unless verified junk'}
                </p>
                {selectedEligibility?.signals?.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-xs text-red-700 space-y-0.5">
                    {selectedEligibility.signals.slice(0, 5).map((signal) => <li key={signal}>{signal}</li>)}
                  </ul>
                )}
                {selectedEligibility?.blockers?.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-xs text-amber-700 space-y-0.5">
                    {selectedEligibility.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                  </ul>
                )}
                {cleanupMessage && <p className="mt-2 text-xs font-semibold text-foreground">{cleanupMessage}</p>}
              </div>

              <div className="flex gap-2 mt-6 flex-wrap">
                <button
                  onClick={() => runImmediateResponse(selectedLead.id)}
                  disabled={selectedHidden}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition disabled:opacity-40"
                >
                  Run Immediate Response
                </button>
                <button
                  onClick={() => archiveWebsiteLead(selectedLead)}
                  disabled={cleanupLoading || selectedLead.archived}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-40"
                >
                  {cleanupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} Archive Test Lead
                </button>
                <button
                  onClick={() => deleteVerifiedWebsiteJunk(selectedLead)}
                  disabled={cleanupLoading || !selectedEligibility?.eligible}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-40"
                >
                  {cleanupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Verified Junk
                </button>
                <select
                  value={selectedLead.lead_status}
                  onChange={(e) => updateLeadStatus(selectedLead.id, 'lead_status', e.target.value)}
                  className="px-3 py-2 border border-border rounded text-sm bg-background text-foreground"
                >
                  {['new', 'contacted', 'responded', 'hot', 'booked', 'closed', 'ignored'].map((s) => (
                    <option key={s} value={s}>
                      Mark as {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Communication Logs */}
            <div className="bg-white rounded-lg border border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h4 className="font-semibold text-foreground">Communication History</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">No communication logs</div>
                ) : (
                  <div className="divide-y divide-border">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{log.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.channel} • {log.event_type}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            log.status === 'sent' ? 'bg-green-50 text-green-700' :
                            log.status === 'failed' ? 'bg-red-50 text-red-700' :
                            log.status === 'skipped' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-muted'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

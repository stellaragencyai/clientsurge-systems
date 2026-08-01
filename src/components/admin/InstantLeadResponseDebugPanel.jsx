import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Send, Mail, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function InstantLeadResponseDebugPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const [jobs, events, deadLetters, websiteLeads] = await Promise.all([
        base44.admin.entities.AutomationJob.filter({}, '-created_at', 50).catch(() => []),
        base44.admin.entities.CommunicationEvent.filter({}, '-created_date', 100).catch(() => []),
        base44.admin.entities.DeadLetterLog.filter({}, '-created_at', 20).catch(() => []),
        base44.admin.entities.WebsiteLead.filter({}, '-created_date', 30).catch(() => []),
      ]);

      setData({
        jobs: jobs || [],
        events: events || [],
        deadLetters: deadLetters || [],
        websiteLeads: websiteLeads || [],
      });
    } catch (err) {
      console.error('Failed to load debug data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading pipeline data...</div>;
  if (!data) return <div className="p-6 text-red-600">Failed to load debug panel.</div>;

  const stats = {
    queued: data.jobs.filter(j => j.status === 'queued').length,
    processing: data.jobs.filter(j => j.status === 'processing').length,
    completed: data.jobs.filter(j => j.status === 'completed').length,
    failed: data.jobs.filter(j => j.status === 'failed').length,
    smsSuccess: data.events.filter(e => e.event_type === 'sms_sent').length,
    emailSuccess: data.events.filter(e => e.event_type === 'email_sent').length,
    deadLettered: data.deadLetters.length,
  };

  const leadWithJobs = (lead) => ({
    ...lead,
    jobs: data.jobs.filter(j => j.lead_id === lead.id),
    events: data.events.filter(e => e.lead_id === lead.id),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Instant Lead Response Pipeline</h2>
        <button
          onClick={fetch}
          className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-1" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Queued', value: stats.queued, color: 'bg-blue-50 text-blue-700' },
          { label: 'Processing', value: stats.processing, color: 'bg-purple-50 text-purple-700' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-50 text-green-700' },
          { label: 'Failed', value: stats.failed, color: 'bg-red-50 text-red-700' },
          { label: 'SMS Sent', value: stats.smsSuccess, color: 'bg-green-50 text-green-700' },
          { label: 'Email Sent', value: stats.emailSuccess, color: 'bg-green-50 text-green-700' },
          { label: 'Dead Letter', value: stats.deadLettered, color: 'bg-red-50 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg p-4 ${color}`}>
            <p className="text-xs font-medium opacity-75">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent WebsiteLeads with pipeline detail */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="bg-gray-50 border-b border-border px-6 py-4">
          <h3 className="font-bold text-foreground">Recent Leads + Pipeline Status</h3>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {data.websiteLeads.slice(0, 10).map(lead => {
            const leadDetail = leadWithJobs(lead);
            return (
              <div
                key={lead.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : leadDetail)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{lead.full_name || lead.email}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {leadDetail.jobs.length > 0 && (
                      <>
                        {leadDetail.jobs.some(j => j.status === 'completed') && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" title="Jobs completed" />
                        )}
                        {leadDetail.jobs.some(j => j.status === 'queued') && (
                          <Clock className="w-4 h-4 text-blue-600" title="Jobs queued" />
                        )}
                        {leadDetail.jobs.some(j => j.status === 'failed') && (
                          <AlertTriangle className="w-4 h-4 text-red-600" title="Jobs failed" />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedLead?.id === lead.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {/* Jobs */}
                    {leadDetail.jobs.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-2">AUTOMATION JOBS</p>
                        {leadDetail.jobs.map(job => (
                          <div key={job.id} className="text-xs bg-gray-50 p-2 rounded mb-1">
                            <div className="flex items-center gap-2">
                              {job.job_type === 'instant_sms' && <Send className="w-3 h-3" />}
                              {job.job_type === 'confirmation_email' && <Mail className="w-3 h-3" />}
                              <span className="font-medium">{job.job_type}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                job.status === 'queued' ? 'bg-blue-100 text-blue-700' :
                                job.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {job.status}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(job.created_at).toLocaleString()}
                              </span>
                            </div>
                            {job.provider_message_id && <p className="text-[10px] text-green-600 mt-1">✓ {job.provider_message_id}</p>}
                            {job.final_error && <p className="text-[10px] text-red-600 mt-1">✗ {job.final_error}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Events */}
                    {leadDetail.events.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground mb-2">COMMUNICATION EVENTS</p>
                        {leadDetail.events.slice(0, 5).map(event => (
                          <div key={event.id} className="text-xs bg-gray-50 p-2 rounded mb-1">
                            <div className="flex items-start gap-2">
                              <Activity className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium">{event.event_type}</p>
                                <p className="text-[10px] text-muted-foreground">{event.provider} · {event.channel}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-1 rounded ${
                                event.status === 'sent' || event.status === 'processed' ? 'bg-green-100 text-green-700' :
                                event.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-900">
                      <p className="font-bold mb-1">Pipeline Summary</p>
                      <p>SMS attempts: {lead.sms_attempt_count || 0} | Email attempts: {lead.email_attempt_count || 0}</p>
                      <p>Initial response: {lead.initial_response_sent_at ? new Date(lead.initial_response_sent_at).toLocaleString() : 'Pending'}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dead Letter Log */}
      {stats.deadLettered > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-bold text-red-900 mb-3">Dead Letter Queue ({stats.deadLettered})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.deadLetters.slice(0, 5).map(dl => (
              <div key={dl.id} className="text-sm bg-white border border-red-200 rounded p-2">
                <p className="font-medium text-red-800">{dl.processor_type}</p>
                <p className="text-xs text-red-700 mt-1">{dl.failure_reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
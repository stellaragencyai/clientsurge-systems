import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function LeadCleanupPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('quarantineFakeLeads', {
        action: 'identify',
        dry_run: true,
      });
      setStats(res.data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  const handleQuarantine = async () => {
    if (!stats?.fake_lead_ids) {
      const identifyRes = await base44.functions.invoke('quarantineFakeLeads', {
        action: 'identify',
        dry_run: false,
      });
      if (!identifyRes.data?.fake_lead_ids?.length) {
        setResult({ error: 'No fake leads found to quarantine' });
        return;
      }
      setActionLoading(true);
      const res = await base44.functions.invoke('quarantineFakeLeads', {
        action: 'quarantine',
        lead_ids: identifyRes.data.fake_lead_ids,
      });
      setResult(res.data);
    } else {
      setActionLoading(true);
      const res = await base44.functions.invoke('quarantineFakeLeads', {
        action: 'quarantine',
        lead_ids: stats.fake_lead_ids,
      });
      setResult(res.data);
    }
    setActionLoading(false);
    loadStats();
  };

  const handlePurge = async () => {
    if (!confirm('Permanently delete ALL quarantined leads? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      const res = await base44.functions.invoke('quarantineFakeLeads', {
        action: 'purge',
        dry_run: false,
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setActionLoading(false);
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-titles text-lg font-bold text-black">CRM Data Cleanup</h3>
          <p className="text-sm text-muted-foreground">
            Identify, quarantine, and purge fake/test leads from your database
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Total Leads</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats?.total_leads ?? 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Fake Detected</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{stats?.fake_identified ?? 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <p className="text-xs font-bold uppercase tracking-wider text-green-600">Active (Real)</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {(stats?.total_leads ?? 0) - (stats?.fake_identified ?? 0)}
          </p>
        </div>
      </div>

      {/* Sample preview */}
      {stats?.sample?.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Sample of Detected Fake Leads
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Business</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Flags</th>
                </tr>
              </thead>
              <tbody>
                {stats.sample.map((lead, i) => (
                  <tr key={lead.id} className={i % 2 ? 'bg-muted/30' : ''}>
                    <td className="px-3 py-2 text-foreground">{lead.name}</td>
                    <td className="px-3 py-2 text-foreground">{lead.business}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{lead.email || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(lead.reason_codes || []).slice(0, 2).map((code) => (
                          <span key={code} className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            {code.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleQuarantine}
          disabled={actionLoading || !stats?.fake_identified}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-100 text-amber-700 font-semibold text-sm hover:bg-amber-200 transition-colors disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          Quarantine {stats?.fake_identified ?? 0} Fake Leads
        </button>
        <button
          onClick={handlePurge}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Purge All Quarantined
        </button>
        <button
          onClick={loadStats}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition-colors"
        >
          Refresh Stats
        </button>
      </div>

      {/* Result message */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg flex items-start gap-2 ${
          result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {result.error ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            {result.error ? (
              <p>{result.error}</p>
            ) : (
              <>
                <p className="font-semibold">
                  {result.quarantined ? `${result.quarantined} leads quarantined` : `${result.deleted} leads permanently deleted`}
                </p>
                {result.message && <p className="text-xs mt-1">{result.message}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
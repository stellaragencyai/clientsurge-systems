import React, { useEffect, useState } from 'react';
import { Loader2, Eye, EyeOff, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StatusBadge({ status }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-500',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || colors.draft}`}>{status}</span>;
}

function HealthBadge({ status }) {
  const colors = {
    healthy: 'bg-green-100 text-green-700',
    degraded: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    unknown: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || colors.unknown}`}>{status}</span>;
}

export default function ClientExperiencePortalPanel() {
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      const data = await base44.asServiceRole.entities.ClientExperiencePortal.list('-created_date', 100);
      setPortals(data || []);
    } catch (err) {
      console.error('Failed to fetch portals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (portal) => {
    try {
      await base44.asServiceRole.entities.ClientExperiencePortal.update(portal.id, {
        portal_access_enabled: !portal.portal_access_enabled,
      });
      setPortals(portals.map(p => p.id === portal.id ? { ...p, portal_access_enabled: !p.portal_access_enabled } : p));
    } catch (err) {
      console.error('Failed to toggle access:', err);
    }
  };

  const handleRecompute = async (clientId) => {
    try {
      await base44.functions.invoke('computeClientExperiencePortal', {
        client_id: clientId,
        force_recompute: true,
      });
      await fetchPortals();
    } catch (err) {
      console.error('Failed to recompute:', err);
    }
  };

  const handleStatusChange = async (portal, newStatus) => {
    try {
      await base44.asServiceRole.entities.ClientExperiencePortal.update(portal.id, {
        portal_status: newStatus,
      });
      setPortals(portals.map(p => p.id === portal.id ? { ...p, portal_status: newStatus } : p));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading client portals...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Client Experience Portals</h2>
          <p className="text-sm text-muted-foreground mt-1">Unified client-facing dashboards</p>
        </div>
        <button
          onClick={fetchPortals}
          className="px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Business</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Leads</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Conv Rate</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Revenue</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Setup</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Health</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Access</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {portals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                    No portals yet. Portals are created when orders are processed.
                  </td>
                </tr>
              ) : (
                portals.map((portal) => (
                  <tr key={portal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{portal.business_name}</p>
                        <p className="text-xs text-muted-foreground">{portal.client_id?.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === portal.id ? (
                        <select
                          value={portal.portal_status}
                          onChange={(e) => handleStatusChange(portal, e.target.value)}
                          className="px-2 py-1 rounded border border-border text-sm"
                          autoFocus
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="archived">Archived</option>
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingId(portal.id)}
                          className="cursor-pointer hover:underline"
                        >
                          <StatusBadge status={portal.portal_status} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      {portal.total_leads_received}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      {portal.conversion_rate}%
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      ${portal.revenue_generated?.toFixed(0) || '0'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                        {portal.onboarding_completion_percent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <HealthBadge status={portal.automation_health_status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleAccess(portal)}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        {portal.portal_access_enabled ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRecompute(portal.client_id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        Recompute
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {portals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">Avg Conversion Rate</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {(portals.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / portals.length).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${portals.reduce((sum, p) => sum + (p.revenue_generated || 0), 0).toFixed(0)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-muted-foreground">Active Blockers</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {portals.reduce((sum, p) => sum + (p.blockers_count || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SOURCE_LABELS = {
  lead: 'Direct Lead',
  outbound: 'Outbound',
  campaign: 'Campaign',
  referral: 'Referral',
  manual: 'Manual',
};

const SOURCE_COLORS = {
  lead: '#0088CC',
  outbound: '#22c55e',
  campaign: '#8b5cf6',
  referral: '#f59e0b',
  manual: '#6b7280',
};

export default function SaasRevenue({ portal, clientId }) {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      const data = await base44.entities.RevenueTracking.filter(
        { client_id: clientId },
        '-conversion_date',
        100
      ).catch(() => []);
      setRevenueData(data || []);
      setLoading(false);
    };
    load();
  }, [clientId]);

  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.revenue_amount || 0), 0);

  // Group by source
  const bySource = revenueData.reduce((acc, r) => {
    const src = r.revenue_source || 'manual';
    acc[src] = (acc[src] || 0) + (r.revenue_amount || 0);
    return acc;
  }, {});

  const convRate = portal?.conversion_rate ?? 0;
  const recentRevenue = revenueData.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Revenue Dashboard</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(0)}</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Conversions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{revenueData.length}</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Conv. Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{convRate}%</p>
        </div>
      </div>

      {/* By source breakdown */}
      {Object.keys(bySource).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue by Source</p>
          <div className="space-y-2">
            {Object.entries(bySource).sort((a,b) => b[1]-a[1]).map(([src, amt]) => {
              const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0;
              return (
                <div key={src}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{SOURCE_LABELS[src] || src}</span>
                    <span className="text-gray-900 font-semibold">${amt.toFixed(0)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: SOURCE_COLORS[src] || '#6b7280' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent conversions */}
      {recentRevenue.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Conversions</p>
          <div className="space-y-2">
            {recentRevenue.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{SOURCE_LABELS[r.revenue_source] || r.revenue_source || 'Revenue'}</p>
                    <p className="text-[11px] text-gray-400">{r.conversion_date ? new Date(r.conversion_date).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />${(r.revenue_amount || 0).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />}
      {!loading && revenueData.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Revenue tracking will appear here once automations generate bookings.</p>
      )}
    </div>
  );
}
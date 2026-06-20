import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SalesAcquisitionModule() {
  const [metrics, setMetrics] = useState({
    total_leads: 0,
    conversion_rate: 0,
    active_campaigns: 0,
    drop_off_stage: '',
  });
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leads, funnelData] = await Promise.all([
          base44.asServiceRole.entities.Leads.filter({}, 'id', 1),
          base44.asServiceRole.entities.ConversionFunnel.filter({}, '-created_date', 5),
        ]);

        setFunnels(funnelData || []);

        if (funnelData && funnelData.length > 0) {
          const funnel = funnelData[0];
          setMetrics({
            total_leads: (leads || []).length,
            conversion_rate: funnel.top_to_bottom_conversion_percent || 0,
            active_campaigns: 0,
            drop_off_stage: funnel.biggest_drop_off_stage || '',
          });
        }
      } catch (e) {
        console.error('Failed to load sales acquisition data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-start gap-4 mb-2">
          <div className="w-1.5 h-12 bg-primary rounded-sm flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Sales Acquisition System</h1>
            <p className="text-sm text-muted-foreground mt-2">Unified view of leads, campaigns, and conversion metrics.</p>
          </div>
        </div>
      </div>

      {/* Funnel Overview */}
      {funnels.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Conversion Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Overall Conversion Rate</p>
                <p className="text-2xl font-bold text-primary">{metrics.conversion_rate.toFixed(1)}%</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{metrics.total_leads}</p>
              </div>
              {metrics.drop_off_stage && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">Biggest Drop-Off</p>
                    <p className="text-sm text-amber-800 mt-1">{metrics.drop_off_stage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Funnels</h2>
            <div className="space-y-2">
              {funnels.slice(0, 3).map((funnel) => (
                <button
                  key={funnel.id}
                  className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{funnel.funnel_name || 'Unnamed Funnel'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {funnel.total_revenue_attributed ? `$${(funnel.total_revenue_attributed / 1000).toFixed(1)}k` : 'No revenue'} in {funnel.metric_period}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
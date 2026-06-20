import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FunnelAnalyticsModule() {
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFunnels = async () => {
      try {
        const result = await base44.asServiceRole.entities.ConversionFunnel.filter(
          {},
          '-created_date',
          10
        );
        setFunnels(result || []);
      } catch (e) {
        console.error('Failed to load funnels:', e);
      } finally {
        setLoading(false);
      }
    };
    loadFunnels();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading funnels...</div>;
  }

  if (funnels.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No funnels configured yet.</div>;
  }

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-start gap-4 mb-2">
          <div className="w-1.5 h-12 bg-primary rounded-sm flex-shrink-0" />
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Funnel Analytics</h1>
            <p className="text-sm text-muted-foreground mt-2">Conversion rates and drop-off analysis.</p>
          </div>
        </div>
      </div>

      {funnels.map((funnel) => (
        <div key={funnel.id} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">{funnel.funnel_name}</h2>
          <p className="text-sm text-muted-foreground mb-6">{funnel.metric_period} period</p>

          {/* Funnel Visualization */}
          <div className="space-y-3 mb-6">
            {funnel.funnel_stages?.map((stage, idx) => {
              const total = stage.total_count || 0;
              const maxCount = Math.max(...(funnel.funnel_stages?.map((s) => s.total_count || 0) || [1]));
              const percentage = maxCount > 0 ? (total / maxCount) * 100 : 0;

              return (
                <button
                  key={idx}
                  className="w-full text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground capitalize">{stage.stage_name}</p>
                    <p className="text-sm font-semibold text-primary">{total}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full overflow-hidden h-6">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 10 && (
                        <span className="text-xs font-semibold text-white">{stage.conversion_from_top_percent?.toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Conversion Rate</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {(funnel.top_to_bottom_conversion_percent || 0).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ${(funnel.total_revenue_attributed || 0).toLocaleString()}
              </p>
            </div>

            {funnel.biggest_drop_off_stage && (
              <div className="col-span-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-900">Biggest Drop-Off</p>
                  <p className="text-sm text-amber-800">
                    {funnel.biggest_drop_off_stage}: {(funnel.biggest_drop_off_percent || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
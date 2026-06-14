import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Conversion pipeline showing closed, engaged, and booked leads.
 * Displays conversion stats and funnel visualization.
 */
export default function ConversionPipeline({ lastUpdated = 0 }) {
  const [stats, setStats] = useState({
    new: 0,
    engaged: 0,
    booked: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch conversion stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const alerts = await base44.entities.Alert.list('-created_date', 200);

        const statCounts = {
          new: alerts.filter(a => a.conversion_status === 'new').length,
          engaged: alerts.filter(a => a.conversion_status === 'engaged').length,
          booked: alerts.filter(a => a.conversion_status === 'booked').length,
          closed: alerts.filter(a => a.conversion_status === 'closed').length,
        };

        setStats(statCounts);
      } catch (err) {
        console.error('[ConversionPipeline] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [lastUpdated]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
  const conversionRate = total > 0 ? ((stats.booked + stats.closed) / total * 100).toFixed(1) : 0;

  const pipelineStages = [
    {
      label: 'New',
      count: stats.new,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Engaged',
      count: stats.engaged,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Booked',
      count: stats.booked,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Closed',
      count: stats.closed,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (loading) {
    return <div className="text-center text-muted-foreground text-sm py-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Conversion Pipeline</h3>
        <span className="text-xs font-medium text-muted-foreground">
          {conversionRate}% closed
        </span>
      </div>

      {/* Pipeline visualization */}
      <div className="grid grid-cols-4 gap-2">
        {pipelineStages.map((stage, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border-2 transition-all ${stage.bgColor} ${stage.color.replace('bg-', 'border-')}/30`}
          >
            <div className={`text-xs font-medium ${stage.textColor} mb-1`}>
              {stage.label}
            </div>
            <div className={`text-2xl font-bold ${stage.textColor}`}>
              {stage.count}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {total > 0 ? ((stage.count / total) * 100).toFixed(0) : 0}%
            </div>
          </div>
        ))}
      </div>

      {/* Funnel bar */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Lead Flow</div>
        <div className="flex items-stretch h-8 gap-1 rounded-lg overflow-hidden border border-border bg-background/50">
          {pipelineStages.map((stage, idx) => (
            <div
              key={idx}
              className={`${stage.color} transition-all relative`}
              style={{
                width: `${(stage.count / total) * 100}%`,
              }}
              title={`${stage.label}: ${stage.count}`}
            />
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="pt-2 border-t border-border">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-muted/30">
            <div className="text-xs text-muted-foreground">Total Leads</div>
            <div className="text-lg font-bold text-foreground">{total}</div>
          </div>
          <div className="p-2 rounded bg-green-50/50">
            <div className="text-xs text-green-600">Conversion Rate</div>
            <div className="text-lg font-bold text-green-600">{conversionRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
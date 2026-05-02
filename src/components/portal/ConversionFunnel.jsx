import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingDown } from 'lucide-react';

const colorMap = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  green: 'bg-green-100 text-green-700 border-green-200',
};

const barColorMap = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
};

export default function ConversionFunnel() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        const res = await base44.functions.invoke('getConversionFunnel', {});
        setStages(res.data.stages || []);
        setError('');
      } catch (err) {
        setError('Failed to load conversion funnel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnel();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!stages.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No leads yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Conversion Funnel</h3>
        <p className="text-sm text-muted-foreground">Track where leads progress through your sales pipeline</p>
      </div>

      <div className="space-y-4">
        {stages.map((stage, idx) => {
          const width = (stage.count / maxCount) * 100;
          const isDropoff = idx > 0 && stage.count < stages[idx - 1].count;

          return (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{stage.count}</span>
                  {isDropoff && (
                    <span className="flex items-center gap-0.5 text-xs text-red-600 font-semibold">
                      <TrendingDown className="w-3 h-3" />
                      {stages[idx - 1].count - stage.count}
                    </span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="w-full h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`h-full ${barColorMap[stage.color]} transition-all duration-500 rounded-lg flex items-center justify-end pr-3`}
                  style={{ width: `${width}%` }}
                >
                  {width > 15 && (
                    <span className="text-xs font-bold text-white">{stage.conversionRate}%</span>
                  )}
                </div>
              </div>

              {/* Conversion rate badge */}
              {idx > 0 && (
                <p className="text-xs text-muted-foreground">
                  {stage.conversionRate}% conversion from previous stage
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary insight */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Total Pipeline:</span> {stages[0]?.count || 0} leads
          {stages[stages.length - 1]?.count > 0 && (
            <>
              {' '}
              · <span className="font-semibold text-foreground">
                Overall conversion: {Math.round((stages[stages.length - 1].count / (stages[0]?.count || 1)) * 100)}%
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
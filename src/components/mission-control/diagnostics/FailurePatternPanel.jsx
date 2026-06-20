import React from 'react';
import { BarChart3 } from 'lucide-react';

function PatternRow({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-foreground w-40 truncate capitalize">
        {label.replace(/_/g, ' ')}
      </span>
      <div className="flex-1 bg-muted rounded-full overflow-hidden h-4">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
          style={{ width: `${pct}%` }}
        >
          {pct > 15 && <span className="text-white text-[10px] font-bold">{count}</span>}
        </div>
      </div>
      {pct <= 15 && <span className="text-xs font-bold text-muted-foreground w-6 text-right">{count}</span>}
    </div>
  );
}

export default function FailurePatternPanel({ jobPatterns, eventPatterns, channelFailures }) {
  const jobMax = jobPatterns[0]?.count || 1;
  const eventMax = eventPatterns[0]?.count || 1;
  const channelMax = channelFailures[0]?.count || 1;

  const hasData = jobPatterns.length > 0 || eventPatterns.length > 0 || channelFailures.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Failure Patterns</h2>
        <span className="ml-auto text-xs text-muted-foreground">Most common failure sources</span>
      </div>

      {!hasData ? (
        <p className="text-sm text-muted-foreground text-center py-8">✅ No failure patterns detected</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {jobPatterns.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">By Job Type</p>
              <div className="space-y-3">
                {jobPatterns.slice(0, 6).map(p => (
                  <PatternRow key={p.key} label={p.key} count={p.count} max={jobMax} color="bg-red-400" />
                ))}
              </div>
            </div>
          )}

          {eventPatterns.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">By Event Type</p>
              <div className="space-y-3">
                {eventPatterns.slice(0, 6).map(p => (
                  <PatternRow key={p.key} label={p.key} count={p.count} max={eventMax} color="bg-orange-400" />
                ))}
              </div>
            </div>
          )}

          {channelFailures.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">By Channel</p>
              <div className="space-y-3">
                {channelFailures.slice(0, 6).map(p => (
                  <PatternRow key={p.key} label={p.key} count={p.count} max={channelMax} color="bg-amber-400" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
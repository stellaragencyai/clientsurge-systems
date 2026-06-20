import React from 'react';
import { Lightbulb, ArrowRight, AlertTriangle, AlertCircle, Info, CheckCircle2, FlaskConical } from 'lucide-react';

const SEVERITY_CONFIG = {
  high: { icon: AlertCircle, color: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-700', label: 'High' },
  medium: { icon: AlertTriangle, color: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: 'Medium' },
  info: { icon: Info, color: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Info' },
};

function RecommendationCard({ rec, onNavigate }) {
  const config = SEVERITY_CONFIG[rec.severity] || SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-5 ${config.color}`}>
      <div className="flex items-start gap-4">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-80" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>{config.label}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{rec.category}</span>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">{rec.issue}</p>
          <p className="text-xs text-muted-foreground mb-3">
            <strong>Likely cause:</strong> {rec.cause}
          </p>
          <div className="rounded-lg bg-white/70 border border-white/60 px-3 py-2.5">
            <p className="text-xs font-bold text-foreground mb-1">Recommended fix</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{rec.fix}</p>
          </div>
        </div>
        {rec.module && (
          <button
            onClick={() => onNavigate(rec.module)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-white/60 transition-colors"
            title={`Go to ${rec.module}`}
          >
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

function SimComparisonPanel({ simResults }) {
  if (!simResults || simResults.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-sm font-semibold text-foreground">No simulation data available</p>
        <p className="text-xs text-muted-foreground mt-1">Run a simulation in the Simulation Lab to compare against live system performance.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
        Simulation vs Live Comparison
      </p>
      <div className="space-y-3">
        {simResults.slice(0, 5).map(sim => (
          <div key={sim.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-semibold text-foreground">{sim.full_name || 'Test Lead'}</p>
              <p className="text-xs text-muted-foreground">{sim.email} · {sim.source}</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              SIM
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FixRecommendationsPanel({ recommendations, simResults, onNavigate }) {
  const highCount = recommendations.filter(r => r.severity === 'high').length;
  const mediumCount = recommendations.filter(r => r.severity === 'medium').length;

  return (
    <div className="space-y-6">
      {/* Fix Recommendations */}
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold text-foreground">Diagnostic Insights & Fix Recommendations</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          {highCount > 0 && <span className="font-bold text-red-600">{highCount} high severity · </span>}
          {mediumCount > 0 && <span className="font-bold text-amber-600">{mediumCount} medium · </span>}
          Each recommendation links to the affected module.
        </p>

        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* Simulation Comparison */}
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Simulation vs Live Performance</h2>
        </div>
        <SimComparisonPanel simResults={simResults} />
      </div>
    </div>
  );
}
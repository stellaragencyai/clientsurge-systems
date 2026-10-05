import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Zap,
  RefreshCw,
  Filter,
} from 'lucide-react';

export default function GrowthOptimizationDashboard() {
  const [signals, setSignals] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('severity');

  const loadData = async () => {
    setLoading(true);
    try {
      const [signalsRes, actionsRes] = await Promise.all([
        base44.admin.entities.GrowthOptimizationSignal.filter({}, '-triggered_at', 100),
        base44.admin.entities.OptimizationAction.filter({}, '-created_at', 50),
      ]);
      setSignals(signalsRes || []);
      setActions(actionsRes || []);
    } catch (err) {
      console.error('[GrowthOptimizationDashboard]', err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('computeGrowthOptimizationSignals', {});
      await loadData();
    } catch (err) {
      console.error('[GrowthOptimizationDashboard] analysis failed:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSignals = signals
    .filter((s) => filter === 'all' || s.severity === filter)
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.severity] - order[b.severity];
      }
      return new Date(b.triggered_at) - new Date(a.triggered_at);
    });

  const suggestedActions = actions.filter((a) => a.status === 'suggested').length;
  const appliedActions = actions.filter((a) => a.status === 'applied').length;

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
      high: <AlertCircle className="w-5 h-5 text-orange-600" />,
      medium: <TrendingUp className="w-5 h-5 text-yellow-600" />,
      low: <Zap className="w-5 h-5 text-blue-600" />,
    };
    return icons[severity] || <Zap className="w-5 h-5" />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-50 border-red-200 text-red-900',
      high: 'bg-orange-50 border-orange-200 text-orange-900',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      low: 'bg-blue-50 border-blue-200 text-blue-900',
    };
    return colors[severity] || 'bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Growth Optimization Engine</h2>
          <p className="text-slate-600 mt-1">
            AI-powered analysis detects underperforming pages and suggests improvements
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Analysis
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600 font-semibold mb-1">Active Signals</p>
          <p className="text-3xl font-bold text-slate-900">{signals.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600 font-semibold mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">
            {signals.filter((s) => s.severity === 'critical').length}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600 font-semibold mb-1">Suggested Actions</p>
          <p className="text-3xl font-bold text-yellow-600">{suggestedActions}</p>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600 font-semibold mb-1">Applied</p>
          <p className="text-3xl font-bold text-green-600">{appliedActions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <Filter className="w-4 h-4 text-slate-600" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="high">High & Critical</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 ml-auto"
        >
          <option value="severity">Sort by Severity</option>
          <option value="recent">Sort by Recent</option>
        </select>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-lg">Optimization Opportunities</h3>
        {loading ? (
          <div className="p-8 text-center text-slate-600">Analyzing landing pages...</div>
        ) : filteredSignals.length === 0 ? (
          <div className="p-8 text-center text-slate-600">No signals detected. All pages performing well!</div>
        ) : (
          filteredSignals.map((signal) => (
            <div
              key={signal.id}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(signal.severity)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">{getSeverityIcon(signal.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-lg">
                        {signal.page_key.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-sm font-medium mt-1">{signal.signal_type.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">{signal.confidence_score}% Confidence</p>
                      <p className="text-xs text-slate-600 mt-1">{signal.metric_affected.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <span className="font-semibold">Current:</span> {signal.current_value.toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-semibold">Benchmark:</span> {signal.benchmark_value.toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-semibold">Variance:</span> {signal.variance_percent > 0 ? '+' : ''}
                      {signal.variance_percent.toFixed(1)}%
                    </div>
                    <div>
                      <span className="font-semibold">Impact:</span> {signal.impact_estimate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Actions List */}
      {suggestedActions > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-lg">Recommended Actions</h3>
          <div className="space-y-2">
            {actions
              .filter((a) => a.status === 'suggested')
              .slice(0, 5)
              .map((action) => (
                <div key={action.id} className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-green-900">{action.title}</p>
                      <p className="text-sm text-green-800 mt-1">{action.instruction}</p>
                      <p className="text-xs text-green-700 font-semibold mt-2">
                        Expected: {action.expected_outcome}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, MessageSquare, Zap, BarChart3, Activity } from 'lucide-react';

export default function BusinessInsightsDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getBusinessInsights', {});
      setInsights(response.data.insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComputeInsights = async () => {
    try {
      setComputing(true);
      await base44.functions.invoke('computeBusinessInsights', {});
      // Refetch after computation
      setTimeout(fetchInsights, 2000);
    } catch (error) {
      console.error('Error computing insights:', error);
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return <div className="h-96 bg-muted rounded-lg animate-pulse" />;
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No insights computed yet</p>
        <button
          onClick={handleComputeInsights}
          disabled={computing}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {computing ? 'Computing...' : 'Compute Insights'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control */}
      <div className="flex justify-end">
        <button
          onClick={handleComputeInsights}
          disabled={computing}
          className="text-xs px-3 py-1.5 border border-border rounded hover:bg-muted disabled:opacity-50"
        >
          {computing ? 'Refreshing...' : 'Refresh Analytics'}
        </button>
      </div>

      {/* Funnel Overview */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Lead Funnel Overview</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-3xl font-bold">{insights.funnel_summary.total_leads}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Leads</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">{insights.funnel_summary.responded}</div>
            <div className="text-xs text-blue-600 mt-1">{insights.funnel_summary.response_rate_percent}% Responded</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-700">{insights.funnel_summary.booked}</div>
            <div className="text-xs text-green-600 mt-1">{insights.funnel_summary.booking_rate_percent}% Booked</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {insights.lead_score_correlation ? insights.lead_score_correlation.avg_score_successful_outcomes : 'N/A'}
            </div>
            <div className="text-xs text-purple-600 mt-1">Avg Score (Success)</div>
          </div>
        </div>
      </div>

      {/* Outcome Distribution */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Outcome Distribution</h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(insights.outcome_distribution).map(([type, count]) => (
            <div key={type} className="p-3 border border-border rounded-lg">
              <div className="text-sm font-medium capitalize">{type.replace(/_/g, ' ')}</div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Template Effectiveness */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Top Message Templates</h3>
        </div>
        <div className="space-y-3">
          {insights.top_message_templates.slice(0, 5).map((template, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground">
                  {template.usage_count} uses · {template.response_rate}% response rate
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{template.booking_rate}%</div>
                <div className="text-xs text-muted-foreground">Booking Rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Rule Performance */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Top Automation Rules</h3>
        </div>
        <div className="space-y-3">
          {insights.top_automation_rules.slice(0, 5).map((rule, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{rule.name}</div>
                <div className="text-xs text-muted-foreground">
                  {rule.trigger_count} triggers · {rule.success_rate}% success rate
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{rule.response_rate}%</div>
                <div className="text-xs text-muted-foreground">Response Rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Patterns */}
      {insights.conversation_patterns.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Successful Conversation Patterns</h3>
          </div>
          <div className="space-y-3">
            {insights.conversation_patterns.map((pattern, idx) => (
              <div key={idx} className="p-3 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold capitalize">{pattern.outcome.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-muted-foreground">Intent: {pattern.intent}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{pattern.success_score.toFixed(0)}/100</div>
                    <div className="text-xs text-muted-foreground">Success Score</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {pattern.template} · {pattern.total_messages} messages · {pattern.frequency} occurrences
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
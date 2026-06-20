import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const PAGE_KEYS = [
  'homepage',
  'med_spa',
  'dental',
  'hvac',
  'roofing',
  'contractors',
  'real_estate',
  'personal_injury',
  'plumbing',
  'chiropractic',
  'pricing',
];

export default function LandingPageAnalyticsPanel() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const records = await base44.asServiceRole.entities.LandingPageAnalytics.filter(
        { date: selectedDate },
        '-created_date',
        50
      ).catch(() => []);
      setAnalytics(records || []);
    } catch (err) {
      console.error('[LandingPageAnalyticsPanel]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await base44.functions.invoke('computeLandingPageAnalytics', { date: selectedDate });
      await new Promise((r) => setTimeout(r, 1000)); // Wait for DB sync
      await loadAnalytics();
    } catch (err) {
      console.error('[handleRefresh]', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedDate]);

  // Compute summary metrics
  const totalImpressions = analytics.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalSessions = analytics.reduce((s, a) => s + (a.sessions || 0), 0);
  const totalCtaClicks = analytics.reduce((s, a) => s + (a.cta_clicks || 0), 0);
  const overallConversionRate = totalSessions > 0 ? ((totalCtaClicks / totalSessions) * 100).toFixed(2) : 0;

  const bestPerformer = [...analytics].sort((a, b) => (b.conversion_rate || 0) - (a.conversion_rate || 0))[0];
  const worstPerformer = [...analytics].sort((a, b) => (a.conversion_rate || 0) - (b.conversion_rate || 0))[0];

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Landing Page Analytics</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted text-sm font-semibold hover:bg-muted/80 disabled:opacity-60"
          style={{ minHeight: 'unset', minWidth: 'unset' }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Computing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Date Picker */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Analytics Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Impressions" value={totalImpressions.toLocaleString()} />
        <MetricCard label="Total Sessions" value={totalSessions.toLocaleString()} />
        <MetricCard label="CTA Clicks" value={totalCtaClicks.toLocaleString()} />
        <MetricCard label="Conv. Rate" value={`${overallConversionRate}%`} />
      </div>

      {/* Best/Worst Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestPerformer && (
          <div className="p-4 rounded-lg border border-green-200 bg-green-50">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
              Best Performing
            </p>
            <p className="text-lg font-bold text-green-900">{bestPerformer.page_key}</p>
            <p className="text-sm text-green-700 mt-1">
              {bestPerformer.conversion_rate?.toFixed(2)}% conversion rate
            </p>
          </div>
        )}
        {worstPerformer && (
          <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1">
              Needs Attention
            </p>
            <p className="text-lg font-bold text-orange-900">{worstPerformer.page_key}</p>
            <p className="text-sm text-orange-700 mt-1">
              {worstPerformer.conversion_rate?.toFixed(2)}% conversion rate
            </p>
          </div>
        )}
      </div>

      {/* Analytics Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-semibold text-foreground">Page</th>
              <th className="text-right py-2 px-3 font-semibold text-foreground">Views</th>
              <th className="text-right py-2 px-3 font-semibold text-foreground">Sessions</th>
              <th className="text-right py-2 px-3 font-semibold text-foreground">CTA Clicks</th>
              <th className="text-right py-2 px-3 font-semibold text-foreground">Conv. Rate</th>
              <th className="text-right py-2 px-3 font-semibold text-foreground">Scroll %</th>
              <th className="text-right py-2 px-3 font-semibold text-foreground">Bounce %</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-muted-foreground">
                  Loading analytics...
                </td>
              </tr>
            ) : analytics.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-6 text-center text-muted-foreground">
                  No analytics data for {selectedDate}
                </td>
              </tr>
            ) : (
              analytics.map((record) => (
                <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-3 font-medium text-foreground">{record.page_key}</td>
                  <td className="py-3 px-3 text-right text-foreground">{(record.impressions || 0).toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-foreground">{(record.sessions || 0).toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-foreground">{(record.cta_clicks || 0).toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {record.conversion_rate > 5 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : record.conversion_rate > 2 ? (
                        <TrendingDown className="w-4 h-4 text-orange-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-semibold">{record.conversion_rate?.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-foreground">
                    {record.scroll_completion_rate?.toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 text-right text-foreground">
                    {record.bounce_rate?.toFixed(0)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* UTM Insights */}
      {analytics.some((a) => a.top_utm_source) && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Traffic Sources (UTM)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {analytics.map((record) => (
              record.top_utm_source && (
                <div key={record.id} className="flex justify-between">
                  <span className="text-foreground">{record.page_key}</span>
                  <span className="text-muted-foreground">
                    {record.top_utm_source} {record.top_utm_campaign && `/ ${record.top_utm_campaign}`}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/50">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function getTodayISO() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}
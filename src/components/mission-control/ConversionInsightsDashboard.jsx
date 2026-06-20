import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function FunnelStage({ label, count, rate }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-white">
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{label}</p>
      <p className="text-3xl font-bold text-foreground">{count}</p>
      {rate !== undefined && <p className="text-xs text-muted-foreground mt-1">{rate}% conv.</p>}
    </div>
  );
}

function SourceRow({ source }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border hover:bg-gray-50/50 last:border-0">
      <div className="flex-1">
        <p className="font-semibold text-foreground capitalize text-sm">{source.source}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{source.total_leads} leads</p>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-sm font-bold text-foreground">{source.booking_rate}%</p>
          <p className="text-xs text-muted-foreground">Booking Rate</p>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{source.conversion_rate}%</p>
          <p className="text-xs text-muted-foreground">Conversions</p>
        </div>
      </div>
    </div>
  );
}

export default function ConversionInsightsDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('90');
  const [sourceFilter, setSourceFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const fetchInsights = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange) params.append('dateRange', dateRange);
      if (sourceFilter) params.append('source', sourceFilter);
      if (industryFilter) params.append('industry', industryFilter);
      
      const res = await base44.functions.invoke('getConversionInsights', {
        dateRange: parseInt(dateRange),
        ...(sourceFilter && { source: sourceFilter }),
        ...(industryFilter && { industry: industryFilter }),
      });
      setInsights(res?.data);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [dateRange, sourceFilter, industryFilter]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading conversion insights...</div>;
  }

  if (!insights) {
    return <div className="p-8 text-center text-red-600">Failed to load insights.</div>;
  }

  const { funnel_stages, conversion_rates, drop_off_analysis, source_performance, time_to_convert } = insights;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          Conversion Insights
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Funnel performance and drop-off analysis</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-white p-4 flex flex-wrap gap-3">
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Sources</option>
          <option value="website">Website</option>
          <option value="outbound">Outbound</option>
          <option value="campaign">Campaign</option>
          <option value="referral">Referral</option>
        </select>
      </div>

      {/* Funnel Overview */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Funnel Stages</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FunnelStage label="Created" count={funnel_stages.created} />
          <FunnelStage label="Contacted" count={funnel_stages.contacted} rate={conversion_rates.created_to_contacted} />
          <FunnelStage label="Responded" count={funnel_stages.responded} rate={conversion_rates.contacted_to_responded} />
          <FunnelStage label="Booked" count={funnel_stages.booked} rate={conversion_rates.responded_to_booked} />
          <FunnelStage label="Closed" count={funnel_stages.closed} rate={conversion_rates.booked_to_closed} />
        </div>
        <div className="mt-4 p-4 rounded-lg border border-border bg-blue-50">
          <p className="text-sm font-semibold text-foreground">Overall Conversion Rate</p>
          <p className="text-2xl font-bold text-primary mt-1">{conversion_rates.overall}%</p>
        </div>
      </div>

      {/* Drop-Off Analysis */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600" />
          Drop-Off Analysis
        </h3>
        <div className="space-y-3">
          {drop_off_analysis.stages.map((stage, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{stage.stage}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">{stage.rate}%</p>
                <p className="text-xs text-muted-foreground">{stage.leads} leads</p>
              </div>
            </div>
          ))}
        </div>
        {drop_off_analysis.top_drop_off && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-xs font-semibold text-yellow-900">Highest Drop-Off</p>
            <p className="text-sm font-bold text-yellow-900 mt-1">{drop_off_analysis.top_drop_off.stage} ({drop_off_analysis.top_drop_off.rate}%)</p>
          </div>
        )}
      </div>

      {/* Time to Convert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-white p-5">
          <p className="text-sm font-semibold text-muted-foreground uppercase">Avg. Days to Book</p>
          <p className="text-3xl font-bold text-foreground mt-2">{time_to_convert.average_days_to_book}</p>
          <p className="text-xs text-muted-foreground mt-2">{time_to_convert.leads_with_booking_time} leads with booking time</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5">
          <p className="text-sm font-semibold text-muted-foreground uppercase">Contact to Conversion</p>
          <p className="text-3xl font-bold text-foreground mt-2">{time_to_convert.average_days_contact_to_conversion}</p>
          <p className="text-xs text-muted-foreground mt-2">{time_to_convert.leads_with_conversion_time} leads with conversion time</p>
        </div>
      </div>

      {/* Source Performance */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="p-5 border-b border-border bg-gray-50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Source Performance
          </h3>
        </div>
        <div>
          {source_performance.length > 0 ? (
            source_performance.map((src, idx) => (
              <SourceRow key={idx} source={src} />
            ))
          ) : (
            <div className="p-5 text-center text-sm text-muted-foreground">No sources found</div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Clock, ArrowDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StageBar({ stage, count, rateFromPrev, maxCount }) {
  const width = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{stage}</span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-foreground">{count.toLocaleString()}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            rateFromPrev >= 70 ? 'bg-green-50 text-green-700' :
            rateFromPrev >= 40 ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700'
          }`}>{rateFromPrev}%</span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: '#00AEEF' }} />
      </div>
    </div>
  );
}

function SourceRow({ s }) {
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground capitalize">{s.source}</p>
        <p className="text-xs text-muted-foreground">{s.total} leads</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-foreground">{s.conversion_rate}%</p>
        <p className="text-xs text-muted-foreground">{s.booked} booked</p>
      </div>
    </div>
  );
}

export default function ConversionInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [sourceFilter, setSourceFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getConversionInsights', {
        date_range: dateRange,
        source_filter: sourceFilter || null,
        industry_filter: industryFilter || null,
      });
      setData(res?.data);
    } catch (err) {
      console.error('Failed to load conversion insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange, sourceFilter, industryFilter]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading conversion insights...</div>;
  if (!data) return <div className="p-8 text-center text-red-600">Failed to load data.</div>;

  const maxCount = data.funnel_stages[0]?.count || 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Conversion Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Funnel performance across {data.meta.total_leads.toLocaleString()} leads
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-3 py-1.5 rounded border border-border text-sm font-medium bg-white text-foreground cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 rounded border border-border text-sm font-medium bg-white text-foreground cursor-pointer"
          >
            <option value="">All Sources</option>
            {data.filter_options.sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            className="px-3 py-1.5 rounded border border-border text-sm font-medium bg-white text-foreground cursor-pointer"
          >
            <option value="">All Industries</option>
            {data.filter_options.industries.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Funnel Stages */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-bold text-foreground mb-5">Funnel Stages</h2>
        <div className="space-y-4">
          {data.funnel_stages.map((s, i) => (
            <StageBar key={i} {...s} maxCount={maxCount} rateFromPrev={s.rate_from_prev} />
          ))}
        </div>
      </div>

      {/* Drop-off & Time to Convert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop-off */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            Drop-Off Analysis
          </h3>
          {data.drop_off.biggest.from !== 'N/A' && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50/30 px-4 py-3">
              <p className="text-xs font-bold text-red-700 uppercase mb-1">Highest Drop-Off</p>
              <p className="text-sm font-semibold text-foreground">{data.drop_off.biggest.from}</p>
              <p className="text-xs text-muted-foreground">{data.drop_off.biggest.count} leads lost ({data.drop_off.biggest.rate}%)</p>
            </div>
          )}
          <div className="space-y-2">
            {data.drop_off.stages.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">{d.from}</span>
                </div>
                <span className={`text-sm font-bold ${d.rate > 50 ? 'text-red-600' : d.rate > 25 ? 'text-orange-600' : 'text-green-600'}`}>
                  -{d.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Time to Convert */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Time to Convert
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Avg. Time to First Contact</p>
              <p className="text-2xl font-bold text-foreground">
                {data.time_to_convert.avg_hours_to_contact != null
                  ? `${data.time_to_convert.avg_hours_to_contact}h`
                  : 'N/A'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Avg. Time to Booking</p>
              <p className="text-2xl font-bold text-foreground">
                {data.time_to_convert.avg_hours_to_book != null
                  ? `${data.time_to_convert.avg_hours_to_book}h`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Source Performance */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4">Source Performance</h3>
        <div>
          {data.source_performance.map((s, i) => (
            <SourceRow key={i} s={s} />
          ))}
          {data.source_performance.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No source data available</p>
          )}
        </div>
      </div>

      {/* Industry Breakdown */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4">Industry Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Industry</th>
                <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Leads</th>
                <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Booked</th>
                <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.industry_breakdown.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.industry}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.total}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.booked}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`font-bold ${row.conversion_rate >= 10 ? 'text-green-600' : row.conversion_rate >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {row.conversion_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
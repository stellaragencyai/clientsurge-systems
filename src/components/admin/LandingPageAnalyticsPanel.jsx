import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Eye, MousePointerClick, Clock, RefreshCw, ChevronDown } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value?.toLocaleString() ?? '—'}</p>
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function LandingPageAnalyticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [propertyId, setPropertyId] = useState('');

  const fetchData = async (overrideDays, overridePropertyId) => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getLandingPageAnalytics', {
        days: overrideDays ?? days,
        propertyId: (overridePropertyId ?? propertyId) || undefined,
      });
      setData(res.data);
      if (!propertyId && res.data?.propertyId) {
        setPropertyId(res.data.propertyId);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDaysChange = (newDays) => {
    setDays(newDays);
    fetchData(newDays, propertyId);
  };

  const handlePropertyChange = (newPropId) => {
    setPropertyId(newPropId);
    fetchData(days, newPropId);
  };

  const rows = data?.rows || [];
  const chartData = rows.slice(0, 10).map((r) => ({
    name: r.pagePath.replace(/^\//, '') || 'home',
    Sessions: r.sessions,
    Views: r.pageViews,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Landing Page Traffic</h2>
          <p className="text-sm text-muted-foreground">Google Analytics — service & industry pages</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Property selector */}
          {data?.properties?.length > 1 && (
            <div className="relative">
              <select
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          {/* Date range */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  days === d ? 'bg-primary text-white' : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Sessions" value={data.totals.sessions} icon={TrendingUp} color="bg-blue-500" />
            <StatCard label="Total Page Views" value={data.totals.pageViews} icon={Eye} color="bg-purple-500" />
            <StatCard label="Total Conversions" value={data.totals.conversions} icon={MousePointerClick} color="bg-green-500" />
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Top Pages by Sessions (last {days} days)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Views" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Page</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Sessions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Views</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Bounce Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Avg Duration</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No data found for service landing pages in the last {days} days.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{row.pagePath}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.pageTitle}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{row.sessions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-foreground">{row.pageViews.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${row.bounceRate > 0.7 ? 'text-red-600' : row.bounceRate > 0.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {(row.bounceRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {formatDuration(row.avgSessionDuration)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${row.conversions > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {row.conversions}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
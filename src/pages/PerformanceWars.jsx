import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Trophy, Flame, TrendingUp, Users, Zap, RefreshCw,
  Loader2, AlertCircle, Star, Crown, Medal, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Agent config ─────────────────────────────────────────────────────────────
const AGENTS = [
  { key: 'sales_rep_med_spa',      name: 'Sarah',  industry: 'Med Spa',       emoji: '💆',  avgDealValue: 800,  color: '#ec4899' },
  { key: 'sales_rep_dental',       name: 'Marcus', industry: 'Dental',        emoji: '🦷',  avgDealValue: 1200, color: '#06b6d4' },
  { key: 'sales_rep_chiropractic', name: 'Jordan', industry: 'Chiropractic',  emoji: '🦴',  avgDealValue: 600,  color: '#8b5cf6' },
  { key: 'sales_rep_hvac',         name: 'Tyler',  industry: 'HVAC',          emoji: '❄️',  avgDealValue: 950,  color: '#f97316' },
  { key: 'sales_rep_roofing',      name: 'Derek',  industry: 'Roofing',       emoji: '🏠',  avgDealValue: 2200, color: '#64748b' },
  { key: 'sales_rep_contractors',  name: 'Alex',   industry: 'Contractors',   emoji: '🔨',  avgDealValue: 1500, color: '#f59e0b' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dayKey(iso) { return iso ? iso.slice(0, 10) : null; }

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function fmtDay(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtUSD(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RankBadge({ rank }) {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 shadow-md">
      <Crown className="w-4 h-4 text-yellow-900" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
      <Medal className="w-4 h-4 text-slate-700" />
    </div>
  );
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
      <Medal className="w-4 h-4 text-amber-100" />
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    </div>
  );
}

function TrendIndicator({ value }) {
  if (value > 0) return <span className="flex items-center gap-0.5 text-green-600 text-xs font-bold"><ArrowUp className="w-3 h-3" />{value}%</span>;
  if (value < 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs font-bold"><ArrowDown className="w-3 h-3" />{Math.abs(value)}%</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="w-3 h-3" />0%</span>;
}

function ScoreBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function AgentRow({ agent, rank, maxRoi, maxLeads, maxConversion, isTop }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
      isTop
        ? 'border-yellow-400 bg-yellow-50 shadow-md'
        : rank <= 3
          ? 'border-border bg-white shadow-sm'
          : 'border-border/60 bg-white/60'
    }`}>
      <RankBadge rank={rank} />

      {/* Agent info */}
      <div className="w-28 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-base">{agent.meta.emoji}</span>
          <p className="font-bold text-foreground text-sm leading-tight">{agent.meta.name}</p>
          {isTop && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground">{agent.meta.industry}</p>
      </div>

      {/* Metric bars */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 text-right flex-shrink-0">Weekly ROI</span>
          <ScoreBar value={agent.weeklyRoi} max={maxRoi} color={agent.meta.color} />
          <span className="text-xs font-bold text-foreground w-16 text-right flex-shrink-0">{fmtUSD(agent.weeklyRoi)}</span>
          <TrendIndicator value={agent.roiTrend} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 text-right flex-shrink-0">Throughput</span>
          <ScoreBar value={agent.weeklyLeads} max={maxLeads} color={agent.meta.color} />
          <span className="text-xs font-bold text-foreground w-16 text-right flex-shrink-0">{agent.weeklyLeads} leads</span>
          <TrendIndicator value={agent.leadTrend} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 text-right flex-shrink-0">Conversion</span>
          <ScoreBar value={agent.conversionRate} max={maxConversion || 100} color={agent.meta.color} />
          <span className="text-xs font-bold text-foreground w-16 text-right flex-shrink-0">{agent.conversionRate}%</span>
          <TrendIndicator value={agent.conversionTrend} />
        </div>
      </div>

      {/* Score pill */}
      <div className="flex-shrink-0 text-center">
        <div
          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2"
          style={{ borderColor: agent.meta.color, background: `${agent.meta.color}15` }}
        >
          <p className="text-lg font-black" style={{ color: agent.meta.color }}>{agent.score}</p>
          <p className="text-[9px] text-muted-foreground font-semibold">SCORE</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PerformanceWars() {
  const [rankedAgents, setRankedAgents] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [topPerformer, setTopPerformer] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [allLeads] = await Promise.all([
        base44.entities.Leads.list('-created_date', 2000),
      ]);

      const days30 = last30Days();
      const days7 = last7Days();
      const sevenDaysAgo = days7[0];
      const prevSevenStart = new Date(days7[0]);
      prevSevenStart.setDate(prevSevenStart.getDate() - 7);
      const prevSevenStartStr = prevSevenStart.toISOString().slice(0, 10);

      // Build per-agent stats
      const computed = AGENTS.map(meta => {
        const leads = allLeads.filter(l => l.assigned_agent_name === meta.key);
        const weekLeads = leads.filter(l => dayKey(l.created_date) >= sevenDaysAgo);
        const prevWeekLeads = leads.filter(l => {
          const dk = dayKey(l.created_date);
          return dk >= prevSevenStartStr && dk < sevenDaysAgo;
        });

        const weekBooked = weekLeads.filter(l => ['Booked', 'Closed'].includes(l.status)).length;
        const prevBooked = prevWeekLeads.filter(l => ['Booked', 'Closed'].includes(l.status)).length;

        const weeklyRoi = weekBooked * meta.avgDealValue;
        const prevRoi = prevBooked * meta.avgDealValue;
        const roiTrend = prevRoi > 0 ? Math.round(((weeklyRoi - prevRoi) / prevRoi) * 100) : (weeklyRoi > 0 ? 100 : 0);

        const leadTrend = prevWeekLeads.length > 0
          ? Math.round(((weekLeads.length - prevWeekLeads.length) / prevWeekLeads.length) * 100)
          : (weekLeads.length > 0 ? 100 : 0);

        // Conversion = booked / total leads this week (or all time if few this week)
        const baseLeads = weekLeads.length > 0 ? weekLeads : leads.slice(-50);
        const baseBooked = baseLeads.filter(l => ['Booked', 'Closed'].includes(l.status)).length;
        const conversionRate = baseLeads.length > 0 ? Math.round((baseBooked / baseLeads.length) * 100) : 0;

        // Previous conversion for trend
        const prevConversion = prevWeekLeads.length > 0
          ? Math.round((prevBooked / prevWeekLeads.length) * 100)
          : 0;
        const conversionTrend = prevConversion > 0
          ? Math.round(((conversionRate - prevConversion) / prevConversion) * 100)
          : (conversionRate > 0 ? 100 : 0);

        // Composite score (0-100): 40% ROI weight, 30% throughput, 30% conversion
        const roiScore = weeklyRoi;
        const score = Math.round(roiScore * 0.00001 + weekLeads.length * 3 + conversionRate * 3);

        // 30-day daily conversion trend
        const daily30 = days30.map(day => {
          const dayLeads = leads.filter(l => dayKey(l.created_date) === day);
          const dayBooked = dayLeads.filter(l => ['Booked', 'Closed'].includes(l.status)).length;
          return {
            date: day,
            conversion: dayLeads.length > 0 ? Math.round((dayBooked / dayLeads.length) * 100) : 0,
            leads: dayLeads.length,
          };
        });

        return {
          meta,
          weeklyLeads: weekLeads.length,
          weeklyRoi,
          conversionRate,
          roiTrend,
          leadTrend,
          conversionTrend,
          score,
          daily30,
        };
      });

      // Rank by composite score desc
      const ranked = [...computed].sort((a, b) => b.score - a.score);
      setRankedAgents(ranked);
      setTopPerformer(ranked[0]);

      // Build 30-day combined trend chart (one line per agent)
      const combined = days30.map((day, idx) => {
        const point = { date: day, label: fmtDay(day) };
        computed.forEach(a => {
          point[a.meta.name] = a.daily30[idx]?.conversion ?? 0;
        });
        return point;
      });
      setTrendData(combined);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const maxRoi = Math.max(...rankedAgents.map(a => a.weeklyRoi), 1);
  const maxLeads = Math.max(...rankedAgents.map(a => a.weeklyLeads), 1);
  const maxConversion = Math.max(...rankedAgents.map(a => a.conversionRate), 1);

  const totalWeeklyRoi = rankedAgents.reduce((s, a) => s + a.weeklyRoi, 0);
  const totalWeeklyLeads = rankedAgents.reduce((s, a) => s + a.weeklyLeads, 0);
  const avgConversion = rankedAgents.length > 0
    ? Math.round(rankedAgents.reduce((s, a) => s + a.conversionRate, 0) / rankedAgents.length)
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Admin</Link>
            <h1 className="text-3xl font-black text-foreground mt-1 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-500" />
              Performance Wars
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly rankings across all 6 industry AI agents — ROI, lead throughput, and conversion efficiency.
            </p>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mt-1">Updated {lastRefresh.toLocaleTimeString()}</p>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* System KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Weekly Revenue Est.', value: fmtUSD(totalWeeklyRoi), icon: TrendingUp, color: 'text-green-700' },
            { label: 'Weekly Leads', value: totalWeeklyLeads.toString(), icon: Users, color: 'text-primary' },
            { label: 'Avg Conversion', value: `${avgConversion}%`, icon: Zap, color: 'text-yellow-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-border p-5 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              {loading
                ? <div className="h-8 w-20 bg-muted animate-pulse rounded mx-auto mt-1" />
                : <p className={`text-2xl font-black ${color}`}>{value}</p>}
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Top Performer Banner */}
        {!loading && topPerformer && (
          <div
            className="rounded-2xl p-6 flex items-center gap-5 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${topPerformer.meta.color} 0%, ${topPerformer.meta.color}99 100%)` }}
          >
            <div className="absolute top-0 right-0 opacity-10">
              <Trophy className="w-40 h-40 -mt-8 -mr-8" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
              {topPerformer.meta.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest opacity-75">⭐ Top Performer This Week</span>
              </div>
              <h2 className="text-2xl font-black mt-0.5">
                {topPerformer.meta.name} — {topPerformer.meta.industry}
              </h2>
              <div className="flex items-center gap-5 mt-2 flex-wrap text-sm">
                <span className="bg-white/20 rounded-lg px-3 py-1 font-bold">{fmtUSD(topPerformer.weeklyRoi)} est. ROI</span>
                <span className="bg-white/20 rounded-lg px-3 py-1 font-bold">{topPerformer.weeklyLeads} leads this week</span>
                <span className="bg-white/20 rounded-lg px-3 py-1 font-bold">{topPerformer.conversionRate}% conversion</span>
                <span className="bg-white/20 rounded-lg px-3 py-1 font-bold">Score: {topPerformer.score}</span>
              </div>
            </div>
            <Star className="w-8 h-8 opacity-60 flex-shrink-0" />
          </div>
        )}

        {/* Leaderboard */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Agent Leaderboard
            <span className="text-xs font-normal text-muted-foreground">This week vs. last week</span>
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {rankedAgents.map((agent, i) => (
                <AgentRow
                  key={agent.meta.key}
                  agent={agent}
                  rank={i + 1}
                  maxRoi={maxRoi}
                  maxLeads={maxLeads}
                  maxConversion={maxConversion}
                  isTop={i === 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* 30-Day Conversion Growth Trend */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Lead Conversion Growth — 30 Days
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Daily conversion rate (%) per agent over the past month</p>
          {loading ? (
            <div className="h-64 bg-muted animate-pulse rounded-xl" />
          ) : trendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No trend data yet — agents will appear here as leads are assigned.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 'auto']} />
                <Tooltip
                  formatter={(v, name) => [`${v}%`, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {AGENTS.map(a => (
                  <Line
                    key={a.key}
                    type="monotone"
                    dataKey={a.name}
                    stroke={a.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Scoring legend */}
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">How Scores Are Calculated</h3>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <p className="font-bold text-foreground mb-0.5">Weekly ROI</p>
              <p>Estimated revenue = bookings this week × avg deal value per industry (Med Spa $800, Dental $1,200, Roofing $2,200, etc.)</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-0.5">Lead Throughput</p>
              <p>Raw number of new leads assigned to each agent in the past 7 days. Higher = more active pipeline.</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-0.5">Conversion Efficiency</p>
              <p>Booked ÷ total leads this week (%). Trend arrows show change vs. the prior 7-day window.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
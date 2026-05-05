import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, TrendingUp, PhoneCall, Calendar, MessageSquare,
  RefreshCw, Loader2, ChevronDown, ChevronUp, Zap, Target,
  Mail, AlertCircle, Clock, ArrowUpRight, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AGENT_COLORS = {
  sales_rep_med_spa:      { bg: 'bg-pink-50',   border: 'border-pink-200',   badge: 'bg-pink-100 text-pink-800',   chart: '#ec4899' },
  sales_rep_dental:       { bg: 'bg-cyan-50',    border: 'border-cyan-200',   badge: 'bg-cyan-100 text-cyan-800',   chart: '#06b6d4' },
  sales_rep_chiropractic: { bg: 'bg-purple-50',  border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', chart: '#8b5cf6' },
  sales_rep_hvac:         { bg: 'bg-orange-50',  border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', chart: '#f97316' },
  sales_rep_roofing:      { bg: 'bg-slate-50',   border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-700', chart: '#64748b' },
  sales_rep_contractors:  { bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800', chart: '#f59e0b' },
};

function fmt(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function KpiCard({ label, value, sub, icon: Icon, color = 'text-foreground', loading }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/50" />}
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
      ) : (
        <p className={`text-3xl font-black ${color}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-muted-foreground w-20 text-right flex-shrink-0">{label}</p>
      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs font-bold text-foreground w-12 text-right flex-shrink-0">{value.toLocaleString()}</p>
    </div>
  );
}

function AgentCard({ agent, expanded, onToggle }) {
  const c = AGENT_COLORS[agent.agent_key] || {};
  const trendData = (agent.trend || []).filter((_, i) => i % 3 === 0); // sample every 3 days for mini chart

  return (
    <div className={`rounded-xl border-2 ${c.border || 'border-border'} overflow-hidden transition-shadow hover:shadow-md`}>
      {/* Header */}
      <div
        className={`flex items-center gap-4 p-5 cursor-pointer ${c.bg || 'bg-white'}`}
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-base">{agent.name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge || 'bg-muted text-muted-foreground'}`}>
              {agent.industry}
            </span>
            {agent.failed_events > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {agent.failed_events} failed
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> {agent.total_leads} total leads
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {agent.booked} booked
            </span>
            {agent.avg_response_minutes != null && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{agent.avg_response_minutes}m avg response
              </span>
            )}
          </div>
        </div>

        {/* Conversion ring summary */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          {[
            { label: 'Contact', value: agent.contact_rate },
            { label: 'Reply', value: agent.reply_rate },
            { label: 'Book', value: agent.booking_rate },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-black text-foreground">{value}%</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Mini trend */}
        <div className="hidden lg:block w-24 h-10 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line type="monotone" dataKey="leads" dot={false} stroke={c.chart || '#00AEEF'} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="bg-white border-t border-border p-5 space-y-6">
          {/* Funnel */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Conversion Funnel</p>
            <div className="space-y-2">
              <FunnelBar label="Contacted" value={agent.contacted} max={agent.total_leads} color={c.chart || '#00AEEF'} />
              <FunnelBar label="Replied" value={agent.replied} max={agent.total_leads} color={c.chart || '#00AEEF'} />
              <FunnelBar label="Booked" value={agent.booked} max={agent.total_leads} color={c.chart || '#00AEEF'} />
              <FunnelBar label="Closed" value={agent.closed} max={agent.total_leads} color={c.chart || '#00AEEF'} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { label: 'SMS Sent', value: agent.sms_sent, Icon: MessageSquare },
              { label: 'Emails Sent', value: agent.email_sent, Icon: Mail },
              { label: 'Voice Calls', value: agent.voice_calls, Icon: PhoneCall },
              { label: 'Voice Answered', value: agent.voice_answered, Icon: PhoneCall },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="rounded-lg bg-muted/30 border border-border p-3">
                <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* 30-Day Trend Chart */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">30-Day Lead & Booking Trend</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={agent.trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10 }} interval={6} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v, n) => [v, n === 'leads' ? 'Leads' : 'Booked']}
                  labelFormatter={fmt}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="leads" stroke={c.chart || '#00AEEF'} fill={c.chart || '#00AEEF'} fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="booked" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AISalesCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getAgentPerformanceMetrics', {});
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const agents = data?.agents || [];
  const system = data?.system || {};

  // Top performer
  const topAgent = [...agents].sort((a, b) => b.booked - a.booked)[0];

  // Aggregate bar chart: booking rate per agent
  const bookingRateData = agents.map(a => ({
    name: a.name,
    industry: a.industry,
    bookingRate: a.booking_rate,
    leads: a.total_leads,
    fill: AGENT_COLORS[a.agent_key]?.chart || '#00AEEF',
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Admin</Link>
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              AI Sales Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live performance metrics for all 6 industry AI sales agents — conversion rates, bookings, and 30-day trends.
            </p>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mt-1">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Leads" value={system.total_leads?.toLocaleString() ?? '—'} icon={Users} loading={loading} />
          <KpiCard label="Total Booked" value={system.total_booked?.toLocaleString() ?? '—'} icon={Calendar} color="text-green-700" loading={loading} />
          <KpiCard label="Overall Booking Rate" value={system.overall_booking_rate != null ? `${system.overall_booking_rate}%` : '—'} icon={TrendingUp} color="text-primary" loading={loading} />
          <KpiCard
            label="Top Agent"
            value={topAgent?.name ?? '—'}
            sub={topAgent ? `${topAgent.booked} bookings · ${topAgent.industry}` : ''}
            icon={Target}
            color="text-foreground"
            loading={loading}
          />
        </div>

        {/* System 30-day trend */}
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              System-Wide 30-Day Lead Volume
            </h2>
          </div>
          {loading ? (
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={system.trend || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v, n) => [v, n === 'leads' ? 'New Leads' : n === 'booked' ? 'Booked' : 'Replied']}
                  labelFormatter={fmt}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" name="New Leads" stroke="#00AEEF" fill="#00AEEF" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="replied" name="Replied" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="booked" name="Booked" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking Rate Comparison Bar Chart */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Booking Rate by Agent
          </h2>
          {loading ? (
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bookingRateData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Booking Rate']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="bookingRate" name="Booking Rate" radius={[4, 4, 0, 0]}>
                  {bookingRateData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Per-Agent Cards */}
        <div>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Agent Performance Breakdown
            <span className="text-xs font-normal text-muted-foreground ml-1">— click to expand</span>
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No agent data yet</p>
              <p className="text-sm mt-1">Agents will appear here once leads are assigned to them.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map(agent => (
                <AgentCard
                  key={agent.agent_key}
                  agent={agent}
                  expanded={expandedAgent === agent.agent_key}
                  onToggle={() => setExpandedAgent(expandedAgent === agent.agent_key ? null : agent.agent_key)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            How This Command Center Works
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">Real-Time Agent Data</p>
              <p>All metrics are pulled live from the Leads entity filtered by <code className="bg-muted px-1 rounded text-xs">assigned_agent_name</code>. Each of the 6 industry AI reps has its own funnel tracked here.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Conversion Funnel</p>
              <p>Tracks every stage: <strong>Contacted → Replied → Booked → Closed</strong>. Booking rate is calculated as booked ÷ replied, giving the most meaningful signal of agent effectiveness.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">30-Day Trend</p>
              <p>Each agent shows a daily volume chart for new leads and bookings. System-wide trend shows the full pipeline health across all 6 industries over the past month.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
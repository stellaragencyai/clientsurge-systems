import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Clock, DollarSign } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [leads, setLeads] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const leadsData = await base44.entities.Leads.list('-created_date', 200);
      setLeads(leadsData);

      // Calculate metrics
      const last7Days = getLast7DaysData(leadsData);
      const conversionRate = calculateConversionRate(leadsData);
      const avgResponseTime = calculateResponseTime(leadsData);
      const roiMetrics = calculateROI(leadsData);

      setAnalytics({ last7Days, conversionRate, avgResponseTime, roiMetrics });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLast7DaysData = (leadsData) => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      const count = leadsData.filter(l => 
        new Date(l.created_date).toLocaleDateString() === dateStr
      ).length;
      data.push({ date: dateStr.split('/').slice(0, 2).join('/'), leads: count });
    }
    return data;
  };

  const calculateConversionRate = (leadsData) => {
    const booked = leadsData.filter(l => l.status === 'Booked').length;
    return leadsData.length > 0 ? Math.round((booked / leadsData.length) * 100) : 0;
  };

  const calculateResponseTime = (leadsData) => {
    const responded = leadsData.filter(l => l.last_contacted_at).length;
    return responded > 0 ? '< 2 hours' : 'N/A';
  };

  const calculateROI = (leadsData) => {
    const booked = leadsData.filter(l => l.status === 'Booked').length;
    const avgValue = 2500; // Assumed avg booking value
    const setupCost = 1997;
    const monthlyCost = 797;
    const revenue = booked * avgValue;
    const roi = revenue > (setupCost + monthlyCost) ? 'Positive' : 'In Progress';
    return { booked, revenue, roi };
  };

  const pipelineData = [
    { name: 'New', value: leads.filter(l => l.status === 'New').length, fill: '#3b82f6' },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length, fill: '#8b5cf6' },
    { name: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length, fill: '#10b981' },
    { name: 'Booked', value: leads.filter(l => l.status === 'Booked').length, fill: '#059669' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${analytics?.conversionRate}%`}
          color="blue"
        />
        <MetricCard
          icon={Target}
          label="Qualified Leads"
          value={leads.filter(l => l.status === 'Qualified').length}
          color="green"
        />
        <MetricCard
          icon={Clock}
          label="Avg Response Time"
          value={analytics?.avgResponseTime}
          color="purple"
        />
        <MetricCard
          icon={DollarSign}
          label="Projected Revenue"
          value={`$${analytics?.roiMetrics?.revenue?.toLocaleString()}`}
          color="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Trend */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Lead Volume (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics?.last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Pipeline Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {pipelineData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  {item.name}
                </span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROI Summary */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">ROI Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Booked Appointments</p>
            <p className="text-3xl font-bold text-foreground">{analytics?.roiMetrics?.booked}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Est. Revenue</p>
            <p className="text-3xl font-bold text-green-600">${analytics?.roiMetrics?.revenue?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">ROI Status</p>
            <p className={`text-3xl font-bold ${analytics?.roiMetrics?.roi === 'Positive' ? 'text-green-600' : 'text-yellow-600'}`}>
              {analytics?.roiMetrics?.roi}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className={`rounded-xl border border-border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium opacity-75">{label}</p>
        <Icon className="w-4 h-4 opacity-75" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 174, 239, 0.08)' }}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      </div>
    </div>
  );
}

function RevenueRow({ data, index }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border last:border-0 hover:bg-gray-50/50">
      <div className="flex-1">
        <p className="font-semibold text-foreground text-sm">{data.business_name || data.lead_name}</p>
        <p className="text-xs text-muted-foreground">{data.source || 'Unknown'}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-foreground">${data.revenue_amount?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-muted-foreground capitalize">{data.revenue_source || 'Direct'}</p>
        </div>
        {data.conversion_date && (
          <span className="text-xs text-muted-foreground">{new Date(data.conversion_date).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

export default function RevenueTrackingDashboard() {
  const [revenueData, setRevenueData] = useState(null);
  const [revenueRecords, setRevenueRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState(null);
  const [filterChannel, setFilterChannel] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const records = await base44.admin.entities.RevenueTracking.list('-conversion_date', 100);
        setRevenueRecords(records || []);

        // Compute summary metrics
        const totalRevenue = records.reduce((sum, r) => sum + (r.revenue_amount || 0), 0);
        const leadRevenue = records
          .filter(r => r.revenue_source === 'lead')
          .reduce((sum, r) => sum + (r.revenue_amount || 0), 0);
        const campaignRevenue = records
          .filter(r => r.revenue_source === 'campaign')
          .reduce((sum, r) => sum + (r.revenue_amount || 0), 0);
        const avgPerLead = records.length > 0 ? totalRevenue / records.length : 0;

        setRevenueData({
          total_revenue: totalRevenue,
          lead_revenue: leadRevenue,
          campaign_revenue: campaignRevenue,
          average_per_lead: avgPerLead,
          conversion_count: records.length,
        });
      } catch (err) {
        console.error('Failed to fetch revenue data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading revenue data...</div>;
  }

  const filteredRecords = revenueRecords.filter(r => {
    if (filterSource && r.revenue_source !== filterSource) return false;
    if (filterChannel && r.channel !== filterChannel) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-primary" />
          Revenue Tracking
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track revenue generated from leads and campaigns</p>
      </div>

      {/* Summary Metrics */}
      {revenueData && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Total Revenue" value={`$${revenueData.total_revenue.toFixed(2)}`} icon={DollarSign} />
            <MetricCard label="Lead Revenue" value={`$${revenueData.lead_revenue.toFixed(2)}`} icon={DollarSign} />
            <MetricCard label="Campaign Revenue" value={`$${revenueData.campaign_revenue.toFixed(2)}`} icon={DollarSign} />
            <MetricCard label="Avg Per Lead" value={`$${revenueData.average_per_lead.toFixed(2)}`} icon={TrendingUp} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-border bg-white p-4 flex flex-wrap gap-3 items-center">
        <select
          value={filterSource || ''}
          onChange={e => setFilterSource(e.target.value || null)}
          className="px-3 py-1.5 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Sources</option>
          <option value="lead">Lead</option>
          <option value="outbound">Outbound</option>
          <option value="campaign">Campaign</option>
          <option value="referral">Referral</option>
          <option value="manual">Manual</option>
        </select>
        <select
          value={filterChannel || ''}
          onChange={e => setFilterChannel(e.target.value || null)}
          className="px-3 py-1.5 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Channels</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
          <option value="web">Web</option>
          <option value="call">Call</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Recent Conversions */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="p-5 border-b border-border bg-gray-50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            Recent Conversions ({filteredRecords.length})
          </h3>
        </div>
        <div>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, idx) => (
              <RevenueRow key={record.id || idx} data={record} index={idx} />
            ))
          ) : (
            <div className="p-5 text-center text-sm text-muted-foreground">
              No revenue records match the selected filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
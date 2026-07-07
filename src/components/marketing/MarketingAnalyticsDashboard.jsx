import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, RefreshCw, BarChart3, MousePointer, Users, Target } from 'lucide-react';

export default function MarketingAnalyticsDashboard() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MarketingAnalyticsSnapshot.list('-captured_at', 100);
      setSnapshots(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Aggregate by platform
  const byPlatform = {};
  snapshots.forEach(s => {
    if (!byPlatform[s.platform]) {
      byPlatform[s.platform] = { impressions: 0, clicks: 0, likes: 0, comments: 0, shares: 0, leads: 0, website_sessions: 0 };
    }
    byPlatform[s.platform].impressions += s.impressions || 0;
    byPlatform[s.platform].clicks += s.clicks || 0;
    byPlatform[s.platform].likes += s.likes || 0;
    byPlatform[s.platform].comments += s.comments || 0;
    byPlatform[s.platform].shares += s.shares || 0;
    byPlatform[s.platform].leads += s.leads_created || 0;
    byPlatform[s.platform].website_sessions += s.website_sessions || 0;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (snapshots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <h3 className="font-semibold text-foreground mb-1">No Analytics Data Yet</h3>
        <p className="text-muted-foreground text-sm">Analytics will appear once platforms are connected and posts are published. No fabricated metrics are shown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingUp} label="Total Impressions" value={snapshots.reduce((a, s) => a + (s.impressions || 0), 0)} />
        <SummaryCard icon={MousePointer} label="Total Clicks" value={snapshots.reduce((a, s) => a + (s.clicks || 0), 0)} />
        <SummaryCard icon={Users} label="Total Engagement" value={snapshots.reduce((a, s) => a + (s.likes || 0) + (s.comments || 0) + (s.shares || 0), 0)} />
        <SummaryCard icon={Target} label="Leads from Social" value={snapshots.reduce((a, s) => a + (s.leads_created || 0), 0)} />
      </div>

      {/* Per-platform breakdown */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Per-Platform Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(byPlatform).map(([platform, metrics]) => (
            <div key={platform} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground capitalize mb-2">{platform.replace(/_/g, ' ')}</h3>
              <div className="space-y-1 text-sm">
                <MetricRow label="Impressions" value={metrics.impressions} />
                <MetricRow label="Clicks" value={metrics.clicks} />
                <MetricRow label="Likes" value={metrics.likes} />
                <MetricRow label="Comments" value={metrics.comments} />
                <MetricRow label="Shares" value={metrics.shares} />
                <MetricRow label="Website Sessions" value={metrics.website_sessions} />
                <MetricRow label="Leads Created" value={metrics.leads} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data source notice */}
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <strong>Data Sources:</strong> Metrics are labeled by source — platform_api, ga4, lead_entity, manual, or not_connected.
        "Not connected" means the data source is not yet configured. No fabricated or estimated metrics are shown.
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{(value || 0).toLocaleString()}</span>
    </div>
  );
}
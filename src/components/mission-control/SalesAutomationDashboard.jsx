import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Users, TrendingUp, MessageSquare, CheckCircle, Zap, Target,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SalesAutomationDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch metrics
        const metricsRes = await base44.asServiceRole.functions.invoke('getSalesAutomationMetrics', {
          period: '30d',
        });
        setMetrics(metricsRes.data?.metrics);

        // Fetch recent leads
        const recentLeads = await base44.asServiceRole.entities.OutboundLead.filter(
          {},
          '-last_activity_at',
          20
        ).catch(() => []);
        setLeads(recentLeads || []);
      } catch (error) {
        console.error('Error loading sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Leads</p>
              <p className="text-3xl font-bold text-foreground mt-1">{metrics.total_leads}</p>
            </div>
            <Users className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Contacted</p>
              <p className="text-3xl font-bold text-foreground mt-1">{metrics.leads_contacted}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Response Rate</p>
              <p className="text-3xl font-bold text-foreground mt-1">{metrics.response_rate}%</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Conversion Rate</p>
              <p className="text-3xl font-bold text-foreground mt-1">{metrics.conversion_rate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Top Sequences */}
      {metrics.top_sequences?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Sequences
          </h3>
          <div className="space-y-2">
            {metrics.top_sequences.map((seq, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{seq.name}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {seq.conversion_rate}% conversion
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{seq.leads_sent} leads sent</span>
                  <span>{seq.conversions} conversions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Leads */}
      <div>
        <h3 className="font-semibold mb-4">Recent Outbound Leads</h3>
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">No outbound leads yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map(lead => (
              <div key={lead.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-semibold text-sm">{lead.business_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    lead.outreach_status === 'converted'
                      ? 'bg-green-100 text-green-700'
                      : lead.outreach_status === 'replied'
                      ? 'bg-blue-100 text-blue-700'
                      : lead.outreach_status === 'contacted'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.outreach_status}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  <span>{lead.total_outreach_messages} messages</span>
                  <span>{lead.total_replies} replies</span>
                  {lead.last_activity_at && (
                    <span>{formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
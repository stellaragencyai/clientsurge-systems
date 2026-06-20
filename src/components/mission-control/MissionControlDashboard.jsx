import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageSquare, Zap, Target, DollarSign, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MissionControlMetricsCard from './MissionControlMetricsCard';
import SalesPipelineVisual from './SalesPipelineVisual';
import LiveActivityStream from './LiveActivityStream';

export default function MissionControlDashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState({
    total_leads: 0,
    active_automations: 0,
    messages_sent: 0,
    bookings: 0,
    revenue_impact: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Load metrics with individual error handling for each query
        let leads = [];
        let automations = [];
        let events = [];
        let conversions = [];

        try {
          leads = await base44.asServiceRole.entities.Leads.list('-created_date', 1);
        } catch (e) {
          console.warn('Failed to load leads:', e);
        }

        try {
          automations = await base44.asServiceRole.entities.AutomationRule.filter({ status: 'active' }, '-created_date', 1);
        } catch (e) {
          console.warn('Failed to load automations:', e);
        }

        try {
          events = await base44.asServiceRole.entities.CommunicationEvent.list('-created_date', 1);
        } catch (e) {
          console.warn('Failed to load events:', e);
        }

        try {
          conversions = await base44.asServiceRole.entities.ConversionFunnel.list('-created_date', 1);
        } catch (e) {
          console.warn('Failed to load conversions:', e);
        }

        setMetrics({
          total_leads: (leads || []).length,
          active_automations: (automations || []).length,
          messages_sent: (events || []).length,
          bookings: conversions?.[0]?.funnel_stages?.find(s => s.stage_name === 'booked')?.total_count || 0,
          revenue_impact: conversions?.[0]?.total_revenue_attributed || 0,
        });
      } catch (e) {
        console.error('Critical error loading metrics:', e);
        // Set default metrics on critical error
        setMetrics({
          total_leads: 0,
          active_automations: 0,
          messages_sent: 0,
          bookings: 0,
          revenue_impact: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  const metricCards = [
    {
      id: 'leads',
      label: 'Total Leads',
      value: metrics.total_leads,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-700',
      onClick: () => onNavigate('leads'),
    },
    {
      id: 'automations',
      label: 'Active Automations',
      value: metrics.active_automations,
      icon: Zap,
      color: 'bg-purple-50 text-purple-700',
      onClick: () => onNavigate('automation'),
    },
    {
      id: 'messages',
      label: 'Messages Sent',
      value: metrics.messages_sent,
      icon: MessageSquare,
      color: 'bg-green-50 text-green-700',
      onClick: () => onNavigate('system-health'),
    },
    {
      id: 'bookings',
      label: 'Bookings',
      value: metrics.bookings,
      icon: Target,
      color: 'bg-orange-50 text-orange-700',
      onClick: () => onNavigate('funnels'),
    },
    {
      id: 'revenue',
      label: 'Revenue Impact',
      value: `$${(metrics.revenue_impact / 1000).toFixed(1)}k`,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700',
      onClick: () => onNavigate('funnels'),
    },
  ];

  return (
    <div className="space-y-12">
      {/* Section A — Executive Metrics */}
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Executive Metrics</h2>
          <div className="w-1 h-8 bg-primary rounded-sm mt-3" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {metricCards.map((card) => (
              <MissionControlMetricsCard key={card.id} {...card} />
            ))}
          </div>
        )}
      </div>

      {/* Section B — Sales Pipeline */}
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Sales Pipeline</h2>
          <div className="w-1 h-8 bg-primary rounded-sm mt-3" />
        </div>
        <SalesPipelineVisual onNavigate={onNavigate} />
      </div>

      {/* Section C — Live Activity Stream */}
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-black text-foreground tracking-tight">Live Activity Stream</h2>
          <div className="w-1 h-8 bg-primary rounded-sm mt-3" />
        </div>
        <LiveActivityStream />
      </div>
    </div>
  );
}
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

export default function LeadMetrics({ analytics }) {
  const metrics = [
    {
      icon: Users,
      label: 'Total Leads',
      value: analytics?.total_leads || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: TrendingUp,
      label: 'New Leads (Today)',
      value: analytics?.new_leads || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Target,
      label: 'High Quality',
      value: analytics?.high_quality_count || 0,
      subtext: `${analytics?.total_leads > 0 ? Math.round((analytics.high_quality_count / analytics.total_leads) * 100) : 0}%`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: BarChart3,
      label: 'Avg Lead Score',
      value: analytics?.avg_lead_score || 0,
      subtext: '/100',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  // Pipeline distribution
  const pipelineMetrics = [
    { label: 'New', value: analytics?.stage_new || 0, color: 'bg-slate-400' },
    { label: 'Qualified', value: analytics?.stage_qualified || 0, color: 'bg-blue-400' },
    { label: 'Contacted', value: analytics?.stage_contacted || 0, color: 'bg-yellow-400' },
    { label: 'Responded', value: analytics?.stage_responded || 0, color: 'bg-cyan-400' },
    { label: 'Booked', value: analytics?.stage_booked || 0, color: 'bg-green-400' },
    { label: 'Closed', value: analytics?.stage_closed || 0, color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                      {metric.subtext && <span className="text-sm text-muted-foreground">{metric.subtext}</span>}
                    </div>
                  </div>
                  <div className={`${metric.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline Distribution */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">Pipeline Distribution</h3>
          <div className="space-y-2">
            {pipelineMetrics.map((stage, i) => {
              const total = analytics?.total_leads || 1;
              const percentage = (stage.value / total) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                    <span className="text-xs font-semibold">{stage.value}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${stage.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
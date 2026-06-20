import React from 'react';
import { TrendingUp, MessageSquare, Zap, AlertCircle, Activity } from 'lucide-react';

function NoteCard({ icon: Icon, title, description, category, value }) {
  const categoryColors = {
    'Leads': 'bg-blue-50 text-blue-700 border-blue-200',
    'Messaging': 'bg-green-50 text-green-700 border-green-200',
    'Automation': 'bg-purple-50 text-purple-700 border-purple-200',
    'System': 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className="rounded-lg border border-border bg-white p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 174, 239, 0.08)' }}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryColors[category] || categoryColors['System']}`}>
          {category}
        </span>
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        {value !== undefined && (
          <p className="text-lg font-bold text-primary mt-2">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function SystemNotesSection({ insights }) {
  if (!insights) return null;

  const { top_lead_sources, performance_summary, top_automation_types, top_failures, daily_activity } = insights;

  // Build note cards
  const notes = [
    // Top lead source
    top_lead_sources && top_lead_sources.length > 0 && {
      icon: TrendingUp,
      title: `Top Lead Source: ${top_lead_sources[0].source}`,
      description: `${top_lead_sources[0].total} leads with ${top_lead_sources[0].conversion_rate}% conversion rate`,
      category: 'Leads',
      value: `${top_lead_sources[0].booked} booked`,
    },

    // Average response time
    performance_summary && {
      icon: Activity,
      title: 'Average Response Time',
      description: `System responds to leads in ${performance_summary.avg_response_time_minutes} minutes on average`,
      category: 'System',
      value: `${performance_summary.avg_response_time_minutes}m`,
    },

    // Most used automation type
    top_automation_types && top_automation_types.length > 0 && {
      icon: Zap,
      title: `Most Used Automation: ${top_automation_types[0].type}`,
      description: `${top_automation_types[0].count} jobs executed with ${top_automation_types[0].success_rate}% success rate`,
      category: 'Automation',
      value: `${top_automation_types[0].success_rate}%`,
    },

    // Most common failure
    top_failures && top_failures.length > 0 && {
      icon: AlertCircle,
      title: `Top Failure Category: ${top_failures[0].reason}`,
      description: `${top_failures[0].count} failures detected. Review and address this category.`,
      category: 'Automation',
      value: `${top_failures[0].count} failures`,
    },

    // Daily activity summary
    daily_activity && {
      icon: MessageSquare,
      title: 'Daily Activity Summary',
      description: `${daily_activity.new_leads} new leads, ${daily_activity.messages_sent} messages sent, ${daily_activity.jobs_executed} jobs executed`,
      category: 'System',
      value: `${daily_activity.system_health}% health`,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground mb-4">System Notes</h2>
        <p className="text-sm text-muted-foreground mb-6">Quick summaries of key system insights based on recent activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note, idx) => (
          <NoteCard
            key={idx}
            icon={note.icon}
            title={note.title}
            description={note.description}
            category={note.category}
            value={note.value}
          />
        ))}
      </div>
    </div>
  );
}
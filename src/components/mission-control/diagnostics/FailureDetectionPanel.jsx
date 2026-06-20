import React, { useState } from 'react';
import { AlertCircle, Zap, MessageSquare, ToggleLeft, ChevronDown, ChevronUp } from 'lucide-react';

const TAB_CONFIG = [
  { id: 'jobs', label: 'Automation Jobs', icon: Zap },
  { id: 'events', label: 'Comm. Events', icon: MessageSquare },
  { id: 'rules', label: 'Inactive Rules', icon: ToggleLeft },
];

function FailedJobRow({ job }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-900 capitalize">
            {(job.event_type || 'unknown').replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-red-700 mt-0.5">
            {job.processor_type || 'Unknown processor'} · {new Date(job.created_date).toLocaleString()}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-red-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-red-400 flex-shrink-0" />}
      </div>
      {expanded && job.error_message && (
        <div className="mt-2 pt-2 border-t border-red-200 text-xs font-mono text-red-800 bg-white/50 rounded px-2 py-1.5 text-left break-words">
          {job.error_message}
        </div>
      )}
    </button>
  );
}

function FailedEventRow({ event }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left p-3 rounded-lg border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-900 capitalize">
            {(event.event_type || 'event').replace(/_/g, ' ')} · {event.channel}
          </p>
          <p className="text-xs text-orange-700 mt-0.5">
            Provider: {event.provider} · {new Date(event.created_date).toLocaleString()}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-orange-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-orange-400 flex-shrink-0" />}
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-orange-200 text-xs text-orange-800 text-left space-y-1">
          {event.error_message && <p><strong>Error:</strong> {event.error_message}</p>}
          {event.message_body && <p className="truncate"><strong>Body:</strong> {event.message_body}</p>}
        </div>
      )}
    </button>
  );
}

export default function FailureDetectionPanel({ failedJobs, errorEvents, inactiveRules, onNavigate }) {
  const [activeTab, setActiveTab] = useState('jobs');

  const counts = {
    jobs: failedJobs.length,
    events: errorEvents.length,
    rules: inactiveRules.length,
  };

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h2 className="text-xl font-bold text-foreground">Failure Detection</h2>
        <span className="ml-auto text-xs font-bold text-muted-foreground">
          {counts.jobs + counts.events} total failures
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-1">
        {TAB_CONFIG.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-card border border-b-0 border-border text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                  {counts[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {activeTab === 'jobs' && (
          failedJobs.length === 0
            ? <p className="text-sm text-muted-foreground py-6 text-center">✅ No failed automation jobs</p>
            : failedJobs.map(job => <FailedJobRow key={job.id} job={job} />)
        )}
        {activeTab === 'events' && (
          errorEvents.length === 0
            ? <p className="text-sm text-muted-foreground py-6 text-center">✅ No communication failures</p>
            : errorEvents.map(event => <FailedEventRow key={event.id} event={event} />)
        )}
        {activeTab === 'rules' && (
          inactiveRules.length === 0
            ? <p className="text-sm text-muted-foreground py-6 text-center">✅ All automation rules are active</p>
            : inactiveRules.map(rule => (
              <div key={rule.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-foreground">{rule.rule_name || 'Unnamed Rule'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Status: <span className="font-semibold text-amber-600">{rule.status}</span>
                  {rule.condition && ` · Condition: ${rule.condition}`}
                </p>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { MessageSquare, Zap, Target, BarChart3, Activity } from 'lucide-react';

const CATEGORY_CONFIG = [
  { key: 'messaging', label: 'Messaging', icon: MessageSquare, description: 'SMS & email delivery success' },
  { key: 'automation', label: 'Automation Jobs', icon: Zap, description: 'Job execution success rate' },
  { key: 'rules', label: 'Active Rules', icon: Target, description: 'Rules currently enabled' },
];

function ScoreRing({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black" style={{ color }}>{score}</span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Health</span>
      </div>
    </div>
  );
}

function CategoryBar({ label, icon: CategoryIcon, score, description }) {
  const Icon = CategoryIcon;
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-500';
  const textColor = score >= 80 ? 'text-green-700' : score >= 60 ? 'text-amber-700' : 'text-red-700';
  const bgColor = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className={`rounded-xl p-4 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${textColor}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`ml-auto text-sm font-black ${textColor}`}>{score}%</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function SystemHealthScorePanel({ scores, totals }) {
  const overall = scores.overall;
  const statusLabel = overall >= 80 ? 'Healthy' : overall >= 60 ? 'Degraded' : 'Critical';
  const statusColor = overall >= 80 ? 'text-green-700 bg-green-50 border-green-200' : overall >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="flex items-center gap-3 mb-8">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">System Health Overview</h2>
        <span className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10">
        <ScoreRing score={overall} />

        <div className="flex-1 space-y-3 w-full">
          {CATEGORY_CONFIG.map(cat => (
            <CategoryBar key={cat.key} {...cat} score={scores[cat.key]} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8 border-t border-border pt-6">
        <div className="text-center">
          <p className="text-2xl font-black text-foreground">{totals.events}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">Total Events</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-foreground">{totals.jobs}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">Automation Jobs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-foreground">{totals.rules}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">Total Rules</p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { TrendingUp, Zap, MessageSquare, Star, Clock, Sparkles } from 'lucide-react';

export default function LeadScoreDisplay({ lead }) {
  const score = lead.lead_score || 0;
  
  // Determine score tier and color
  const getScoreTier = (s) => {
    if (s >= 80) return { tier: 'Excellent', color: '#10b981', bg: '#ecfdf5', emoji: '🔥' };
    if (s >= 60) return { tier: 'Good', color: '#3b82f6', bg: '#eff6ff', emoji: '⭐' };
    if (s >= 40) return { tier: 'Fair', color: '#f59e0b', bg: '#fffbeb', emoji: '👍' };
    return { tier: 'Cold', color: '#6b7280', bg: '#f3f4f6', emoji: '❄️' };
  };

  const tier = getScoreTier(score);

  // Calculate percentage — animate in on mount
  const [displayedScore, setDisplayedScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayedScore(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="space-y-4">
      {/* Score Circle */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            {/* Progress circle — animates from 0 to score */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={tier.color}
              strokeWidth="8"
              strokeDasharray={`${(displayedScore / 100) * 282.7} 282.7`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: tier.color }}>
              {Math.round(score)}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Score Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{tier.emoji}</span>
            <span className="font-bold text-lg" style={{ color: tier.color }}>
              {tier.tier} Score
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {score >= 80 && 'This lead is hot — engage immediately!'}
            {score >= 60 && score < 80 && 'Strong prospect — prioritize this lead.'}
            {score >= 40 && score < 60 && 'Moderate interest — worth nurturing.'}
            {score < 40 && 'Early stage — needs more engagement.'}
          </p>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs">
            {lead.last_contacted_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 3600000)}h ago
                </span>
              </div>
            )}
            {lead.reply_sentiment === 'Positive' && (
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-green-600" />
                <span className="text-green-600 font-medium">Positive reply</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Score Breakdown</p>
        <div className="space-y-2">
          <ScoreBreakdownRow
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Lead Recency"
            desc="New leads get bonus points"
            active={lead.created_date && (Date.now() - new Date(lead.created_date).getTime()) / 86400000 < 7}
          />
          <ScoreBreakdownRow
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Status"
            desc={lead.status}
            active={lead.status !== 'New' && lead.status !== 'Closed'}
          />
          <ScoreBreakdownRow
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            label="Engagement"
            desc={lead.last_contacted_at ? 'Recently contacted' : 'No contact yet'}
            active={!!lead.last_contacted_at}
          />
          <ScoreBreakdownRow
            icon={<Star className="w-3.5 h-3.5" />}
            label="Sentiment"
            desc={lead.reply_sentiment || 'Unknown'}
            active={lead.reply_sentiment === 'Positive'}
          />
          <ScoreBreakdownRow
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Quality"
            desc={lead.lead_category || 'Standard'}
            active={lead.lead_category === 'High-Value'}
          />
        </div>
      </div>
    </div>
  );
}

function ScoreBreakdownRow({ icon, label, desc, active }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded transition-colors ${
      active ? 'text-foreground' : 'text-muted-foreground opacity-50'
    }`}>
      <div className={active ? 'text-primary' : 'text-muted-foreground'}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] opacity-75 truncate">{desc}</p>
      </div>
      {active && <span className="text-xs font-bold text-primary">+pts</span>}
    </div>
  );
}
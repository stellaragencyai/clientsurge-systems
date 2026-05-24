import { TrendingUp } from 'lucide-react';

export default function LeadScoreCard({ lead }) {
  const score = lead.lead_score ?? 0;

  const getColor = (s) => {
    if (s >= 80) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🔥' };
    if (s >= 60) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '⭐' };
    if (s >= 40) return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '👍' };
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '❄️' };
  };

  const colors = getColor(score);

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4 flex items-center gap-4`}>
      <div className="flex-shrink-0 text-2xl">{colors.icon}</div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead Score</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-2xl font-bold ${colors.text}`}>{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="flex-1 hidden sm:block">
        <div className="h-2 bg-white rounded-full overflow-hidden border border-current opacity-20">
          <div
            className="h-full rounded-full bg-current"
            style={{ width: `${score}%`, transition: 'width 0.3s ease' }}
          />
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <TrendingUp className={`w-5 h-5 ${colors.text}`} />
      </div>
    </div>
  );
}
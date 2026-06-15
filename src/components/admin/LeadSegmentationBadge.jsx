import { getSegmentTier } from '@/lib/leadSegmentation';
import { Zap, TrendingUp, Clock } from 'lucide-react';

/**
 * Lead Segmentation Badge Component
 * Displays segment label with color coding and intent/recency scores
 */
export default function LeadSegmentationBadge({ lead, size = 'md', showScores = true }) {
  if (!lead) return null;

  const segment = getSegmentTier(lead.segment_label || 'COLD');

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <div className="flex flex-col gap-2">
      {/* Main Segment Badge */}
      <div
        className={`inline-flex items-center rounded-full font-semibold text-white w-fit ${sizeClasses[size]}`}
        style={{ backgroundColor: segment.color }}
      >
        <Zap size={iconSize} />
        <span>{segment.label}</span>
      </div>

      {/* Score Breakdown (Optional) */}
      {showScores && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            <span>Intent: {lead.intent_score || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>Recency: {lead.recency_score || 0}</span>
          </div>
        </div>
      )}

      {/* Industry Info */}
      {lead.industry && (
        <div className="text-xs font-medium text-foreground bg-muted px-2 py-1 rounded w-fit">
          {lead.industry}
        </div>
      )}
    </div>
  );
}
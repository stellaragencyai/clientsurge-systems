import React from 'react';
import { AlertCircle, TrendingUp, Zap, MessageSquare, Wrench } from 'lucide-react';

function PriorityBadge({ priority }) {
  const styles = {
    high: { bg: 'bg-red-50', text: 'text-red-700', label: '🔴 High' },
    medium: { bg: 'bg-orange-50', text: 'text-orange-700', label: '🟠 Medium' },
    low: { bg: 'bg-blue-50', text: 'text-blue-700', label: '🔵 Low' },
  };
  const style = styles[priority] || styles.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function CategoryIcon({ category }) {
  const icons = {
    Leads: <TrendingUp className="w-4 h-4" />,
    Messaging: <MessageSquare className="w-4 h-4" />,
    Automation: <Zap className="w-4 h-4" />,
    System: <AlertCircle className="w-4 h-4" />,
  };
  return icons[category] || icons.System;
}

function CategoryBadge({ category }) {
  const styles = {
    Leads: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Messaging: { bg: 'bg-purple-100', text: 'text-purple-700' },
    Automation: { bg: 'bg-green-100', text: 'text-green-700' },
    System: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };
  const style = styles[category] || styles.System;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${style.bg} ${style.text}`}>
      <CategoryIcon category={category} />
      {category}
    </span>
  );
}

export default function SuggestionsPanel({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          Suggestions
        </h3>
        <p className="text-xs text-muted-foreground">Informational insights based on system patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border bg-white p-4 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="font-semibold text-foreground text-sm flex-1">{suggestion.title}</h4>
              <PriorityBadge priority={suggestion.priority} />
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              {suggestion.description}
            </p>
            <div className="flex items-center justify-between">
              <CategoryBadge category={suggestion.category} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
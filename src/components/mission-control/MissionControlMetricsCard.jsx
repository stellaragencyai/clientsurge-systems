import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function MissionControlMetricsCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border border-border p-6 text-left transition-all hover:shadow-lg hover:scale-105 group ${color}`}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p>
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-black">{value}</p>
        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}
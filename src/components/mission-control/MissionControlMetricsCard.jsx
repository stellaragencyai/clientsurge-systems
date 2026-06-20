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
      className={`rounded-xl border border-border p-6 text-left transition-all hover:shadow-lg hover:scale-105 ${color}`}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium opacity-75">{label}</p>
        <Icon className="w-5 h-5 opacity-60" />
      </div>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-bold">{value}</p>
        <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100" />
      </div>
    </button>
  );
}
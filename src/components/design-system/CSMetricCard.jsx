import { TrendingUp } from "lucide-react";

export default function CSMetricCard({ title, value, change, icon: Icon, description }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
        </div>
        {Icon && (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
            <Icon className="h-5 w-5 text-cyan-600" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-600">
          <TrendingUp className="h-4 w-4" />
          {change}
        </div>
      )}
    </div>
  );
}

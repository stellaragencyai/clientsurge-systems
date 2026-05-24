import { CheckCircle2, Clock, Loader2, AlertCircle, LayoutList } from "lucide-react";

const CARDS = [
  { key: "total",      label: "Total Jobs",   icon: LayoutList,   color: "bg-slate-50 border-slate-200 text-slate-700" },
  { key: "completed",  label: "Completed",    icon: CheckCircle2, color: "bg-green-50 border-green-200 text-green-700" },
  { key: "processing", label: "Processing",   icon: Loader2,      color: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "queued",     label: "Queued",       icon: Clock,        color: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "failed",     label: "Failed",       icon: AlertCircle,  color: "bg-red-50 border-red-200 text-red-700" },
];

export default function TaskStatsRow({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className={`rounded-xl border p-4 ${color}`}>
          <div className="flex items-center gap-1.5 mb-2 opacity-70">
            <Icon className="w-3.5 h-3.5" />
            <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
          </div>
          <p className="text-2xl font-bold">{stats?.[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
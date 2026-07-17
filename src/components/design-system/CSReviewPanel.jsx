import { CheckCircle2, AlertCircle } from "lucide-react";

export default function CSReviewPanel({ title = "Review Setup", items = [], warnings = [] }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">Confirm your configuration before activation.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white divide-y">
        {items.map((item, index) => (
          <div key={item.label || index} className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="text-sm text-slate-500">{item.value}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          {warnings.map((warning, index) => (
            <div key={index} className="flex gap-2 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

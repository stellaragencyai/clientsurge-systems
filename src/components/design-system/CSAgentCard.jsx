import { CheckCircle2 } from "lucide-react";

export default function CSAgentCard({ name, role, status = "Online", activity }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{name}</h3>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      </div>
      <div className="mt-4 rounded-2xl bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
        {status}
      </div>
      {activity && <p className="mt-3 text-xs text-slate-500">{activity}</p>}
    </div>
  );
}

import { Users, CheckCircle, Calendar, DollarSign } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SaasKpiBar({ portal }) {
  const convRate = portal?.conversion_rate ?? 0;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard icon={Users} label="Leads Captured" value={portal?.total_leads_received} sub="all time" color="bg-blue-500" />
      <KpiCard icon={CheckCircle} label="Leads Contacted" value={portal?.leads_contacted} sub={`${portal?.total_leads_received ? Math.round((portal.leads_contacted/portal.total_leads_received)*100) : 0}% contact rate`} color="bg-teal-500" />
      <KpiCard icon={Calendar} label="Bookings" value={portal?.leads_booked} sub={`${convRate}% conversion`} color="bg-indigo-500" />
      <KpiCard icon={DollarSign} label="Revenue Generated" value={portal?.revenue_generated ? `$${portal.revenue_generated.toFixed(0)}` : '$0'} sub={`avg ${portal?.avg_response_time_minutes ?? 0}m response`} color="bg-emerald-500" />
    </div>
  );
}
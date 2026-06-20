import { useState, useEffect } from 'react';
import { Zap, MessageSquare, Mail, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
      <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <div>
        <p className="text-lg font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {note && <p className="text-[11px] text-gray-400 mt-0.5">{note}</p>}
      </div>
    </div>
  );
}

const HEALTH_CONFIG = {
  healthy: { label: 'Healthy', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  degraded: { label: 'Degraded', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  failed: { label: 'Issues Detected', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  unknown: { label: 'Monitoring', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export default function SaasAutomations({ portal, clientId }) {
  const [stats, setStats] = useState({ sms: 0, email: 0, total: 0, success: 0 });

  useEffect(() => {
    if (!clientId) return;
    const load = async () => {
      const events = await base44.entities.CommunicationEvent.filter(
        { client_id: clientId, direction: 'outbound' },
        '-created_date',
        200
      ).catch(() => []);

      const sms = events.filter(e => e.channel === 'sms' && e.status !== 'failed').length;
      const email = events.filter(e => e.channel === 'email' && e.status !== 'failed').length;
      const total = events.length;
      const success = events.filter(e => e.status === 'delivered' || e.status === 'sent').length;
      setStats({ sms, email, total, success });
    };
    load();
  }, [clientId]);

  const health = portal?.automation_health_status || 'unknown';
  const hc = HEALTH_CONFIG[health] || HEALTH_CONFIG.unknown;
  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Automation Performance</h2>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${hc.bg} ${hc.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${hc.dot}`} />
          {hc.label}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="Messages Sent" value={stats.total} />
        <StatCard icon={MessageSquare} label="SMS Delivered" value={stats.sms} />
        <StatCard icon={Mail} label="Emails Sent" value={stats.email} />
        <StatCard icon={Activity} label="Success Rate" value={`${successRate}%`} note={`${stats.success} of ${stats.total}`} />
      </div>

      {/* Success rate bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Delivery success rate</span>
          <span className="font-semibold text-gray-700">{successRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${successRate}%`, background: successRate > 90 ? '#22c55e' : successRate > 70 ? '#eab308' : '#ef4444' }}
          />
        </div>
      </div>
    </div>
  );
}
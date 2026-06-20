import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  locked: { icon: Lock, color: 'bg-slate-100 text-slate-700', label: 'Locked' },
  blocked: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Blocked' },
  ready_for_proof: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Ready for Proof' },
  proof_passed: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Passed' },
  approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
};

export default function LaunchGatesModule() {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGates = async () => {
      try {
        const result = await base44.asServiceRole.entities.LaunchGate.filter({}, '-created_date', 20);
        setGates(result || []);
      } catch (e) {
        console.error('Failed to load launch gates:', e);
      } finally {
        setLoading(false);
      }
    };
    loadGates();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading launch gates...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Launch Gates</h1>
        <p className="text-muted-foreground">System readiness checklist and blockers.</p>
      </div>

      {gates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No launch gates configured.</div>
      ) : (
        <div className="grid gap-4">
          {gates.map((gate) => {
            const config = STATUS_CONFIG[gate.status] || STATUS_CONFIG.locked;
            const Icon = config.icon;

            return (
              <button
                key={gate.id}
                className={`rounded-xl border-2 border-border p-6 text-left transition-all hover:shadow-lg ${config.color}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold">{gate.gate_name}</h3>
                      <p className="text-sm opacity-75 mt-1">{gate.section_label}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white/30">
                    {gate.completion_percent}%
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="w-full bg-white/30 rounded-full overflow-hidden h-2">
                    <div
                      className="bg-current h-full transition-all"
                      style={{ width: `${gate.completion_percent}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                {gate.current_blocker && (
                  <div className="text-sm opacity-90">
                    <strong>Blocker:</strong> {gate.current_blocker}
                  </div>
                )}
                {gate.next_action && (
                  <div className="text-sm opacity-90 mt-2">
                    <strong>Next:</strong> {gate.next_action}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
/**
 * CustomerOnboardingPanel — Client Onboarding Flow
 * Tracks paid customers through onboarding → activation → live stages.
 * Visibility layer only; no backend modifications.
 */

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Users, CheckCircle2, AlertCircle, Clock, Zap, BarChart3,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

const ONBOARDING_STAGES = [
  { key: 'payment_received', label: 'Payment Received', icon: '💳' },
  { key: 'account_created', label: 'Account Created', icon: '📝' },
  { key: 'form_started', label: 'Onboarding Form Started', icon: '✏️' },
  { key: 'form_completed', label: 'Onboarding Form Completed', icon: '✅' },
  { key: 'setup_started', label: 'Setup Started', icon: '⚙️' },
  { key: 'automation_testing', label: 'Automation Testing', icon: '🧪' },
  { key: 'client_review', label: 'Client Review', icon: '👀' },
  { key: 'live', label: 'Live', icon: '🚀' },
];

function MetricCard({ icon: Icon, label, value, sub, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-lg border border-slate-200 p-4 space-y-1 ${colors[color]}`}>
      <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-75">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      {sub && <p className="text-xs opacity-75">{sub}</p>}
    </div>
  );
}

function PipelineStageBar({ stage, count, customers, blockers }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-2 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center gap-3 justify-between py-2 hover:bg-slate-50 rounded-lg px-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{stage.icon}</span>
          <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-900">{count}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>
      {expanded && customers?.length > 0 && (
        <div className="ml-6 space-y-1.5 text-xs">
          {customers.slice(0, 5).map((c, i) => (
            <div key={i} className="py-1.5 px-2 rounded border border-slate-100 bg-slate-50">
              <p className="font-semibold text-slate-800">{c.business_name || c.customer_name}</p>
              <p className="text-slate-500">{c.customer_email}</p>
            </div>
          ))}
          {customers.length > 5 && (
            <p className="text-slate-500 italic">+{customers.length - 5} more</p>
          )}
        </div>
      )}
      {expanded && blockers?.length > 0 && (
        <div className="ml-6 space-y-1 border-t border-slate-100 pt-2 mt-2">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Blockers:</p>
          {blockers.map((b, i) => (
            <p key={i} className="text-[11px] text-amber-700 py-0.5">⚠️ {b}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerOnboardingPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBlockers, setExpandedBlockers] = useState(false);
  const [expandedActions, setExpandedActions] = useState(false);

  const [metrics, setMetrics] = useState({
    paidCustomers: 0,
    paidNotOnboarded: 0,
    onboardingInProgress: 0,
    blockedRecords: 0,
    readyForActivation: 0,
    liveClients: 0,
    pipelineStages: {},
    blockers: [],
    nextActions: [],
    paidNotOnboardedList: [],
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orders, onboardings, installations, portals] = await Promise.all([
        base44.entities.Order.list('-created_date', 500).catch(() => []),
        base44.entities.OnboardingOrchestration.list('-created_date', 500).catch(() => []),
        base44.entities.ClientInstallationOS.list('-created_date', 500).catch(() => []),
        base44.entities.ClientExperiencePortal.list('-created_date', 500).catch(() => []),
      ]);

      // Count metrics
      const paidOrders = orders.filter(o => o.payment_status === 'paid');
      const paidCount = paidOrders.length;
      const liveClients = paidOrders.filter(o => o.status === 'active' || o.status === 'onboarded').length;

      // Pair orders with onboarding records
      const onboardingMap = {};
      onboardings.forEach(ob => {
        const orderId = ob.order_id || ob.client_id;
        if (orderId) onboardingMap[orderId] = ob;
      });

      const paidNotOnboarded = paidOrders.filter(o => !onboardingMap[o.id] || onboardingMap[o.id].status === 'pending');
      const inProgress = paidOrders.filter(o => onboardingMap[o.id] && ['in_progress', 'waiting_for_client'].includes(onboardingMap[o.id].status));
      const blocked = paidOrders.filter(o => onboardingMap[o.id]?.status === 'blocked' || (onboardingMap[o.id]?.blockers?.length || 0) > 0);
      const readyForActivation = paidOrders.filter(o => onboardingMap[o.id]?.status === 'ready_for_activation');

      // Build pipeline stages
      const stageMap = {
        payment_received: [],
        account_created: [],
        form_started: [],
        form_completed: [],
        setup_started: [],
        automation_testing: [],
        client_review: [],
        live: [],
      };

      paidOrders.forEach(o => {
        const ob = onboardingMap[o.id];
        const stage = ob?.current_stage || 'payment_received';
        if (stageMap[stage]) {
          stageMap[stage].push({
            customer_name: o.customer_name,
            business_name: o.business_name,
            customer_email: o.customer_email,
          });
        }
      });

      // Collect blockers
      const blockerList = [];
      blocked.forEach(o => {
        const ob = onboardingMap[o.id];
        if (ob?.blockers?.length > 0) {
          ob.blockers.forEach(blocker => {
            blockerList.push({
              business: o.business_name || o.customer_name,
              blocker,
              severity: 'high',
              action: 'Contact client and resolve',
            });
          });
        }
        if (ob?.missing_setup_items?.length > 0) {
          ob.missing_setup_items.forEach(item => {
            blockerList.push({
              business: o.business_name || o.customer_name,
              blocker: `Missing setup: ${item}`,
              severity: 'medium',
              action: 'Complete setup item',
            });
          });
        }
      });

      installations.forEach(inst => {
        if (inst.activation_blockers?.length > 0) {
          inst.activation_blockers.forEach(blocker => {
            blockerList.push({
              business: inst.client_name || 'Unknown',
              blocker,
              severity: 'high',
              action: 'Resolve installation issue',
            });
          });
        }
      });

      // Next required actions (sample logic)
      const actions = [];
      paidNotOnboarded.forEach(o => {
        actions.push(`Send onboarding form to ${o.business_name || o.customer_name}`);
      });
      inProgress.forEach(o => {
        const ob = onboardingMap[o.id];
        if (ob?.status === 'waiting_for_client') {
          actions.push(`Follow up with ${o.business_name || o.customer_name} on onboarding form`);
        }
      });
      readyForActivation.forEach(o => {
        actions.push(`Activate client portal for ${o.business_name || o.customer_name}`);
      });

      setMetrics({
        paidCustomers: paidCount,
        paidNotOnboarded: paidNotOnboarded.length,
        onboardingInProgress: inProgress.length,
        blockedRecords: blocked.length,
        readyForActivation: readyForActivation.length,
        liveClients,
        pipelineStages: stageMap,
        blockers: blockerList.slice(0, 10),
        nextActions: actions.slice(0, 10),
        paidNotOnboardedList: paidNotOnboarded.slice(0, 20),
      });
    } catch (err) {
      console.error('[CustomerOnboardingPanel]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading onboarding data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error loading onboarding data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Customer Onboarding</h2>
        <p className="text-sm text-slate-500 mt-1">Track paid customers through onboarding, setup, and activation</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={Users} label="Paid Customers" value={metrics.paidCustomers} color="blue" />
        <MetricCard icon={AlertCircle} label="Unprepared" value={metrics.paidNotOnboarded} color="amber" />
        <MetricCard icon={Clock} label="In Progress" value={metrics.onboardingInProgress} color="slate" />
        <MetricCard icon={AlertCircle} label="Blocked" value={metrics.blockedRecords} color="red" />
        <MetricCard icon={CheckCircle2} label="Ready" value={metrics.readyForActivation} color="green" />
        <MetricCard icon={Zap} label="Live" value={metrics.liveClients} color="green" />
      </div>

      {/* Paid But Not Onboarded */}
      {metrics.paidNotOnboardedList.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Paid But Not Onboarded ({metrics.paidNotOnboardedList.length})</h3>
          <div className="space-y-2">
            {metrics.paidNotOnboardedList.map((order, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{order.business_name || order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.customer_email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.selected_package_type || order.package_type || 'Unknown'} · {order.payment_status}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex-shrink-0">
                  Action needed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onboarding Pipeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Onboarding Pipeline</h3>
        <div className="space-y-3">
          {ONBOARDING_STAGES.map((stage) => (
            <PipelineStageBar
              key={stage.key}
              stage={stage}
              count={metrics.pipelineStages[stage.key]?.length || 0}
              customers={metrics.pipelineStages[stage.key] || []}
              blockers={[]}
            />
          ))}
        </div>
      </div>

      {/* Onboarding Blockers */}
      {metrics.blockers.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setExpandedBlockers(!expandedBlockers)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-bold text-slate-800">Onboarding Blockers ({metrics.blockers.length})</p>
            </div>
            {expandedBlockers ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedBlockers && (
            <div className="border-t border-slate-200 p-6 space-y-3">
              {metrics.blockers.map((blocker, i) => (
                <div key={i} className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-red-900">{blocker.business}</p>
                      <p className="text-sm text-red-800 mt-1">{blocker.blocker}</p>
                      <p className="text-xs text-red-700 mt-2">→ {blocker.action}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                      blocker.severity === 'high' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {blocker.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next Setup Actions */}
      {metrics.nextActions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setExpandedActions(!expandedActions)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-bold text-slate-800">Next Setup Actions ({metrics.nextActions.length})</p>
            </div>
            {expandedActions ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedActions && (
            <div className="border-t border-slate-200 p-6 space-y-2">
              {metrics.nextActions.map((action, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <span className="text-green-600 font-bold">→</span>
                  <span className="text-sm text-slate-700">{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadData}
        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
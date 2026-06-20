import { CheckCircle, AlertCircle, ArrowRight, Clock } from 'lucide-react';

const STAGE_LABELS = {
  intake_received: 'Intake Received',
  setup_in_progress: 'Setup In Progress',
  testing: 'Testing',
  awaiting_client_approval: 'Awaiting Your Approval',
  live: 'Live 🎉',
  blocked: 'Blocked — Action Required',
};

const STAGE_ORDER = ['intake_received', 'setup_in_progress', 'testing', 'awaiting_client_approval', 'live'];

export default function SaasOnboarding({ portal, installOS }) {
  const stage = portal?.onboarding_stage || 'intake_received';
  const pct = portal?.onboarding_completion_percent ?? 0;
  const blockers = portal?.blockers_count ?? 0;
  const stageIdx = STAGE_ORDER.indexOf(stage);
  const nextAction = installOS?.next_required_action;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Onboarding Progress</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          stage === 'live' ? 'bg-green-100 text-green-700' :
          stage === 'blocked' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {STAGE_LABELS[stage] || stage}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Setup completion</span>
          <span className="font-semibold text-gray-700">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: stage === 'blocked' ? '#ef4444' : 'linear-gradient(90deg,#0088CC,#00AEEF)' }}
          />
        </div>
      </div>

      {/* Stage steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGE_ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              i < stageIdx ? 'bg-green-100 text-green-700' :
              i === stageIdx ? 'bg-blue-100 text-blue-700' :
              'bg-gray-50 text-gray-400'
            }`}>
              {i < stageIdx && <CheckCircle className="w-3 h-3" />}
              {STAGE_LABELS[s]}
            </div>
            {i < STAGE_ORDER.length - 1 && <div className="w-4 h-px bg-gray-200 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Blockers */}
      {blockers > 0 && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">{blockers} Blocker{blockers > 1 ? 's' : ''} Detected</p>
            <p className="text-xs text-red-600 mt-0.5">Contact support to resolve these items before going live.</p>
          </div>
        </div>
      )}

      {/* Next action */}
      {nextAction && nextAction.action_type !== 'ready_to_activate' && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-50 border border-blue-100">
          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Next Step</p>
            <p className="text-xs text-blue-600 mt-0.5">{nextAction.description}</p>
            {nextAction.estimated_time_minutes > 0 && (
              <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{nextAction.estimated_time_minutes} min
              </p>
            )}
          </div>
        </div>
      )}

      {stage === 'live' && !blockers && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700 font-medium">
          <CheckCircle className="w-4 h-4" />
          Your automation system is fully live and running.
        </div>
      )}
    </div>
  );
}
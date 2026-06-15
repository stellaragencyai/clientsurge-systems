import { CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const INSTALL_SUBSTEPS = {
  'Paid': [
    { label: 'Payment Verified', icon: '✓' },
    { label: 'Awaiting Configuration', icon: '⏳' },
  ],
  'Ready for Install': [
    { label: 'Services Queued', icon: '✓' },
    { label: 'Credentials Validation', icon: '⏳' },
  ],
  'Configuring': [
    { label: 'Twilio Setup', icon: '📞' },
    { label: 'Resend Email Config', icon: '📧' },
    { label: 'Webhook Registration', icon: '🔗' },
    { label: 'DNS Propagation', icon: '🌐' },
  ],
  'Testing': [
    { label: 'Send Test SMS', icon: '✓' },
    { label: 'Send Test Email', icon: '✓' },
    { label: 'Verify Inbound', icon: '⏳' },
  ],
  'Live': [
    { label: 'All Systems Active', icon: '✓' },
    { label: 'Monitoring Enabled', icon: '✓' },
  ],
};

export default function SetupStatusPanelEnhanced({ order, systemHealth }) {
  const [expandedStage, setExpandedStage] = useState(null);
  const currentStage = order?.pipeline_status || 'Paid';
  const substeps = INSTALL_SUBSTEPS[currentStage] || [];

  const getStageColor = (stage) => {
    if (stage === currentStage) return 'bg-blue-50 border-blue-300';
    if (['Testing', 'Live'].includes(stage)) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Installation Status</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          <Zap className="w-3 h-3" /> {currentStage}
        </span>
      </div>

      {/* Main stage progression */}
      <div className="mb-6 space-y-2">
        {Object.keys(INSTALL_SUBSTEPS).map((stage) => (
          <button
            key={stage}
            onClick={() => setExpandedStage(expandedStage === stage ? null : stage)}
            className={`w-full rounded-lg border-2 p-3 text-left transition-all ${getStageColor(stage)}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{stage}</span>
              {stage === currentStage && <Clock className="w-4 h-4 animate-spin text-blue-600" />}
              {['Testing', 'Live'].includes(stage) && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            </div>
          </button>
        ))}
      </div>

      {/* Expanded substeps for current stage */}
      {substeps.length > 0 && (
        <div className="rounded-lg bg-muted p-4">
          <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Current Stage Details</p>
          <div className="space-y-2">
            {substeps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-lg">{step.icon}</span>
                <span className="text-sm text-foreground">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System health alerts */}
      {systemHealth && systemHealth.status !== 'healthy' && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900">Health Alert</p>
              <p className="text-xs text-amber-800 mt-1">{systemHealth.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}